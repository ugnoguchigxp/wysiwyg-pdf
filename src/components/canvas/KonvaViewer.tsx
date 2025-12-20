import type Konva from 'konva'
import type React from 'react'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { UnifiedNode } from '../../types/canvas'
import type { CanvasElementCommonProps, CanvasShapeRefCallback } from './types'
import { KonvaCanvasEditor, type KonvaCanvasEditorHandle } from './KonvaCanvasEditor'

export interface KonvaViewerHandle {
  getStage: () => Konva.Stage | null
}

interface KonvaViewerProps {
  elements: UnifiedNode[]
  zoom: number
  paperWidth: number
  paperHeight: number
  background?: React.ReactNode
  overlay?: React.ReactNode
  renderCustom?: (
    element: UnifiedNode,
    commonProps: CanvasElementCommonProps,
    shapeRef: CanvasShapeRefCallback
  ) => React.ReactNode
}

export const KonvaViewer = forwardRef<KonvaViewerHandle, KonvaViewerProps>(
  ({ elements, zoom, paperWidth, paperHeight, background, overlay, renderCustom }, ref) => {
    const editorRef = useRef<KonvaCanvasEditorHandle>(null)

    useImperativeHandle(ref, () => ({
      getStage: () => editorRef.current?.getStage() ?? null,
    }))

    return (
      <KonvaCanvasEditor
        ref={editorRef}
        elements={elements}
        selectedIds={[]}
        onSelect={() => { }}
        onChange={() => { }}
        zoom={zoom}
        paperWidth={paperWidth}
        paperHeight={paperHeight}
        background={background}
        overlay={overlay}
        renderCustom={renderCustom}
        readOnly={true}
        showGrid={false}
      />
    )
  }
)

KonvaViewer.displayName = 'KonvaViewer'
