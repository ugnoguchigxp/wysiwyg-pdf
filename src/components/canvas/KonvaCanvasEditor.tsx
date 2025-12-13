import type Konva from 'konva'
import type React from 'react'
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Layer, Stage } from 'react-konva'
import type { CanvasElement, IBox, ITextElement } from '../../types/canvas'
import {
  type CanvasElementCommonProps,
  CanvasElementRenderer,
  type CanvasShapeRefCallback,
} from './CanvasElementRenderer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { TextEditOverlay } from './TextEditOverlay'

export interface KonvaCanvasEditorHandle {
  getStage: () => Konva.Stage | null
}

interface KonvaCanvasEditorProps {
  elements: CanvasElement[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onChange: (id: string, newAttrs: Partial<CanvasElement>) => void
  zoom: number
  paperWidth: number
  paperHeight: number
  background?: React.ReactNode
  renderCustom?: (
    element: CanvasElement,
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
}

type BoxElement = Extract<CanvasElement, { box: IBox }>

const isBoxElement = (element: CanvasElement): element is BoxElement => 'box' in element

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
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<Konva.Stage>(null)
    const [editingElementId, setEditingElementId] = useState<string | null>(null)

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }))

    // Calculate stage size based on zoomed paper
    const stageWidth = paperWidth * zoom
    const stageHeight = paperHeight * zoom

    const handleSelect = (
      id: string | null,
      e?: Konva.KonvaEventObject<MouseEvent | TouchEvent>
    ) => {
      if (readOnly) return

      // If no ID (clicked on empty stage), clear selection
      if (!id) {
        onSelect([])
        return
      }

      // Check for modifier keys (Shift or Ctrl/Meta)
      const isMultiSelect = e?.evt?.shiftKey || e?.evt?.ctrlKey || e?.evt?.metaKey

      if (isMultiSelect) {
        // Toggle selection
        if (selectedIds.includes(id)) {
          onSelect(selectedIds.filter((s) => s !== id))
        } else {
          onSelect([...selectedIds, id])
        }
      } else {
        // Single selection (replace)
        onSelect([id])
      }
    }

    const handleElementDblClick = (element: CanvasElement) => {
      if (readOnly) return
      if (element.type === 'Text') {
        setEditingElementId(element.id)
      }
    }

    const handleTextUpdate = (text: string) => {
      if (!editingElementId) return
      onChange(editingElementId, { text })
    }

    const handleTextEditFinish = () => {
      setEditingElementId(null)
    }

    const handleMove = (dx: number, dy: number) => {
      if (readOnly) return
      selectedIds.forEach((id) => {
        const element = elements.find((el) => el.id === id)
        if (element && isBoxElement(element)) {
          onChange(id, {
            box: {
              ...element.box,
              x: element.box.x + dx,
              y: element.box.y + dy,
            },
          })
        } else if (element && element.type === 'Line') {
          // Handle line movement if needed (requires moving points)
          // Simplified for now, assuming lines are not moved by arrow keys or handled differently
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
      ? (elements.find((el) => el.id === editingElementId) as ITextElement)
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
            scaleX={zoom}
            scaleY={zoom}
            ref={stageRef}
            onMouseDown={(e) => {
              // Priority to passed handler (e.g. for drawing)
              if (onStageMouseDown) {
                onStageMouseDown(e)
                // If drawing, we might want to stop propagation or prevent default selection logic
                // For now, let's assume if onStageMouseDown is provided, it handles logic.
                // But we also need selection clearing if NOT drawing.
                // We can check e.cancelBubble or similar if the handler decides to consume it?
                // Or simple check:
              }

              // Clicked on stage or paper background -> Clear selection
              // ONLY if NOT handled by element click (bubbling)
              // But passed onStageMouseDown might be for drawing tools which capture everything.
              if (
                !onStageMouseDown && // If external handler exists, assume it manages selection or decides to clear
                (e.target === e.target.getStage() || e.target.name() === 'paper-background')
              ) {
                handleSelect(null, e)
                setEditingElementId(null)
              } else if (!onStageMouseDown && e.target === e.target.getStage()) {
                handleSelect(null, e) // Fallback
              }
            }}
            onMouseMove={(e) => {
              onStageMouseMove?.(e)
            }}
            onMouseUp={(e) => {
              onStageMouseUp?.(e)
            }}
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
            onTouchMove={(e) => {
              onStageMouseMove?.(e)
            }}
            onTouchEnd={(e) => {
              onStageMouseUp?.(e)
            }}
          >
            <Layer>
              {background}
              {elements
                .sort((a, b) => a.z - b.z)
                .map((element) => (
                  <CanvasElementRenderer
                    key={element.id}
                    element={element}
                    isSelected={selectedIds.includes(element.id)}
                    onSelect={(e) => handleSelect(element.id, e)}
                    onChange={(newAttrs) => onChange(element.id, newAttrs)}
                    onDblClick={() => handleElementDblClick(element)}
                    isEditing={element.id === editingElementId}
                    renderCustom={renderCustom}
                  />
                ))}
            </Layer>
          </Stage>
          {editingElement && (
            <TextEditOverlay
              element={editingElement}
              scale={zoom}
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
