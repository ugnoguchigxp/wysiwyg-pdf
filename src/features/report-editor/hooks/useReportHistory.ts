import { useCallback, useState } from 'react'
import type { Doc, TableNode } from '@/features/konva-editor/types'
import { validateDoc } from '@/types/doc.schema'

interface UseHistoryReturn {
  document: Doc
  setDocument: (
    doc: Doc | ((prev: Doc) => Doc),
    options?: { saveToHistory?: boolean; force?: boolean }
  ) => void
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  reset: (doc: Doc) => void
}

export function useReportHistory(initialDocument: Doc): UseHistoryReturn {
  const normalizedInitialDocument = normalizeLoadedTables(initialDocument)

  if (normalizedInitialDocument?.unit && normalizedInitialDocument.unit !== 'mm') {
    // Doc is expected to be mm-based everywhere. Convert legacy docs at the import boundary.
    // (We intentionally do not normalize here.)
  }

  const [history, setHistory] = useState<{
    past: Doc[]
    present: Doc
    future: Doc[]
  }>({
    past: [],
    present: normalizedInitialDocument,
    future: [],
  })

  // Update to support optional history saving
  const setDocument = useCallback(
    (
      docOrUpdater: Doc | ((prev: Doc) => Doc),
      options: { saveToHistory?: boolean; force?: boolean } = {}
    ) => {
      const { saveToHistory = true, force = false } = options

      setHistory((prev) => {
        const newPresent =
          typeof docOrUpdater === 'function' ? docOrUpdater(prev.present) : docOrUpdater

        // Don't add to history if document hasn't changed (deep comparison), unless forced
        if (!force && JSON.stringify(newPresent) === JSON.stringify(prev.present)) {
          return prev
        }

        if (!saveToHistory) {
          return {
            ...prev,
            present: newPresent,
            future: [],
          }
        }

        return {
          past: [...prev.past, prev.present],
          present: newPresent,
          future: [],
        }
      })
    },
    []
  )

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev

      const newPast = prev.past.slice(0, prev.past.length - 1)
      const newPresent = prev.past[prev.past.length - 1]

      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev

      const newFuture = prev.future.slice(1)
      const newPresent = prev.future[0]

      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      }
    })
  }, [])

  const reset = useCallback((doc: Doc) => {
    const normalizedDoc = normalizeLoadedTables(doc)

    if (normalizedDoc?.unit && normalizedDoc.unit !== 'mm') {
      // Doc.unit is not mm - silently continue
    }
    // Validate doc on load
    const validation = validateDoc(normalizedDoc)
    if (!validation.success) {
      // Validation failed - silently continue
    }
    setHistory({
      past: [],
      present: normalizedDoc,
      future: [],
    })
  }, [])

  return {
    document: history.present,
    setDocument,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    reset,
  }
}

function normalizeLoadedTables(doc: Doc): Doc {
  if (!doc?.nodes?.length) return doc

  const surfaceMap = new Map(doc.surfaces.map((surface) => [surface.id, surface]))
  let changed = false

  const nodes = doc.nodes.map((node) => {
    if (node.t !== 'table') return node

    const surface = surfaceMap.get(node.s)
    const drawableWidth = getDrawableWidth(surface?.w, surface?.margin)
    const normalized = normalizeTableNode(node, drawableWidth)
    if (normalized !== node) changed = true
    return normalized
  })

  if (!changed) return doc
  return { ...doc, nodes }
}

function getDrawableWidth(
  surfaceWidth: number | undefined,
  margin: { l: number; r: number } | undefined
): number | undefined {
  if (!surfaceWidth || surfaceWidth <= 0) return undefined
  const left = margin?.l ?? 0
  const right = margin?.r ?? 0
  const drawable = surfaceWidth - left - right
  return drawable > 0 ? drawable : surfaceWidth
}

