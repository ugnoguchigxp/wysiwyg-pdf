/**
 * Surface変換 + 簡易ページ分割
 *
 * ExcelSheet → OutputSurface + OutputTableNode
 * （Phase1: まずは1ページ前提のシンプル実装）
 */

import type { ExcelSheet, ExcelRow, ExcelCell, MergedCell } from '../types/excel'
import type { ImportOptions } from '../types/options'
import type { OutputSurface, OutputNode } from '../types/output'
import { DEFAULT_IMPORT_OPTIONS } from '../types/options'
import { excelColWidthToMm, excelRowHeightToMm, PAPER_SIZES, inchToMm } from '../utils'
import { convertToTableNode } from './table'

export function convertSheet(
  sheet: ExcelSheet,
  sheetOrder: number,
  options: ImportOptions,
  defaultFont: { name: string; size: number }
): { surfaces: OutputSurface[]; nodes: OutputNode[] } {
  const resolvedOptions = { ...DEFAULT_IMPORT_OPTIONS, ...options }

  // 1. ページサイズ決定
  const paperKey = resolvedOptions.pageSize ?? sheet.pageSetup.paperSize ?? 'a4'
  const paper = PAPER_SIZES[paperKey] ?? PAPER_SIZES.a4
  const landscape = (resolvedOptions.orientation ?? sheet.pageSetup.orientation) === 'landscape'
  const pageSize = landscape ? { w: paper.h, h: paper.w } : { w: paper.w, h: paper.h }

  // 2. 余白(mm)
  const margin =
    resolvedOptions.margin ??
    {
      t: inchToMm(sheet.pageSetup.margin.top),
      r: inchToMm(sheet.pageSetup.margin.right),
      b: inchToMm(sheet.pageSetup.margin.bottom),
      l: inchToMm(sheet.pageSetup.margin.left),
    }

  // 3. 対象範囲決定
  const { rowMap, colMap, filteredRows, filteredMerged } = filterRowsCols(sheet, resolvedOptions)

  const contentWidth = colMap.map((i) => sheet.columns[i]?.width ?? 8.43).reduce((s, w) => s + excelColWidthToMm(w), 0)
  const contentHeight = rowMap.map((i) => sheet.rows[i]?.height ?? 15).reduce((s, h) => s + excelRowHeightToMm(h), 0)

  // 4. 縮尺
  const drawableWidth = pageSize.w - margin.l - margin.r
  const drawableHeight = pageSize.h - margin.t - margin.b
  const scale =
    resolvedOptions.scale ??
    (resolvedOptions.fitToPage
      ? Math.min(
        drawableWidth / (contentWidth || drawableWidth),
        drawableHeight / (contentHeight || drawableHeight),
        1
      )
      : 1)

  console.log('[DEBUG] Layout Metrics:', {
    contentWidth,
    drawableWidth,
    scale,
    margin,
    pageSize,
    paperKey,
    colMapSize: colMap.length,
    columnsCount: sheet.columns.length
  })

  // 5. 行高・列幅 (スケール適用後)
  const rowHeightsMm = rowMap.map((i) => {
    const h = sheet.rows[i]?.height ?? 15
    return excelRowHeightToMm(h) * scale
  })
  const colWidthsMm = colMap.map((i) => {
    // シート定義がない場合はデフォルト幅(8.43)
    // ExcelRowのセルデータから推測もできるが、基本はデフォルトでOK
    const w = sheet.columns[i]?.width ?? 8.43
    return excelColWidthToMm(w) * scale
  })

  // 6. ページ分割
  const rowRanges = calculateRowRanges(rowHeightsMm, drawableHeight, sheet.pageSetup.horizontalPageBreaks, !!resolvedOptions.fitToPage)
  const colRanges = calculateColRanges(colWidthsMm, drawableWidth, sheet.pageSetup.verticalPageBreaks, !!resolvedOptions.fitToPage)

  const surfaces: OutputSurface[] = []
  const nodes: OutputNode[] = []

  let pageIdx = 0
  for (const rr of rowRanges) {
    for (const cr of colRanges) {
      const surfaceId = `surface_${sheet.index}_${sheetOrder}_${pageIdx}`

      // テーブルノード作成時に、範囲内のRow/Columnを渡す
      // filteredRowsはrowMapに対応しているが、convertToTableNodeはsliceを使うため
      // 範囲外や欠落行のハンドリングが必要。
      // ここでは簡易的に、filteredRowsをそのまま使う（ただし行インデックスはずれている可能性がある）
      // convertToTableNodeのsliceRowsは単純な配列sliceなので、rowMapと整合性が取れている必要がある。

      // convertToTableNodeのシグネチャ的に、渡すrowsは「そのページの行」だけにするのが正しい。
      // しかし現状の実装は sheet.rows (全行) を渡して range (startRow/endRow) でスライスしている。
      // また filteredRows は filterRowsCols で生成された「出力対象行」のリスト。

      // ここでの rr.startRow / rr.endRow は、 rowHeightsMm (= rowMap) のインデックス範囲。
      // したがって、 filteredRows のスライスで正しい。

      const tableNode = convertToTableNode(
        {
          ...sheet,
          rows: filteredRows.slice(rr.startRow, rr.endRow + 1),
          // columns配列はメタデータ用だが、colMapに含まれるものだけにフィルタ済みと仮定
          columns: sheet.columns.filter((col) => colMap.includes(col.index)).slice(cr.startCol, cr.endCol + 1),
          mergedCells: filteredMerged,
        },
        {
          startRow: rr.startRow,
          endRow: rr.endRow,
          startCol: cr.startCol,
          endCol: cr.endCol,
        },
        rowHeightsMm,
        colWidthsMm,
        surfaceId,
        resolvedOptions,
        { x: margin.l, y: margin.t }
      )

      surfaces.push({
        id: surfaceId,
        type: 'page',
        w: pageSize.w,
        h: pageSize.h,
        margin,
      })
      nodes.push(tableNode)
      pageIdx += 1
    }
  }

  return { surfaces, nodes }
}

