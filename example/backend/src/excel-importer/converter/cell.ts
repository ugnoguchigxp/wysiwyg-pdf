/**
 * セル変換
 *
 * ExcelCell → OutputCell
 */

import type { ExcelCell } from '../types/excel'
import type { ImportOptions } from '../types/options'
import type { OutputCell } from '../types/output'
import { convertCellStyle } from './style'

/**
 * セルをOutputCellに変換
 */
export function convertCell(cell: ExcelCell, options: ImportOptions): OutputCell {
  const v = formatValue(cell, options)
  const style = convertCellStyle(cell.style, options)

  const result: OutputCell = {
    r: cell.row,
    c: cell.col,
    v,
    ...style,
  }

  // MANUAL OVERRIDES (User Feedback Hacks) - REMOVED to restore WYSIWYG behavior
  // if (typeof v === 'string') {
  //   if (v.includes('Thank you')) { // Looser match
  //     console.log('[DEBUG] Applying Footer Override for:', v)
  //     result.align = 'c'
  //   }
  //   // "Logo design" -> Adjust vertical alignment to bottom if user feels it floats too much
  //   if (v.includes('Logo design')) {
  //     console.log('[DEBUG] Applying Logo Override for:', v)
  //     result.vAlign = 'b'
  //   }
  // }

  return result
}

function formatValue(cell: ExcelCell, options: ImportOptions): string {
  const { value } = cell

  if (value === null) return ''

  // preserveFormulas が真なら式文字列を優先
  if (options.preserveFormulas && cell.formula) {
    return `=${cell.formula}`
  }

  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') {
    const numFmt = cell.style?.numberFormat
    if (numFmt && (numFmt.includes('$') || numFmt.includes('¥'))) {
      // Simple currency formatting with 2 decimals
      // TODO: Parse numFmt more strictly if needed
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    }
    return value.toString()
  }
  if (value instanceof Date) {
    if (options.dateFormat) {
      // 簡易フォーマット: Intlを利用
      try {
        return new Intl.DateTimeFormat('ja-JP', parseDateFormat(options.dateFormat)).format(value)
      } catch {
        // フォールバック
      }
    }
    return value.toISOString()
  }

  return String(value)
}

/**
 * 簡易的に dateFormat (例: 'yyyy/MM/dd') を Intl のオプションに近似する
 * 厳密なExcel互換ではなく簡易実装
 */
function parseDateFormat(fmt: string): Intl.DateTimeFormatOptions {
  const options: Intl.DateTimeFormatOptions = {}
  if (fmt.includes('yyyy')) options.year = 'numeric'
  if (fmt.includes('MM')) options.month = '2-digit'
  if (fmt.includes('dd')) options.day = '2-digit'
  if (fmt.includes('HH')) options.hour = '2-digit'
  if (fmt.includes('mm')) options.minute = '2-digit'
  if (fmt.includes('ss')) options.second = '2-digit'
  return options
}
