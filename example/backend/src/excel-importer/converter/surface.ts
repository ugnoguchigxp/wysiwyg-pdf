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
import { excelColWidthToMm, excelRowHeightToMm, PAPER_SIZES, inchToMm, pxToMm } from '../utils'
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

  let scale = 1.0

  if (resolvedOptions.scale !== undefined) {
    // 1. Explicit manual scale (User override)
    scale = resolvedOptions.scale
  } else if (resolvedOptions.fitToPage === true && options.fitToPage !== undefined) {
    // 2. Explicit "Force Fit to 1 Page" (User override)
    // Only if user explicitly requested fitToPage (boolean) in options.
    // If it came from DEFAULT (undefined in options), we might want to check Excel settings.
    scale = Math.min(
      drawableWidth / (contentWidth || drawableWidth),
      drawableHeight / (contentHeight || drawableHeight),
      1
    )
  } else if (sheet.pageSetup.fitToPage) {
    // 3. Excel "Fit to Pages" settings 
    // If fitToPage is defined in Excel, we calculate scale to fit X pages wide / Y pages tall.
    const { width: pagesWide, height: pagesTall } = sheet.pageSetup.fitToPage

    let scaleX = Infinity
    let scaleY = Infinity

    // 0 or undefined usually means "automatic" (don't constrain)
    if (pagesWide && pagesWide > 0) {
      scaleX = (drawableWidth * pagesWide) / (contentWidth || 1)
    }
    if (pagesTall && pagesTall > 0) {
      scaleY = (drawableHeight * pagesTall) / (contentHeight || 1)
    }

    if (scaleX === Infinity && scaleY === Infinity) {
      // Fallback: Use simple scale if object exists but empty
      scale = (sheet.pageSetup.scale ?? 100) / 100
    } else {
      scale = Math.min(scaleX, scaleY)
      // Cap at 100%? Excel fit-to-page *can* zoom in, but typically used to shrink.
      // We'll leave it as calculated for strictness.
    }
  } else if (options.fitToPage === undefined && resolvedOptions.fitToPage === true) {
    // 4. Backward Compatibility / Default Behavior
    // User didn't specify fitToPage, but Default is true.
    // And no specific Excel FitToPages settings found.
    // Fallback to "Fit to 1 Page" or "Scale=1"?
    // Current "Safe" default is Fit to 1 Page to avoid exploding pages.
    scale = Math.min(
      drawableWidth / (contentWidth || drawableWidth),
      drawableHeight / (contentHeight || drawableHeight),
      1
    )
  } else {
    // 5. Default Scale from Excel
    scale = (sheet.pageSetup.scale ?? 100) / 100
  }

  // Safety: Prevent Scale from becoming too small (Task 5-1)
  const SAFE_MIN_SCALE = 0.3
  if (scale < SAFE_MIN_SCALE) {
    console.warn(`[Layout] Calculated scale ${scale} is below safe limit ${SAFE_MIN_SCALE}. Clamping likely needed or pagination strategy change.`)
    // For now we use the calculated scale but user might want to know.
  }

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

  // 累積座標（ページ判定用）
  const rowCumH = [0]
  rowHeightsMm.forEach((h, i) => rowCumH.push(rowCumH[i] + h))
  const colCumW = [0]
  colWidthsMm.forEach((w, i) => colCumW.push(colCumW[i] + w))

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
        header: resolveHeaderFooter(sheet.pageSetup.headerFooter, pageIdx + 1, 'header'),
        footer: resolveHeaderFooter(sheet.pageSetup.headerFooter, pageIdx + 1, 'footer'),
      })
      nodes.push(tableNode)

      // 画像処理
      // このページに含まれる画像を抽出・変換
      // アンカーベースで簡易判定 (TopLeftがページ内にあるか)

      const pageStartY = rowCumH[rr.startRow]
      const pageEndY = rowCumH[rr.endRow + 1] ?? rowCumH[rowCumH.length - 1]
      const pageStartX = colCumW[cr.startCol]
      const pageEndX = colCumW[cr.endCol + 1] ?? colCumW[colCumW.length - 1]

      sheet.images.forEach(img => {
        // マッピング: 元のRow/Col index -> rowMap/colMap index
        // 見つからない(=非表示/範囲外)場合はスキップ
        const localRowIdx = rowMap.indexOf(img.range.from.row)
        const localColIdx = colMap.indexOf(img.range.from.col)

        if (localRowIdx === -1 || localColIdx === -1) return

        // 座標計算 (scale考慮)
        // Anchor offset is in pixels usually (or EMU). Assuming pixels from parser.
        const offX = pxToMm(img.range.from.colOff) * scale
        const offY = pxToMm(img.range.from.rowOff) * scale

        const globalX = colCumW[localColIdx] + offX
        const globalY = rowCumH[localRowIdx] + offY

        // ページ判定 (TopLeftが範囲内)
        // 厳密には画像の一部が入る場合も考慮すべきだが、まずはTopLeft基準
        if (globalX >= pageStartX && globalX < pageEndX && globalY >= pageStartY && globalY < pageEndY) {

          // Width/Height計算
          // TwoCellAnchor: to - from
          const toRowIdx = rowMap.indexOf(img.range.to.row)
          const toColIdx = colMap.indexOf(img.range.to.col)

          let w = 0
          let h = 0

          // If 'to' anchor is valid and within map
          if (toRowIdx !== -1 && toColIdx !== -1) {
            const toOffX = pxToMm(img.range.to.colOff) * scale
            const toOffY = pxToMm(img.range.to.rowOff) * scale
            const globalRight = colCumW[toColIdx] + toOffX
            const globalBottom = rowCumH[toRowIdx] + toOffY
            w = globalRight - globalX
            h = globalBottom - globalY
          } else {
            // Fallback: if 'to' is outside (e.g. after last row), estimate?
            // Or maybe fixed size?
            // For now, minimal support.
            w = 10
            h = 10
          }

          nodes.push({
            id: `img_${img.id}_${surfaceId}`,
            t: 'image',
            s: surfaceId,
            x: globalX - pageStartX + margin.l,
            y: globalY - pageStartY + margin.t,
            w,
            h,
            assetId: undefined, // URL or Base64 lookup needed. For now just node structure.
            // We need 'src' or 'assetId'. 
            // OutputImageNode supports 'src' (data url).
            src: `data:image/${img.extension};base64,${Buffer.from(new Uint8Array(img.data)).toString('base64')}`
          })
        }
      })

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
  // 列フィルタ
  const rowMap: number[] = []
  const colMap: number[] = []

  // PrintAreaがない場合、UsedRangeを厳密に計算して「空行・空列」をトリムする (Task 2)
  const { startRow, endRow, startCol, endCol } = calculateStrictUsedRange(sheet)

  // rowMap構築
  for (let r = startRow; r <= endRow; r++) {
    // 行が存在しない場合はスキップするか？
    // ExcelJSのrowsはsparse。存在チェックにはfindなどが要るが
    // ここでは単純に sheet.rows を回してみるアプローチではなく、範囲で回す
    const row = sheet.rows.find(row => row.index === r)

    // 行オブジェクトがない、またはhiddenならスキップ (ただし空行保持設定なら話は別だが、UsedRange logicではトリム済)
    if (!row) {
      // 行オブジェクトがない = データもスタイルもない → スキップでOK (Trim)
      continue
    }

    if (row.hidden) continue
    if (skipEmptyRows && isRowEmpty(row)) continue

    // データはある、あるいはTrim範囲内
    rowMap.push(row.index) // 元のindexを保持
  }

  // colMap構築
  for (let c = startCol; c <= endCol; c++) {
    const colKey = sheet.columns.find(col => col.index === c)
    if (colKey && colKey.hidden) continue

    // 列が空かどうかのチェック (isColumnEmptyは全行スキャンするため重いが...)
    // UsedRange範囲内であれば「何かある」はずだが、sparseな矩形の可能性はある
    // skipEmptyColsが指定された時のみチェック
    if (skipEmptyCols && isColumnEmpty(sheet.rows, c)) continue

    colMap.push(c)
  }

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

