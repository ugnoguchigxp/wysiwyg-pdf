import ExcelJS from 'exceljs'
import type { Cell as ExcelCell, Column, Row, Worksheet } from 'exceljs'
import type { Doc, Surface, TableNode, Cell } from '../../types/canvas'
import type { ExcelImportOptions } from './types'

const PAPER_SIZES: Record<string, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  a3: { w: 297, h: 420 },
  b4: { w: 250, h: 353 },
  b5: { w: 176, h: 250 },
  letter: { w: 215.9, h: 279.4 },
  legal: { w: 215.9, h: 355.6 },
}

export async function excelToDoc(buffer: ArrayBuffer, options: ExcelImportOptions = {}): Promise<Doc> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const pageSize = options.pageSize ?? 'a4'
  const landscape = options.orientation === 'landscape'
  const paper = PAPER_SIZES[pageSize] ?? PAPER_SIZES.a4
  const { w, h } = landscape ? { w: paper.h, h: paper.w } : paper

  const surfaces: Surface[] = []
  const nodes: TableNode[] = []

  const targetSheets: Worksheet[] =
    options.sheetIndex !== undefined
      ? [workbook.worksheets[options.sheetIndex]].filter((s): s is Worksheet => Boolean(s))
      : workbook.worksheets

  targetSheets.forEach((sheet: Worksheet, idx: number) => {
    const surfaceId = `surface_${idx}`
    surfaces.push({ id: surfaceId, type: 'page', w, h })

    const rows: number[] = []
    const cols: number[] = []
    const cells: Cell[] = []

    // 列幅収集
    sheet.columns.forEach((col: Partial<Column>) => {
      const widthPx = ((col.width ?? 8.43) as number) * 7
      cols.push(widthPx * 0.264583) // px → mm
    })

    // 行高・セル収集
    sheet.eachRow({ includeEmpty: true }, (row: Row, rowNum: number) => {
      const heightPt = (row.height ?? 15) as number
      rows.push(heightPt * 0.352778) // pt → mm

      row.eachCell({ includeEmpty: true }, (cell: ExcelCell, colNum: number) => {
        cells.push({
          r: rowNum - 1,
          c: colNum - 1,
          v: String((cell.text ?? cell.value ?? '') as string),
          bg: extractBgColor(cell),
          align: mapAlign(cell.alignment?.horizontal),
          vAlign: mapVAlign(cell.alignment?.vertical),
        })
      })
    })

    const tableW = cols.reduce((a, b) => a + b, 0)
    const tableH = rows.reduce((a, b) => a + b, 0)

    nodes.push({
      id: `table_${idx}`,
      s: surfaceId,
      t: 'table',
      x: 10,
      y: 10,
      w: tableW,
      h: tableH,
      table: { rows, cols, cells },
    })
  })

  return {
    v: 1,
    id: `excel_${Date.now()}`,
    title: 'Imported Excel',
    unit: 'mm',
    surfaces,
    nodes,
  }
}

function extractBgColor(cell: ExcelCell): string | undefined {
  const fill = cell.fill
  if (fill && fill.type === 'pattern' && 'fgColor' in fill && fill.fgColor && 'argb' in fill.fgColor && fill.fgColor.argb) {
    return '#' + String(fill.fgColor.argb).slice(2)
  }
  return undefined
}

function mapAlign(h?: string): 'l' | 'c' | 'r' | undefined {
  if (h === 'left') return 'l'
  if (h === 'center') return 'c'
  if (h === 'right') return 'r'
  return undefined
}

function mapVAlign(v?: string): 't' | 'm' | 'b' | undefined {
  if (v === 'top') return 't'
  if (v === 'middle') return 'm'
  if (v === 'bottom') return 'b'
  return undefined
}
