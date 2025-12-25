import type { TableNode, Cell } from '@/types/canvas'

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v)

const findCell = (cells: Cell[], r: number, c: number) => cells.find((cc) => cc.r === r && cc.c === c)

const cellRect = (c: { r: number; c: number; rs?: number; cs?: number }) => {
  const rs = c.rs || 1
  const cs = c.cs || 1
  return { r1: c.r, c1: c.c, r2: c.r + rs - 1, c2: c.c + cs - 1 }
}

const rectIntersects = (
  a: { r1: number; c1: number; r2: number; c2: number },
  b: { r1: number; c1: number; r2: number; c2: number }
) => {
  return !(a.r2 < b.r1 || a.r1 > b.r2 || a.c2 < b.c1 || a.c1 > b.c2)
}

export const insertRow = (table: TableNode, targetRow: number, where: 'above' | 'below'): TableNode => {
  const insertIndex = where === 'above' ? targetRow : targetRow + 1
  const newRows = [...table.table.rows]
  newRows.splice(insertIndex, 0, 50)

  const cells = table.table.cells
  const nextCells = cells.map((c) => {
    // Shift cells below
    if (c.r >= insertIndex) return { ...c, r: c.r + 1 }
    // Expand spans that cross insertion boundary
    const rs = c.rs || 1
    if (rs > 1 && c.r < insertIndex && insertIndex <= c.r + rs - 1) {
      return { ...c, rs: rs + 1 }
    }
    return c
  })

  // Generate new cells for the inserted row
  for (let c = 0; c < table.table.cols.length; c++) {
    // Find template cell from the row where interaction happened (or closest neighbor)
    const template =
      cells.find((cell) => cell.r === targetRow && cell.c === c) || findCell(cells, targetRow, 0)
    
    if (template) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { r: _r, c: _c, v: _v, rs: _rs, cs: _cs, ...styles } = template
      nextCells.push({
        r: insertIndex,
        c,
        v: '',
        ...styles,
        // Reset spans for new cells
        rs: 1,
        cs: 1,
      } as Cell)
    } else {
      // Fallback if sparse and no template found (create default)
      nextCells.push({
        r: insertIndex,
        c,
        v: '',
        rs: 1,
        cs: 1,
        borderW: 2,
        borderColor: '#000000',
      } as Cell)
    }
  }

  return {
    ...table,
    h: sum(newRows),
    table: {
      ...table.table,
      rows: newRows,
      cells: nextCells,
    },
  }
}

export const insertCol = (table: TableNode, targetCol: number, targetRow: number, where: 'left' | 'right'): TableNode => {
  const insertIndex = where === 'left' ? targetCol : targetCol + 1
  const newCols = [...table.table.cols]
  newCols.splice(insertIndex, 0, 100)

  const cells = table.table.cells
  const nextCells = cells.map((c) => {
    if (c.c >= insertIndex) return { ...c, c: c.c + 1 }
    const cs = c.cs || 1
    if (cs > 1 && c.c < insertIndex && insertIndex <= c.c + cs - 1) {
      return { ...c, cs: cs + 1 }
    }
    return c
  })

  // Generate new cells for the inserted column
  for (let r = 0; r < table.table.rows.length; r++) {
    // Find template cell from the column where interaction happened
    const template =
      cells.find((cell) => cell.r === r && cell.c === targetCol) || findCell(cells, targetRow, targetCol)
    
    if (template) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { r: _r, c: _c, v: _v, rs: _rs, cs: _cs, ...styles } = template
      nextCells.push({
        r,
        c: insertIndex,
        v: '',
        ...styles,
        rs: 1,
        cs: 1,
      } as Cell)
    } else {
      nextCells.push({
        r,
        c: insertIndex,
        v: '',
        rs: 1,
        cs: 1,
        borderW: 2,
        borderColor: '#000000',
      } as Cell)
    }
  }

  return {
    ...table,
    w: sum(newCols),
    table: {
      ...table.table,
      cols: newCols,
      cells: nextCells,
    },
  }
}

