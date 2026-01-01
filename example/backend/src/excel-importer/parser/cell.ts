/**
 * Cell Parser
 *
 * ExcelJSのCellを中間表現に変換
 */

import type { ExcelCell, CellValue } from '../types/excel'
import { parseCellStyle } from './style'

// ExcelJSの型（プレースホルダー）
type ExcelJSCell = {
  value: unknown
  formula?: string
  result?: unknown
  style: unknown
  type: number
}

// ExcelJSのセルタイプ
const CellType = {
  Null: 0,
  Merge: 1,
  Number: 2,
  String: 3,
  Date: 4,
  Hyperlink: 5,
  Formula: 6,
  SharedString: 7,
  RichText: 8,
  Boolean: 9,
  Error: 10,
}

/**
 * ExcelJSセルを中間表現に変換
 *
 * @param cell ExcelJSのセル
 * @param row 行インデックス（0-based）
 * @param col 列インデックス（0-based）
 * @returns 中間表現のセル
 */
export function parseCell(cell: ExcelJSCell, row: number, col: number): ExcelCell {
  return {
    row,
    col,
    value: extractCellValue(cell),
    formula: cell.formula,
    style: parseCellStyle(cell.style),
  }
}

/**
 * セル値を抽出
 *
 * ExcelJSのセル値は様々な形式で格納されているため、
 * 統一した形式に変換する
 */
function extractCellValue(cell: ExcelJSCell): CellValue {
  const value = cell.value

  // null/undefined
  if (value === null || value === undefined) {
    return null
  }

  // 数式の場合は結果を使用
  if (cell.formula && cell.result !== undefined) {
    return normalizeValue(cell.result)
  }

  // リッチテキストの場合
  if (isRichText(value)) {
    return extractRichTextValue(value)
  }

  // ハイパーリンクの場合
  if (isHyperlink(value)) {
    return (value as { text?: string }).text ?? ''
  }

  // エラー値の場合
  if (isErrorValue(value)) {
    return `#${(value as { error: string }).error}`
  }

  return normalizeValue(value)
}

/**
 * 値を正規化
 */
function normalizeValue(value: unknown): CellValue {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (value instanceof Date) {
    return value
  }

  // その他は文字列化
  if (value && typeof value === 'object') {
    // 再帰的にチェック (Formulaのエラーオブジェクトや計算結果オブジェクトなど)
    if ('result' in value && (value as any).result !== undefined) {
      return normalizeValue((value as any).result)
    }
    if ('text' in value) {
      return (value as any).text
    }
    if ('richText' in value) {
      return extractRichTextValue(value)
    }

    // Formula object without result (likely just formula string)
    // Avoid JSON.stringify for formulas to prevent {"formula":...} in UI
    if ('formula' in value) {
      return ''
    }

    // JSONとして読めるなら読む (デバッグ用)
    try {
      const str = JSON.stringify(value)
      // If it looks like a formula object, suppress it
      if (str.includes('"formula":')) return ''
      return str
    } catch {
      // ignore
    }
  }

  return String(value)
}

/**
 * リッチテキストかどうかを判定
 */
function isRichText(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'richText' in value &&
    Array.isArray((value as { richText: unknown[] }).richText)
  )
}

/**
 * リッチテキストから文字列を抽出
 */
function extractRichTextValue(value: unknown): string {
  // If it's the standard ExcelJS structure
  if (
    typeof value === 'object' &&
    value !== null &&
    'richText' in value &&
    Array.isArray((value as any).richText)
  ) {
    const richText = (value as any).richText as Array<{ text: string }>
    return richText.map((part) => part.text).join('')
  }

  // Fallback for unknown object structures: try JSON or toString, but avoid [object Object] if possible
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * ハイパーリンクかどうかを判定
 */
function isHyperlink(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hyperlink' in value
  )
}

/**
 * エラー値かどうかを判定
 */
function isErrorValue(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value
  )
}

/**
 * セル値を表示用文字列に変換
 *
 * @param value セル値
 * @param numberFormat 数値フォーマット（オプション）
 * @returns 表示用文字列
 */
export function formatCellValue(value: CellValue, numberFormat?: string): string {
  if (value === null) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  }

  if (value instanceof Date) {
    // 基本的な日付フォーマット（将来的にnumberFormatを解析）
    return value.toLocaleDateString('ja-JP')
  }

  if (typeof value === 'number') {
    // 数値フォーマットの適用（将来的にnumberFormatを解析）
    if (numberFormat) {
      // TODO: 数値フォーマットの解析と適用
      return value.toString()
    }
    return value.toString()
  }

  return String(value)
}
