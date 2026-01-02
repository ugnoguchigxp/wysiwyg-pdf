import type React from 'react'
import { Group, Rect, Text } from 'react-konva'

interface TableHeadersProps {
  rowCount: number
  colCount: number
  rows: number[]
  cols: number[]
  getRowY: (index: number) => number
  getColX: (index: number) => number
  invScale: number
}

export const TableHeaders: React.FC<TableHeadersProps> = ({
  rowCount,
  colCount,
  rows,
  cols,
  getRowY,
  getColX,
  invScale,
}) => {
  const HEADER_BG = '#f3f4f6'
  const HEADER_BORDER = '#d1d5db'
  const HEADER_TEXT = '#6b7280'
  const COL_HEADER_H = 24 * invScale
  const ROW_HEADER_W = 32 * invScale
  const FONT_SIZE = 10 * invScale

  const toColumnName = (num: number): string => {
    let s = ''
    let t = num + 1
    while (t > 0) {
      const m = (t - 1) % 26
      s = String.fromCharCode(65 + m) + s
      t = Math.floor((t - m) / 26)
    }
    return s
  }

  const rendered: React.ReactNode[] = []

  // Column Headers (Top)
  for (let c = 0; c < colCount; c++) {
    const x = getColX(c)
    const w = cols[c] ?? 0
    rendered.push(
      <Group key={`col_header_${c}`} x={x} y={-COL_HEADER_H} name="table-header-ui">
        <Rect
          width={w}
          height={COL_HEADER_H}
          fill={HEADER_BG}
          stroke={HEADER_BORDER}
          strokeWidth={1 * invScale}
        />
        <Text
          x={0}
          y={0}
          width={w}
          height={COL_HEADER_H}
          text={toColumnName(c)}
          align="center"
          verticalAlign="middle"
          fontSize={FONT_SIZE}
          fill={HEADER_TEXT}
        />
      </Group>
    )
  }

  // Row Headers (Left)
  for (let r = 0; r < rowCount; r++) {
    const y = getRowY(r)
    const h = rows[r] ?? 0
    rendered.push(
      <Group key={`row_header_${r}`} x={-ROW_HEADER_W} y={y} name="table-header-ui">
        <Rect
          width={ROW_HEADER_W}
          height={h}
          fill={HEADER_BG}
          stroke={HEADER_BORDER}
          strokeWidth={1 * invScale}
        />
        <Text
          x={0}
          y={0}
          width={ROW_HEADER_W}
          height={h}
          text={String(r + 1)}
          align="center"
          verticalAlign="middle"
          fontSize={FONT_SIZE}
          fill={HEADER_TEXT}
        />
      </Group>
    )
  }

  // Corner Box
  rendered.push(
    <Rect
      key="header_corner"
      x={-ROW_HEADER_W}
      y={-COL_HEADER_H}
      width={ROW_HEADER_W}
      height={COL_HEADER_H}
      fill={HEADER_BG}
      stroke={HEADER_BORDER}
      strokeWidth={1 * invScale}
      name="table-header-ui"
    />
  )

  return <>{rendered}</>
}
