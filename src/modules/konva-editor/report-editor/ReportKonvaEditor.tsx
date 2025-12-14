import { PEN_CURSOR_URL } from '../cursors'
import type Konva from 'konva'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Image as KonvaImage, Rect as KonvaRect, Layer, Stage } from 'react-konva'
import { CanvasElementRenderer } from '../../../components/canvas/CanvasElementRenderer'
import { useKeyboardShortcuts } from '../../../components/canvas/hooks/useKeyboardShortcuts'
// import { TextEditOverlay } from '../../../components/canvas/TextEditOverlay' // Comment out if not immediately available or needs update
import type { TextNode, UnifiedNode, Doc, Surface, SignatureNode, TableNode } from '../../../types/canvas' // Direct import
import { createContextLogger } from '../../../utils/logger'
import { findImageWithExtension } from './pdf-editor/components/WysiwygCanvas/canvasImageUtils'
import { simplifyPoints } from '../../../utils/geometry'
import { GridLayer } from '../../../components/canvas/GridLayer'
import { TableContextMenu } from './pdf-editor/components/ContextMenu/TableContextMenu'

const log = createContextLogger('ReportKonvaEditor')

export interface ReportKonvaEditorHandle {
  downloadImage: () => void
  flushSignature: () => Doc | null
}

