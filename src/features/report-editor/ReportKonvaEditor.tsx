import type Konva from 'konva'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Image as KonvaImage, Rect as KonvaRect, Layer, Stage } from 'react-konva'
import { CanvasElementRenderer } from '@/components/canvas/CanvasElementRenderer'
import { GridLayer } from '@/components/canvas/GridLayer'
import { useKeyboardShortcuts } from '@/components/canvas/hooks/useKeyboardShortcuts'
import { TextEditOverlay } from '@/components/canvas/TextEditOverlay'
import { PEN_CURSOR_URL } from '@/features/konva-editor/cursors'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'
import type { Doc, SignatureNode, Surface, TableNode, TextNode, UnifiedNode } from '@/types/canvas' // Direct import
import { createContextLogger } from '@/utils/logger'
import { mmToPx, ptToMm } from '@/utils/units'
import { useTextDimensions } from '@/features/konva-editor/hooks/useTextDimensions'
import {
  deleteCol,
  deleteRow,
  insertCol,
  insertRow,
  mergeCells,
  unmergeCells,
} from './utils/tableOperations'
import { getStrokesBox, normalizeStrokes, processStrokes } from './utils/signatureUtils'
import { TableContextMenu } from './components/ContextMenu/TableContextMenu'

const log = createContextLogger('ReportKonvaEditor')

const dpi = 96

export interface ReportKonvaEditorHandle {
  downloadImage: () => void
  flushSignature: () => Doc | null
}

interface ReportKonvaEditorProps {
  templateDoc: Doc
  zoom: number
  selectedElementId?: string
  onElementSelect: (element: UnifiedNode | null) => void
  onTemplateChange: (doc: Doc, options?: { saveToHistory?: boolean; force?: boolean }) => void
  currentPageId?: string
  onUndo?: () => void
  onRedo?: () => void
  orientation?: 'portrait' | 'landscape'
  onSelectedCellChange?: (cell: { elementId: string; row: number; col: number } | null) => void
  activeTool?: string
  drawingSettings?: { stroke: string; strokeWidth: number; simplification?: number }
  showGrid?: boolean
  snapStrength?: number
  gridSize?: number
}

const getRowY = (rows: number[], rowIndex: number) => {
  let y = 0
  for (let i = 0; i < rowIndex; i++) {
    if (rows[i] !== undefined) y += rows[i]
  }
  return y
}

const getColX = (cols: number[], colIndex: number) => {
  let x = 0
  for (let i = 0; i < colIndex; i++) {
    if (cols[i] !== undefined) x += cols[i]
  }
  return x
}

const getRowHeight = (rows: number[], rowIndex: number, span: number = 1) => {
  let h = 0
  for (let i = 0; i < span; i++) {
    const rh = rows[rowIndex + i]
    if (rh !== undefined) h += rh
  }
  return h
}

const getColWidth = (cols: number[], colIndex: number, span: number = 1) => {
  let w = 0
  for (let i = 0; i < span; i++) {
    const cw = cols[colIndex + i]
    if (cw !== undefined) w += cw
  }
  return w
}

