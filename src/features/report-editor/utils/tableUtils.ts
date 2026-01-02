import type { TableNode } from '@/types/canvas'

export const getRowY = (rows: number[], rowIndex: number) => {
  let y = 0
  for (let i = 0; i < rowIndex; i++) {
    if (rows[i] !== undefined) y += rows[i]
  }
  return y
}

export const getColX = (cols: number[], colIndex: number) => {
  let x = 0
  for (let i = 0; i < colIndex; i++) {
    if (cols[i] !== undefined) x += cols[i]
  }
  return x
}

export const getRowHeight = (rows: number[], rowIndex: number, span: number = 1) => {
  let h = 0
  for (let i = 0; i < span; i++) {
    const rh = rows[rowIndex + i]
    if (rh !== undefined) h += rh
  }
  return h
}

export const getColWidth = (cols: number[], colIndex: number, span: number = 1) => {
  let w = 0
  for (let i = 0; i < span; i++) {
    const cw = cols[colIndex + i]
    if (cw !== undefined) w += cw
  }
  return w
}

/**
 * Calculates the cell at the pointer position relative to the table.
 * @param table The table node
 * @param pointerPos The absolute pointer position on the stage (in pixels)
 * @param displayScale The current display scale of the stage
 * @returns {row: number, col: number} or null if not found
 */
export const getCellAt = (
  table: TableNode,
  pointerPos: { x: number; y: number } | null,
  displayScale: number
) => {
  if (!pointerPos) return null

  const logicX = pointerPos.x / displayScale
  const logicY = pointerPos.y / displayScale

  const localX = logicX - (table.x || 0)
  const localY = logicY - (table.y || 0)

  if (localX < 0 || localY < 0) return null

  // Find Column
  let cx = 0
  let colIndex = -1
  for (let i = 0; i < table.table.cols.length; i++) {
    const w = table.table.cols[i]
    if (localX >= cx && localX < cx + w) {
      colIndex = i
      break
    }
    cx += w
  }

  // Find Row
  let cy = 0
  let rowIndex = -1
  for (let i = 0; i < table.table.rows.length; i++) {
    const h = table.table.rows[i]
    if (localY >= cy && localY < cy + h) {
      rowIndex = i
      break
    }
    cy += h
  }

  if (colIndex >= 0 && rowIndex >= 0) {
    return { row: rowIndex, col: colIndex }
  }
  return null
}
