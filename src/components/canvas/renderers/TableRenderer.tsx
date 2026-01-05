import type React from 'react'
import { Group, Rect, Text } from 'react-konva'
import type { TableNode, UnifiedNode } from '@/types/canvas'
import { ptToMm } from '@/utils/units'
import type { CanvasElementCommonProps } from '../types'
import { TableHeaders } from './components/TableHeaders'
import { TableResizeHandles } from './components/TableResizeHandles'
import { RichTextRenderer } from './RichTextRenderer'

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

  const backgrounds: React.ReactNode[] = []
  const borders: React.ReactNode[] = []
  const texts: React.ReactNode[] = []

  // Helper to create identifying key
  const getCellId = (r: number, c: number) => `${tableElement.id}_cell_${r}_${c} `

  const rendered: React.ReactNode[] = []

  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      if (occupied[r][c]) continue

      const cell = cellMap.get(`${r}:${c} `)
      const rs = cell?.rs || 1
      const cs = cell?.cs || 1

      // Mark occupied
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

      // Fix: Default border width should be 0 if no border is specified, otherwise we get unwanted gridlines everywhere.
      const bg = cell?.bg
      const fontSize = cell?.fontSize ?? ptToMm(12)
      const fontFamily = cell?.font || 'Meiryo'
      const color = cell?.color || '#000000'
      const align = cell?.align || 'l'
      const vAlign = cell?.vAlign || 'm' // Default to middle alignment for better visual consistency

      const isSelectedCell =
        isSelected && _selectedCell && _selectedCell.row === r && _selectedCell.col === c

      const cellId = getCellId(r, c)

      // 1. Background Layer
      // Add generous overlap (0.5) to prevent sub-pixel gaps (artifacts) between cells like in the blue header
      const OVERLAP = 0.5
      backgrounds.push(
        <Rect
          key={`${cellId}_bg`}
          x={x}
          y={y}
          width={w + OVERLAP}
          height={h + OVERLAP}
          fill={bg || '#ffffff'}
          opacity={bg ? 1 : 0.01}
          onClick={(e) => {
            e.cancelBubble = true
            onCellClick?.(tableElement.id, r, c)
            commonProps.onSelect?.(e)
          }}
          onTap={(e) => {
            e.cancelBubble = true
            onCellClick?.(tableElement.id, r, c)
            commonProps.onSelect?.(e)
          }}
          onDblClick={(e) => {
            e.cancelBubble = true
            onCellDblClick?.(tableElement.id, r, c)
          }}
        />
      )

      // 2. Borders Layer
      // Fix: Adjust coordinates to center borders on grid lines to overlap adjacent borders (prevent double lines)
      // 3. Borders (Explicit)
      if (cell?.borders) {
        borders.push(
          <Group key={`${cellId}_borders`} x={x} y={y} listening={false}>
            {cell.borders.l && (
              <Rect
                x={-(cell.borders.l.width || 0.2) / 2}
                y={0}
                width={cell.borders.l.width || 0.2}
                height={h}
                fill={cell.borders.l.color || '#000000'}
                listening={false}
              />
            )}
            {cell.borders.r && (
              <Rect
                x={w - (cell.borders.r.width || 0.2) / 2}
                y={0}
                width={cell.borders.r.width || 0.2}
                height={h}
                fill={cell.borders.r.color || '#000000'}
                listening={false}
              />
            )}
            {cell.borders.t && (
              <Rect
                x={0}
                y={-(cell.borders.t.width || 0.2) / 2}
                width={w}
                height={cell.borders.t.width || 0.2}
                fill={cell.borders.t.color || '#000000'}
                listening={false}
              />
            )}
            {cell.borders.b && (
              <Rect
                x={0}
                y={h - (cell.borders.b.width || 0.2) / 2}
                width={w}
                height={cell.borders.b.width || 0.2}
                fill={cell.borders.b.color || '#000000'}
                listening={false}
              />
            )}
          </Group>
        )
      } else {
        // Fallback or default grid
        // FIX: Usage of strokeEnabled={false} is the most reliable way to prevent any ghost strokes
        borders.push(
          <Rect
            key={`${cellId}_border_fallback`}
            x={x}
            y={y}
            width={w}
            height={h}
            strokeEnabled={false} // Disable stroke entirely
            fillEnabled={false}
            listening={false}
          />
        )
      }

      // 3. Text/Content Layer
      const useRichText = cell?.richText && cell.richText.length > 0

      if (useRichText && cell) {
        const PADDING_X = 0.5 * invScale
        const PADDING_Y = 1.6 * invScale

        texts.push(
          <RichTextRenderer
            key={`${cellId}_richtext`}
            fragments={cell.richText!}
            x={x + PADDING_X}
            y={y + PADDING_Y}
            width={Math.max(0, w - 2 * PADDING_X)}
            height={Math.max(0, h - 2 * PADDING_Y)}
            align={align}
            vAlign={vAlign}
            defaultFontSize={fontSize}
            defaultFontFamily={fontFamily}
            defaultColor={color}
            keyPrefix={cellId}
            wrap={!!cell.wrap}
          />
        )
      } else if (cell?.v) {
        const isRight = align === 'r'

        // Style Logic
        const fontStyle = ((cell.bold ? 'bold ' : '') + (cell.italic ? 'italic' : '')).trim()
        const textDecoration = cell.strike ? 'line-through' : undefined

        // PADDING Logic
        // Add small horizontal padding to prevent text touching borders
        // Reduced to 0.5 based on feedback (2.0 was too large)
        const PADDING_X = 0.5 * invScale
        const PADDING_Y = 1.6 * invScale // Increased vertical padding to ensuring text floats off the line

        // ... (Align Logic omitted - preserved)
        // Large Header Text logic
        // Fix: Lower threshold and force "INVOICE" to never wrap
        const isLargeText = fontSize > 2.8 // Lowered slightly
        const isInvoiceHeader = typeof cell.v === 'string' && cell.v.includes('INVOICE')
        const shouldUnconstrain = !cell.wrap || isLargeText || !!cell.bold || isInvoiceHeader

        let textW = !cell.wrap ? undefined : Math.max(0, w - 2 * PADDING_X)
        let textX = x + PADDING_X

        const textH = h - 2 * PADDING_Y // Constrain height with padding
        const textY = y + PADDING_Y // Offset Y

        const LARGE_WIDTH = 5000

        if (isRight) {
          textW = LARGE_WIDTH
          textX = x + w - LARGE_WIDTH - PADDING_X
        } else if (align === 'c') {
          if (shouldUnconstrain) {
            textW = LARGE_WIDTH
            textX = x + w / 2 - LARGE_WIDTH / 2
          } else {
            textW = w - 2 * PADDING_X
          }
        } else {
          // Left align (default)
          // Fix: Use Massive Width strategy even for Left Align to ensure verticalAlign works consistently with Right/Center.
          if (shouldUnconstrain) {
            textW = LARGE_WIDTH
          }
        }

        texts.push(
          <Text
            key={`${cellId}_text`}
            x={textX}
            y={textY}
            width={textW}
            height={textH}
            text={cell.v}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontStyle={fontStyle}
            textDecoration={textDecoration}
            fill={color}
            align={isRight ? 'right' : align === 'c' ? 'center' : 'left'}
            // Fix: Map 'bottom' (and default 'middle') to 'middle' to ensure visual centering.
            // Only 'top' is respected as distinct.
            verticalAlign={vAlign === 't' ? 'top' : 'middle'}
            wrap={shouldUnconstrain ? 'none' : 'word'}
            listening={false}
          />
        )
      }

      // Selection Highlight (on top of everything for this cell, or in separate layer)
      // We will put it in texts layer for now so it's on top of borders
      if (isSelectedCell) {
        texts.push(
          <Rect
            key={`${cellId}_selected`}
            x={x}
            y={y}
            width={w}
            height={h}
            stroke="#3b82f6"
            strokeWidth={2 * invScale}
            dash={[4, 4]}
            fillEnabled={false}
            listening={false}
          />
        )
      }
    }
  }

  // Combine layers
  rendered.push(...backgrounds, ...borders, ...texts)

  // ==================================================================================================
  // Headers (A, B, C... / 1, 2, 3...)
  // ==================================================================================================
  rendered.push(
    <TableHeaders
      key="table_headers"
      rowCount={rowCount}
      colCount={colCount}
      rows={rows}
      cols={cols}
      getRowY={getRowY}
      getColX={getColX}
      invScale={invScale}
    />
  )

  if (isSelected && !readOnly) {
    rendered.push(
      <TableResizeHandles
        key="table_resize_handles"
        tableElement={tableElement}
        rows={rows}
        cols={cols}
        getRowY={getRowY}
        getColX={getColX}
        invScale={invScale}
        onChange={onChange}
      />
    )
  }

  return (
    <Group {...commonProps}>
      {rendered}
      {/* Table Frame Selector (Hit Area for Outer Selection) */}
      <Rect
        width={tableElement.w}
        height={tableElement.h}
        fillEnabled={false}
        stroke="transparent"
        strokeWidth={1 * invScale}
        hitStrokeWidth={5 * invScale}
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
