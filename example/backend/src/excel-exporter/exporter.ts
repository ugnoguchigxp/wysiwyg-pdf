import * as fs from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import ExcelJS from 'exceljs'
import { db } from '../db'
import { FIELD_MAP, TABLE_MAP } from './mappings'

/**
 * Excel テンプレートにデータをバインドして出力する
 */
export async function exportExcelWithData(
  templatePath: string,
  dataSelection: { table: string; id: string }
) {
  const buffer = await fs.readFile(templatePath)
  const workbook = new ExcelJS.Workbook()
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  await workbook.xlsx.load(arrayBuffer)

  const sheet = workbook.worksheets[0]

  const tableSchema = TABLE_MAP[dataSelection.table]
  if (!tableSchema) throw new Error(`Unknown table: ${dataSelection.table}`)

  const rows = await db
    .select()
    .from(tableSchema)
    .where(eq(tableSchema.id, dataSelection.id))
    .limit(1)
  const data = rows[0] as Record<string, any>
  if (!data) throw new Error(`Data not found for ID: ${dataSelection.id}`)

  // Token replacement strategy: {Table}.[Field]
  const tokenRegex = /\{([^}]+)\}\.\[([^\]]+)\]/g

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      const cellValue = cell.value
      if (!cellValue) return

      if (typeof cellValue === 'string') {
        let text = cellValue
        let hasMatch = false
        text = text.replace(tokenRegex, (match, tableName, fieldName) => {
          if (tableName === dataSelection.table) {
            const physicalField = FIELD_MAP[tableName]?.[fieldName]
            if (physicalField && data[physicalField] !== undefined) {
              hasMatch = true
              return (data[physicalField] || '').toString()
            }
          }
          return match
        })
        if (hasMatch) cell.value = text
      } else if (typeof cellValue === 'object' && 'richText' in cellValue) {
        // Handle RichText while preserving formatting
        let hasMatch = false
        const newRichText = cellValue.richText.map((rt) => {
          const text = rt.text
          const replacedText = text.replace(tokenRegex, (match, tableName, fieldName) => {
            if (tableName === dataSelection.table) {
              const physicalField = FIELD_MAP[tableName]?.[fieldName]
              if (physicalField && data[physicalField] !== undefined) {
                hasMatch = true
                return (data[physicalField] || '').toString()
              }
            }
            return match
          })
          return { ...rt, text: replacedText }
        })

        if (hasMatch) {
          cell.value = { richText: newRichText }
        }
      }
    })
  })

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer
}
