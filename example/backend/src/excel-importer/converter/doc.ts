/**
 * Document Converter
 *
 * ExcelWorkbook → OutputDoc 変換
 */

import type { ExcelWorkbook } from '../types/excel'
import type { ImportOptions } from '../types/options'
import type { OutputDoc } from '../types/output'
import { convertSheet } from './surface'

/**
 * ワークブックをDoc形式に変換
 *
 * @param workbook 中間表現のワークブック
 * @param options インポートオプション
 * @returns OutputDoc
 */
export function convertWorkbook(workbook: ExcelWorkbook, options: ImportOptions = {}): OutputDoc {
  const docId = options.documentId ?? generateId()
  const title = options.documentTitle ?? workbook.metadata?.title ?? 'Untitled'

  // 対象シートを決定
  const targetSheets = selectTargetSheets(workbook, options)

  // 各シートをSurface + Nodesに変換
  const conversionResults = targetSheets.map((sheet, index) =>
    convertSheet(sheet, index, options, workbook.defaultFont)
  )

  // 結果を統合
  const surfaces = conversionResults.flatMap((r) => r.surfaces)
  const nodes = conversionResults.flatMap((r) => r.nodes)

  return {
    v: 1,
    id: docId,
    title,
    unit: 'mm',
    surfaces,
    nodes,
  }
}

/**
 * 対象シートを選択
 */
function selectTargetSheets(workbook: ExcelWorkbook, options: ImportOptions) {
  // シート名で指定
  if (options.sheetName) {
    const sheet = workbook.sheets.find((s) => s.name === options.sheetName)
    if (sheet) return [sheet]
    throw new Error(`Sheet not found: ${options.sheetName}`)
  }

  // インデックスで指定
  if (options.sheetIndex !== undefined) {
    const sheet = workbook.sheets[options.sheetIndex]
    if (sheet) return [sheet]
    throw new Error(`Sheet index out of range: ${options.sheetIndex}`)
  }

  // 全シート
  return workbook.sheets
}

/**
 * ID生成（簡易版）
 */
function generateId(): string {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}