/**
 * 厳密なUsedRangeを計算 (データまたはスタイルがある範囲)
 */
function calculateStrictUsedRange(sheet: ExcelSheet): { startRow: number, endRow: number, startCol: number, endCol: number } {
  let minR = Infinity
  let maxR = -Infinity
  let minC = Infinity
  let maxC = -Infinity

  let hasContent = false

  for (const row of sheet.rows) {
    let rowHasData = false

    // Check cells
    for (const cell of row.cells) {
      if (isCellEffective(cell)) {
        rowHasData = true
        if (cell.col < minC) minC = cell.col
        if (cell.col > maxC) maxC = cell.col
      }
    }

    if (rowHasData) {
      hasContent = true
      if (row.index < minR) minR = row.index
      if (row.index > maxR) maxR = row.index
    }
  }

  if (!hasContent) {
    return { startRow: 0, endRow: 0, startCol: 0, endCol: 0 }
  }

  return { startRow: minR, endRow: maxR, startCol: minC, endCol: maxC }
}

/**
 * セルが「有効」か判定
 * 値がある、またはスタイル(罫線・背景)がある
 */
function isCellEffective(cell: ExcelCell): boolean {
  // 値がある
  if (cell.value !== null && cell.value !== undefined && cell.value !== '') return true

  // スタイルがある (Border)
  if (cell.style.border) {
    const b = cell.style.border
    if (b.top && b.top.style && b.top.style !== 'none') return true
    if (b.bottom && b.bottom.style && b.bottom.style !== 'none') return true
    if (b.left && b.left.style && b.left.style !== 'none') return true
    if (b.right && b.right.style && b.right.style !== 'none') return true
  }

  // スタイルがある (Fill)
  if (cell.style.fill) {
    if (cell.style.fill.type !== 'pattern' || (cell.style.fill.patternType && cell.style.fill.patternType !== 'none')) {
      return true
    }
  }

  return false
}