type FilterResult = {
  rowMap: number[]
  colMap: number[]
  filteredRows: ExcelRow[]
  filteredMerged: MergedCell[]
}

function filterRowsCols(sheet: ExcelSheet, options: ImportOptions): FilterResult {
  const skipEmptyRows = options.skipEmptyRows ?? DEFAULT_IMPORT_OPTIONS.skipEmptyRows
  const skipEmptyCols = options.skipEmptyColumns ?? DEFAULT_IMPORT_OPTIONS.skipEmptyColumns

  // 印刷範囲があればそれを優先
  if (sheet.printArea) {
    const { startRow, endRow, startCol, endCol } = sheet.printArea

    // PrintAreaの範囲を強制的に採用
    const rowMap: number[] = []
    for (let r = startRow; r <= endRow; r++) {
      // hidden行は除外するか？ 通常印刷範囲指定時はhiddenも印刷対象外になることが多いが
      // ExcelJSのPrintArea定義は単なる範囲。
      // 安全のため、明らかにhiddenフラグがついているものは除外する
      if (sheet.rows[r]?.hidden) continue
      rowMap.push(r)
    }

    const colMap: number[] = []
    for (let c = startCol; c <= endCol; c++) {
      if (sheet.columns[c]?.hidden) continue
      colMap.push(c)
    }

    // filteredRowsの構築
    // rowMapにある行を集める。存在しない行（データなし）はダミーで作る必要があるかも？
    // convertToTableNode等で rows[i] にアクセスする際、undefinedチェックが必要だが
    // filteredRowsは ExcelRow[] なので、ダミーオブジェクトを入れる。

    const filteredRows: ExcelRow[] = rowMap.map((originalRowIdx, newRowIdx) => {
      const originalRow = sheet.rows[originalRowIdx]

      if (!originalRow) {
        // データがない行（ダミー）
        return {
          index: newRowIdx,
          height: 15, // default
          hidden: false,
          cells: []
        }
      }

      // セルもcolMapに合わせてフィルタ＆並べ替え
      const newCells: ExcelCell[] = originalRow.cells
        .filter((cell) => colMap.includes(cell.col))
        .map((cell) => ({
          ...cell,
          row: newRowIdx,
          col: colMap.indexOf(cell.col),
        }))

      return {
        ...originalRow,
        index: newRowIdx,
        cells: newCells
      }
    })

    const filteredMerged = filterMergedCells(sheet.mergedCells, rowMap, colMap)

    return { rowMap, colMap, filteredRows, filteredMerged }
  }

  // 以下、PrintAreaがない場合の通常ロジック
  // 行フィルタ
  const rowMap: number[] = []
  sheet.rows.forEach((row, idx) => {
    if (row.hidden) return
    if (skipEmptyRows && isRowEmpty(row)) return
    rowMap.push(idx)
  })

  // 列フィルタ
  const colMap: number[] = []
  sheet.columns.forEach((col, idx) => {
    if (col.hidden) return
    if (skipEmptyCols && isColumnEmpty(sheet.rows, idx)) return
    colMap.push(idx)
  })

  // 行・列を再構築してインデックスを0基準で振り直す
  const filteredRows: ExcelRow[] = rowMap.map((originalRowIdx, newRowIdx) => {
    const originalRow = sheet.rows[originalRowIdx]
    const newCells: ExcelCell[] = originalRow.cells
      .filter((cell) => colMap.includes(cell.col))
      .map((cell) => ({
        ...cell,
        row: newRowIdx,
        col: colMap.indexOf(cell.col),
      }))

    return {
      index: newRowIdx,
      height: originalRow.height,
      hidden: false,
      cells: newCells,
    }
  })

  const filteredMerged = filterMergedCells(sheet.mergedCells, rowMap, colMap)

  return { rowMap, colMap, filteredRows, filteredMerged }
}

