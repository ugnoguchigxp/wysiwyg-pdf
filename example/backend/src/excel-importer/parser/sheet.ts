/**
 * Sheet Parser
 *
 * ExcelJSのWorksheetを中間表現に変換
 */

import type {
  CellRange,
  ExcelColumn,
  ExcelImage,
  ExcelRow,
  ExcelSheet,
  MergedCell,
  PageSetup,
} from '../types/excel'
import { parseCell } from './cell'

// ExcelJSの型（プレースホルダー）
type ExcelJSWorksheet = {
  name: string
  id: number
  pageSetup: ExcelJSPageSetup
  rowCount: number
  columnCount: number
  getRow: (index: number) => ExcelJSRow
  getColumn: (index: number) => ExcelJSColumn
  eachRow: (
    options: { includeEmpty: boolean },
    callback: (row: ExcelJSRow, rowNumber: number) => void
  ) => void
  columns?: unknown[] // Added for access to raw column definitions
  model: {
    merges?: string[]
  }
  getImages?: () => ExcelJSImageEntry[]
  workbook?: {
    getImage: (id: number) => { name: string; extension: string; buffer: ArrayBuffer }
  }
}

type ExcelJSImageEntry = {
  type: 'image'
  imageId: string
  range: {
    tl: ExcelJSAnchorPoint
    br: ExcelJSAnchorPoint
    editAs?: string
  }
}

type ExcelJSAnchorPoint = {
  nativeCol: number
  nativeColOff: number
  nativeRow: number
  nativeRowOff: number
  col?: number // Sometimes present
  row?: number
}

type ExcelJSPageSetup = {
  paperSize?: number
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
    header?: number
    footer?: number
  }
  scale?: number
  fitToPage?: boolean
  fitToWidth?: number
  fitToHeight?: number
  printArea?: string
  horizontalCentered?: boolean
  verticalCentered?: boolean
  headerFooter?: {
    oddHeader?: string
    oddFooter?: string
    evenHeader?: string
    evenFooter?: string
    firstHeader?: string
    firstFooter?: string
  }
}

type ExcelJSRow = {
  number: number
  height?: number
  hidden?: boolean
  getCell: (index: number) => ExcelJSCell
  eachCell: (
    options: { includeEmpty: boolean },
    callback: (cell: ExcelJSCell, colNumber: number) => void
  ) => void
  actualColumnCount: number
}

type ExcelJSColumn = {
  number: number
  width?: number
  hidden?: boolean
}

type ExcelJSCell = {
  row: number
  col: number
  value: unknown
  formula?: string
  result?: unknown
  style: unknown
  type: number
}

/**
 * ExcelJSワークシートを中間表現に変換
 *
 * @param worksheet ExcelJSのワークシート
 * @param index シートインデックス
 * @returns 中間表現のシート
 */
export function parseSheet(worksheet: ExcelJSWorksheet, index: number): ExcelSheet {
  const rows: ExcelRow[] = []
  const columns: ExcelColumn[] = []
  const printArea = worksheet.pageSetup.printArea
    ? parsePrintArea(worksheet.pageSetup.printArea)
    : undefined

  // 列情報を収集
  // worksheet.columnCount / worksheet.columns は罫線だけで XFD まで膨らむことがあるため利用しない。
  // 値・塗りつぶし・明示範囲(printArea)のみを列採用条件とする。
  const COLUMN_SCAN_CAP = 500
  let actualMaxCol = printArea ? printArea.endCol + 1 : 0
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const rowScanLimit = Math.min(Math.max(0, row.actualColumnCount), COLUMN_SCAN_CAP)
    for (let colNumber = 1; colNumber <= rowScanLimit; colNumber++) {
      const cell = row.getCell(colNumber)
      if (!cell) continue
      if (isCellEffectiveForColumnTrim(cell)) {
        actualMaxCol = Math.max(actualMaxCol, colNumber)
      }
    }

    // Sparse rows may have cells beyond actualColumnCount.
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (colNumber > COLUMN_SCAN_CAP) return
      if (isCellEffectiveForColumnTrim(cell)) {
        actualMaxCol = Math.max(actualMaxCol, colNumber)
      }
    })
  })

  // 安全のためハードキャップ(500)
  const maxCol = Math.min(actualMaxCol, COLUMN_SCAN_CAP)

  for (let i = 1; i <= maxCol; i++) {
    const colDef = (worksheet.columns as any)?.[i - 1] as ExcelJSColumn | undefined
    const col = worksheet.getColumn(i)
    columns.push({
      index: i - 1,
      width: colDef?.width ?? col.width ?? 8.43,
      hidden: colDef?.hidden ?? col.hidden ?? false,
    })
  }

  // 行情報を収集
  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const cells = parseCellsInRow(row, maxCol)
    rows.push({
      index: rowNumber - 1, // 0-based
      height: row.height ?? 15, // デフォルト高さ（pt）
      hidden: row.hidden ?? false,
      cells,
    })
  })

  // 結合セル情報を解析
  const mergedCells = parseMergedCells(worksheet.model.merges ?? [])

  // ページ設定を解析
  const pageSetup = parsePageSetup(worksheet.pageSetup)

  return {
    name: worksheet.name,
    index,
    pageSetup,
    printArea,
    rows,
    columns,
    mergedCells,
    images: parseImages(worksheet),
  }
}