const PageBackground = ({
  width,
  height,
  surface,
}: {
  width: number
  height: number
  surface: Surface
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  const bg = surface.bg
  const isColor = bg ? bg.startsWith('#') || bg.startsWith('rgb') : true

  useEffect(() => {
    if (!bg || isColor) {
      setImage(null)
      return
    }

    if (!bg.startsWith('http') && !bg.startsWith('data:')) {
      findImageWithExtension(bg).then((res) => {
        if (res) setImage(res.img)
      })
    } else {
      const img = new window.Image()
      img.src = bg
      img.onload = () => setImage(img)
    }
  }, [bg, isColor])

  return (
    <>
      <KonvaRect
        name="_background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill={isColor ? bg || '#ffffff' : '#ffffff'}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.1}
      />
      {image && (
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
      // orientation = 'portrait', // unused
      onSelectedCellChange,
      activeTool,
      drawingSettings = { stroke: '#000000', strokeWidth: 0.2, simplification: 0 },
      showGrid = false,
      snapStrength = 0,
      gridSize = 50,
    },
    ref
  ) => {
    const stageRef = useRef<Konva.Stage>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [editingElementId, setEditingElementId] = useState<string | null>(null)
    const [pasteCount, setPasteCount] = useState(1)

    const [selectedCell, setSelectedCell] = useState<{
      elementId: string
      row: number
      col: number
    } | null>(null)

    const [editingCell, setEditingCell] = useState<{
      elementId: string
      row: number
      col: number
    } | null>(null)

    const [editingCellValue, setEditingCellValue] = useState<string>('')

    const [contextMenu, setContextMenu] = useState<{
      visible: boolean
      x: number
      y: number
      elementId: string
      type: 'table' | 'line'
      row?: number
      col?: number
    } | null>(null)

    // Sync selectedCell to parent
    useEffect(() => {
      onSelectedCellChange?.(selectedCell)
    }, [selectedCell, onSelectedCellChange])

    // Signature Drawing State
    const [isDrawing, setIsDrawing] = useState(false)
    const [currentStrokes, setCurrentStrokes] = useState<number[][]>([])
    const [currentPoints, setCurrentPoints] = useState<number[]>([])
    const [currentPressure, setCurrentPressure] = useState<number[]>([])
    const [allPressureData, setAllPressureData] = useState<number[][]>([])

    // const [contextMenu, setContextMenu] = useState<any>(null)

    // Current Surface (Page)
    const currentSurface =
      templateDoc.surfaces.find((s) => s.id === currentPageId) || templateDoc.surfaces[0]

    // Filter nodes for current surface
    const nodes = templateDoc.nodes.filter((n) => n.s === currentSurface.id)

    const selectedNode = useMemo(() => {
      if (!selectedElementId) return null
      return templateDoc.nodes.find((n) => n.id === selectedElementId) || null
    }, [selectedElementId, templateDoc.nodes])

    const selectedTable = selectedNode?.t === 'table' ? (selectedNode as TableNode) : null

    const editingElement = useMemo(() => {
      if (!editingElementId) return null
      const node = templateDoc.nodes.find((n) => n.id === editingElementId)
      if (!node || node.t !== 'text') return null
      return node as TextNode
    }, [editingElementId, templateDoc.nodes])

    const selectedCellBox = useMemo(() => {
      if (!selectedTable || !selectedCell || selectedCell.elementId !== selectedTable.id)
        return null

      const cell = selectedTable.table.cells.find(
        (c) => c.r === selectedCell.row && c.c === selectedCell.col
      )
      const rs = cell?.rs || 1
      const cs = cell?.cs || 1

      const x = (selectedTable.x || 0) + getColX(selectedTable.table.cols, selectedCell.col)
      const y = (selectedTable.y || 0) + getRowY(selectedTable.table.rows, selectedCell.row)
      const w = getColWidth(selectedTable.table.cols, selectedCell.col, cs)
      const h = getRowHeight(selectedTable.table.rows, selectedCell.row, rs)

      return { x, y, w, h }
    }, [selectedCell, selectedTable])

    // Page Size
    // const isLandscape = orientation === 'landscape' // unused
    const width = currentSurface.w
    const height = currentSurface.h

    const displayScale = zoom * mmToPx(1, { dpi })

    const handleElementSelect = (element: UnifiedNode | null) => {
      onElementSelect(element)
    }

    const handleCellClick = (elementId: string, row: number, col: number) => {
      // Ensure table is selected when clicking a cell
      const element = nodes.find((n) => n.id === elementId)
      if (element) {
        onElementSelect(element)
      }
      setSelectedCell({ elementId, row, col })
      // Do not automatically enter edit mode
      setEditingCell(null)
    }

    const handleCellDblClick = (elementId: string, row: number, col: number) => {
      const element = nodes.find((n) => n.id === elementId)
      if (!element || element.t !== 'table') return
      onElementSelect(element)
      setSelectedCell({ elementId, row, col })

      const table = element as TableNode
      const existing = table.table.cells.find((c) => c.r === row && c.c === col)
      setEditingCell({ elementId, row, col })
      setEditingCellValue(existing?.v || '')
    }

    const commitCellEdit = useCallback(() => {
      if (!editingCell) return
      const { elementId, row, col } = editingCell

      const nextNodes = templateDoc.nodes.map((n) => {
        if (n.id !== elementId || n.t !== 'table') return n
        const table = n as TableNode

        const cells = [...table.table.cells]
        const idx = cells.findIndex((c) => c.r === row && c.c === col)
        if (idx >= 0) {
          cells[idx] = { ...cells[idx], v: editingCellValue }
        } else {
          cells.push({ r: row, c: col, v: editingCellValue })
        }

        return {
          ...table,
          table: {
            ...table.table,
            cells,
            rows: table.table.rows,
            cols: table.table.cols,
          },
        } as TableNode
      })

      onTemplateChange({ ...templateDoc, nodes: nextNodes })
      setEditingCell(null)
    }, [editingCell, editingCellValue, onTemplateChange, templateDoc])

    const handleElementChange = useCallback(
      (
        updates:
          | (Partial<UnifiedNode> & { id?: string })
          | (Partial<UnifiedNode> & { id?: string })[],
        options?: { saveToHistory?: boolean; force?: boolean }
      ) => {
        const updateList = Array.isArray(updates) ? updates : [updates]

        // Optimize: Create a map of updates by ID for O(1) lookup
        const updateMap = new Map(
          updateList.map((u) => {
            const id = u.id || selectedElementId
            return [id, u]
          })
        )

        // Iterate once over all nodes
        const nextNodes = templateDoc.nodes.map((el) => {
          const update = updateMap.get(el.id)
          if (update) {
            return { ...el, ...update, id: el.id } as UnifiedNode
          }
          return el
        })

        onTemplateChange({ ...templateDoc, nodes: nextNodes }, options)
      },
      [onTemplateChange, selectedElementId, templateDoc]
    )

    const { calculateDimensions } = useTextDimensions()

    const handleTextUpdate = useCallback(
      (text: string) => {
        if (!editingElementId) return

        // Get current element to access font settings
        const element = templateDoc.nodes.find((n) => n.id === editingElementId)
        if (!element || element.t !== 'text') {
          handleElementChange(
            { id: editingElementId, text } as Partial<UnifiedNode> & { id?: string },
            { saveToHistory: false }
          )
          return
        }

        const textNode = element as TextNode
        const dimensions = calculateDimensions(text, {
          family: textNode.font,
          size: textNode.fontSize,
          weight: textNode.fontWeight,
          padding: textNode.padding,
        })

        // Note: fontSize in textNode is usually in 'pt' or 'px'?
        // Looking at ReportKonvaEditor lines 359: size: mmToPx(textNode.fontSize || ptToMm(12), { dpi })
        // It seems textNode.fontSize is stored in 'mm' in the model?
        // Let's re-verify the types and assumptions.
        // ReportKonvaEditor L359: mmToPx(textNode.fontSize || ptToMm(12), { dpi })
        // If textNode.fontSize is defined, it is treated as mm by mmToPx directly?
        // Actually, let's look at L359 again:
        // size: mmToPx(textNode.fontSize || ptToMm(12), { dpi })
        // If textNode.fontSize is 10 (mm), mmToPx(10) -> px.
        // If textNode.fontSize is undefined, ptToMm(12) -> mm, then mmToPx -> px.
        // So textNode.fontSize IS in mm.

        console.log('[ReportKonvaEditor] handleTextUpdate:', { text, ...dimensions })

        // Update text and dimensions together (Transient)
        handleElementChange(
          {
            id: editingElementId,
            text,
            w: dimensions.w,
            h: dimensions.h,
          } as Partial<UnifiedNode> & { id?: string },
          { saveToHistory: false }
        )
      },
      [editingElementId, templateDoc.nodes, handleElementChange, calculateDimensions]
    )

    const handleTextEditFinish = useCallback(() => {
      // Final commit to history (Force save even if state is identical to last transient state)
      if (editingElementId) {
        const element = templateDoc.nodes.find((n) => n.id === editingElementId)
        if (element && element.t === 'text') {
          // Re-trigger update with force=true to ensure it hits history
          // Note: We don't need to recalculate if we assume handleTextUpdate did it.
          // However, for safety, let's just trigger a "no-op" update or same-value update with force.
          // Actually, passing the current values is enough.
          handleElementChange({ id: editingElementId }, { saveToHistory: true, force: true })
        }
      }
      setEditingElementId(null)
    }, [editingElementId, templateDoc.nodes, handleElementChange])

    const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>, element: UnifiedNode) => {
      e.evt.preventDefault()

      if (element.t !== 'table') return

      // Prefer parsing the actual clicked cell from target id.
      const parseFromId = (id: string) => {
        const parts = id.split('_cell_')
        if (parts.length !== 2) return null
        const elementId = parts[0]
        const rc = parts[1].split('_')
        if (rc.length < 2) return null
        const row = Number.parseInt(rc[0]!, 10)
        const col = Number.parseInt(rc[1]!, 10)
        if (Number.isNaN(row) || Number.isNaN(col)) return null
        return { elementId, row, col }
      }

      const target = e.target
      const idsToTry = [
        target.id(),
        target.getParent()?.id(),
        target.getParent()?.getParent()?.id(),
      ].filter(Boolean) as string[]
      let parsed: { elementId: string; row: number; col: number } | null = null
      for (const id of idsToTry) {
        parsed = parseFromId(id)
        if (parsed) break
      }
      if (!parsed) return

      // Sync selection
      setSelectedCell(parsed)
      setEditingCell(null)

      setContextMenu({
        visible: true,
        x: e.evt.clientX,
        y: e.evt.clientY,
        elementId: parsed.elementId,
        type: 'table',
        row: parsed.row,
        col: parsed.col,
      })
    }

    const applyTableUpdate = useCallback(
      (elementId: string, updater: (t: TableNode) => TableNode) => {
        const nextNodes = templateDoc.nodes.map((n) => {
          if (n.id !== elementId || n.t !== 'table') return n
          return updater(n as TableNode)
        })
        onTemplateChange({ ...templateDoc, nodes: nextNodes })
      },
      [onTemplateChange, templateDoc]
    )

    const handleContextMenuAction = useCallback(
      (
        action:
          | 'insertRowAbove'
          | 'insertRowBelow'
          | 'insertColLeft'
          | 'insertColRight'
          | 'deleteRow'
          | 'deleteCol'
          | 'mergeRight'
          | 'mergeDown'
          | 'unmerge'
      ) => {
        if (!contextMenu) return
        const { elementId, row, col, type } = contextMenu

        if (type !== 'table' || row === undefined || col === undefined) return

        applyTableUpdate(elementId, (table) => {
          switch (action) {
            case 'insertRowAbove':
              return insertRow(table, row, 'above')
            case 'insertRowBelow':
              return insertRow(table, row, 'below')
            case 'insertColLeft':
              return insertCol(table, col, row, 'left')
            case 'insertColRight':
              return insertCol(table, col, row, 'right')
            case 'deleteRow':
              return deleteRow(table, row)
            case 'deleteCol':
              return deleteCol(table, col)
            case 'mergeRight':
              return mergeCells(table, row, col, 'right')
            case 'mergeDown':
              return mergeCells(table, row, col, 'down')
            case 'unmerge':
              return unmergeCells(table, row, col)
            default:
              return table
          }
        })

        setContextMenu(null)
      },
      [applyTableUpdate, contextMenu]
    )


    const commitSignature = useCallback((): Doc | null => {
      if (currentStrokes.length === 0) return null

      const simplifiedStrokes = processStrokes(currentStrokes, {
        simplification: drawingSettings.simplification,
      })

      const box = getStrokesBox(simplifiedStrokes)

      const normalizedStrokes = normalizeStrokes(simplifiedStrokes, box)

      const hasPressureData = allPressureData.some((pressure) => pressure.length > 0)
      const element: SignatureNode = {
        id: `sig-${crypto.randomUUID()}`,
        t: 'signature',
        s: currentSurface.id,
        name: 'Signature',
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        strokes: normalizedStrokes,
        stroke: drawingSettings.stroke,
        strokeW: drawingSettings.strokeWidth,
        pressureData: hasPressureData ? allPressureData : undefined,
        usePressureSim: !hasPressureData,
        r: 0,
        locked: false,
        hidden: false,
      }

      const nextDoc = {
        ...templateDoc,
        nodes: [...templateDoc.nodes, element],
      }
      onTemplateChange(nextDoc)

      setCurrentStrokes([])
      setCurrentPoints([])
      setCurrentPressure([])
      setAllPressureData([])
      setIsDrawing(false)
      onElementSelect(element)

      return nextDoc
    }, [
      currentStrokes,
      currentSurface.id,
      templateDoc,
      getStrokesBox,
      onTemplateChange,
      onElementSelect,
      drawingSettings.stroke,
      drawingSettings.strokeWidth,
      drawingSettings.simplification,
      allPressureData,
    ])

    useEffect(() => {
      if (activeTool !== 'signature' && currentStrokes.length > 0) {
        commitSignature()
      }
    }, [activeTool, commitSignature, currentStrokes.length])

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage()
      const interestedInBackground =
        e.target === stage || e.target.name() === '_background'

      if (activeTool === 'signature' && interestedInBackground) {
        setIsDrawing(true)
        const nativeEvent = e.evt as PointerEvent | undefined
        const pressure =
          nativeEvent && 'pressure' in nativeEvent ? nativeEvent.pressure : undefined
        const isPressureDevice = typeof pressure === 'number' && pressure !== 0.5 && pressure !== 0
        const point = stage?.getPointerPosition()
        if (point) {
          const transform = stage?.getAbsoluteTransform().copy()
          transform?.invert()
          const pos = transform?.point(point)
          if (pos) {
            setCurrentPoints([pos.x, pos.y])
            if (isPressureDevice && typeof pressure === 'number') {
              setCurrentPressure([pressure])
            }
          }
        }
        return
      }

      if (interestedInBackground) {
        handleElementSelect(null)
        setSelectedCell(null)
        setEditingCell(null)
      }
    }

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Signature Drawing
      if (activeTool === 'signature' && isDrawing) {
        const stage = e.target.getStage()
        const nativeEvent = e.evt as PointerEvent | undefined
        const pressure =
          nativeEvent && 'pressure' in nativeEvent ? nativeEvent.pressure : undefined
        const isPressureDevice = typeof pressure === 'number' && pressure !== 0.5 && pressure !== 0
        const point = stage?.getPointerPosition()
        if (point) {
          const transform = stage?.getAbsoluteTransform().copy()
          transform?.invert()
          const pos = transform?.point(point)
          if (pos) {
            setCurrentPoints((prev) => [...prev, pos.x, pos.y])
            if (isPressureDevice) {
              setCurrentPressure((prev) => [...prev, pressure])
            }
          }
        }
      }
    }

    const handleStageMouseUp = () => {
      if (activeTool === 'signature' && isDrawing) {
        setIsDrawing(false)
        if (currentPoints.length > 0) {
          setCurrentStrokes((prev) => [...prev, currentPoints])
          setCurrentPoints([])
          setAllPressureData((prev) => [
            ...prev,
            currentPressure.length > 0 ? currentPressure : [],
          ])
          setCurrentPressure([])
        }
      }
    }

    const handleDelete = () => {
      if (selectedElementId) {
        const nextNodes = templateDoc.nodes.filter((el) => el.id !== selectedElementId)
        onTemplateChange({ ...templateDoc, nodes: nextNodes })
        onElementSelect(null)
      }
    }

    const handleSelectAll = () => {
      if (nodes.length > 0) onElementSelect(nodes[0])
    }

    const handleMove = (dx: number, dy: number) => {
      if (selectedElementId) {
        const el = nodes.find((n) => n.id === selectedElementId)
        if (el && el.t !== 'line') {
          handleElementChange({ id: selectedElementId, x: (el.x || 0) + dx, y: (el.y || 0) + dy })
        }
      }
    }

    const handleCopy = () => {
      if (!selectedElementId) return
      const selected = nodes.find((n) => n.id === selectedElementId)
      if (selected) {
        // Report editor currently supports single selection mostly, but we use array for clipboard consistency
        const clipboardData = [selected]
        localStorage.setItem('__konva_clipboard', JSON.stringify(clipboardData))
        setPasteCount(1)
      }
    }

    const handlePaste = () => {
      try {
        const json = localStorage.getItem('__konva_clipboard')
        if (!json) return
        const clipboardElements = JSON.parse(json) as UnifiedNode[]

        if (!Array.isArray(clipboardElements) || clipboardElements.length === 0) return

        // Offset based on surface width (similar to toolbar behavior)
        // Toolbar uses 1% of width per new element
        const step = currentSurface.w * 0.01
        const offset = step * pasteCount

        const newNodes: UnifiedNode[] = []
        clipboardElements.forEach((el) => {
          const newId = crypto.randomUUID()
          const newEl = { ...el, id: newId, s: currentSurface.id }

          if (
            'x' in newEl &&
            'y' in newEl &&
            typeof newEl.x === 'number' &&
            typeof newEl.y === 'number'
          ) {
            newEl.x += offset
            newEl.y += offset
          }
          // Ensure unique cell IDs for table if copied
          if (newEl.t === 'table' && 'table' in newEl) {
            // Deep copy could be needed if table structure has IDs?
            // Currently table cells don't have unique IDs in this model, just r/c.
          }
          newNodes.push(newEl)
        })

        onTemplateChange({ ...templateDoc, nodes: [...templateDoc.nodes, ...newNodes] })

        // Select the last pasted element
        if (newNodes.length > 0) {
          onElementSelect(newNodes[newNodes.length - 1])
        }

        setPasteCount((c) => c + 1)
      } catch (e) {
        console.error('Failed to paste elements', e)
      }
    }

    useKeyboardShortcuts({
      onUndo,
      onRedo,
      onDelete: handleDelete,
      onCopy: handleCopy,
      onPaste: handlePaste,
      onSelectAll: handleSelectAll,
      onMoveUp: (step) => handleMove(0, -step),
      onMoveDown: (step) => handleMove(0, step),
      onMoveLeft: (step) => handleMove(-step, 0),
      onMoveRight: (step) => handleMove(step, 0),
    })

    useImperativeHandle(ref, () => ({
      downloadImage: () => {
        if (!stageRef.current) return
        const stage = stageRef.current

        // Hide grid layer
        const gridLayer = stage.findOne('.grid-layer')
        const wasGridVisible = gridLayer?.visible()

        // Hide transformer handles (selection UI)
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

          const link = document.createElement('a')
          link.download = `report-${Date.now()}.png`
          link.href = dataURL
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } finally {
          // Restore grid layer
          if (gridLayer && wasGridVisible) {
            gridLayer.show()
          }
          // Restore transformer handles
          transformers.forEach((tr, idx) => {
            const prev = transformerVisibility[idx]
            if (prev) tr.show()
          })
        }
      },
      flushSignature: () => {
        const result = commitSignature()
        return result
      },
    }))

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      if (!stageRef.current) return

      try {
        const jsonData = e.dataTransfer.getData('application/json')
        if (!jsonData) return
        const payload = JSON.parse(jsonData)
        if (payload.type !== 'binding') return

        const { fieldId, text } = payload.data

        stageRef.current.setPointersPositions(e)
        const stagePos = stageRef.current.getPointerPosition()
        if (!stagePos) return
        const logicX = stagePos.x / displayScale
        const logicY = stagePos.y / displayScale

        const newElement: TextNode = {
          id: `field-${crypto.randomUUID()}`,
          t: 'text',
          s: currentSurface.id,
          name: fieldId,
          text: text,
          font: 'Helvetica',
          fontSize: ptToMm(12),
          fill: '#0000ff',
          align: 'l',
          vAlign: 't',
          x: logicX,
          y: logicY,
          w: 50,
          h: 8,
          bind: fieldId,
        }

        const nextDoc = {
          ...templateDoc,
          nodes: [...templateDoc.nodes, newElement],
        }
        onTemplateChange(nextDoc)
        onElementSelect(newElement)
      } catch (err) {
        log.error('Failed to handle drop', err)
      }
    }

    return (
      <div
        className="relative w-full h-full bg-gray-100 overflow-auto flex justify-start items-start p-2 scrollbar-thin cursor-default"
        ref={containerRef}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDrop={handleDrop}
      >
        <div className="relative shadow-lg border-2 border-gray-500 w-fit h-fit">
          <Stage
            width={width * displayScale}
            height={height * displayScale}
            scaleX={displayScale}
            scaleY={displayScale}
            ref={stageRef}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            style={{
              cursor: activeTool === 'signature' ? PEN_CURSOR_URL : 'default',
            }}
          >
            <Layer name="background-layer" listening={false}>
              <PageBackground width={width} height={height} surface={currentSurface} />
            </Layer>
            <GridLayer
              width={width}
              height={height}
              scale={displayScale}
              visible={showGrid}
              gridSize={gridSize}
            />
            <Layer name="content-layer" listening={activeTool !== 'signature' || !isDrawing}>
              {nodes.map((element) => (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedElementId}
                  stageScale={displayScale}
                  allElements={nodes}
                  snapStrength={isDrawing ? 0 : snapStrength} // Disable snap while drawing signature
                  showGrid={showGrid}
                  gridSize={gridSize}
                  onSelect={() => handleElementSelect(element)}
                  onChange={handleElementChange}
                  onDblClick={() => {
                    if (activeTool !== 'signature' && element.t === 'text')
                      setEditingElementId(element.id)
                  }}
                  onContextMenu={(e) => handleContextMenu(e, element)}
                  isEditing={element.id === editingElementId}
                  selectedCell={
                    selectedCell?.elementId === element.id
                      ? { row: selectedCell.row, col: selectedCell.col }
                      : null
                  }
                  editingCell={editingCell}
                  onCellClick={handleCellClick}
                  onCellDblClick={handleCellDblClick}
                />
              ))}
              {(currentStrokes.length > 0 || currentPoints.length > 0) && (
                <CanvasElementRenderer
                  key="active-signature"
                  element={
                    {
                      id: 'active-signature',
                      t: 'signature',
                      s: currentSurface.id,
                      name: 'Signature',
                      x: 0,
                      y: 0,
                      w: 0,
                      h: 0,
                      strokes: [
                        ...processStrokes(currentStrokes, { simplification: drawingSettings.simplification }),
                        ...(currentPoints.length > 0 ? [currentPoints] : []),
                      ],
                      stroke: drawingSettings.stroke,
                      strokeW: drawingSettings.strokeWidth,
                      pressureData: [
                        ...allPressureData,
                        ...(currentPoints.length > 0 ? [currentPressure] : []),
                      ],
                      usePressureSim: true,
                    } as SignatureNode
                  }
                  isSelected={false}
                  stageScale={displayScale}
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

          <TableContextMenu
            visible={!!contextMenu?.visible && contextMenu?.type === 'table'}
            x={contextMenu?.x || 0}
            y={contextMenu?.y || 0}
            onClose={() => setContextMenu(null)}
            onAction={handleContextMenuAction}
          />

          {editingCell && selectedCellBox && selectedTable && (
            <textarea
              value={editingCellValue}
              onChange={(e) => setEditingCellValue(e.target.value)}
              onBlur={() => commitCellEdit()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  commitCellEdit()
                } else if (e.key === 'Escape') {
                  setEditingCell(null)
                }
              }}
              className="absolute border-2 border-blue-500 bg-white text-black resize-none outline-none p-1"
              style={{
                left: `${selectedCellBox.x * displayScale + 8}px`,
                top: `${selectedCellBox.y * displayScale + 8}px`,
                width: `${Math.max(20, selectedCellBox.w * displayScale - 16)}px`,
                height: `${Math.max(20, selectedCellBox.h * displayScale - 16)}px`,
                zIndex: 1000,
                fontSize: `${(selectedTable.table.cells.find((c) => c.r === editingCell.row && c.c === editingCell.col)?.fontSize ?? ptToMm(12)) * displayScale}px`,
                fontFamily:
                  selectedTable.table.cells.find(
                    (c) => c.r === editingCell.row && c.c === editingCell.col
                  )?.font || 'Meiryo',
                color:
                  selectedTable.table.cells.find(
                    (c) => c.r === editingCell.row && c.c === editingCell.col
                  )?.color || '#000000',
              }}
            />
          )}
        </div>
      </div>
    )
  }
)