function normalizeTableNode(node: TableNode, drawableWidth?: number): TableNode {
  const trimmed = trimTableToEffectiveArea(node)
  const rows = sanitizeSizes(trimmed.rows)
  const cols = sanitizeSizes(trimmed.cols)
  if (rows !== node.table.rows || cols !== node.table.cols) {
    // Continue and rebuild node below.
  }

  const originalRowSum = sumSizes(rows)
  const originalColSum = sumSizes(cols)

  let scale = 1
  if (
    drawableWidth !== undefined &&
    drawableWidth > 0 &&
    originalColSum > 0 &&
    originalColSum > drawableWidth + 1e-3
  ) {
    scale = drawableWidth / originalColSum
  }

  const scaledRows = scale === 1 ? rows : rows.map((v) => v * scale)
  const scaledCols = scale === 1 ? cols : cols.map((v) => v * scale)
  const rowSum = sumSizes(scaledRows)
  const colSum = sumSizes(scaledCols)

  const wChanged = Math.abs((node.w ?? 0) - colSum) > 1e-3
  const hChanged = Math.abs((node.h ?? 0) - rowSum) > 1e-3
  const rowsChanged = scaledRows !== node.table.rows
  const colsChanged = scaledCols !== node.table.cols
  const scaleChanged = scale !== 1

  if (!wChanged && !hChanged && !rowsChanged && !colsChanged && !scaleChanged) {
    return node
  }

  return {
    ...node,
    w: colSum,
    h: rowSum,
    table: {
      ...node.table,
      rows: scaledRows,
      cols: scaledCols,
      cells: scaleChanged
        ? trimmed.cells.map((cell) => ({
            ...cell,
            borderW: typeof cell.borderW === 'number' ? cell.borderW * scale : cell.borderW,
            fontSize: typeof cell.fontSize === 'number' ? cell.fontSize * scale : cell.fontSize,
            borders: cell.borders
              ? {
                  t: cell.borders.t
                    ? {
                        ...cell.borders.t,
                        width:
                          typeof cell.borders.t.width === 'number'
                            ? cell.borders.t.width * scale
                            : cell.borders.t.width,
                      }
                    : cell.borders.t,
                  r: cell.borders.r
                    ? {
                        ...cell.borders.r,
                        width:
                          typeof cell.borders.r.width === 'number'
                            ? cell.borders.r.width * scale
                            : cell.borders.r.width,
                      }
                    : cell.borders.r,
                  b: cell.borders.b
                    ? {
                        ...cell.borders.b,
                        width:
                          typeof cell.borders.b.width === 'number'
                            ? cell.borders.b.width * scale
                            : cell.borders.b.width,
                      }
                    : cell.borders.b,
                  l: cell.borders.l
                    ? {
                        ...cell.borders.l,
                        width:
                          typeof cell.borders.l.width === 'number'
                            ? cell.borders.l.width * scale
                            : cell.borders.l.width,
                      }
                    : cell.borders.l,
                }
              : cell.borders,
            richText: cell.richText?.map((fragment) => ({
              ...fragment,
              fontSize:
                typeof fragment.fontSize === 'number'
                  ? fragment.fontSize * scale
                  : fragment.fontSize,
            })),
          }))
        : trimmed.cells,
    },
  }
}

function trimTableToEffectiveArea(node: TableNode): {
  rows: number[]
  cols: number[]
  cells: TableNode['table']['cells']
} {
  const maxRows = node.table.rows.length
  const maxCols = node.table.cols.length

  if (maxRows === 0 || maxCols === 0) {
    return { rows: node.table.rows, cols: node.table.cols, cells: node.table.cells }
  }

  let maxUsedRow = -1
  let maxUsedCol = -1

  for (const cell of node.table.cells) {
    if (!isCellEffectiveForTrim(cell)) continue
    const rs = Math.max(1, cell.rs ?? 1)
    const cs = Math.max(1, cell.cs ?? 1)
    maxUsedRow = Math.max(maxUsedRow, cell.r + rs - 1)
    maxUsedCol = Math.max(maxUsedCol, cell.c + cs - 1)
  }

  if (maxUsedRow < 0 || maxUsedCol < 0) {
    return {
      rows: node.table.rows.slice(0, 1),
      cols: node.table.cols.slice(0, 1),
      cells: [],
    }
  }

  const endRow = Math.min(maxRows - 1, maxUsedRow)
  const endCol = Math.min(maxCols - 1, maxUsedCol)

  if (endRow === maxRows - 1 && endCol === maxCols - 1) {
    return { rows: node.table.rows, cols: node.table.cols, cells: node.table.cells }
  }

  const rows = node.table.rows.slice(0, endRow + 1)
  const cols = node.table.cols.slice(0, endCol + 1)
  const cells = node.table.cells.filter((cell) => {
    if (cell.r > endRow || cell.c > endCol) return false
    const rs = Math.max(1, cell.rs ?? 1)
    const cs = Math.max(1, cell.cs ?? 1)
    return cell.r + rs - 1 <= endRow && cell.c + cs - 1 <= endCol
  })

  return { rows, cols, cells }
}

function isCellEffectiveForTrim(cell: TableNode['table']['cells'][number]): boolean {
  if (cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') return true
  if (cell.bg) return true
  if (typeof cell.borderW === 'number' && cell.borderW > 0) return true
  if (cell.borders) {
    const sides = [cell.borders.t, cell.borders.r, cell.borders.b, cell.borders.l]
    if (sides.some((side) => (side?.width ?? 0) > 0)) return true
  }
  if (cell.richText?.some((fragment) => fragment.text?.trim() || (fragment.fontSize ?? 0) > 0))
    return true
  if (typeof cell.fontSize === 'number' && cell.fontSize > 0) return true
  return false
}

function sanitizeSizes(sizes: number[]): number[] {
  let changed = false
  const normalized = sizes.map((size) => {
    if (!Number.isFinite(size) || size <= 0) {
      changed = true
      return 0.001
    }
    return size
  })
  return changed ? normalized : sizes
}

function sumSizes(sizes: number[]): number {
  return sizes.reduce((sum, size) => sum + size, 0)
}