/**
 * 行内のセルをパース
 */
function parseCellsInRow(row: ExcelJSRow, maxCol: number) {
  const cells: ReturnType<typeof parseCell>[] = []

  for (let colNumber = 1; colNumber <= maxCol; colNumber++) {
    const cell = row.getCell(colNumber)
    if (!cell) continue
    if (!isCellEffectiveForParsing(cell)) continue
    cells.push(parseCell(cell, row.number - 1, colNumber - 1))
  }

  return cells
}

function isCellEffectiveForParsing(cell: ExcelJSCell): boolean {
  if (cell.value !== null && cell.value !== undefined && cell.value !== '') return true
  if (cell.formula) return true

  const style = cell.style as
    | {
        fill?: {
          type?: string
          pattern?: string
          fgColor?: unknown
          bgColor?: unknown
        }
        border?: {
          top?: { style?: string }
          right?: { style?: string }
          bottom?: { style?: string }
          left?: { style?: string }
          diagonal?: { style?: string }
        }
      }
    | undefined

  const fill = style?.fill
  if (fill) {
    if (fill.type === 'gradient') return true
    const pattern = fill.pattern ?? 'none'
    if (pattern !== 'none' && (pattern !== 'solid' || !!fill.fgColor || !!fill.bgColor)) {
      return true
    }
    if (pattern === 'solid' && (fill.fgColor || fill.bgColor)) {
      return true
    }
  }

  const border = style?.border
  if (border) {
    const sides = [border.top, border.right, border.bottom, border.left, border.diagonal]
    if (sides.some((side) => !!side?.style && side.style !== 'none')) {
      return true
    }
  }

  return false
}

function isCellEffectiveForColumnTrim(cell: ExcelJSCell): boolean {
  if (cell.value !== null && cell.value !== undefined && cell.value !== '') return true
  if (cell.formula) return true

  const style = cell.style as
    | {
        fill?: {
          type?: string
          pattern?: string
          fgColor?: unknown
          bgColor?: unknown
        }
      }
    | undefined
  const fill = style?.fill
  if (!fill) return false

  if (fill.type === 'gradient') return true

  const pattern = fill.pattern ?? 'none'
  if (pattern === 'none') return false
  if (pattern === 'solid') return true

  return !!fill.fgColor || !!fill.bgColor
}

/**
 * 結合セル情報を解析
 *
 * @param merges ExcelJSの結合セル文字列配列（例: ["A1:B2", "C3:D4"]）
 * @returns 結合セル情報の配列
 */
function parseMergedCells(merges: string[]): MergedCell[] {
  return merges.map((merge) => {
    const [start, end] = merge.split(':')
    const startCell = cellRefToIndices(start)
    const endCell = cellRefToIndices(end)

    return {
      startRow: startCell.row,
      startCol: startCell.col,
      endRow: endCell.row,
      endCol: endCell.col,
    }
  })
}

/**
 * セル参照文字列をインデックスに変換
 *
 * @param ref セル参照（例: "A1", "AA100"）
 * @returns { row, col } 0-based
 */
