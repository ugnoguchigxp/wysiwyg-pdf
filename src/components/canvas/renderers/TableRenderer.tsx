import type Konva from 'konva'
import type React from 'react'
import { Group, Rect, Text } from 'react-konva'
import { ptToMm } from '@/utils/units'
import type { TableNode, UnifiedNode } from '@/types/canvas'
import type { CanvasElementCommonProps } from '../types'

interface TableRendererProps {
  element: TableNode
  commonProps: CanvasElementCommonProps
  isSelected: boolean
  readOnly?: boolean
  invScale: number
  onChange: (
    newAttrs: (Partial<UnifiedNode> & { id?: string }) | (Partial<UnifiedNode> & { id?: string })[]
  ) => void
  onCellClick?: (elementId: string, row: number, col: number) => void
  onCellDblClick?: (elementId: string, row: number, col: number) => void
  selectedCell?: { row: number; col: number } | null
}

export const TableRenderer: React.FC<TableRendererProps> = ({
  element,
  commonProps,
  isSelected,
  readOnly,
  invScale,
  onChange,
  onCellClick,
  onCellDblClick,
  selectedCell: _selectedCell,
}) => {
  const tableElement = element
  const { rows, cols, cells } = tableElement.table

  const rowCount = rows.length
  const colCount = cols.length

  const totalW = cols.reduce((acc, v) => acc + (v ?? 0), 0)
  const totalH = rows.reduce((acc, v) => acc + (v ?? 0), 0)

  // Track occupied cells due to row/col spans to avoid rendering duplicates.
  const occupied = Array(rowCount)
    .fill(null)
    .map(() => Array(colCount).fill(false))

  // Helpers to get cumulative positions
  const getRowY = (rowIndex: number) => {
    let y = 0
    for (let i = 0; i < rowIndex; i++) {
      if (rows[i] !== undefined) y += rows[i]
    }
    return y
  }

  const getColX = (colIndex: number) => {
    let x = 0
    for (let i = 0; i < colIndex; i++) {
      if (cols[i] !== undefined) x += cols[i]
    }
    return x
  }

  const getRowHeight = (rowIndex: number, span: number = 1) => {
    let h = 0
    for (let i = 0; i < span; i++) {
      const rh = rows[rowIndex + i]
      if (rh !== undefined) h += rh
    }
    return h
  }

  const getColWidth = (colIndex: number, span: number = 1) => {
    let w = 0
    for (let i = 0; i < span; i++) {
      const cw = cols[colIndex + i]
      if (cw !== undefined) w += cw
    }
    return w
  }

  // Build a fast lookup for cells.
  const cellMap = new Map<string, TableNode['table']['cells'][number]>()
  for (const c of cells) cellMap.set(`${c.r}:${c.c} `, c)

  const rendered: React.ReactNode[] = []

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      if (occupied[r][c]) continue

      const cell = cellMap.get(`${r}:${c} `)
      const rs = cell?.rs || 1
      const cs = cell?.cs || 1

      // Mark occupied for spans (including the top-left cell position)
      if (rs > 1 || cs > 1) {
        for (let rr = 0; rr < rs; rr++) {
          for (let cc = 0; cc < cs; cc++) {
            if (r + rr < rowCount && c + cc < colCount) {
              occupied[r + rr][c + cc] = true
            }
          }
        }
      }

      const x = getColX(c)
      const y = getRowY(r)
      const w = getColWidth(c, cs)
      const h = getRowHeight(r, rs)

      const borderColor = cell?.borderColor || cell?.border || '#cccccc'
      const borderW = cell?.borderW ?? (cell?.border ? 0.2 : 0.2)
      const borderEnabled = borderW > 0
      const bg = cell?.bg
      const fontSize = cell?.fontSize ?? ptToMm(12)
      const fontFamily = cell?.font || 'Meiryo'
      const color = cell?.color || '#000000'
      const align = cell?.align || 'l'
      const vAlign = cell?.vAlign || 'm'

      const isSelectedCell =
        isSelected && _selectedCell && _selectedCell.row === r && _selectedCell.col === c

      const cellId = `${tableElement.id}_cell_${r}_${c} `

      rendered.push(
        <Group
          key={cellId}
          x={x}
          y={y}
          onClick={(e) => {
            e.cancelBubble = true
            onCellClick?.(tableElement.id, r, c)
          }}
          onDblClick={(e) => {
            e.cancelBubble = true
            onCellDblClick?.(tableElement.id, r, c)
          }}
        >
          <Rect
            id={cellId}
            x={0}
            y={0}
            width={w}
            height={h}
            fill={bg || 'transparent'}
            stroke={borderEnabled ? borderColor : undefined}
            strokeWidth={borderEnabled ? borderW : 0}
          />

          {!!cell?.v && (
            <Text
              id={`${cellId} _text`}
              x={4 * invScale}
              y={0}
              width={Math.max(0, w - 8 * invScale)}
              height={h}
              text={cell.v}
              fontSize={fontSize}
              fontFamily={fontFamily}
              fill={color}
              align={align === 'r' ? 'right' : align === 'c' ? 'center' : 'left'}
              verticalAlign={vAlign === 't' ? 'top' : vAlign === 'b' ? 'bottom' : 'middle'}
              listening={false}
            />
          )}

          {isSelectedCell && (
            <Rect
              x={0}
              y={0}
              width={w}
              height={h}
              stroke="#3b82f6"
              strokeWidth={2 * invScale}
              dash={[4, 4]}
              fillEnabled={false}
              listening={false}
            />
          )}
        </Group>
      )
    }
  }

  const handles: React.ReactNode[] = []
  const HANDLE_SIZE = 8 * invScale
  const MIN_ROW = 10
  const MIN_COL = 10

  if (isSelected && !readOnly) {
    // Row resize handles
    for (let i = 0; i < rowCount - 1; i++) {
      const boundaryY = getRowY(i + 1)

      handles.push(
        <Rect
          key={`${tableElement.id}_row_handle_${i} `}
          x={0}
          y={boundaryY - HANDLE_SIZE / 2}
          width={totalW}
          height={HANDLE_SIZE}
          fill="transparent"
          draggable
          dragBoundFunc={function (this: Konva.Node, pos) {
            const parent = this.getParent()
            if (!parent) return pos

            const transform = parent.getAbsoluteTransform().copy()
            transform.invert()
            const localPos = transform.point(pos)

            // Allow free movement along Y in local space, lock X to 0
            const newLocal = { x: 0, y: localPos.y }
            return parent.getAbsoluteTransform().point(newLocal)
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'row-resize'
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'default'
          }}
          onDragStart={(e) => {
            const node = e.target as Konva.Shape
            node.fill('#3b82f6')
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true
            const node = e.target as Konva.Shape
            node.fill('transparent')
            const delta = node.y() - (boundaryY - HANDLE_SIZE / 2)

            // Reset visual position immediately - React will re-render with new rows if valid
            node.position({ x: 0, y: boundaryY - HANDLE_SIZE / 2 })

            if (Math.abs(delta) < 0.01) return

            const newRows = [...rows]
            const topH = (newRows[i] ?? 0) + delta
            const bottomH = (newRows[i + 1] ?? 0) - delta
            if (topH >= MIN_ROW && bottomH >= MIN_ROW) {
              newRows[i] = topH
              newRows[i + 1] = bottomH
              onChange({
                id: tableElement.id,
                h: newRows.reduce((acc, v) => acc + (v ?? 0), 0),
                table: {
                  ...tableElement.table,
                  rows: newRows,
                },
              } as unknown as Partial<UnifiedNode>)
            }
          }}
        />
      )
    }

    // Column resize handles
    for (let i = 0; i < colCount - 1; i++) {
      const boundaryX = getColX(i + 1)

      handles.push(
        <Rect
          key={`${tableElement.id}_col_handle_${i} `}
          x={boundaryX - HANDLE_SIZE / 2}
          y={0}
          width={HANDLE_SIZE}
          height={totalH}
          fill="transparent"
          draggable
          dragBoundFunc={function (this: Konva.Node, pos) {
            const parent = this.getParent()
            if (!parent) return pos

            const transform = parent.getAbsoluteTransform().copy()
            transform.invert()
            const localPos = transform.point(pos)

            // Allow free movement along X in local space, lock Y to 0
            const newLocal = { x: localPos.x, y: 0 }
            return parent.getAbsoluteTransform().point(newLocal)
          }}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'col-resize'
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'default'
          }}
          onDragStart={(e) => {
            const node = e.target as Konva.Shape
            node.fill('#3b82f6')
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true
            const node = e.target as Konva.Shape
            node.fill('transparent')
            const delta = node.x() - (boundaryX - HANDLE_SIZE / 2)

            // Reset visual position immediately
            node.position({ x: boundaryX - HANDLE_SIZE / 2, y: 0 })

            if (Math.abs(delta) < 0.01) return

            const newCols = [...cols]
            const leftW = (newCols[i] ?? 0) + delta
            const rightW = (newCols[i + 1] ?? 0) - delta
            if (leftW >= MIN_COL && rightW >= MIN_COL) {
              newCols[i] = leftW
              newCols[i + 1] = rightW
              onChange({
                id: tableElement.id,
                w: newCols.reduce((acc, v) => acc + (v ?? 0), 0),
                table: {
                  ...tableElement.table,
                  cols: newCols,
                },
              } as unknown as Partial<UnifiedNode>)
            }
          }}
        />
      )
    }
  }

  return (
    <Group {...commonProps}>
      {rendered}
      {/* Table Frame Selector (Hit Area for Outer Selection) - Moved to be AFTER cells to ensure it sits ON TOP (for the border area). 
          Allows clicking the 'outer frame' to select the table instead of the edge cell. 
      */}
      <Rect
        width={tableElement.w}
        height={tableElement.h}
        fillEnabled={false}
        stroke="transparent"
        strokeWidth={1 * invScale}
        hitStrokeWidth={40 * invScale}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container()
          if (container) container.style.cursor = 'move'
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container()
          if (container) container.style.cursor = 'default'
        }}
        onMouseDown={(e) => {
          e.cancelBubble = true
          commonProps.onSelect?.(e)
        }}
        onClick={(e) => {
          e.cancelBubble = true
        }}
        onTap={(e) => {
          e.cancelBubble = true
          commonProps.onSelect?.(e)
        }}
      />
      {handles}
      {isSelected && !_selectedCell && (
        <Rect
          x={0}
          y={0}
          width={tableElement.w}
          height={tableElement.h}
          stroke="#cccccc"
          strokeWidth={1 * invScale}
          dash={[4, 4]}
          fillEnabled={false}
          listening={false}
        />
      )}
    </Group>
  )
}
