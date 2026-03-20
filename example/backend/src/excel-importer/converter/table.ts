/**
 * テーブル変換
 *
 * ページ範囲のセルを OutputTableNode に変換する
 */

import type { ExcelCell, ExcelRow, ExcelSheet, MergedCell } from '../types/excel'
import type { ImportOptions } from '../types/options'
import type { OutputBorderStyle, OutputCell, OutputTableNode } from '../types/output'
import { convertCell } from './cell'
import { convertCellStyle } from './style'

export type PageRange = { startRow: number; endRow: number; startCol: number; endCol: number }

export function convertToTableNode(
  sheet: ExcelSheet,
  range: PageRange,
  rowHeights: number[],
  colWidths: number[],
  surfaceId: string,
  options: ImportOptions,
  position: { x: number; y: number }
): OutputTableNode {
  const rowsSlice = sliceRows(sheet.rows, range)
  const merged = adjustMergedCells(sheet.mergedCells, range)

  const cells = collectCells(rowsSlice, range, merged, options)

  const w = colWidths.slice(range.startCol, range.endCol + 1).reduce((sum, v) => sum + v, 0)
  const h = rowHeights.slice(range.startRow, range.endRow + 1).reduce((sum, v) => sum + v, 0)

  return {
    id: `table_${surfaceId}_${range.startRow}_${range.startCol}`,
    s: surfaceId,
    t: 'table',
    x: position.x,
    y: position.y,
    w,
    h,
    table: {
      rows: rowHeights.slice(range.startRow, range.endRow + 1),
      cols: colWidths.slice(range.startCol, range.endCol + 1),
      cells,
    },
  }
}

function sliceRows(rows: ExcelRow[], range: PageRange): ExcelRow[] {
  return rows.slice(range.startRow, range.endRow + 1)
}

function adjustMergedCells(merged: MergedCell[], range: PageRange): MergedCell[] {
  return merged
    .map((m) => ({
      startRow: m.startRow - range.startRow,
      startCol: m.startCol - range.startCol,
      endRow: m.endRow - range.startRow,
      endCol: m.endCol - range.startCol,
    }))
    .filter(
      (m) =>
        m.startRow >= 0 &&
        m.startCol >= 0 &&
        m.startRow <= range.endRow - range.startRow &&
        m.startCol <= range.endCol - range.startCol
    )
}

