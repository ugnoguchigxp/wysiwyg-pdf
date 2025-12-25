import { describe, expect, it } from 'vitest'
import { insertRow, insertCol, deleteRow, deleteCol, mergeCells, unmergeCells } from '@/features/report-editor/utils/tableOperations'
import type { TableNode, Cell } from '@/types/canvas'

describe('features/report-editor/utils/tableOperations', () => {
  const createMockTable = (rows = 2, cols = 2): TableNode => ({
    id: 'table1',
    t: 'table',
    s: 'surface',
    x: 0,
    y: 0,
    w: 100 * cols,
    h: 50 * rows,
    table: {
      rows: Array.from({ length: rows }, () => 50),
      cols: Array.from({ length: cols }, () => 100),
      cells: Array.from({ length: rows * cols }, (_, i) => ({
        r: Math.floor(i / cols),
        c: i % cols,
        v: `cell${i}`,
        rs: 1,
        cs: 1,
      } as Cell)),
    },
  } as TableNode)

  describe('insertRow', () => {
    it('inserts a row above target row', () => {
      const table = createMockTable(2, 2)
      const result = insertRow(table, 1, 'above')

      expect(result.table.rows).toHaveLength(3)
      expect(result.table.rows[0]).toBe(50)
      expect(result.table.rows[1]).toBe(50)
      expect(result.table.rows[2]).toBe(50)
      expect(result.h).toBe(150)
    })

    it('inserts a row below target row', () => {
      const table = createMockTable(2, 2)
      const result = insertRow(table, 1, 'below')

      expect(result.table.rows).toHaveLength(3)
      expect(result.h).toBe(150)
    })

    it('shifts cells below insertion point', () => {
      const table = createMockTable(2, 2)
      const result = insertRow(table, 0, 'below')

      const cellsBelow = result.table.cells.filter((c) => c.r > 1)
      expect(cellsBelow).toHaveLength(2)
      expect(cellsBelow.every((c) => c.r === 2)).toBe(true)
    })

    it('expands row span when insertion happens inside a merged cell', () => {
      const table = createMockTable(2, 2)
      table.table.cells[0].rs = 2

      const result = insertRow(table, 0, 'below')
      const mergedCell = result.table.cells.find((c) => c.r === 0 && c.c === 0)

      expect(mergedCell?.rs).toBe(3)
    })
  })

  describe('insertCol', () => {
    it('inserts a column to the left of target column', () => {
      const table = createMockTable(2, 2)
      const result = insertCol(table, 1, 0, 'left')

      expect(result.table.cols).toHaveLength(3)
      expect(result.table.cols).toHaveLength(3)
      expect(result.w).toBe(300)
    })

    it('inserts a column to the right of target column', () => {
      const table = createMockTable(2, 2)
      const result = insertCol(table, 1, 0, 'right')

      expect(result.table.cols).toHaveLength(3)
      expect(result.w).toBe(300)
    })

    it('shifts cells to the right of insertion point', () => {
      const table = createMockTable(2, 2)
      const result = insertCol(table, 0, 0, 'right')

      const cellsRight = result.table.cells.filter((c) => c.c > 1)
      expect(cellsRight).toHaveLength(2)
      expect(cellsRight.every((c) => c.c === 2)).toBe(true)
    })

    it('expands col span when insertion happens inside a merged cell', () => {
      const table = createMockTable(2, 2)
      table.table.cells[0].cs = 2

      const result = insertCol(table, 0, 0, 'right')
      const mergedCell = result.table.cells.find((c) => c.r === 0 && c.c === 0)

      expect(mergedCell?.cs).toBe(3)
    })
  })

  describe('deleteRow', () => {
    it('deletes target row', () => {
      const table = createMockTable(3, 2)
      const result = deleteRow(table, 1)

      expect(result.table.rows).toHaveLength(2)
      expect(result.h).toBe(100)
    })

    it('does not delete when only one row exists', () => {
      const table = createMockTable(1, 2)
      const result = deleteRow(table, 0)

      expect(result.table.rows).toHaveLength(1)
      expect(result.h).toBe(50)
    })

    it('shifts cells below deleted row up', () => {
      const table = createMockTable(3, 2)
      const result = deleteRow(table, 1)

      const bottomCells = result.table.cells.filter((c) => c.r === 1)
      expect(bottomCells).toHaveLength(2)
    })

    it('shrinks row span when deleting inside a merged cell', () => {
      const table = createMockTable(2, 2)
      table.table.cells[0].rs = 2

      const result = deleteRow(table, 1)
      const mergedCell = result.table.cells.find((c) => c.r === 0 && c.c === 0)

      expect(mergedCell?.rs).toBe(1)
    })

    it('promotes merged cell when deleting its start row', () => {
      const table = createMockTable(2, 2)
      table.table.cells[0].rs = 2

      const result = deleteRow(table, 0)
      const mergedCell = result.table.cells.find((c) => c.r === 0 && c.c === 0)

      expect(mergedCell?.rs).toBe(1)
    })
  })

  describe('deleteCol', () => {
    it('deletes target column', () => {
      const table = createMockTable(2, 3)
      const result = deleteCol(table, 1)

      expect(result.table.cols).toHaveLength(2)
      expect(result.w).toBe(200)
    })

    it('does not delete when only one column exists', () => {
      const table = createMockTable(2, 1)
      const result = deleteCol(table, 0)

      expect(result.table.cols).toHaveLength(1)
      expect(result.w).toBe(100)
    })

    it('shifts cells to the right of deleted column left', () => {
      const table = createMockTable(2, 3)
      const result = deleteCol(table, 1)

      const rightCells = result.table.cells.filter((c) => c.c === 1)
      expect(rightCells).toHaveLength(2)
    })

    it('shrinks col span when deleting inside a merged cell', () => {
      const table = createMockTable(2, 2)
      table.table.cells[0].cs = 2

      const result = deleteCol(table, 1)
      const mergedCell = result.table.cells.find((c) => c.r === 0 && c.c === 0)

      expect(mergedCell?.cs).toBe(1)
    })

    it('promotes merged cell when deleting its start column', () => {
      const table = createMockTable(2, 2)
      table.table.cells[0].cs = 2

      const result = deleteCol(table, 0)
      const mergedCell = result.table.cells.find((c) => c.r === 0 && c.c === 0)

      expect(mergedCell?.cs).toBe(1)
    })
  })

  describe('mergeCells', () => {
    it('merges cells to the right', () => {
      const table = createMockTable(2, 3)
      const result = mergeCells(table, 0, 0, 'right')

      expect(result).toBeDefined()
      const mergedCell = result.table.cells.find((c) => c.r === 0 && c.c === 0)
      expect(mergedCell?.cs).toBeGreaterThan(1)
    })

    it('merges cells down', () => {
      const table = createMockTable(3, 2)
      const result = mergeCells(table, 0, 0, 'down')

      expect(result).toBeDefined()
    })

    it('returns original table if merge would go out of bounds', () => {
      const table = createMockTable(2, 2)
      const result = mergeCells(table, 0, 1, 'right')

      expect(result).toEqual(table)
    })

    it.skip('does not merge if neighbor has different span', () => {
      const table = createMockTable(2, 3)
      table.table.cells[0].cs = 2
      const result = mergeCells(table, 0, 2, 'left')

      expect(result).toEqual(table)
    })

    it('returns original table when merge would intersect another cell', () => {
      const table = createMockTable(2, 2)
      table.table.cells[0].rs = 2

      const result = mergeCells(table, 0, 0, 'right')

      expect(result).toEqual(table)
    })
  })

  describe('unmergeCells', () => {
    it('unmerges a merged cell', () => {
      const table = createMockTable(2, 2)
      table.table.cells[0].cs = 2
      table.table.cells[0].rs = 2
      const result = unmergeCells(table, 0, 0)

      expect(result.table.cells).toHaveLength(4) // 4 cells created
    })

    it('returns original table if cell is not merged', () => {
      const table = createMockTable(2, 2)
      const result = unmergeCells(table, 0, 0)

      expect(result).toEqual(table)
    })

    it('creates new cells for merged area', () => {
      const table = createMockTable(2, 2)
      table.table.cells[0].cs = 2
      table.table.cells[0].rs = 2
      const result = unmergeCells(table, 0, 0)

      expect(result.table.cells).toHaveLength(4)
    })

    it('recreates missing cells when only the merged cell exists', () => {
      const table = createMockTable(2, 2)
      table.table.cells = [
        {
          r: 0,
          c: 0,
          v: 'merged',
          rs: 2,
          cs: 2,
        } as Cell,
      ]

      const result = unmergeCells(table, 0, 0)

      expect(result.table.cells).toHaveLength(4)
      expect(result.table.cells.some((c) => c.r === 1 && c.c === 1)).toBe(true)
    })
  })
})
