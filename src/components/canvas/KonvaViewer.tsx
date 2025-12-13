import type Konva from 'konva'
import type React from 'react'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Layer, Stage } from 'react-konva'
import type { UnifiedNode } from '../../types/canvas'
import {
    type CanvasElementCommonProps,
    CanvasElementRenderer,
    type CanvasShapeRefCallback,
} from './CanvasElementRenderer'

export interface KonvaViewerHandle {
    getStage: () => Konva.Stage | null
}

interface KonvaViewerProps {
    elements: UnifiedNode[]
    zoom: number
    paperWidth: number
    paperHeight: number
    background?: React.ReactNode
    renderCustom?: (
        element: UnifiedNode,
        commonProps: CanvasElementCommonProps,
        shapeRef: CanvasShapeRefCallback
    ) => React.ReactNode
}

export const KonvaViewer = forwardRef<KonvaViewerHandle, KonvaViewerProps>(
    ({ elements, zoom, paperWidth, paperHeight, background, renderCustom }, ref) => {
        const stageRef = useRef<Konva.Stage>(null)

        useImperativeHandle(ref, () => ({
            getStage: () => stageRef.current,
        }))

        // Calculate stage size based on zoomed paper
        const stageWidth = paperWidth * zoom
        const stageHeight = paperHeight * zoom

        return (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-900 overflow-auto scrollbar-thin flex justify-start items-start p-2">
                <div className="relative shadow-lg border-2 border-gray-500 bg-white dark:bg-gray-800 w-fit h-fit">
                    <Stage
                        width={stageWidth}
                        height={stageHeight}
                        scaleX={zoom}
                        scaleY={zoom}
                        ref={stageRef}
                    >
                        <Layer>
                            {background}
                            {elements?.map((element) => (
                                <CanvasElementRenderer
                                    key={element.id}
                                    element={element}
                                    isSelected={false}
                                    onSelect={() => { }}
                                    onChange={() => { }}
                                    readOnly={true}
                                    renderCustom={renderCustom}
                                />
                            ))}
                        </Layer>
                    </Stage>
                </div>
            </div>
        )
    }
)

KonvaViewer.displayName = 'KonvaViewer'