interface ReportKonvaEditorProps {
  templateDoc: Doc
  zoom: number
  selectedElementId?: string
  onElementSelect: (element: UnifiedNode | null) => void
  onTemplateChange: (doc: Doc) => void
  currentPageId?: string
  onUndo?: () => void
  onRedo?: () => void
  orientation?: 'portrait' | 'landscape'
  onSelectedCellChange?: (cell: { elementId: string; row: number; col: number } | null) => void
  activeTool?: string
  drawingSettings?: { stroke: string; strokeWidth: number; tolerance?: number }
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

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v)

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
  const isColor = bg ? (bg.startsWith('#') || bg.startsWith('rgb')) : true

  useEffect(() => {
    if (!bg || isColor) {
      setImage(null)
      return
    }

    if (!bg.startsWith('http') && !bg.startsWith('data:')) {
      findImageWithExtension(bg).then(res => {
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
        fill={isColor ? (bg || '#ffffff') : '#ffffff'}
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
      drawingSettings = { stroke: '#000000', strokeWidth: 2, tolerance: 2.0 },
      showGrid = false,
      snapStrength = 0,
      gridSize = 50,
    },
    ref
  ) => {
    const stageRef = useRef<Konva.Stage>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [editingElementId, setEditingElementId] = useState<string | null>(null)

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
      row: number
      col: number
    } | null>(null)

    // Sync selectedCell to parent
    useEffect(() => {
      onSelectedCellChange?.(selectedCell)
    }, [selectedCell, onSelectedCellChange])

    // Signature Drawing State
    const [isDrawing, setIsDrawing] = useState(false)
    const [currentStrokes, setCurrentStrokes] = useState<number[][]>([])
    const [currentPoints, setCurrentPoints] = useState<number[]>([])

    // const [contextMenu, setContextMenu] = useState<any>(null)

    // Current Surface (Page)
    const currentSurface = templateDoc.surfaces.find((s) => s.id === currentPageId) || templateDoc.surfaces[0]

    // Filter nodes for current surface
    const nodes = templateDoc.nodes.filter((n) => n.s === currentSurface.id)

    const selectedNode = useMemo(() => {
      if (!selectedElementId) return null
      return templateDoc.nodes.find((n) => n.id === selectedElementId) || null
    }, [selectedElementId, templateDoc.nodes])

    const selectedTable = selectedNode?.t === 'table' ? (selectedNode as TableNode) : null

    const selectedCellBox = useMemo(() => {
      if (!selectedTable || !selectedCell || selectedCell.elementId !== selectedTable.id) return null

      const cell = selectedTable.table.cells.find((c) => c.r === selectedCell.row && c.c === selectedCell.col)
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

    const displayScale = zoom

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
          },
        } as TableNode
      })

      onTemplateChange({ ...templateDoc, nodes: nextNodes })
      setEditingCell(null)
    }, [editingCell, editingCellValue, onTemplateChange, templateDoc])

    const handleElementChange = (updates: Partial<UnifiedNode> & { id?: string }) => {
      const targetId = updates.id || selectedElementId
      if (!targetId) return

      const nextNodes = templateDoc.nodes.map((el) => {
        if (el.id === targetId) {
          return { ...el, ...updates, id: targetId } as UnifiedNode
        }
        return el
      })
      onTemplateChange({ ...templateDoc, nodes: nextNodes })
    }

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
      const idsToTry = [target.id(), target.getParent()?.id(), target.getParent()?.getParent()?.id()].filter(Boolean) as string[]
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
        row: parsed.row,
        col: parsed.col,
      })
    }

    const applyTableUpdate = useCallback((elementId: string, updater: (t: TableNode) => TableNode) => {
      const nextNodes = templateDoc.nodes.map((n) => {
        if (n.id !== elementId || n.t !== 'table') return n
        return updater(n as TableNode)
      })
      onTemplateChange({ ...templateDoc, nodes: nextNodes })
    }, [onTemplateChange, templateDoc])

    const handleContextMenuAction = useCallback((action:
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
      const { elementId, row, col } = contextMenu

      applyTableUpdate(elementId, (table) => {
        const rowCount = table.table.rows.length
        const colCount = table.table.cols.length
        const cells = [...table.table.cells]

        const findCell = (r: number, c: number) => cells.find((cc) => cc.r === r && cc.c === c)

        const base = findCell(row, col) || { r: row, c: col, v: '' }

        const materializeCellAt = (
          targetCells: typeof cells,
          r: number,
          c: number,
          inheritFrom?: typeof base
        ) => {
          if (targetCells.find((cc) => cc.r === r && cc.c === c)) return
          const { rs, cs, v, ...style } = (inheritFrom || base) as any
          targetCells.push({ r, c, v: '', ...(style as object) })
        }

        const ensureBaseExists = () => {
          if (!findCell(row, col)) cells.push({ ...base })
        }

        const cellRect = (c: { r: number; c: number; rs?: number; cs?: number }) => {
          const rs = c.rs || 1
          const cs = c.cs || 1
          return { r1: c.r, c1: c.c, r2: c.r + rs - 1, c2: c.c + cs - 1 }
        }

        const rectIntersects = (a: { r1: number; c1: number; r2: number; c2: number }, b: { r1: number; c1: number; r2: number; c2: number }) => {
          return !(a.r2 < b.r1 || a.r1 > b.r2 || a.c2 < b.c1 || a.c1 > b.c2)
        }

        if (action === 'insertRowAbove' || action === 'insertRowBelow') {
          const insertIndex = action === 'insertRowAbove' ? row : row + 1
          const newRows = [...table.table.rows]
          newRows.splice(insertIndex, 0, 50)

          const nextCells = cells
            .map((c) => {
              // Shift cells below
              if (c.r >= insertIndex) return { ...c, r: c.r + 1 }
              // Expand spans that cross insertion boundary
              const rs = c.rs || 1
              if (rs > 1 && c.r < insertIndex && insertIndex <= c.r + rs - 1) {
                return { ...c, rs: rs + 1 }
              }
              return c
            })

          return {
            ...table,
            h: sum(newRows),
            table: {
              ...table.table,
              rows: newRows,
              cells: nextCells,
            },
          }
        }

        if (action === 'insertColLeft' || action === 'insertColRight') {
          const insertIndex = action === 'insertColLeft' ? col : col + 1
          const newCols = [...table.table.cols]
          newCols.splice(insertIndex, 0, 100)

          const nextCells = cells
            .map((c) => {
              if (c.c >= insertIndex) return { ...c, c: c.c + 1 }
              const cs = c.cs || 1
              if (cs > 1 && c.c < insertIndex && insertIndex <= c.c + cs - 1) {
                return { ...c, cs: cs + 1 }
              }
              return c
            })

          return {
            ...table,
            w: sum(newCols),
            table: {
              ...table.table,
              cols: newCols,
              cells: nextCells,
            },
          }
        }

        if (action === 'deleteRow') {
          if (rowCount <= 1) return table
          const deleteIndex = clamp(row, 0, rowCount - 1)
          const newRows = table.table.rows.filter((_, i) => i !== deleteIndex)

          const nextCells: typeof cells = []
          for (const c of cells) {
            // If cell starts on deleted row
            if (c.r === deleteIndex) {
              const rs = c.rs || 1
              if (rs > 1) {
                // Promote the cell to the next row (which shifts up to deleteIndex) and shrink span
                nextCells.push({ ...c, rs: rs - 1 })
              }
              continue
            }

            // If cell is below deleted row, shift up
            if (c.r > deleteIndex) {
              nextCells.push({ ...c, r: c.r - 1 })
              continue
            }

            // If cell spans across deleted row, shrink span
            const rs = c.rs || 1
            if (rs > 1 && c.r < deleteIndex && deleteIndex <= c.r + rs - 1) {
              nextCells.push({ ...c, rs: rs - 1 })
              continue
            }

            nextCells.push(c)
          }

          return {
            ...table,
            h: sum(newRows),
            table: {
              ...table.table,
              rows: newRows,
              cells: nextCells,
            },
          }
        }

        if (action === 'deleteCol') {
          if (colCount <= 1) return table
          const deleteIndex = clamp(col, 0, colCount - 1)
          const newCols = table.table.cols.filter((_, i) => i !== deleteIndex)

          const nextCells: typeof cells = []
          for (const c of cells) {
            if (c.c === deleteIndex) {
              const cs = c.cs || 1
              if (cs > 1) {
                nextCells.push({ ...c, cs: cs - 1 })
              }
              continue
            }

            if (c.c > deleteIndex) {
              nextCells.push({ ...c, c: c.c - 1 })
              continue
            }

            const cs = c.cs || 1
            if (cs > 1 && c.c < deleteIndex && deleteIndex <= c.c + cs - 1) {
              nextCells.push({ ...c, cs: cs - 1 })
              continue
            }

            nextCells.push(c)
          }

          return {
            ...table,
            w: sum(newCols),
            table: {
              ...table.table,
              cols: newCols,
              cells: nextCells,
            },
          }
        }

        if (action === 'mergeRight') {
          ensureBaseExists()
          const current = findCell(row, col) || base
          const rs = current.rs || 1
          const cs = current.cs || 1
          const targetCol = col + cs
          if (targetCol >= colCount) return table

          const baseRect = cellRect({ r: row, c: col, rs, cs: cs + 1 })

          // Allow merge only if the added strip is not covered by any other cell (including spanned cells).
          // The only allowed overlapping cell is the immediate neighbor top-left at (row, targetCol) with matching rowSpan and cs=1.
          const neighbor = findCell(row, targetCol)
          if (!neighbor) return table
          const neighborRs = neighbor.rs || 1
          const neighborCs = neighbor.cs || 1
          if (neighborRs !== rs || neighborCs !== 1) return table

          for (const other of cells) {
            if (other.r === row && other.c === col) continue
            if (other.r === row && other.c === targetCol) continue
            const oRect = cellRect(other)
            if (rectIntersects(oRect, baseRect)) {
              return table
            }
          }

          // Remove cells that would become covered by the new merged span (the added strip)
          const nextCells = cells.filter((c) => {
            if (c.r === row && c.c === col) return true
            if (c.r === row && c.c === targetCol) return false
            // Any cell starting inside the added strip is removed
            return !(c.c === targetCol && c.r >= row && c.r < row + rs)
          })

          const idx = nextCells.findIndex((c) => c.r === row && c.c === col)
          if (idx >= 0) nextCells[idx] = { ...nextCells[idx], cs: cs + 1 }

          return {
            ...table,
            table: {
              ...table.table,
              cells: nextCells,
            },
          }
        }

        if (action === 'mergeDown') {
          ensureBaseExists()
          const current = findCell(row, col) || base
          const rs = current.rs || 1
          const cs = current.cs || 1
          const targetRow = row + rs
          if (targetRow >= rowCount) return table

          const baseRect = cellRect({ r: row, c: col, rs: rs + 1, cs })

          const neighbor = findCell(targetRow, col)
          if (!neighbor) return table
          const neighborRs = neighbor.rs || 1
          const neighborCs = neighbor.cs || 1
          if (neighborCs !== cs || neighborRs !== 1) return table

          for (const other of cells) {
            if (other.r === row && other.c === col) continue
            if (other.r === targetRow && other.c === col) continue
            const oRect = cellRect(other)
            if (rectIntersects(oRect, baseRect)) {
              return table
            }
          }

          const nextCells = cells.filter((c) => {
            if (c.r === row && c.c === col) return true
            if (c.r === targetRow && c.c === col) return false
            // Any cell starting inside the added strip is removed
            return !(c.r === targetRow && c.c >= col && c.c < col + cs)
          })

          const idx = nextCells.findIndex((c) => c.r === row && c.c === col)
          if (idx >= 0) nextCells[idx] = { ...nextCells[idx], rs: rs + 1 }

          return {
            ...table,
            table: {
              ...table.table,
              cells: nextCells,
            },
          }
        }

        if (action === 'unmerge') {
          const current = findCell(row, col)
          if (!current) return table
          const rs = current.rs || 1
          const cs = current.cs || 1
          if (rs <= 1 && cs <= 1) return table

          const nextCells = cells.filter((c) => !(c.r === row && c.c === col))

          // Recreate base cell without spans
          const { rs: _rs, cs: _cs, ...rest } = current
          nextCells.push({ ...(rest as any), r: row, c: col, v: current.v })

          // Materialize all newly uncovered cells inheriting style
          for (let rr = 0; rr < rs; rr++) {
            for (let cc = 0; cc < cs; cc++) {
              if (rr === 0 && cc === 0) continue
              const r = row + rr
              const c = col + cc
              if (r < 0 || r >= rowCount || c < 0 || c >= colCount) continue
              materializeCellAt(nextCells, r, c, current)
            }
          }

          return {
            ...table,
            table: {
              ...table.table,
              cells: nextCells,
            },
          }
        }

        return table
      })

      setContextMenu(null)
    }, [applyTableUpdate, contextMenu])

    // Signature Box Calculation
    const getStrokesBox = useCallback((strokes: number[][]) => {
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
      if (minX === Infinity) return { x: 0, y: 0, w: 100, h: 50 }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }, [])

    const commitSignature = useCallback((): Doc | null => {
      if (currentStrokes.length === 0) return null

      const simplifiedStrokes = currentStrokes.map(stroke => {
        const simplified = simplifyPoints(stroke, drawingSettings.tolerance ?? 2.5)
        if (simplified.length === 2) return [...simplified, ...simplified]
        return simplified
      })

      const box = getStrokesBox(simplifiedStrokes)

      const normalizedStrokes = simplifiedStrokes.map(stroke => {
        const newStroke: number[] = []
        for (let i = 0; i < stroke.length; i += 2) {
          let x = stroke[i] - box.x
          let y = stroke[i + 1] - box.y
          x = Math.round(x * 1000) / 1000
          y = Math.round(y * 1000) / 1000
          newStroke.push(x, y)
        }
        return newStroke
      })

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
        r: 0,
        locked: false,
        hidden: false
      }

      const nextDoc = {
        ...templateDoc,
        nodes: [...templateDoc.nodes, element],
      }
      onTemplateChange(nextDoc)

      setCurrentStrokes([])
      setCurrentPoints([])
      setIsDrawing(false)
      onElementSelect(element)

      return nextDoc
    }, [currentStrokes, currentSurface.id, templateDoc, getStrokesBox, onTemplateChange, onElementSelect, drawingSettings.stroke, drawingSettings.strokeWidth, drawingSettings.tolerance])

    useEffect(() => {
      if (activeTool !== 'signature' && currentStrokes.length > 0) {
        commitSignature()
      }
    }, [activeTool, commitSignature, currentStrokes.length])

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Signature Drawing
      if (activeTool === 'signature') {
        setIsDrawing(true)
        const stage = e.target.getStage()
        const point = stage?.getPointerPosition()
        if (point) {
          const transform = stage?.getAbsoluteTransform().copy()
          transform?.invert()
          const pos = transform?.point(point)
          if (pos) {
            setCurrentPoints([pos.x, pos.y])
          }
        }
        return
      }

      // Deselect
      if (e.target === e.target.getStage() || e.target.name() === '_background') {
        handleElementSelect(null)
        setSelectedCell(null)
        setEditingCell(null)
      }
    }

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Signature Drawing
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

    const handleStageMouseUp = () => {
      if (activeTool === 'signature' && isDrawing) {
        setIsDrawing(false)
        if (currentPoints.length > 0) {
          setCurrentStrokes(prev => [...prev, currentPoints])
          setCurrentPoints([])
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
        const el = nodes.find(n => n.id === selectedElementId)
        if (el && el.t !== 'line') {
          handleElementChange({ id: selectedElementId, x: (el.x || 0) + dx, y: (el.y || 0) + dy })
        }
      }
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
    })

    useImperativeHandle(ref, () => ({
      downloadImage: () => {
        if (!stageRef.current) return
        const stage = stageRef.current

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

        const link = document.createElement('a')
        link.download = `report-${Date.now()}.png`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      },
      flushSignature: () => {
        const result = commitSignature()
        return result
      }
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
          fontSize: 12,
          fill: '#0000ff',
          align: 'l',
          x: logicX,
          y: logicY,
          w: 150,
          h: 20,
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
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
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
              cursor: activeTool === 'signature' ? PEN_CURSOR_URL : 'default'
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
            <Layer name="content-layer" listening={activeTool !== 'signature'}>
              {nodes.map((element) => (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedElementId}
                  snapStrength={isDrawing ? 0 : snapStrength} // Disable snap while drawing signature
                  showGrid={showGrid}
                  gridSize={gridSize}
                  onSelect={() => handleElementSelect(element)}
                  onChange={handleElementChange}
                  onDblClick={() => {
                    if (activeTool !== 'signature' && element.t === 'text') setEditingElementId(element.id)
                  }}
                  onContextMenu={(e) => handleContextMenu(e, element)}
                  isEditing={element.id === editingElementId}
                  selectedCell={selectedCell?.elementId === element.id ? { row: selectedCell.row, col: selectedCell.col } : null}
                  editingCell={editingCell}
                  onCellClick={handleCellClick}
                  onCellDblClick={handleCellDblClick}
                />
              ))}
              {(currentStrokes.length > 0 || currentPoints.length > 0) && (
                <CanvasElementRenderer
                  key="active-signature"
                  element={{
                    id: 'active-signature',
                    t: 'signature',
                    s: currentSurface.id,
                    name: 'Signature',
                    x: 0, y: 0, w: 0, h: 0,
                    strokes: [...currentStrokes, ...(currentPoints.length > 0 ? [currentPoints] : [])].map(s => s.length === 2 ? [...s, ...s] : s),
                    stroke: drawingSettings.stroke,
                    strokeW: drawingSettings.strokeWidth,
                  } as SignatureNode}
                  isSelected={false}
                  onSelect={() => { }}
                  onChange={() => { }}
                />
              )}
            </Layer>
          </Stage>

          <TableContextMenu
            visible={!!contextMenu?.visible}
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
                left: `${(selectedCellBox.x * displayScale) + 8}px`,
                top: `${(selectedCellBox.y * displayScale) + 8}px`,
                width: `${Math.max(20, (selectedCellBox.w * displayScale) - 16)}px`,
                height: `${Math.max(20, (selectedCellBox.h * displayScale) - 16)}px`,
                zIndex: 1000,
                fontSize: `${((selectedTable.table.cells.find((c) => c.r === editingCell.row && c.c === editingCell.col)?.fontSize || 12) * displayScale)}px`,
                fontFamily: selectedTable.table.cells.find((c) => c.r === editingCell.row && c.c === editingCell.col)?.font || 'Meiryo',
                color: selectedTable.table.cells.find((c) => c.r === editingCell.row && c.c === editingCell.col)?.color || '#000000',
              }}
            />
          )}
        </div>
      </div>
    )
  }
)