export const deleteRow = (table: TableNode, targetRow: number): TableNode => {
  const rowCount = table.table.rows.length
  if (rowCount <= 1) return table
  const deleteIndex = clamp(targetRow, 0, rowCount - 1)
  const newRows = table.table.rows.filter((_, i) => i !== deleteIndex)

  const cells = table.table.cells
  const nextCells: Cell[] = []
  for (const c of cells) {
    // If cell starts on deleted row
    if (c.r === deleteIndex) {
      const rs = c.rs || 1
      if (rs > 1) {
        // Promote the cell to the next row (which shifts up to deleteIndex) and shrink span
        nextCells.push({ ...c, rs: rs - 1 })
      }
      continue
    }

    // If cell is below deleted row, shift up
    if (c.r > deleteIndex) {
      nextCells.push({ ...c, r: c.r - 1 })
      continue
    }

    // If cell spans across deleted row, shrink span
    const rs = c.rs || 1
    if (rs > 1 && c.r < deleteIndex && deleteIndex <= c.r + rs - 1) {
      nextCells.push({ ...c, rs: rs - 1 })
      continue
    }

    nextCells.push(c)
  }

  return {
    ...table,
    h: sum(newRows),
    table: {
      ...table.table,
      rows: newRows,
      cells: nextCells,
    },
  }
}

export const deleteCol = (table: TableNode, targetCol: number): TableNode => {
  const colCount = table.table.cols.length
  if (colCount <= 1) return table
  const deleteIndex = clamp(targetCol, 0, colCount - 1)
  const newCols = table.table.cols.filter((_, i) => i !== deleteIndex)

  const cells = table.table.cells
  const nextCells: Cell[] = []
  for (const c of cells) {
    if (c.c === deleteIndex) {
      const cs = c.cs || 1
      if (cs > 1) {
        nextCells.push({ ...c, cs: cs - 1 })
      }
      continue
    }

    if (c.c > deleteIndex) {
      nextCells.push({ ...c, c: c.c - 1 })
      continue
    }

    const cs = c.cs || 1
    if (cs > 1 && c.c < deleteIndex && deleteIndex <= c.c + cs - 1) {
      nextCells.push({ ...c, cs: cs - 1 })
      continue
    }

    nextCells.push(c)
  }

  return {
    ...table,
    w: sum(newCols),
    table: {
      ...table.table,
      cols: newCols,
      cells: nextCells,
    },
  }
}