function collectCells(
  rows: ExcelRow[],
  range: PageRange,
  merged: MergedCell[],
  options: ImportOptions
): OutputCell[] {
  const mergedAnchor = new Map<string, MergedCell>()
  const mergedCovered = new Set<string>()

  for (const m of merged) {
    const key = `${m.startRow}_${m.startCol}`
    mergedAnchor.set(key, m)
    for (let r = m.startRow; r <= m.endRow; r++) {
      for (let c = m.startCol; c <= m.endCol; c++) {
        const k = `${r}_${c}`
        if (k !== key) mergedCovered.add(k)
      }
    }
  }

  const _cells: OutputCell[] = []

  // Helper to get cell at relative position
  const getCell = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= rows.length) return undefined
    const row = rows[r]
    // row.cells is array, find by col.
    // local col is relative to range.startCol.
    // row.cells stores absolute col.
    const targetCol = range.startCol + c
    return row.cells.find((cell) => cell.col === targetCol)
  }

  // Pre-calculate cell outputs (base)
  const cellMap = new Map<string, OutputCell>()

  rows.forEach((row, localRowIdx) => {
    row.cells.forEach((cell) => {
      const localColIdx = cell.col - range.startCol
      if (localColIdx < 0 || localColIdx > range.endCol - range.startCol) return

      const key = `${localRowIdx}_${localColIdx}`
      if (mergedCovered.has(key)) return

      const base = convertCell(
        {
          ...cell,
          row: localRowIdx,
          col: localColIdx,
        },
        options
      )

      const mergeInfo = mergedAnchor.get(key)
      if (mergeInfo) {
        base.rs = mergeInfo.endRow - mergeInfo.startRow + 1
        base.cs = mergeInfo.endCol - mergeInfo.startCol + 1

        const mergedPerimeterBorders = collectMergedPerimeterBorders(mergeInfo, getCell, options)
        base.borders = {
          t: resolveEdge(base.borders?.t, mergedPerimeterBorders.t),
          r: resolveEdge(base.borders?.r, mergedPerimeterBorders.r),
          b: resolveEdge(base.borders?.b, mergedPerimeterBorders.b),
          l: resolveEdge(base.borders?.l, mergedPerimeterBorders.l),
        }
      }

      cellMap.set(key, base)
    })
  })

  // Resolve Borders
  // Iterate all cells to resolve conflicts with neighbors (Right/Bottom)
  // Logic: "Winner takes all" - stronger border overwrites weaker one.
  // We check R and B of current cell against L and T of neighbor.
  cellMap.forEach((cell, _key) => {
    // Current cell position (local)
    // Note: cell.r / cell.c are local indices relative to Range
    const r = cell.r
    const c = cell.c
    const rs = cell.rs || 1
    const cs = cell.cs || 1

    // 1. Resolve Vertical Edge (Right of Current vs Left of Right Neighbor)
    // Neighbor is at (r, c + cs).
    // Note: Neighbor might be a merged cell starting there.
    // If neighbor is NOT a start of a cell (e.g. we are at edge of page), we skip.
    // But we also need to handle if neighbor is "covered" by a merge that started earlier?
    // In our `cellMap`, only start cells exist.
    // If (r, c+cs) is "covered", `cellMap.get` returns undefined.
    // Wait, if (r, c+cs) is covered, who owns the Left Border at that content-coordinate?
    // The Merge Parent. But the Merge Parent might start way above.
    // This implies we should be checking the "Effective Border" at the specific coordinate.
    // BUT! Since we only output *nodes* for the Start Cells, the Renderer draws borders around the *Node*.
    // Therefore, we only care about the boundary between THESE two specific Nodes (merged blocks).
    // If they touch, we resolve.

    // Check Right Neighbor
    const rightKey = `${r}_${c + cs}`
    const rightNeighbor = cellMap.get(rightKey)
    if (rightNeighbor && cell.borders && rightNeighbor.borders) {
      const resolved = resolveEdge(cell.borders.r, rightNeighbor.borders.l)
      if (resolved) {
        cell.borders.r = { ...resolved }
        rightNeighbor.borders.l = { ...resolved }
      }
    }

    // Check Bottom Neighbor
    const bottomKey = `${r + rs}_${c}`
    const bottomNeighbor = cellMap.get(bottomKey)
    if (bottomNeighbor && cell.borders && bottomNeighbor.borders) {
      const resolved = resolveEdge(cell.borders.b, bottomNeighbor.borders.t)
      if (resolved) {
        cell.borders.b = { ...resolved }
        bottomNeighbor.borders.t = { ...resolved }
      }
    }
  })

  return Array.from(cellMap.values())
}

/**
 * Compare two borders and return the winner.
 * If one is missing, return the other.
 * If both consistent, return one.
 * If conflict, return heavier one.
 */
function resolveEdge(
  b1: OutputBorderStyle | undefined,
  b2: OutputBorderStyle | undefined
): OutputBorderStyle | undefined {
  if (!b1 && !b2) return undefined
  if (!b1) return b2
  if (!b2) return b1

  // Compare weights (width)
  // Higher width wins.
  // If equal width, we can use a style priority or just pick one.
  // borderWidth is a function, need to cast style if needed or trust it matches.
  // The style in OutputBorderStyle is string (CSS-like), but borderWidth expects BorderStyleType (Excel).
  // Need to map or cast?
  // OutputBorderStyle.style is usually 'solid', 'dashed' etc. which matches BorderStyleType roughly.
  // But strictly, OutputBorderStyle.style might be valid CSS ('solid', 'dashed', 'dotted', 'double').
  // BorderStyleType has more ('hair', 'mediumDashed'...).
  // `borderWidth` function handles BorderStyleType.
  // If OutputBorderStyle has raw Excel style strings, it's fine.
  // In `style.ts`, we mapped: `style: 'solid'`. Wait.
  // `convertBorderSide` in `style.ts` forces `style: 'solid'`.
  // It loses the detail!
  // IF `convertBorderSide` forces 'solid', we cannot resolve priority based on 'double' vs 'thick' correctly if they both become 'solid' with different widths.
  // BUT `convertBorderSide` sets WIDTH based on the original style.
  // So width comparisons (w1 > w2) will still work for Thick(0.7) vs Thin(0.2).
  // So `borderWidth(b1.style)` is NOT useful if b1.style is always 'solid'.
  // We should rely on `b1.width`.

  const w1 = b1.width ?? 0
  const w2 = b2.width ?? 0

  if (w1 > w2) return b1
  if (w2 > w1) return b2

  const colorWinner = resolveColorTie(b1, b2)
  if (colorWinner) return colorWinner

  // Weights equal - Check style styles?
  // e.g. Solid vs Double?
  // Double borders often have same "width" mapping in our naive map (0.7 vs 0.7).
  // Priority: Double > Solid > Dashed > Dotted
  const priority = (s: string) => {
    if (s === 'double') return 4
    if (s === 'solid') return 3
    if (s === 'dashed') return 2
    if (s === 'dotted') return 1
    return 0
  }

  if (priority(b1.style) >= priority(b2.style)) return b1
  return b2
}

