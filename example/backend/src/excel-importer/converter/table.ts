/**
 * テーブル変換
 *
 * ページ範囲のセルを OutputTableNode に変換する
 */

import type { ExcelSheet, ExcelRow, ExcelCell, MergedCell } from '../types/excel'
import type { ImportOptions } from '../types/options'
import type { OutputTableNode, OutputCell } from '../types/output'
import { convertCell } from './cell'

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

  const cells: OutputCell[] = []

  rows.forEach((row, localRowIdx) => {
    row.cells.forEach((cell) => {
      const localColIdx = cell.col - range.startCol
      if (localColIdx < 0 || localColIdx > range.endCol - range.startCol) return

      const key = `${localRowIdx}_${localColIdx}`
      if (mergedCovered.has(key)) {
        // 結合セルの非起点は出力しない
        return
      }

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
      }

      cells.push(base)
    })
  })

  return cells
}
