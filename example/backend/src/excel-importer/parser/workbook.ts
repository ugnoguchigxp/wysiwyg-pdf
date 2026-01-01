/**
 * Workbook Parser
 *
 * ExcelJSのWorkbookを中間表現に変換
 */

import type { ExcelWorkbook, FontInfo } from '../types/excel'
import { parseSheet } from './sheet'

// ExcelJSの型を直接依存させない簡易版定義（exceljs未インストールでも型エラーを避ける）
type ExcelJSWorkbook = {
  worksheets: ExcelJSWorksheet[]
  creator?: string
  created?: Date
  modified?: Date
  title?: string
}

/**
 * exceljs の動的読み込み
 */
async function loadExcelJS() {
  try {
    const mod = await import('exceljs')
    return mod
  } catch (err) {
    throw new Error(
      'exceljs が見つかりません。example/backend 配下で `bun add exceljs` または `npm install exceljs` を実行してください。'
    )
  }
}

type ExcelJSWorksheet = {
  name: string
  id: number
  pageSetup: unknown
  rowCount: number
  columnCount: number
  getRow: (index: number) => unknown
  getColumn: (index: number) => unknown
  eachRow: (options: { includeEmpty: boolean }, callback: (row: unknown, rowNumber: number) => void) => void
  model: {
    merges?: string[]
  }
}

/**
 * デフォルトフォント情報
 */
const DEFAULT_FONT: FontInfo = {
  name: 'Calibri',
  size: 11,
}

/**
 * ArrayBufferからExcelワークブックをパース
 *
 * @param buffer Excelファイルのバッファ
 * @returns 中間表現のワークブック
 */
export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ExcelWorkbook> {
  const ExcelJS = await loadExcelJS()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  return parseWorkbook(workbook as unknown as ExcelJSWorkbook)
}

/**
 * ファイルパスからExcelワークブックをパース
 *
 * @param filePath Excelファイルのパス
 * @returns 中間表現のワークブック
 */
export async function parseExcelFile(filePath: string): Promise<ExcelWorkbook> {
  const ExcelJS = await loadExcelJS()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  return parseWorkbook(workbook as unknown as ExcelJSWorkbook)
}

/**
 * ExcelJSワークブックを中間表現に変換
 *
 * @param workbook ExcelJSのワークブック
 * @returns 中間表現のワークブック
 */
export function parseWorkbook(workbook: ExcelJSWorkbook): ExcelWorkbook {
  const sheets = workbook.worksheets.map((ws: ExcelJSWorksheet, index: number) => parseSheet(ws, index))

  return {
    sheets,
    defaultFont: DEFAULT_FONT,
    metadata: {
      title: workbook.title,
      author: workbook.creator,
      created: workbook.created,
      modified: workbook.modified,
    },
  }
}