function resolveColorTie(
  b1: OutputBorderStyle,
  b2: OutputBorderStyle
): OutputBorderStyle | undefined {
  const c1 = normalizeHexColor(b1.color)
  const c2 = normalizeHexColor(b2.color)

  if (!c1 && !c2) return undefined
  if (!c1) return b2
  if (!c2) return b1
  if (c1 === c2) return undefined

  const nearWhite1 = isNearWhite(c1)
  const nearWhite2 = isNearWhite(c2)
  if (nearWhite1 !== nearWhite2) {
    return nearWhite1 ? b2 : b1
  }

  const l1 = relativeLuminance(c1)
  const l2 = relativeLuminance(c2)
  if (Math.abs(l1 - l2) > 1e-4) {
    return l1 < l2 ? b1 : b2
  }

  return undefined
}

function normalizeHexColor(color: string | undefined): string | undefined {
  if (!color) return undefined
  const value = color.trim().toUpperCase()
  if (!value.startsWith('#')) return undefined
  const hex = value.slice(1)
  if (hex.length === 6 && /^[0-9A-F]{6}$/.test(hex)) {
    return `#${hex}`
  }
  if (hex.length === 3 && /^[0-9A-F]{3}$/.test(hex)) {
    return `#${hex
      .split('')
      .map((ch) => `${ch}${ch}`)
      .join('')}`
  }
  return undefined
}

function isNearWhite(color: string): boolean {
  const { r, g, b } = parseHexColor(color)
  return r >= 245 && g >= 245 && b >= 245
}

function relativeLuminance(color: string): number {
  const { r, g, b } = parseHexColor(color)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function parseHexColor(color: string): { r: number; g: number; b: number } {
  const hex = color.slice(1)
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

function collectMergedPerimeterBorders(
  mergeInfo: MergedCell,
  getCell: (r: number, c: number) => ExcelCell | undefined,
  options: ImportOptions
): {
  t?: OutputBorderStyle
  r?: OutputBorderStyle
  b?: OutputBorderStyle
  l?: OutputBorderStyle
} {
  let top: OutputBorderStyle | undefined
  let right: OutputBorderStyle | undefined
  let bottom: OutputBorderStyle | undefined
  let left: OutputBorderStyle | undefined

  for (let c = mergeInfo.startCol; c <= mergeInfo.endCol; c++) {
    top = resolveEdge(top, getCellBorderSide(getCell(mergeInfo.startRow, c), 't', options))
    bottom = resolveEdge(bottom, getCellBorderSide(getCell(mergeInfo.endRow, c), 'b', options))
  }

  for (let r = mergeInfo.startRow; r <= mergeInfo.endRow; r++) {
    left = resolveEdge(left, getCellBorderSide(getCell(r, mergeInfo.startCol), 'l', options))
    right = resolveEdge(right, getCellBorderSide(getCell(r, mergeInfo.endCol), 'r', options))
  }

  // Excel merged ranges sometimes keep only one vertical side on edge cells.
  // If there is no adjacent anchor-side column, mirror the opposite side to preserve visible box edges.
  const hasLeftNeighbor = hasAnyCellInColumn(
    getCell,
    mergeInfo.startCol - 1,
    mergeInfo.startRow,
    mergeInfo.endRow
  )
  const hasRightNeighbor = hasAnyCellInColumn(
    getCell,
    mergeInfo.endCol + 1,
    mergeInfo.startRow,
    mergeInfo.endRow
  )
  if (!left && right && !hasLeftNeighbor) {
    left = { ...right }
  }
  if (!right && left && !hasRightNeighbor) {
    right = { ...left }
  }

  return {
    t: top,
    r: right,
    b: bottom,
    l: left,
  }
}

function hasAnyCellInColumn(
  getCell: (r: number, c: number) => ExcelCell | undefined,
  col: number,
  startRow: number,
  endRow: number
): boolean {
  if (col < 0) return false
  for (let r = startRow; r <= endRow; r++) {
    if (getCell(r, col)) return true
  }
  return false
}

function getCellBorderSide(
  cell: ExcelCell | undefined,
  side: 't' | 'r' | 'b' | 'l',
  options: ImportOptions
): OutputBorderStyle | undefined {
  if (!cell) return undefined
  const style = convertCellStyle(cell.style, options)
  return style.borders?.[side]
}
