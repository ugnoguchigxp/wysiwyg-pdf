import type Konva from 'konva'
import type React from 'react'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import type { TextNode, UnifiedNode } from '../../types/canvas'
import { mmToPx } from '@/utils/units'
import { measureText } from '@/features/konva-editor/utils/textUtils'
import { ptToMm, pxToMm } from '@/utils/units'
import {
  type CanvasElementCommonProps,
  CanvasElementRenderer,
  type CanvasShapeRefCallback,
} from './CanvasElementRenderer'
import { GridLayer } from './GridLayer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { TextEditOverlay } from './TextEditOverlay'

export interface KonvaCanvasEditorHandle {
  getStage: () => Konva.Stage | null
}

interface KonvaCanvasEditorProps {
  elements: UnifiedNode[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onChange: (id: string, newAttrs: Partial<UnifiedNode>) => void
  zoom: number
  paperWidth: number
  paperHeight: number
  background?: React.ReactNode
  renderCustom?: (
    element: UnifiedNode,
    commonProps: CanvasElementCommonProps,
    shapeRef: CanvasShapeRefCallback
  ) => React.ReactNode
  readOnly?: boolean
  // Keyboard handlers
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
  // Stage events injection
  onStageMouseDown?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onStageMouseMove?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onStageMouseUp?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  showGrid?: boolean
  snapStrength?: number
  gridSize?: number
}

export const KonvaCanvasEditor = forwardRef<KonvaCanvasEditorHandle, KonvaCanvasEditorProps>(
  (
    {
      elements,
      selectedIds,
      onSelect,
      onChange,
      zoom,
      paperWidth,
      paperHeight,
      background,
      renderCustom,
      readOnly = false,
      onUndo,
      onRedo,
      onDelete,
      onStageMouseDown,
      onStageMouseMove,
      onStageMouseUp,
      showGrid = false,
      snapStrength = 5,
      gridSize = 5,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<Konva.Stage>(null)
    const [editingElementId, setEditingElementId] = useState<string | null>(null)

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }))

    const dpi = 96
    const displayScale = mmToPx(1, { dpi }) * zoom

    const stageWidth = paperWidth * displayScale
    const stageHeight = paperHeight * displayScale

    const handleSelect = (
      id: string | null,
      e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>
    ) => {
      if (readOnly) return
      if (!id) {
        onSelect([])
        return
      }

      const isMultiSelect = e?.evt?.shiftKey || e?.evt?.ctrlKey || e?.evt?.metaKey

      if (isMultiSelect) {
        if (selectedIds.includes(id)) {
          onSelect(selectedIds.filter((s) => s !== id))
        } else {
          onSelect([...selectedIds, id])
        }
      } else {
        onSelect([id])
      }
    }

    const handleElementDblClick = (element: UnifiedNode) => {
      if (readOnly) return
      if (element.t === 'text') {
        setEditingElementId(element.id)
      }
    }

    const handleTextUpdate = (text: string) => {
      if (!editingElementId) return

      const element = elements.find((el) => el.id === editingElementId)
      if (!element || element.t !== 'text') {
        onChange(editingElementId, { text } as Partial<UnifiedNode>)
        return
      }

      const textNode = element as TextNode
      const dpi = 96

      const font = {
        family: textNode.font || 'Meiryo',
        size: mmToPx(textNode.fontSize || ptToMm(12), { dpi }),
        weight: textNode.fontWeight || 400,
      }

      const lines = text.split('\n')
      let maxWidth = 0
      for (const line of lines) {
        const { width } = measureText(line || ' ', font)
        if (width > maxWidth) maxWidth = width
      }

      const lineHeight = font.size * 1.2
      const calculatedHeight = Math.max(1, lines.length) * lineHeight
      const newWidthPx = maxWidth + 10
      const newHeightPx = calculatedHeight + 4

      onChange(editingElementId, {
        text,
        w: pxToMm(newWidthPx, { dpi }),
        h: pxToMm(newHeightPx, { dpi }),
      } as Partial<UnifiedNode>)
    }

