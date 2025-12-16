import type Konva from 'konva'
import type React from 'react'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Layer, Stage } from 'react-konva'
import type { UnifiedNode } from '../../types/canvas'
import { mmToPx } from '@/utils/units'
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
    const dpi = 96
    const displayScale = mmToPx(1, { dpi }) * zoom
    const stageWidth = paperWidth * displayScale
    const stageHeight = paperHeight * displayScale

    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-900 overflow-auto scrollbar-thin flex justify-start items-start p-2">
        <div className="relative shadow-lg border-2 border-gray-500 bg-white dark:bg-gray-800 w-fit h-fit">
          <Stage
            width={stageWidth}
            height={stageHeight}
            scaleX={displayScale}
            scaleY={displayScale}
            ref={stageRef}
          >
            <Layer name="paper-layer" listening={false}>
              {background}
            </Layer>
            <Layer>
              {elements?.map((element) => (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={false}
                  stageScale={displayScale}
                  onSelect={() => {}}
                  onChange={() => {}}
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
