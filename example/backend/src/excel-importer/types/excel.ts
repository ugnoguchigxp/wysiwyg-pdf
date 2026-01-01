/**
 * Excel中間表現の型定義
 *
 * ExcelJSの構造を抽象化し、パーサーとコンバーターを疎結合にする
 */

// ========================================
// Workbook
// ========================================

export interface ExcelWorkbook {
  sheets: ExcelSheet[]
  defaultFont: FontInfo
  metadata?: WorkbookMetadata
}

export interface WorkbookMetadata {
  title?: string
  author?: string
  created?: Date
  modified?: Date
}

// ========================================
// Sheet
// ========================================

export interface ExcelSheet {
  name: string
  index: number

  // 印刷設定
  pageSetup: PageSetup
  printArea?: CellRange

  // データ
  rows: ExcelRow[]
  columns: ExcelColumn[]
  mergedCells: MergedCell[]

  // 計算済み情報
  usedRange?: CellRange
}

export interface PageSetup {
  paperSize: PaperSize
  orientation: 'portrait' | 'landscape'
  margin: PageMargin
  scale?: number // 1-400 (%)
  fitToPage?: {
    width?: number // ページ数
    height?: number // ページ数
  }
  horizontalPageBreaks?: number[] // 行インデックス
  verticalPageBreaks?: number[] // 列インデックス
  headerFooter?: HeaderFooter
}

export interface PageMargin {
  top: number // inch
  right: number // inch
  bottom: number // inch
  left: number // inch
  header: number // inch
  footer: number // inch
}

export interface HeaderFooter {
  oddHeader?: string
  oddFooter?: string
  evenHeader?: string
  evenFooter?: string
  firstHeader?: string
  firstFooter?: string
}

export type PaperSize =
  | 'letter' // 8.5 x 11 inch
  | 'legal' // 8.5 x 14 inch
  | 'a3' // 297 x 420 mm
  | 'a4' // 210 x 297 mm
  | 'a5' // 148 x 210 mm
  | 'b4' // 250 x 353 mm
  | 'b5' // 176 x 250 mm

// ========================================
// Row / Column
// ========================================

export interface ExcelRow {
  index: number // 0-based
  height: number // pt (default: ~15pt)
  hidden: boolean
  cells: ExcelCell[]
}

export interface ExcelColumn {
  index: number // 0-based
  width: number // Excel単位（文字数ベース）
  hidden: boolean
}

// ========================================
// Cell
// ========================================

export interface ExcelCell {
  row: number // 0-based
  col: number // 0-based
  value: CellValue
  formula?: string
  style: CellStyle
}

export type CellValue = string | number | boolean | Date | null

export interface MergedCell {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export interface CellRange {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

// ========================================
// Style
// ========================================

export interface CellStyle {
  font?: FontInfo
  fill?: FillInfo
  border?: BorderInfo
  alignment?: AlignmentInfo
  numberFormat?: string
}

export interface FontInfo {
  name: string
  size: number // pt
  bold?: boolean
  italic?: boolean
  underline?: boolean | 'single' | 'double'
  strike?: boolean
  color?: ColorInfo
}

export interface FillInfo {
  type: 'solid' | 'pattern' | 'gradient'
  color?: ColorInfo
  patternType?: string
  patternColor?: ColorInfo
}

export interface BorderInfo {
  top?: BorderStyle
  right?: BorderStyle
  bottom?: BorderStyle
  left?: BorderStyle
  diagonal?: BorderStyle
  diagonalUp?: boolean
  diagonalDown?: boolean
}

export interface BorderStyle {
  style: BorderStyleType
  color?: ColorInfo
}

export type BorderStyleType =
  | 'thin'
  | 'medium'
  | 'thick'
  | 'dotted'
  | 'dashed'
  | 'double'
  | 'hair'
  | 'mediumDashed'
  | 'dashDot'
  | 'mediumDashDot'
  | 'dashDotDot'
  | 'mediumDashDotDot'
  | 'slantDashDot'
  | 'none'

export interface AlignmentInfo {
  horizontal?: 'left' | 'center' | 'right' | 'fill' | 'justify' | 'distributed'
  vertical?: 'top' | 'middle' | 'bottom' | 'justify' | 'distributed'
  wrapText?: boolean
  shrinkToFit?: boolean
  indent?: number
  textRotation?: number // 0-180 or 255 (vertical)
}

export interface ColorInfo {
  argb?: string // AARRGGBB
  theme?: number
  tint?: number
  indexed?: number
}
