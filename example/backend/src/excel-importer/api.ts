/**
 * Public API
 */

import { parseExcelBuffer, parseExcelFile } from './parser'
import { convertWorkbook } from './converter'
import type { ImportOptions } from './types/options'
import type { OutputDoc } from './types/output'

/**
 * ArrayBuffer からExcelを読み込み Doc に変換
 */
export async function importExcel(buffer: ArrayBuffer, options: ImportOptions = {}): Promise<OutputDoc> {
  const workbook = await parseExcelBuffer(buffer)
  return convertWorkbook(workbook, options)
}

/**
 * ファイルパスからExcelを読み込み Doc に変換
 */
export async function importExcelFromFile(filePath: string, options: ImportOptions = {}): Promise<OutputDoc> {
  const workbook = await parseExcelFile(filePath)
  return convertWorkbook(workbook, options)
}

export type { ImportOptions, OutputDoc } from './types'