function filterMergedCells(mergedCells: MergedCell[], rowMap: number[], colMap: number[]): MergedCell[] {
  const colIndexMap = new Map(colMap.map((c, i) => [c, i]))
  const rowIndexMap = new Map(rowMap.map((r, i) => [r, i]))

  return mergedCells
    .map((m) => {
      const sr = rowIndexMap.get(m.startRow)
      const sc = colIndexMap.get(m.startCol)
      const er = rowIndexMap.get(m.endRow)
      const ec = colIndexMap.get(m.endCol)
      if (
        sr === undefined ||
        sc === undefined ||
        er === undefined ||
        ec === undefined ||
        sr < 0 ||
        sc < 0 ||
        er < 0 ||
        ec < 0
      ) {
        return undefined
      }
      return {
        startRow: sr,
        startCol: sc,
        endRow: er,
        endCol: ec,
      }
    })
    .filter((m): m is MergedCell => !!m)
}

function isRowEmpty(row: ExcelRow): boolean {
  return row.cells.every((cell) => cell.value === null || cell.value === undefined || cell.value === '')
}

function isColumnEmpty(rows: ExcelRow[], colIndex: number): boolean {
  return rows.every((row) => {
    const target = row.cells.find((c) => c.col === colIndex)
    return !target || target.value === null || target.value === undefined || target.value === ''
  })
}

/**
 * 行/列分割範囲を計算
 */
function calculateRowRanges(sizes: number[], limit: number, manualBreaks?: number[], forceFit: boolean = false) {
  if (sizes.length === 0) return [{ startRow: 0, endRow: 0 }]
  if (forceFit) return [{ startRow: 0, endRow: sizes.length - 1 }]

  const breaks = new Set(manualBreaks ?? [])
  const ranges: Array<{ startRow: number; endRow: number }> = []
  let start = 0
  let acc = 0
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]
    const isManualBreak = breaks.has(i)
    const willOverflow = acc + size > limit && acc > 0
    if (isManualBreak || willOverflow) {
      ranges.push({ startRow: start, endRow: i - 1 })
      start = i
      acc = 0
    }
    acc += size
  }
  ranges.push({ startRow: start, endRow: sizes.length - 1 })
  return ranges
}

function calculateColRanges(sizes: number[], limit: number, manualBreaks?: number[], forceFit: boolean = false) {
  if (sizes.length === 0) return [{ startCol: 0, endCol: 0 }]
  if (forceFit) return [{ startCol: 0, endCol: sizes.length - 1 }]

  const breaks = new Set(manualBreaks ?? [])
  const ranges: Array<{ startCol: number; endCol: number }> = []
  let start = 0
  let acc = 0
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]
    const isManualBreak = breaks.has(i)
    const willOverflow = acc + size > limit && acc > 0
    if (isManualBreak || willOverflow) {
      ranges.push({ startCol: start, endCol: i - 1 })
      start = i
      acc = 0
    }
    acc += size
  }
  ranges.push({ startCol: start, endCol: sizes.length - 1 })
  return ranges
}