    const handleTextEditFinish = () => {
      setEditingElementId(null)
    }

    const handleMove = (dx: number, dy: number) => {
      if (readOnly) return
      selectedIds.forEach((id) => {
        const element = elements.find((el) => el.id === id)
        if (element && element.t !== 'line') {
          // Assuming elements with x/y
          if ('x' in element && 'y' in element) {
            onChange(id, {
              x: (element.x ?? 0) + dx,
              y: (element.y ?? 0) + dy,
            })
          }
        }
      })
    }

    const handleSelectAll = () => {
      if (readOnly) return
      onSelect(elements.map((el) => el.id))
    }

    useKeyboardShortcuts({
      onUndo,
      onRedo,
      onDelete,
      onSelectAll: handleSelectAll,
      onMoveUp: (step) => handleMove(0, -step),
      onMoveDown: (step) => handleMove(0, step),
      onMoveLeft: (step) => handleMove(-step, 0),
      onMoveRight: (step) => handleMove(step, 0),
    })

    const editingElement = editingElementId
      ? (elements.find((el) => el.id === editingElementId) as TextNode)
      : undefined

    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-gray-100 dark:bg-gray-900 overflow-auto scrollbar-thin flex justify-start items-start p-2"
      >
        <div className="relative shadow-lg border-2 border-gray-500 bg-white dark:bg-gray-800 w-fit h-fit">
          <Stage
            width={stageWidth}
            height={stageHeight}
            scaleX={displayScale}
            scaleY={displayScale}
            ref={stageRef}
            onMouseDown={(e) => {
              if (onStageMouseDown) {
                onStageMouseDown(e)
              }
              if (
                !onStageMouseDown &&
                (e.target === e.target.getStage() || e.target.name() === 'paper-background')
              ) {
                handleSelect(null, e)
                setEditingElementId(null)
              } else if (!onStageMouseDown && e.target === e.target.getStage()) {
                handleSelect(null, e)
              }
            }}
            onMouseMove={(e) => onStageMouseMove?.(e)}
            onMouseUp={(e) => onStageMouseUp?.(e)}
            onTouchStart={(e) => {
              onStageMouseDown?.(e)
              if (
                !onStageMouseDown &&
                (e.target === e.target.getStage() || e.target.name() === 'paper-background')
              ) {
                handleSelect(null, e)
                setEditingElementId(null)
              }
            }}
            onTouchMove={(e) => onStageMouseMove?.(e)}
            onTouchEnd={(e) => onStageMouseUp?.(e)}
          >
            <Layer name="paper-layer" listening={false}>
              {background}
            </Layer>
            <GridLayer
              width={paperWidth}
              height={paperHeight}
              scale={displayScale}
              visible={showGrid}
              gridSize={gridSize > 0 ? gridSize : 50}
            />
            <Layer>
              {elements.map((element) => (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={selectedIds.includes(element.id)}
                  allElements={elements}
                  stageScale={displayScale}
                  onSelect={(e) => handleSelect(element.id, e)}
                  onChange={(newAttrs) => onChange(element.id, newAttrs)}
                  onDblClick={() => handleElementDblClick(element)}
                  isEditing={element.id === editingElementId}
                  renderCustom={renderCustom}
                  snapStrength={snapStrength}
                  showGrid={showGrid}
                  gridSize={gridSize}
                />
              ))}
            </Layer>
          </Stage>
          {editingElement && (
            <TextEditOverlay
              element={editingElement}
              scale={displayScale}
              stageNode={stageRef.current}
              onUpdate={handleTextUpdate}
              onFinish={handleTextEditFinish}
            />
          )}
        </div>
      </div>
    )
  }
)

KonvaCanvasEditor.displayName = 'KonvaCanvasEditor'
