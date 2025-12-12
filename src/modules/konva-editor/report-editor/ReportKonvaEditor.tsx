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
import { A4_HEIGHT_PT, A4_WIDTH_PT, PX_PER_PT } from './pdf-editor/utils/coordinates'

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
      onEditingCellChange,
      onSelectedCellChange,
    },
    ref
  ) => {
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

    const [contextMenu, setContextMenu] = useState<{
      visible: boolean
      x: number
      y: number
      elementId: string
      row: number
      col: number
    } | null>(null)

    // Sync selectedCell to parent
    useEffect(() => {
      onSelectedCellChange?.(selectedCell)
    }, [selectedCell, onSelectedCellChange])

    const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault()
      const stage = e.target.getStage()
      if (!stage) return

      // Find if we clicked on a table cell
      // We need to find the element
      // Konva target might be a Text or Rect inside the Group
      // The Group id is the element id.
      // The cell id pattern is `${tableElement.id}_cell_${cell.row}_${cell.col}` for Text
      // Rect doesn't have ID in render??
      // Let's check CanvasElementRenderer. It has `Group key={...}` but no ID on Rect/Group parts for cell mapping except Text?
      // Wait, the renderer `Group` has `commonProps` which includes `id`.
      // The inner cells... `Group` has key but not ID?
      // Text has ID: `${element.id}_cell_${cell.row}_${cell.col}`.
      // We can rely on Text ID or we need to add ID to Rect/Group if clicked on background.
      // Ideally we want to know WHICH cell.
      // Parsing ID: `${elementId}_cell_${row}_${col}`

      // If we can't parse, fallback?
      // Let's rely on finding `cell_R_C` pattern.

      const targetId = e.target.id()
      if (!targetId) return // or check parent?

      const parts = targetId.split('_cell_')
      if (parts.length !== 2) return

      const elementId = parts[0]
      const cellParts = parts[1].split('_')
      // Supports "row_col" or "row_col_text"
      if (cellParts.length < 2) return

      const row = parseInt(cellParts[0], 10)
      const col = parseInt(cellParts[1], 10)

      const pointerPos = stage.getPointerPosition()
      if (!pointerPos) return

      // We use absolute coordinates for the menu (relative to viewport/window or container?)
      // The menu is `fixed` so we need clientX/Y from the native event?
      // e.evt is a PointerEvent.
      setContextMenu({
        visible: true,
        x: e.evt.clientX,
        y: e.evt.clientY,
        elementId,
        row,
        col,
      })
    }

    const handleContextMenuAction = (
      action:
        | 'insertRowAbove'
        | 'insertRowBelow'
        | 'insertColLeft'
        | 'insertColRight'
        | 'deleteRow'
        | 'deleteCol'
    ) => {
      if (!contextMenu) return

      const element = elements.find((el) => el.id === contextMenu.elementId)
      if (!element || element.type !== 'Table') return
      const tableElement = element as ITableElement

      // Logic similar to TableProperties but using contextMenu.row/col
      const { row, col } = contextMenu

      let updates: Partial<ITableElement> = {}

      if (action === 'insertRowAbove' || action === 'insertRowBelow') {
        const insertIndex = action === 'insertRowAbove' ? row : row + 1
        const newRowId = `r-${crypto.randomUUID()}`
        const newRow = { id: newRowId, height: 50 }
        const newRows = [...tableElement.rows]
        newRows.splice(insertIndex, 0, newRow)

        const newCells = tableElement.cells.map((cell) =>
          cell.row >= insertIndex ? { ...cell, row: cell.row + 1 } : cell
        )
        for (let c = 0; c < tableElement.colCount; c++) {
          newCells.push({
            row: insertIndex,
            col: c,
            content: '',
            styles: { borderWidth: 1, borderColor: '#000000' },
          })
        }
        updates = {
          rows: newRows,
          cells: newCells,
          rowCount: tableElement.rowCount + 1,
          box: { ...tableElement.box, height: tableElement.box.height + 50 },
        }
      } else if (action === 'insertColLeft' || action === 'insertColRight') {
        const insertIndex = action === 'insertColLeft' ? col : col + 1
        const newColId = `c-${crypto.randomUUID()}`
        const newCol = { id: newColId, width: 100 }
        const newCols = [...tableElement.cols]
        newCols.splice(insertIndex, 0, newCol)

        const newCells = tableElement.cells.map((cell) =>
          cell.col >= insertIndex ? { ...cell, col: cell.col + 1 } : cell
        )
        for (let r = 0; r < tableElement.rowCount; r++) {
          newCells.push({
            row: r,
            col: insertIndex,
            content: '',
            styles: { borderWidth: 1, borderColor: '#000000' },
          })
        }
        updates = {
          cols: newCols,
          cells: newCells,
          colCount: tableElement.colCount + 1,
          box: { ...tableElement.box, width: tableElement.box.width + 100 },
        }
      } else if (action === 'deleteRow') {
        if (tableElement.rowCount <= 1) return
        const targetRow = tableElement.rows[row]
        const newRows = tableElement.rows.filter((_, i: number) => i !== row)
        const newCells = tableElement.cells
          .filter((cell) => cell.row !== row)
          .map((cell) => (cell.row > row ? { ...cell, row: cell.row - 1 } : cell))
        updates = {
          rows: newRows,
          cells: newCells,
          rowCount: tableElement.rowCount - 1,
          box: {
            ...tableElement.box,
            height: Math.max(0, tableElement.box.height - targetRow.height),
          },
        }
      } else if (action === 'deleteCol') {
        if (tableElement.colCount <= 1) return
        const targetCol = tableElement.cols[col]
        const newCols = tableElement.cols.filter((_, i: number) => i !== col)
        const newCells = tableElement.cells
          .filter((cell) => cell.col !== col)
          .map((cell) => (cell.col > col ? { ...cell, col: cell.col - 1 } : cell))
        updates = {
          cols: newCols,
          cells: newCells,
          colCount: tableElement.colCount - 1,
          box: {
            ...tableElement.box,
            width: Math.max(0, tableElement.box.width - targetCol.width),
          },
        }
      }

      handleElementChange({ id: tableElement.id, ...updates })
      setContextMenu(null)
    }

    useEffect(() => {
      onEditingCellChange?.(editingCell)
    }, [editingCell, onEditingCellChange])

    useEffect(() => {
      onSelectedCellChange?.(selectedCell)
    }, [selectedCell, onSelectedCellChange])

    useImperativeHandle(ref, () => ({
      downloadImage: () => {
        const stage = stageRef.current
        if (!stage) return

        // Hide selection UI
        const transformers = stage.find('._transformer')
        const handles = stage.find('._line_handle')
        for (const transformer of transformers) {
          transformer.hide()
        }
        for (const handle of handles) {
          handle.hide()
        }

        const dataUrl = stage.toDataURL({ pixelRatio: 2 })

        // Restore selection UI
        for (const transformer of transformers) {
          transformer.show()
        }
        for (const handle of handles) {
          handle.show()
        }

        const link = document.createElement('a')
        link.download = `report-${Date.now()}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      },
      getStage: () => stageRef.current,
    }))

    const currentPage = currentPageId
      ? templateDoc.pages.find((p) => p.id === currentPageId) || templateDoc.pages[0]
      : templateDoc.pages[0]

    const elements = templateDoc.elements.filter((el) => el.pageId === currentPage?.id)

    // Calculate canvas size based on page size (A4 default)
    // We use PT units for internal logic (PDF standard), but scale to PX for display (Screen standard)
    const width = orientation === 'landscape' ? A4_HEIGHT_PT : A4_WIDTH_PT
    const height = orientation === 'landscape' ? A4_WIDTH_PT : A4_HEIGHT_PT

    // Scale factor to convert PT (72 DPI) to PX (96 DPI) for display
    // zoom is e.g. 1.0 for 100%
    const displayScale = zoom * PX_PER_PT

    useEffect(() => {
      log.debug('ReportKonvaEditor Dimensions', {
        orientation,
        zoom,
        displayScale,
        logicalWidthPt: width,
        logicalHeightPt: height,
        stageWidthPx: width * displayScale,
        stageHeightPx: height * displayScale,
      })
    }, [orientation, zoom, displayScale, width, height])

    const handleElementChange = (newAttrs: Partial<Element> & { id?: string }) => {
      if (!newAttrs.id) return
      const updatedElements = templateDoc.elements.map((el) => {
        if (el.id === newAttrs.id) {
          return { ...el, ...newAttrs } as Element
        }
        return el
      })
      onTemplateChange({ ...templateDoc, elements: updatedElements })
    }

    const handleElementSelect = (element: Element | null) => {
      setSelectedCell(null)
      setEditingElementId(null)
      onElementSelect(element)
    }

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Deselect if clicked on empty area or background
      if (e.target === e.target.getStage() || e.target.name() === '_background') {
        handleElementSelect(null)
      }
    }

    const handleElementDblClick = (element: Element) => {
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
      setEditingCell({ elementId, row, col })
      setSelectedCell({ elementId, row, col })
    }

    const handleCellClick = (elementId: string, row: number, col: number) => {
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
        className="relative w-full h-full bg-gray-100 overflow-auto flex justify-start items-start p-2 scrollbar-thin"
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
          >
            <Layer name="background-layer" listening={false}>
              {/* Page Background */}
              <PageBackground width={width} height={height} background={currentPage?.background} />
            </Layer>
            <Layer name="content-layer">
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
                    onContextMenu={handleContextMenu}
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
