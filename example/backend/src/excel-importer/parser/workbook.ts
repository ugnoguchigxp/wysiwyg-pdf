/**
 * Workbook Parser
 *
 * ExcelJSのWorkbookを中間表現に変換
 */

import type { ExcelImage, ExcelWorkbook, FontInfo } from '../types/excel'
import { extractChartImagesFromBuffer } from './ooxml-drawing'
import { parseSheet } from './sheet'

type ExcelJSWorkbookRuntime = {
  xlsx: {
    load: (buffer: ArrayBuffer) => Promise<void>
    readFile: (filePath: string) => Promise<void>
  }
  worksheets: ExcelJSWorksheet[]
  creator?: string
  created?: Date
  modified?: Date
  title?: string
}

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
    const Workbook =
      (mod as unknown as { Workbook?: new () => ExcelJSWorkbookRuntime }).Workbook ??
      (mod as unknown as { default?: { Workbook?: new () => ExcelJSWorkbookRuntime } }).default
        ?.Workbook
    if (!Workbook) {
      throw new Error('exceljs module does not expose Workbook constructor')
    }
    return { Workbook }
  } catch (_e) {
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
  eachRow: (
    options: { includeEmpty: boolean },
    callback: (row: unknown, rowNumber: number) => void
  ) => void
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
  const chartImagesBySheetId = await extractChartImagesFromBuffer(buffer).catch(() => new Map())
  return parseWorkbook(workbook as unknown as ExcelJSWorkbook, chartImagesBySheetId)
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
  const { readFile } = await import('node:fs/promises')
  const fileBuffer = await readFile(filePath)
  const chartImagesBySheetId = await extractChartImagesFromBuffer(
    fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
  ).catch(() => new Map())
  return parseWorkbook(workbook as unknown as ExcelJSWorkbook, chartImagesBySheetId)
}

/**
 * ExcelJSワークブックを中間表現に変換
 *
 * @param workbook ExcelJSのワークブック
 * @returns 中間表現のワークブック
 */
export function parseWorkbook(
  workbook: ExcelJSWorkbook,
  chartImagesBySheetId?: Map<number, ExcelImage[]>
): ExcelWorkbook {
  const sheets = workbook.worksheets.map((ws: ExcelJSWorksheet, index: number) => {
    const parsedSheet = parseSheet(ws as any, index)
    const chartImages = chartImagesBySheetId?.get(ws.id) ?? []
    if (chartImages.length > 0) {
      parsedSheet.images = [...parsedSheet.images, ...chartImages]
    }
    return parsedSheet
  })

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