export const mergeCells = (table: TableNode, targetRow: number, targetCol: number, direction: 'right' | 'down'): TableNode => {
  const cells = [...table.table.cells]
  
  // Helper to ensure base exists (if sparse) - though in this pure function we might just create a temp one
  // The original code pushed to cells if missing. Let's replicate that logic carefully.
  // Actually, if we just modify the logic to use a potential base, we can avoid mutating input `cells` array unexpectedly before filtering.
  // But wait, `cells` is a copy `[...table.table.cells]`.
  
  const findOrBase = (r: number, c: number) => {
      const found = findCell(cells, r, c)
      if (found) return found
      // If not found, imply a default cell exists there? 
      // In the original code, it did `ensureBaseExists` which pushed to `cells`.
      return { r, c, v: '' } as Cell
  }

  const current = findOrBase(targetRow, targetCol)
  // If the cell wasn't in the list, we should effectively "add" it to our consideration, 
  // but if we are about to merge it, we need it in the final list.
  // The original code `ensureBaseExists` pushed it to `cells` so that subsequent logic would see it.
  const workingCells = [...cells]
  if (!findCell(workingCells, targetRow, targetCol)) {
      workingCells.push({ ...current })
  }

  const rs = current.rs || 1
  const cs = current.cs || 1
  
  if (direction === 'right') {
    const colCount = table.table.cols.length
    const targetColIdx = targetCol + cs
    if (targetColIdx >= colCount) return table

    const baseRect = cellRect({ r: targetRow, c: targetCol, rs, cs: cs + 1 })
    
    const neighbor = findCell(workingCells, targetRow, targetColIdx)
    if (!neighbor) return table
    const neighborRs = neighbor.rs || 1
    const neighborCs = neighbor.cs || 1
    if (neighborRs !== rs || neighborCs !== 1) return table

    for (const other of workingCells) {
      if (other.r === targetRow && other.c === targetCol) continue
      if (other.r === targetRow && other.c === targetColIdx) continue
      const oRect = cellRect(other)
      if (rectIntersects(oRect, baseRect)) {
        return table
      }
    }

    const nextCells = workingCells.filter((c) => {
      if (c.r === targetRow && c.c === targetCol) return true
      if (c.r === targetRow && c.c === targetColIdx) return false
      // Any cell starting inside the added strip is removed
      return !(c.c === targetColIdx && c.r >= targetRow && c.r < targetRow + rs)
    })

    const idx = nextCells.findIndex((c) => c.r === targetRow && c.c === targetCol)
    if (idx >= 0) nextCells[idx] = { ...nextCells[idx], cs: cs + 1 }

    return {
      ...table,
      table: {
        ...table.table,
        cells: nextCells,
      },
    }
  } else {
    // Merge Down
    const rowCount = table.table.rows.length
    const targetRowIdx = targetRow + rs
    if (targetRowIdx >= rowCount) return table

    const baseRect = cellRect({ r: targetRow, c: targetCol, rs: rs + 1, cs })

    const neighbor = findCell(workingCells, targetRowIdx, targetCol)
    if (!neighbor) return table
    const neighborRs = neighbor.rs || 1
    const neighborCs = neighbor.cs || 1
    if (neighborCs !== cs || neighborRs !== 1) return table

    for (const other of workingCells) {
      if (other.r === targetRow && other.c === targetCol) continue
      if (other.r === targetRowIdx && other.c === targetCol) continue
      const oRect = cellRect(other)
      if (rectIntersects(oRect, baseRect)) {
        return table
      }
    }

    const nextCells = workingCells.filter((c) => {
      if (c.r === targetRow && c.c === targetCol) return true
      if (c.r === targetRowIdx && c.c === targetCol) return false
      return !(c.r === targetRowIdx && c.c >= targetCol && c.c < targetCol + cs)
    })

    const idx = nextCells.findIndex((c) => c.r === targetRow && c.c === targetCol)
    if (idx >= 0) nextCells[idx] = { ...nextCells[idx], rs: rs + 1 }

    return {
      ...table,
      table: {
        ...table.table,
        cells: nextCells,
      },
    }
  }
}

export const unmergeCells = (table: TableNode, targetRow: number, targetCol: number): TableNode => {
  const cells = table.table.cells
  const current = findCell(cells, targetRow, targetCol)
  if (!current) return table
  const rs = current.rs || 1
  const cs = current.cs || 1
  if (rs <= 1 && cs <= 1) return table

  const nextCells = cells.filter((c) => !(c.r === targetRow && c.c === targetCol))

  // Recreate base cell without spans
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rs: _rs, cs: _cs, ...rest } = current
  const base = { ...rest, r: targetRow, c: targetCol, v: current.v } as Cell
  nextCells.push(base)

  const materializeCellAt = (
    targetCells: Cell[],
    r: number,
    c: number,
    inheritFrom?: Partial<Cell>
  ) => {
    if (targetCells.find((cc) => cc.r === r && cc.c === c)) return
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rs: _rs, cs: _cs, v: _v, ...style } = (inheritFrom || base) as Cell
    targetCells.push({ ...style, r, c, v: '' } as Cell)
  }

  const rowCount = table.table.rows.length
  const colCount = table.table.cols.length

  // Materialize all newly uncovered cells inheriting style
  for (let rr = 0; rr < rs; rr++) {
    for (let cc = 0; cc < cs; cc++) {
      if (rr === 0 && cc === 0) continue
      const r = targetRow + rr
      const c = targetCol + cc
      if (r < 0 || r >= rowCount || c < 0 || c >= colCount) continue
      materializeCellAt(nextCells, r, c, current)
    }
  }

  return {
    ...table,
    table: {
      ...table.table,
      cells: nextCells,
    },
  }
}