/**
 * ヘッダー/フッター解決
 */
function resolveHeaderFooter(
  hf: import('../types/excel').HeaderFooter | undefined,
  pageNumber: number,
  type: 'header' | 'footer'
): import('../types/output').HeaderFooterContent | undefined {
  if (!hf) return undefined

  // TODO: `differentFirst` / `differentOddEven` flags are not yet in PageSetup type.
  // Assuming default (odd) for now, or check generic logic.
  // Standard Excel behavior:
  // IF diffFirst && page==1 -> first
  // IF diffOddEven && page%2==0 -> even
  // ELSE -> odd (or default)

  // For now, simple fallback: first ?? odd
  // Since `PageSetup` type update is pending for flags, use oddHeader/oddFooter as main.

  let content: string | undefined
  if (type === 'header') {
    content = hf.oddHeader
  } else {
    content = hf.oddFooter
  }

  if (!content) return undefined
  return parseHeaderFooterString(content)
}

/**
 * Excelヘッダー文字列をパース (&L... &C... &R...)
 */
function parseHeaderFooterString(text: string): import('../types/output').HeaderFooterContent {
  // Simple parser: Split by &L, &C, &R
  // &L Left Content &C Center Content &R Right Content
  // Note: formatting codes like &B(Bold) are inside content.

  const result: import('../types/output').HeaderFooterContent = {}

  // Regex to find sections. 
  // Sections can be in any order? usually L, C, R.
  // &L marks start of Left, until &C or &R or End.

  const parts = text.split(/&([LCR])/).filter(s => s) // Split and keep delimiters

  // parts[0] might be content if it starts without &LCR (assumed Center? No, Excel usually starts with &C if centered)
  // If splits: ["L", "Left Text", "C", "Center", "R", "Right"]

  let currentKey: 'left' | 'center' | 'right' | null = null

  // If the string doesn't start with &L/C/R, it might be center by default? or left?
  // Excel usually stores explicitly.

  // Iterate
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (p === 'L') { currentKey = 'left'; continue }
    if (p === 'C') { currentKey = 'center'; continue }
    if (p === 'R') { currentKey = 'right'; continue }

    // Content
    if (currentKey) {
      result[currentKey] = (result[currentKey] ?? '') + p
    }
  }

  return result
}