function cellRefToIndices(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/)
  if (!match) {
    throw new Error(`Invalid cell reference: ${ref}`)
  }

  const colStr = match[1]
  const rowStr = match[2]

  // 列文字列を数値に変換（A=0, B=1, ..., Z=25, AA=26, ...）
  let col = 0
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64)
  }
  col -= 1 // 0-based

  const row = parseInt(rowStr, 10) - 1 // 0-based

  return { row, col }
}

/**
 * ページ設定を解析
 */
function parsePageSetup(setup: ExcelJSPageSetup): PageSetup {
  return {
    paperSize: paperSizeFromNumber(setup.paperSize ?? 9), // 9 = A4
    orientation: setup.orientation ?? 'portrait',
    margin: {
      top: setup.margins?.top ?? 0.75,
      right: setup.margins?.right ?? 0.7,
      bottom: setup.margins?.bottom ?? 0.75,
      left: setup.margins?.left ?? 0.7,
      header: setup.margins?.header ?? 0.3,
      footer: setup.margins?.footer ?? 0.3,
    },
    scale: setup.scale,
    fitToPage: setup.fitToPage
      ? {
          width: setup.fitToWidth,
          height: setup.fitToHeight,
        }
      : undefined,
    headerFooter: setup.headerFooter
      ? {
          oddHeader: setup.headerFooter.oddHeader,
          oddFooter: setup.headerFooter.oddFooter,
          evenHeader: setup.headerFooter.evenHeader,
          evenFooter: setup.headerFooter.evenFooter,
          firstHeader: setup.headerFooter.firstHeader,
          firstFooter: setup.headerFooter.firstFooter,
        }
      : undefined,
  }
}

/**
 * ExcelJSの用紙サイズ番号を文字列に変換
 */
function paperSizeFromNumber(num: number): PageSetup['paperSize'] {
  const mapping: Record<number, PageSetup['paperSize']> = {
    1: 'letter',
    5: 'legal',
    8: 'a3',
    9: 'a4',
    11: 'a5',
    12: 'b4',
    13: 'b5',
  }
  return mapping[num] ?? 'a4'
}

/**
 * 印刷範囲文字列を解析
 *
 * @param printArea 印刷範囲文字列（例: "A1:Z100"）
 * @returns CellRange
 */
function parsePrintArea(printArea: string): CellRange | undefined {
  // シート名を除去（例: "Sheet1!A1:Z100" → "A1:Z100"）
  const range = printArea.includes('!') ? printArea.split('!')[1] : printArea

  if (!range.includes(':')) {
    return undefined
  }

  const [start, end] = range.split(':')
  const startCell = cellRefToIndices(start)
  const endCell = cellRefToIndices(end)

  return {
    startRow: startCell.row,
    startCol: startCell.col,
    endRow: endCell.row,
    endCol: endCell.col,
  }
}

/**
 * 画像情報を解析
 */
function parseImages(worksheet: ExcelJSWorksheet): ExcelImage[] {
  if (!worksheet.getImages || !worksheet.workbook || !worksheet.workbook.getImage) {
    return []
  }

  const images: ExcelImage[] = []

  try {
    const rawImages = worksheet.getImages()

    for (const raw of rawImages) {
      if (!raw.range || !raw.range.tl || !raw.range.br) continue

      const imgData = worksheet.workbook.getImage(Number(raw.imageId))
      if (!imgData) continue

      images.push({
        id: raw.imageId,
        type: 'image',
        extension: imgData.extension,
        data: new Uint8Array(imgData.buffer),
        range: {
          editAs: raw.range.editAs,
          from: {
            col: raw.range.tl.nativeCol,
            colOff: raw.range.tl.nativeColOff,
            row: raw.range.tl.nativeRow,
            rowOff: raw.range.tl.nativeRowOff,
          },
          to: {
            col: raw.range.br.nativeCol,
            colOff: raw.range.br.nativeColOff,
            row: raw.range.br.nativeRow,
            rowOff: raw.range.br.nativeRowOff,
          },
        },
      })
    }
  } catch (_e) {
    // console.warn('Failed to parse images:', e)
  }

  return images
}
