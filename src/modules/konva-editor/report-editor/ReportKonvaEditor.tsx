import type Konva from 'konva'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Image as KonvaImage, Rect as KonvaRect, Layer, Stage } from 'react-konva'
import { CanvasElementRenderer } from '../../../components/canvas/CanvasElementRenderer'
import { useKeyboardShortcuts } from '../../../components/canvas/hooks/useKeyboardShortcuts'
import { TextEditOverlay } from '../../../components/canvas/TextEditOverlay'
import type { ITextElement } from '../../../types/canvas'
import { createContextLogger } from '../../../utils/logger'
import { TableContextMenu } from './pdf-editor/components/ContextMenu/TableContextMenu'
import { findImageWithExtension } from './pdf-editor/components/WysiwygCanvas/canvasImageUtils'
import type { Element, IBox, ITableElement, ITemplateDoc } from './pdf-editor/types/wysiwyg'
import { A4_HEIGHT_PT, A4_WIDTH_PT } from './pdf-editor/utils/coordinates'

const log = createContextLogger('ReportKonvaEditor')
type TableCell = ITableElement['cells'][number]
type BoxElement = Extract<Element, { box: IBox }>

export interface ReportKonvaEditorHandle {
  downloadImage: () => void
}

interface ReportKonvaEditorProps {
  templateDoc: ITemplateDoc
  zoom: number
  selectedElementId?: string
  onElementSelect: (element: Element | null) => void
  onTemplateChange: (doc: ITemplateDoc) => void
  currentPageId?: string
  onUndo?: () => void
  onRedo?: () => void
  orientation?: 'portrait' | 'landscape'
  onEditingCellChange?: (cell: { elementId: string; row: number; col: number } | null) => void
  onSelectedCellChange?: (cell: { elementId: string; row: number; col: number } | null) => void
  activeTool?: string
}

const PageBackground = ({
  width,
  height,
  background,
}: {
  width: number
  height: number
  background?: { color?: string; imageId?: string }
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!background?.imageId) {
      log.debug('No background imageId')
      setImage(null)
      return
    }

    log.debug('Loading background image', { imageId: background.imageId })
    let active = true
    findImageWithExtension(background.imageId)
      .then((res) => {
        if (active && res) {
          log.debug('Background image loaded', { url: res.url })
          setImage(res.img)
        } else if (active) {
          log.warn('Failed to load background image')
        }
      })
      .catch((err) => {
        log.error('Error loading background image', err)
      })

    return () => {
      active = false
    }
  }, [background?.imageId])

  return (
    <>
      <KonvaRect
        name="_background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill={background?.color || '#ffffff'}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.1}
      />
      {image && image.width > 0 && image.height > 0 && (
        <KonvaImage
          name="_background"
          x={0}
          y={0}
          width={width}
          height={height}
          image={image}
          listening={false}
        />
      )}
    </>
  )
}

