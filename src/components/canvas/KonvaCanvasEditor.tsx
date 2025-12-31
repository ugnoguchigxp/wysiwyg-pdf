import type Konva from 'konva'
import React, { useCallback, forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Layer, Stage, Rect } from 'react-konva'
import type { TextNode, UnifiedNode } from '../../types/canvas'
import { mmToPx } from '@/utils/units'
// import { measureText } from '@/features/konva-editor/utils/textUtils'
import { applyTextLayoutUpdates } from '@/features/konva-editor/utils/textLayout'
import { CanvasElementRenderer } from './CanvasElementRenderer'
import type { CanvasElementCommonProps, CanvasShapeRefCallback } from './types'
import { GridLayer } from './GridLayer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { TextEditOverlay } from './TextEditOverlay'
import { cn } from '@/lib/utils'
import { ObjectContextMenu } from './ObjectContextMenu'
import { reorderNodes } from '@/utils/reorderUtils'

export interface KonvaCanvasEditorHandle {
  getStage: () => Konva.Stage | null
  copy: () => void
  paste: () => void
}

interface KonvaCanvasEditorProps {
  elements: UnifiedNode[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onChange: (
    updates: (Partial<UnifiedNode> & { id?: string }) | (Partial<UnifiedNode> & { id?: string })[],
    options?: { saveToHistory?: boolean; force?: boolean }
  ) => void
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
  onCreateElements?: (elements: UnifiedNode[]) => void
  initialScrollCenter?: { x: number; y: number }
  onToggleCollapse?: (id: string) => void
  // Mindmap drag & drop
  onDragStart?: (nodeId: string, startPosition: { x: number; y: number }) => void
  onDragMove?: (position: { x: number; y: number }) => void
  onDragEnter?: (targetNodeId: string, relativeY: number) => void
  onDragLeave?: () => void
  onDragEnd?: () => void
  dragState?: {
    isDragging: boolean
    draggedNodeId: string | null
    dragPosition: { x: number; y: number } | null
    dropTargetId: string | null
    dropPosition: 'child' | 'before' | 'after' | null
    canDrop: boolean
  }
  className?: string
  showPaperBorder?: boolean
  onReorderNodes?: (nodeIds: string[]) => void
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>, element: UnifiedNode) => void
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
      overlay,
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
      onCreateElements,
      initialScrollCenter,
      onToggleCollapse,
      onDragStart,
      onDragMove,
      onDragEnter,
      onDragLeave,
      onDragEnd,
      dragState,
      className,
      showPaperBorder = true,
      onReorderNodes,
      onContextMenu,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<Konva.Stage>(null)
    const [editingElementId, setEditingElementId] = useState<string | null>(null)

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
      visible: boolean
      x: number
      y: number
      elementId: string | null
    }>({
      visible: false,
      x: 0,
      y: 0,
      elementId: null,
    })

    // ...

    const handleDefaultContextMenu = useCallback((e: Konva.KonvaEventObject<PointerEvent>, element: UnifiedNode) => {
      e.evt.preventDefault()

      // Select the element if not already selected
      if (!selectedIds.includes(element.id)) {
        onSelect([element.id])
      }

      setContextMenu({
        visible: true,
        x: e.evt.clientX,
        y: e.evt.clientY,
        elementId: element.id
      })
    }, [selectedIds, onSelect])

    const handleReorder = useCallback((action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
      if (!contextMenu.elementId || !onReorderNodes) return

      const newElements = reorderNodes(elements, contextMenu.elementId, action)

      // Only notify if order actually changed (optimization could be added to utility but checking diff here is simple enough, or just trust the utility)
      // Actually reorderNodes always returns a new array.
      // We pass IDs to the callback.
      onReorderNodes(newElements.map(el => el.id))
      setContextMenu(prev => ({ ...prev, visible: false }))
    }, [elements, contextMenu.elementId, onReorderNodes])

    // Initial Scroll Centering
    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
      copy: handleCopy,
      paste: handlePaste,
    }))

    const dpi = 96
    const displayScale = mmToPx(1, { dpi }) * zoom

    const stageWidth = paperWidth * displayScale
    const stageHeight = paperHeight * displayScale

    // Handle Initial Scrolling
    const initialScrollDone = useRef(false)
    React.useEffect(() => {
      if (initialScrollCenter && containerRef.current && !initialScrollDone.current) {
        requestAnimationFrame(() => {
          if (!containerRef.current) return

          const { clientWidth, clientHeight } = containerRef.current
          // If container is not yet sized, retry later (don't set done = true)
          if (clientWidth === 0 || clientHeight === 0) return

          const targetX = initialScrollCenter.x * displayScale
          const targetY = initialScrollCenter.y * displayScale

          const scrollLeft = Math.max(0, targetX - clientWidth / 2)
          const scrollTop = Math.max(0, targetY - clientHeight / 2)

          containerRef.current.scrollTo(scrollLeft, scrollTop)
          initialScrollDone.current = true
        })
      }
    }, [initialScrollCenter, displayScale])

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

    const handleTextUpdate = (
      text: string,
      rect?: { x: number; y: number; w: number; h: number }
    ) => {
      if (!editingElementId) return

      const element = elements.find((el) => el.id === editingElementId)
      if (!element || element.t !== 'text') {
        onChange({ id: editingElementId, text } as Partial<UnifiedNode> & { id: string })
        return
      }

      const textNode = element as TextNode

      // If explicit rect is provided (e.g. from VerticalTextEditor)
      if (rect) {
        onChange({
          id: editingElementId,
          text,
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
        } as Partial<UnifiedNode> & { id: string })
        return
      }

      const updatePatch = applyTextLayoutUpdates(textNode, { text })

      onChange({
        id: editingElementId,
        ...updatePatch,
      } as Partial<UnifiedNode> & { id: string })
    }

    const handleTextEditFinish = () => {
      setEditingElementId(null)
    }

    const handleSelectAll = () => {
      if (readOnly) return
      onSelect(elements.map((el) => el.id))
    }

    const [pasteCount, setPasteCount] = useState(1)

    const handleCopy = () => {
      if (selectedIds.length === 0) return
      const selectedElements = elements.filter((el) => selectedIds.includes(el.id))

      if (selectedElements.length > 0) {
        localStorage.setItem('__konva_clipboard', JSON.stringify(selectedElements))
        // Reset paste counter on new copy
        setPasteCount(1)
      }
    }

    const handlePaste = () => {
      if (readOnly) {
        return
      }
      if (!onCreateElements) {
        return
      }
      try {
        const json = localStorage.getItem('__konva_clipboard')
        if (!json) return
        const clipboardElements = JSON.parse(json) as UnifiedNode[]

        if (!Array.isArray(clipboardElements) || clipboardElements.length === 0) return

        // Offset based on paper width (similar to toolbar behavior)
        // Toolbar uses 1% of width per new element
        const step = paperWidth * 0.01
        const offset = step * pasteCount

        const newElements = clipboardElements.map((el) => {
          const newId = crypto.randomUUID()
          const newEl = { ...el, id: newId }

          if (
            'x' in newEl &&
            'y' in newEl &&
            typeof newEl.x === 'number' &&
            typeof newEl.y === 'number'
          ) {
            // Offset by offset mm from original
            newEl.x += offset
            newEl.y += offset
          }
          return newEl
        })

        onCreateElements(newElements)
        // Optionally select the pasted elements
        onSelect(newElements.map((e) => e.id))

        // Increment paste counter for next paste
        setPasteCount((prev) => prev + 1)
      } catch (e) {
        console.error('Failed to paste elements', e)
      }
    }

    // Panning State
    const isPanning = useRef(false)
    const lastMousePos = useRef({ x: 0, y: 0 })

    const shortcutsHandlers = {
      onUndo,
      onRedo,
      onDelete,
      onCopy: handleCopy,
      onPaste: handlePaste,
      onSelectAll: handleSelectAll,
      onMoveUp: () => { }, // Disabled
      onMoveDown: () => { }, // Disabled
      onMoveLeft: () => { }, // Disabled
      onMoveRight: () => { }, // Disabled
    }

    useKeyboardShortcuts(shortcutsHandlers)

    // Mindmap drag & drop handlers
    const handleNodeDragStart = useCallback(
      (nodeId: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const pos = e.target.getStage()?.getPointerPosition()
        if (pos) {
          onDragStart?.(nodeId, { x: pos.x, y: pos.y })
        }
      },
      [onDragStart]
    )

    const handleNodeDragEnter = useCallback(
      (nodeId: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const pos = e.target.getStage()?.getPointerPosition()
        const rect = e.target.getClientRect()
        if (pos && rect) {
          const relativeY = (pos.y - rect.y) / rect.height
          onDragEnter?.(nodeId, relativeY)
        }
      },
      [onDragEnter]
    )

    const editingElement = editingElementId
      ? (elements.find((el) => el.id === editingElementId) as TextNode)
      : undefined

    return (
      <div
        ref={containerRef}
        className={cn(
          'w-full h-full bg-gray-100 dark:bg-gray-900 overflow-auto flex scrollbar-thin p-2',
          className
        )}
        style={{
          cursor: isPanning.current ? 'grabbing' : 'default',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <div
          className={cn(
            'relative bg-white dark:bg-gray-800 w-fit h-fit',
            showPaperBorder && 'shadow-lg border-2 border-gray-500'
          )}
        >
          <Stage
            width={stageWidth}
            height={stageHeight}
            scaleX={displayScale}
            scaleY={displayScale}
            ref={stageRef}
            onContextMenu={(e) => {
              // Prevent default on stage if background clicked
              e.evt.preventDefault()
            }}
            onMouseDown={(e) => {
              if (onStageMouseDown) {
                onStageMouseDown(e)
              }
              const isBackground =
                e.target === e.target.getStage() || e.target.name() === 'paper-background'

              if (isBackground) {
                if (!onStageMouseDown) {
                  handleSelect(null, e)
                  setEditingElementId(null)
                }

                // Start Panning
                isPanning.current = true
                lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY }
                if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
              }
            }}
            onMouseMove={(e) => {
              onStageMouseMove?.(e)

              // Mindmap drag move
              if (onDragMove) {
                const pos = e.target.getStage()?.getPointerPosition()
                if (pos) {
                  onDragMove({ x: pos.x, y: pos.y })
                }
              }

              if (isPanning.current && containerRef.current) {
                e.evt.preventDefault() // Prevent selection
                const dx = e.evt.clientX - lastMousePos.current.x
                const dy = e.evt.clientY - lastMousePos.current.y

                containerRef.current.scrollLeft -= dx
                containerRef.current.scrollTop -= dy

                lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY }
              }
            }}
            onMouseUp={(e) => {
              onStageMouseUp?.(e)

              // Mindmap drag end
              onDragEnd?.()

              if (isPanning.current) {
                isPanning.current = false
                if (containerRef.current) containerRef.current.style.cursor = 'default'
              }
            }}
            onMouseLeave={() => {
              if (isPanning.current) {
                isPanning.current = false
                if (containerRef.current) containerRef.current.style.cursor = 'default'
              }
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
            onTouchMove={(e) => onStageMouseMove?.(e)}
            onTouchEnd={(e) => onStageMouseUp?.(e)}
          >
            <Layer name="paper-layer">
              {background || (
                <Rect
                  name="paper-background"
                  x={0}
                  y={0}
                  width={paperWidth}
                  height={paperHeight}
                  fill="#ffffff"
                  listening={true}
                />
              )}
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
                  onChange={onChange}
                  onDblClick={() => handleElementDblClick(element)}
                  isEditing={element.id === editingElementId}
                  renderCustom={renderCustom}
                  snapStrength={snapStrength}
                  showGrid={showGrid}
                  gridSize={gridSize}
                  onToggleCollapse={onToggleCollapse}
                  onDragStart={onDragStart ? handleNodeDragStart : undefined}
                  onDragEnter={onDragStart ? handleNodeDragEnter : undefined}
                  onDragLeave={onDragStart ? onDragLeave : undefined}
                  dragState={dragState}
                  onContextMenu={(e) => {
                    if (onContextMenu) {
                      onContextMenu(e, element)
                    } else {
                      handleDefaultContextMenu(e, element)
                    }
                  }}
                />
              ))}
            </Layer>
            {overlay && (
              <Layer name="overlay-layer" listening={false}>
                {overlay}
              </Layer>
            )}
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

          <ObjectContextMenu
            visible={contextMenu.visible}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
            onAction={handleReorder}
          />
        </div>
      </div>
    )
  }
)

KonvaCanvasEditor.displayName = 'KonvaCanvasEditor'
