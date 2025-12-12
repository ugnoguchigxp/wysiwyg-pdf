import type Konva from 'konva'
import type React from 'react'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
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
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<Konva.Stage>(null)
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
    const [editingElementId, setEditingElementId] = useState<string | null>(null)
    const [stagePos, setStagePos] = useState({ x: 0, y: 20 })

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }))

    useLayoutEffect(() => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }, [])

    // Calculate required size for the stage to fit the zoomed paper
    const padding = 20
    const requiredWidth = paperWidth * zoom + padding * 2
    const requiredHeight = paperHeight * zoom + padding * 2

    // Stage size should be at least the container size, or larger if content overflows
    const stageWidth = Math.max(dimensions.width, requiredWidth)
    const stageHeight = Math.max(dimensions.height, requiredHeight)

    // Calculate stage position to center content or align with padding
    useEffect(() => {
      let x = 0
      let y = 0

      if (requiredWidth < dimensions.width) {
        x = (dimensions.width - paperWidth * zoom) / 2
      } else {
        x = padding
      }

      if (requiredHeight < dimensions.height) {
        y = (dimensions.height - paperHeight * zoom) / 2
      } else {
        y = padding
      }

      setStagePos({ x, y })
    }, [zoom, dimensions, paperWidth, paperHeight, requiredWidth, requiredHeight])

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
        className="scrollbar-thin"
        style={{
          backgroundColor: '#f0f0f0',
          width: '100%',
          height: '100%',
          overflow: 'auto',
        }}
      >
        <Stage
          width={stageWidth}
          height={stageHeight}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePos.x}
          y={stagePos.y}
          ref={stageRef}
          onMouseDown={(e) => {
            // Clicked on stage or paper background
            if (e.target === e.target.getStage() || e.target.name() === 'paper-background') {
              handleSelect(null, e)
              setEditingElementId(null)
            }
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
    )
  }
)

KonvaCanvasEditor.displayName = 'KonvaCanvasEditor'
