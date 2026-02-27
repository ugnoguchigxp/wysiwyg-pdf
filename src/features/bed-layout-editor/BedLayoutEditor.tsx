import type Konva from 'konva'
import React from 'react'
import {
  KonvaCanvasEditor,
  type KonvaCanvasEditorHandle,
} from '@/components/canvas/KonvaCanvasEditor'
import { BedElement } from '@/features/konva-editor/renderers/bed-elements/BedElement'
import { PaperBackground } from '@/features/konva-editor/viewers/components/PaperBackground'
import type { Doc, UnifiedNode, WidgetNode } from '@/types/canvas'

interface KonvaEditorProps {
  document: Doc
  name?: string
  zoom: number
  selection: string[]
  onSelect: (ids: string[]) => void
  onChangeElement: (
    updates: (Partial<UnifiedNode> & { id?: string }) | (Partial<UnifiedNode> & { id?: string })[],
    options?: { saveToHistory?: boolean; force?: boolean }
  ) => void

  onDelete?: (id: string) => void
  onUndo?: () => void
  onRedo?: () => void
  showGrid?: boolean
  snapStrength?: number
  gridSize?: number
  surfaceId?: string
  onCreateNodes?: (nodes: UnifiedNode[]) => void
  onReorderNodes?: (nodeIds: string[]) => void
}

export interface BedLayoutEditorHandle {
  downloadImage: () => void
  copy: () => void
  paste: () => void
}

export const BedLayoutEditor = React.forwardRef<BedLayoutEditorHandle, KonvaEditorProps>(
  (
    {
      document,
      name: _name,
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
      onCreateNodes,
      onReorderNodes,
    },
    ref
  ) => {
    const editorRef = React.useRef<KonvaCanvasEditorHandle | null>(null)

    const resolvedSurfaceId =
      surfaceId ||
      document.surfaces.find((s) => s.type === 'canvas')?.id ||
      document.surfaces[0]?.id ||
      'layout'

    React.useImperativeHandle(ref, () => ({
      downloadImage: () => {
        const stage = editorRef.current?.getStage()
        if (stage) {
          const gridLayer = stage.findOne('.grid-layer')
          const wasGridVisible = gridLayer?.visible()
          const transformers = (stage.find('Transformer') as unknown as Konva.Node[]).filter(
            (n): n is Konva.Transformer => n.getClassName?.() === 'Transformer'
          )
          const transformerVisibility = transformers.map((tr) => tr.visible())

          try {
            gridLayer?.hide()
            transformers.forEach((tr) => {
              tr.hide()
            })
            const dataURL = stage.toDataURL({ pixelRatio: 2 })
            const link = window.document.createElement('a')
            link.download = 'layout.png'
            link.href = dataURL
            window.document.body.appendChild(link)
            link.click()
            window.document.body.removeChild(link)
          } finally {
            if (gridLayer && wasGridVisible) gridLayer.show()
            transformers.forEach((tr, idx) => {
              if (transformerVisibility[idx]) tr.show()
            })
          }
        }
      },
      copy: () => editorRef.current?.copy(),
      paste: () => editorRef.current?.paste(),
    }))

    const surface =
      document.surfaces.find((s) => s.id === resolvedSurfaceId) || document.surfaces[0]
    const paperWidth = surface?.w ?? 0
    const paperHeight = surface?.h ?? 0
    const elements = document.nodes.filter((n) => n.s === resolvedSurfaceId)
    const selectedElementId = selection.length > 0 ? selection[0] : undefined

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
            const bedNode = el as WidgetNode
            const bedGroups =
              (document.data?.bedGroups as Array<{ id: string; name: string; color: string }>) || []
            const selectedBed = elements.find(
              (e) =>
                e.id === selectedElementId && e.t === 'widget' && (e as WidgetNode).widget === 'bed'
            ) as WidgetNode | undefined
            const selectedGroupId = selectedBed?.data?.groupId
            const myGroupId = bedNode.data?.groupId
            const myGroup = bedGroups.find((g) => g.id === myGroupId)

            return (
              <BedElement
                {...propsWithoutRef}
                element={bedNode}
                isSelected={selection.includes(el.id)}
                shapeRef={handleShapeRef}
                groupColor={myGroup?.color}
                isSameGroupSelected={!!selectedGroupId && selectedGroupId === myGroupId}
              />
            )
          }
          return null
        }}
        showGrid={showGrid}
        snapStrength={snapStrength}
        gridSize={gridSize}
        onCreateElements={onCreateNodes}
        onReorderNodes={onReorderNodes}
      />
    )
  }
)

BedLayoutEditor.displayName = 'BedLayoutEditor'
