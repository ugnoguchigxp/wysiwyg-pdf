import { parseSheet } from './sheet'

type MockCell = {
  col: number
  value: unknown
  formula?: string
  style?: unknown
}

function createMockRow(
  number: number,
  cells: MockCell[],
  options?: { eachCellMode?: 'all' | 'valueOnly' }
) {
  const sortedCells = [...cells].sort((a, b) => a.col - b.col)
  const eachCellMode = options?.eachCellMode ?? 'all'
  const cellMap = new Map(sortedCells.map((cell) => [cell.col, cell]))
  return {
    number,
    height: 15,
    hidden: false,
    actualColumnCount: sortedCells.length ? sortedCells[sortedCells.length - 1].col : 0,
    getCell: (colNumber: number) => {
      const cell = cellMap.get(colNumber)
      return {
        row: number,
        col: colNumber,
        value: cell?.value ?? null,
        formula: cell?.formula,
        style: cell?.style ?? {},
        type: 0,
      }
    },
    eachCell: (
      _options: { includeEmpty: boolean },
      callback: (
        cell: {
          row: number
          col: number
          value: unknown
          formula?: string
          style: unknown
          type: number
        },
        colNumber: number
      ) => void
    ) => {
      const targets =
        eachCellMode === 'valueOnly'
          ? sortedCells.filter(
              (cell) => cell.value !== null && cell.value !== undefined && cell.value !== ''
            )
          : sortedCells

      targets.forEach((cell) => {
        callback(
          {
            row: number,
            col: cell.col,
            value: cell.value,
            formula: cell.formula,
            style: cell.style ?? {},
            type: 0,
          },
          cell.col
        )
      })
    },
  }
}

function createMockWorksheet(
  rows: ReturnType<typeof createMockRow>[],
  overrides: Partial<any> = {}
) {
  const columnCount = overrides.columnCount ?? 100
  const columns =
    overrides.columns ??
    Array.from({ length: columnCount }, () => ({
      width: 8.43,
      hidden: false,
    }))

  return {
    name: 'Sheet1',
    id: 1,
    pageSetup: {
      margins: {},
      ...overrides.pageSetup,
    },
    rowCount: rows.length,
    columnCount,
    getRow: (_index: number) => createMockRow(1, []),
    getColumn: (index: number) => ({ number: index, width: 8.43, hidden: false }),
    eachRow: (
      _options: { includeEmpty: boolean },
      callback: (row: ReturnType<typeof createMockRow>, rowNumber: number) => void
    ) => {
      rows.forEach((row) => {
        callback(row, row.number)
      })
    },
    columns,
    model: {
      merges: [],
    },
  }
}

describe('parseSheet', () => {
  test('trims border-only trailing columns from parser output', () => {
    const row = createMockRow(1, [
      { col: 1, value: 'A1', style: {} },
      {
        col: 2,
        value: null,
        style: {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } },
        },
      },
      {
        col: 100,
        value: null,
        style: {
          border: { top: { style: 'thin' } },
        },
      },
    ])

    const worksheet = createMockWorksheet([row], { columnCount: 100 })
    const parsed = parseSheet(worksheet as any, 0)

    expect(parsed.columns).toHaveLength(2)
    expect(parsed.rows[0]?.cells).toHaveLength(2)
    expect(parsed.rows[0]?.cells.some((cell) => cell.col >= 2)).toBe(false)
  })

  test('keeps explicit printArea width even when cells are empty/border-only', () => {
    const row = createMockRow(1, [
      {
        col: 50,
        value: null,
        style: {
          border: { top: { style: 'thin' } },
        },
      },
    ])

    const worksheet = createMockWorksheet([row], {
      columnCount: 100,
      pageSetup: {
        printArea: 'A1:E10',
      },
    })

    const parsed = parseSheet(worksheet as any, 0)

    expect(parsed.columns).toHaveLength(5)
    expect(parsed.rows[0]?.cells).toHaveLength(0)
    expect(parsed.printArea).toEqual({
      startRow: 0,
      startCol: 0,
      endRow: 9,
      endCol: 4,
    })
  })

  test('keeps style-only fill cells even when eachCell omits empty cells', () => {
    const row = createMockRow(
      1,
      [
        { col: 1, value: 'A1', style: {} },
        {
          col: 2,
          value: null,
          style: {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFBFBF' } },
          },
        },
      ],
      { eachCellMode: 'valueOnly' }
    )

    const worksheet = createMockWorksheet([row], { columnCount: 2 })
    const parsed = parseSheet(worksheet as any, 0)

    expect(parsed.columns).toHaveLength(2)
    expect(parsed.rows[0]?.cells).toHaveLength(2)
    expect(parsed.rows[0]?.cells.some((cell) => cell.col === 1)).toBe(true)
  })
})
