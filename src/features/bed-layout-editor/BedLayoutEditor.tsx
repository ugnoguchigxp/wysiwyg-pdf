import React from 'react'
import {
  KonvaCanvasEditor,
  type KonvaCanvasEditorHandle,
} from '@/components/canvas/KonvaCanvasEditor'
import type { Doc, UnifiedNode, WidgetNode } from '@/types/canvas'
import { PaperBackground } from '@/features/konva-editor/viewers/components/PaperBackground'
import { BedElement } from '@/features/konva-editor/renderers/bed-elements/BedElement'

interface KonvaEditorProps {
  document: Doc
  name?: string
  zoom: number
  selection: string[]
  onSelect: (ids: string[]) => void
  onChangeElement: (id: string, newAttrs: Partial<UnifiedNode>) => void
  onDelete?: (id: string) => void
  onUndo?: () => void
  onRedo?: () => void
  showGrid?: boolean
  snapStrength?: number
  gridSize?: number
  surfaceId?: string
}

export interface BedLayoutEditorHandle {
  downloadImage: () => void
}

export const BedLayoutEditor = React.forwardRef<BedLayoutEditorHandle, KonvaEditorProps>(
  (
    {
      document,
      name,
      zoom,
      selection,
      onSelect,
      onChangeElement,
      onDelete,
      onUndo: _onUndo,
      onRedo: _onRedo,
      showGrid = false,
      snapStrength = 5,
      gridSize = 15,
      surfaceId,
    },
    ref
  ) => {
    // Konva Stage reference for image export
    const editorRef = React.useRef<KonvaCanvasEditorHandle | null>(null)

    React.useImperativeHandle(ref, () => ({
      downloadImage: () => {
        const stage = editorRef.current?.getStage()
        if (stage) {
          // Hide grid layer
          const gridLayer = stage.findOne('.grid-layer')
          const wasVisible = gridLayer?.visible()
          if (gridLayer) {
            gridLayer.hide()
          }

          const dataURL = stage.toDataURL({ pixelRatio: 2 })

          // Restore grid layer
          if (gridLayer && wasVisible) {
            gridLayer.show()
          }

          const link = window.document.createElement('a')
          link.download = `${name || document.title || 'bed-layout'}.png`
          link.href = dataURL
          window.document.body.appendChild(link)
          link.click()
          window.document.body.removeChild(link)
        }
      },
    }))
    const resolvedSurfaceId =
      surfaceId || document.surfaces.find((s) => s.type === 'canvas')?.id || document.surfaces[0]?.id || 'layout'
    const surface = document.surfaces.find((s) => s.id === resolvedSurfaceId) || document.surfaces[0]
    const paperWidth = surface?.w ?? 0
    const paperHeight = surface?.h ?? 0

    const elements = document.nodes.filter((n) => n.s === resolvedSurfaceId)

    return (
      <KonvaCanvasEditor
        ref={editorRef}
        elements={elements}
        selectedIds={selection}
        onSelect={onSelect}
        onChange={onChangeElement}
        zoom={zoom}
        paperWidth={paperWidth}
        paperHeight={paperHeight}
        onDelete={() => {
          if (selection.length > 0 && onDelete) {
            const id = selection[0]
            if (id) onDelete(id)
          }
        }}
        onUndo={_onUndo}
        onRedo={_onRedo}
        background={<PaperBackground document={document} surfaceId={resolvedSurfaceId} />}
        renderCustom={(el, commonProps, handleShapeRef) => {
          if (el.t === 'widget' && el.widget === 'bed') {
            const { ref: _ignoredRef, ...propsWithoutRef } = commonProps
            return (
              <BedElement
                {...propsWithoutRef}
                element={el as WidgetNode}
                isSelected={selection.includes(el.id)}
                shapeRef={handleShapeRef}
              />
            )
          }
          return null
        }}
        showGrid={showGrid}
        snapStrength={snapStrength}
        gridSize={gridSize}
      />
    )
  }
)

BedLayoutEditor.displayName = 'BedLayoutEditor'