export const ReportKonvaEditor = forwardRef<ReportKonvaEditorHandle, ReportKonvaEditorProps>(
  (
    {
      templateDoc,
      zoom,
      selectedElementId,
      onElementSelect,
      onTemplateChange,
      currentPageId,
      onUndo,
      onRedo,
      orientation = 'portrait',
      onSelectedCellChange,
      activeTool = 'select',
    },
    ref
  ) => {
    useImperativeHandle(ref, () => ({
      downloadImage: () => {
        // Placeholder for now
        log.info('Download image requested')
      }
    }))

    const stageRef = useRef<Konva.Stage>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [editingElementId, setEditingElementId] = useState<string | null>(null)
    const [editingCell, setEditingCell] = useState<{
      elementId: string
      row: number
      col: number
    } | null>(null)
    const [selectedCell, setSelectedCell] = useState<{
      elementId: string
      row: number
      col: number
    } | null>(null)

    // Signature Drawing State
    const [isDrawing, setIsDrawing] = useState(false)
    const [currentStrokes, setCurrentStrokes] = useState<number[][]>([])
    const [currentPoints, setCurrentPoints] = useState<number[]>([])

    const [contextMenu, setContextMenu] = useState<{
      visible: boolean
      x: number
      y: number
      elementId: string
      row: number
      col: number
    } | null>(null)

    // --- Restore Missing Assignments ---
    const currentPage = templateDoc.pages.find((p) => p.id === currentPageId) || templateDoc.pages[0]
    // Filter elements for current page
    const elements = templateDoc.elements.filter((el) => el.pageId === currentPage.id)

    // Page Size Logic
    const isLandscape = orientation === 'landscape'
    let width = 0
    let height = 0
    if (typeof currentPage.size === 'string') {
      if (currentPage.size === 'A4') {
        width = isLandscape ? A4_HEIGHT_PT : A4_WIDTH_PT
        height = isLandscape ? A4_WIDTH_PT : A4_HEIGHT_PT
      } else {
        // other sizes fallback
        width = 595
        height = 842
      }
    } else {
      width = currentPage.size.width
      height = currentPage.size.height
    }

    const displayScale = zoom

    // Handlers
    const handleElementSelect = (element: Element | null) => {
      onElementSelect(element)
    }

    const handleElementChange = (updates: Partial<Element> & { id?: string }) => {
      const targetId = updates.id || selectedElementId
      if (!targetId) return

      const nextElements = templateDoc.elements.map((el) => {
        if (el.id === targetId) {
          return { ...el, ...updates, id: targetId } // ensure id is kept
        }
        return el
      })
      onTemplateChange({ ...templateDoc, elements: nextElements as Element[] })
    }

    const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>, element: Element) => {
      e.evt.preventDefault()
      if (element.type === 'Table') {
        const stage = e.target.getStage()
        const ptr = stage?.getPointerPosition()
        if (ptr) {
          // Find cell?
          // For now just show at pointer
          setContextMenu({
            visible: true,
            x: ptr.x,
            y: ptr.y,
            elementId: element.id,
            row: selectedCell?.row ?? -1,
            col: selectedCell?.col ?? -1
          })
        }
      }
    }

    const handleContextMenuAction = (action: string) => {
      if (!contextMenu) return
      log.info('Context menu action', { action, contextMenu })
      // Implement basics if needed, or leave empty/log for now as verification is focus
      setContextMenu(null)
    }

    // Sync selectedCell to parent
    useEffect(() => {
      onSelectedCellChange?.(selectedCell)
    }, [selectedCell, onSelectedCellChange])

    // Commit signature when tool changes or component unmounts?
    // Actually, if we switch tool, we should commit.
    useEffect(() => {
      if (activeTool !== 'signature' && currentStrokes.length > 0) {
        commitSignature()
      }
    }, [activeTool])

    // Helper to calculate box from strokes
    const getStrokesBox = (strokes: number[][]) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      strokes.forEach(stroke => {
        for (let i = 0; i < stroke.length; i += 2) {
          const x = stroke[i]
          const y = stroke[i + 1]
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      })

      // Default / Safety
      if (minX === Infinity) return { x: 0, y: 0, width: 100, height: 50 }

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      }
    }

    const commitSignature = () => {
      if (currentStrokes.length === 0) return

      const pageId = currentPageId || templateDoc.pages[0]?.id
      const id = `sig-${crypto.randomUUID()}`
      const box = getStrokesBox(currentStrokes)

      // Normalize points relative to box (0,0)
      const normalizedStrokes = currentStrokes.map(stroke => {
        const newStroke: number[] = []
        for (let i = 0; i < stroke.length; i += 2) {
          newStroke.push(stroke[i] - box.x)
          newStroke.push(stroke[i + 1] - box.y)
        }
        return newStroke
      })

      const element: any = { // ISignatureElement
        id,
        type: 'Signature',
        pageId,
        z: templateDoc.elements.length + 1,
        visible: true,
        locked: false,
        name: 'Signature',
        box,
        strokes: normalizedStrokes,
        stroke: '#000000',
        strokeWidth: 2,
        rotation: 0
      }

      const nextDoc = {
        ...templateDoc,
        elements: [...templateDoc.elements, element],
      }
      onTemplateChange(nextDoc)

      setCurrentStrokes([])
      setCurrentPoints([])
      setIsDrawing(false)

      // Select the new element?
      onElementSelect(element)
    }

    // Debug active tool changes
    useEffect(() => {
      log.debug('Active Tool Changed', { activeTool })
    }, [activeTool])

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      log.debug('Stage MouseDown', { activeTool, isDrawing, target: e.target.name() })

      // Priority to drawing
      if (activeTool === 'signature') {
        setIsDrawing(true)
        const stage = e.target.getStage()
        const point = stage?.getPointerPosition()
        if (point) {
          // Correct for stage transform
          // But actually we are drawing ON TOP of everything?
          // Or in the world coordinates?
          // We need world coordinates.
          // stage.getPointerPosition() is screen px.
          // We need to divide by scale. (We don't use scroll in this simple editor yet, or do we? 
          // The container has overflow-auto, but stage is fixed size with scale inside.
          // Wait, container scrolls. Stage is typically full size?
          // No, file says: <div overflow-auto> <Stage .../> </div>
          // So Stage is big. pointerPosition is relative to Stage top-left?
          // Yes, Konva getPointerPosition is relative to page usually, but react-konva uses relative to container?
          // Standard Konva: getRelativePointerPosition updates for scale.
          const transform = stage?.getAbsoluteTransform().copy()
          transform?.invert()
          const pos = transform?.point(point)
          if (pos) {
            setCurrentPoints([pos.x, pos.y])
          }
        }
        return
      }

      // Deselect if clicked on empty area or background
      if (e.target === e.target.getStage() || e.target.name() === '_background') {
        handleElementSelect(null)
      }
    }

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'signature' && isDrawing) {
        const stage = e.target.getStage()
        const point = stage?.getPointerPosition()
        if (point) {
          const transform = stage?.getAbsoluteTransform().copy()
          transform?.invert()
          const pos = transform?.point(point)
          if (pos) {
            setCurrentPoints(prev => [...prev, pos.x, pos.y])
          }
        }
      }
    }

    const handleStageMouseUp = (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'signature' && isDrawing) {
        setIsDrawing(false)
        if (currentPoints.length > 0) {
          setCurrentStrokes(prev => [...prev, currentPoints])
          setCurrentPoints([])
        }
      }
    }

    // Touch support mapping for drawing
    const handleStageTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
      // handleStageMouseDown expects MouseEvent, but we only use getStage/getPointer.
      // Pass as any or cast
      handleStageMouseDown(e as any)
    }
    const handleStageTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
      handleStageMouseMove(e as any)
    }
    const handleStageTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
      handleStageMouseUp(e as any)
    }

    const handleElementDblClick = (element: Element) => {
      if (activeTool === 'signature') return // No interaction in drawing mode
      if (element.type === 'Text') {
        setEditingElementId(element.id)
      }
    }

    const handleTextUpdate = (text: string) => {
      if (!editingElementId) return
      handleElementChange({ id: editingElementId, text })
    }

    const handleTextEditFinish = () => {
      setEditingElementId(null)
    }

    const handleCellDblClick = (elementId: string, row: number, col: number) => {
      if (activeTool === 'signature') return
      setEditingCell({ elementId, row, col })
      setSelectedCell({ elementId, row, col })
    }

    const handleCellClick = (elementId: string, row: number, col: number) => {
      if (activeTool === 'signature') return
      // ... same as before

      log.debug('handleCellClick', { elementId, row, col })

      // Always select the cell
      setSelectedCell({ elementId, row, col })

      // Ensure the table element itself is selected in the editor state
      if (selectedElementId !== elementId) {
        const element = elements.find((el) => el.id === elementId)
        if (element) {
          setEditingElementId(null)
          onElementSelect(element)
        }
      }
    }

    const handleCellUpdate = (text: string) => {
      if (!editingCell) return
      const element = elements.find((el) => el.id === editingCell.elementId) as Element
      if (element?.type !== 'Table') return

      const tableElement = element as ITableElement
      const updatedCells = tableElement.cells.map((cell) => {
        if (cell.row === editingCell.row && cell.col === editingCell.col) {
          return { ...cell, content: text }
        }
        return cell
      }) as TableCell[]

      handleElementChange({ id: editingCell.elementId, cells: updatedCells })
    }

    const handleCellEditFinish = () => {
      setEditingCell(null)
    }

    const editingTableElement = elements.find((el) => el.id === editingCell?.elementId)
    // Safe lookup for cell data
    const editingCellData =
      editingTableElement && editingTableElement.type === 'Table' && editingCell
        ? (editingTableElement as ITableElement).cells.find(
          (cell) => cell.row === editingCell.row && cell.col === editingCell.col
        )
        : null

    // Create a proxy ITextElement for the overlay
    const proxyTextElement =
      editingTableElement && editingCellData
        ? ({
          id: `${editingTableElement.id}_cell_${editingCellData.row}_${editingCellData.col}`,
          text: editingCellData.content,
          font: editingCellData.styles.font || {
            size: 12,
            family: 'Meiryo',
            weight: 400,
          },
          color: editingCellData.styles.font?.color || '#000000',
          align: editingCellData.styles.align || 'left',
          // We need box for TextEditOverlay to size the textarea.
          // We can approximate or calculation required?
          // TextEditOverlay uses element.box.width.
          // We need to calculate cell width/height.
          // IMPOTANT: We need the calculated width/height here.
          // But we don't have access to rows/cols easy lookup here without same logic as renderer.
          // Simplified: pass dummy box and let Overlay autosize? No overlay needs size.
          // Re-implement lookup helper here strictly for the proxy.
          box: (() => {
            const tbl = editingTableElement as ITableElement
            const rows = tbl.rows
            const cols = tbl.cols
            const { row, col, rowSpan = 1, colSpan = 1 } = editingCellData
            let w = 0
            let h = 0
            for (let i = 0; i < colSpan; i++) {
              if (cols[col + i]) w += cols[col + i].width
            }
            for (let i = 0; i < rowSpan; i++) {
              if (rows[row + i]) h += rows[row + i].height
            }
            return { width: w, height: h }
          })(),
          rotation: editingTableElement.rotation,
          type: 'Text', // Fake type
          z: 0,
          pageId: '',
          visible: true,
          locked: false,
        } as unknown as ITextElement)
        : undefined

    const editingElement = elements.find((el) => el.id === editingElementId) as
      | ITextElement
      | undefined

    const handleDelete = () => {
      if (selectedElementId) {
        const updatedElements = templateDoc.elements.filter((el) => el.id !== selectedElementId)
        onTemplateChange({ ...templateDoc, elements: updatedElements })
        onElementSelect(null)
        log.info('Deleted element', { id: selectedElementId })
      }
    }

    const handleSelectAll = () => {
      // In this simple editor, maybe we don't support multi-select yet,
      // but we can select the first one or implement multi-select later.
      // For now, let's just log or select the first one if nothing selected.
      if (elements.length > 0) {
        onElementSelect(elements[0] || null)
      } else {
        onElementSelect(null)
      }
    }

    const handleMove = (dx: number, dy: number) => {
      if (selectedElementId) {
        const element = elements.find((el) => el.id === selectedElementId)
        if (element && 'box' in element) {
          // Cast to access box safely, ensuring we are operating on an element with a box property
          // We use Partial<IBox> to avoid needing to specify all properties when we only update x and y
          const boxElement = element as unknown as {
            box: { x: number; y: number; width: number; height: number }
          }
          const newBox = {
            ...boxElement.box,
            x: boxElement.box.x + dx,
            y: boxElement.box.y + dy,
          }
          handleElementChange({ id: selectedElementId, box: newBox })
        }
      }
    }

    const [clipboard, setClipboard] = useState<Element | null>(null)

    const handleCopy = () => {
      if (selectedElementId) {
        const element = elements.find((el) => el.id === selectedElementId)
        if (element) {
          setClipboard(element)
          log.info('Copied element to clipboard', { id: element.id, type: element.type })
        }
      }
    }

    const handlePaste = () => {
      if (!clipboard) return

      const newId = crypto.randomUUID()
      // Offset by 20px so it doesn't perfectly overlap
      const offset = 20

      let newElement: Element

      if ('box' in clipboard) {
        // Handle elements with box (Text, Rect, Image, etc)
        const boxElement = clipboard as BoxElement
        newElement = {
          ...clipboard,
          id: newId,
          box: {
            ...boxElement.box,
            x: boxElement.box.x + offset,
            y: boxElement.box.y + offset,
          },
        } as Element
      } else {
        // Fallback for elements without box (shouldn't happen for most)
        newElement = {
          ...clipboard,
          id: newId,
        } as Element
      }

      const nextDoc = {
        ...templateDoc,
        elements: [...templateDoc.elements, newElement],
      }

      onTemplateChange(nextDoc)
      onElementSelect(newElement)
      log.info('Pasted element from clipboard', { originalId: clipboard.id, newId })
    }

    useKeyboardShortcuts({
      onUndo,
      onRedo,
      onDelete: handleDelete,
      onSelectAll: handleSelectAll,
      onMoveUp: (step) => handleMove(0, -step),
      onMoveDown: (step) => handleMove(0, step),
      onMoveLeft: (step) => handleMove(-step, 0),
      onMoveRight: (step) => handleMove(step, 0),
      onCopy: handleCopy,
      onPaste: handlePaste,
    })

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      if (!stageRef.current) return

      try {
        const jsonData = e.dataTransfer.getData('application/json')
        if (!jsonData) return

        const payload = JSON.parse(jsonData)
        if (payload.type !== 'binding') return

        const { sourceId, fieldId, text } = payload.data // Added fieldType to payload in DataPalette

        // Get drop position relative to stage
        stageRef.current.setPointersPositions(e)
        const stagePos = stageRef.current.getPointerPosition()

        if (!stagePos) return

        // Convert to logic coordinate (PT)
        // stagePos is in standard screen pixels (considering zoom)
        // Logic coord = stagePos / zoom / PX_PER_PT ?
        // Wait, stage scale is `displayScale = zoom * PX_PER_PT`.
        // So logicX = stagePos.x / displayScale

        const logicX = stagePos.x / displayScale
        const logicY = stagePos.y / displayScale

        // Create new element
        const pageId = currentPage?.id || templateDoc.pages[0].id // Use current page

        // TODO: Handle Image type, Repeater/Table type later
        // For now default to TextElement for string/number/date
        const newElement: ITextElement = {
          id: `field-${crypto.randomUUID()}`,
          type: 'Text',
          pageId,
          z: elements.length + 1, // Simple Z index
          visible: true,
          locked: false,
          rotation: 0,
          name: fieldId, // Use field ID as name
          text: text, // '[Label]'
          font: {
            family: 'Meiryo',
            size: 12,
            weight: 400,
          },
          color: '#0000ff', // Blue for bound fields
          align: 'left',
          box: {
            x: logicX,
            y: logicY,
            width: 150,
            height: 20,
          },
          binding: {
            type: 'field',
            sourceId,
            fieldId,
            path: fieldId, // Assuming flat path for now
          },
        }

        const nextDoc = {
          ...templateDoc,
          elements: [...templateDoc.elements, newElement],
        }
        onTemplateChange(nextDoc)
        onElementSelect(newElement)
      } catch (err) {
        log.error('Failed to handle drop', err)
      }
    }

    return (
      <div
        className={`relative w-full h-full bg-gray-100 overflow-auto flex justify-start items-start p-2 scrollbar-thin ${activeTool === 'signature' ? 'cursor-crosshair' : 'cursor-default'
          }`}
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="region"
        aria-label="Report canvas drop area"
      >
        <div className="relative shadow-lg border-2 border-gray-500 w-fit h-fit">
          <Stage
            key={orientation}
            width={width * displayScale}
            height={height * displayScale}
            scaleX={displayScale}
            scaleY={displayScale}
            ref={stageRef}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onTouchStart={handleStageTouchStart}
            onTouchMove={handleStageTouchMove}
            onTouchEnd={handleStageTouchEnd}
          >
            <Layer name="background-layer" listening={false}>
              {/* Page Background */}
              <PageBackground width={width} height={height} background={currentPage?.background} />
            </Layer>
            <Layer
              name="content-layer"
              listening={activeTool !== 'signature'}
            >
              {elements
                .sort((a, b) => a.z - b.z)
                .map((element) => (
                  <CanvasElementRenderer
                    key={element.id}
                    element={element}
                    isSelected={element.id === selectedElementId}
                    onSelect={() => handleElementSelect(element)}
                    onChange={handleElementChange}
                    onDblClick={() => handleElementDblClick(element)}
                    onCellDblClick={handleCellDblClick}
                    onCellClick={handleCellClick}
                    editingCell={editingCell}
                    selectedCell={selectedCell?.elementId === element.id ? selectedCell : null}
                    isEditing={
                      element.id === editingElementId || element.id === editingCell?.elementId
                    }
                    onContextMenu={(e) => handleContextMenu(e, element)}
                  />
                ))}
              {/* Active Signature Rendering */}
              {(currentStrokes.length > 0 || currentPoints.length > 0) && (
                <CanvasElementRenderer
                  key="active-signature"
                  element={{
                    id: 'active-signature',
                    type: 'Signature',
                    pageId: currentPage?.id || '',
                    z: 9999, // On top
                    visible: true,
                    locked: false,
                    name: 'Signature',
                    box: { x: 0, y: 0, width: 0, height: 0 }, // Box doesn't matter for pure rendering of points if they are absolute, BUT...
                    // Wait, if I render separate Lines with Absolute points, I don't need box.
                    // BUT my Signature renderer implementation USES `box` (Rect transparent overlay) + lines.
                    // And it expects strokes to be relative?
                    // "strokes" in ISignatureElement should be relative to box.x/y or absolute?
                    // If I defined them as absolute in my renderer:
                    // "points={points}" in renderer assumes points are relative to Group (x,y)? 
                    // In renderer: <Group {...commonProps}> ... <Line points={points} />
                    // commonProps includes x/y from element.box.
                    // So points MUST be relative to element.box.x/y.
                    // BUT `currentpoints` are ABSOLUTE (stage logic coords).
                    // So for 'active-signature', I should set box.x=0, box.y=0.
                    // Then absolute points will render correctly in the group at 0,0.
                    // My previous implementation of `commitSignature` normalized them.
                    // So here, render ABSOLUTE points with box at 0,0.
                    strokes: [...currentStrokes, ...(currentPoints.length > 0 ? [currentPoints] : [])],
                    stroke: '#000000',
                    strokeWidth: 2
                  } as any}
                  isSelected={false}
                  onSelect={() => { }}
                  onChange={() => { }}
                />
              )}
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

          {proxyTextElement && (
            <TextEditOverlay
              element={proxyTextElement}
              scale={displayScale}
              stageNode={stageRef.current}
              onUpdate={handleCellUpdate}
              onFinish={handleCellEditFinish}
            />
          )}

          {contextMenu && (
            <TableContextMenu
              visible={contextMenu.visible}
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              onAction={handleContextMenuAction}
            />
          )}
        </div>
      </div>
    )
  }
)

ReportKonvaEditor.displayName = 'ReportKonvaEditor'
