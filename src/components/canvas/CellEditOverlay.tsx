import type Konva from 'konva'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { TableNode } from '@/types/canvas'

interface CellEditOverlayProps {
  tableNode: TableNode
  cell: { row: number; col: number; elementId: string }
  stageNode: Konva.Stage | null
  scale: number
  onUpdate: (value: string) => void
  onFinish: () => void
}

const getRowY = (rows: number[], rowIndex: number) => {
  let y = 0
  for (let i = 0; i < rowIndex; i++) {
    if (rows[i] !== undefined) y += rows[i]
  }
  return y
}

const getColX = (cols: number[], colIndex: number) => {
  let x = 0
  for (let i = 0; i < colIndex; i++) {
    if (cols[i] !== undefined) x += cols[i]
  }
  return x
}

export const CellEditOverlay: React.FC<CellEditOverlayProps> = ({
  tableNode,
  cell,
  stageNode,
  scale,
  onUpdate,
  onFinish,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Locate the cell data
  const cellData = tableNode.table.cells.find((c) => c.r === cell.row && c.c === cell.col)
  const initialValue = cellData?.v || ''
  const [value, setValue] = useState(initialValue)

  // Calculate position and size
  const cols = tableNode.table.cols
  const rows = tableNode.table.rows

  const cellX = (tableNode.x || 0) + getColX(cols, cell.col)
  const cellY = (tableNode.y || 0) + getRowY(rows, cell.row)

  const cs = cellData?.cs || 1
  const rs = cellData?.rs || 1

  let cellW = 0
  for (let i = 0; i < cs; i++) cellW += cols[cell.col + i] || 0

  let cellH = 0
  for (let i = 0; i < rs; i++) cellH += rows[cell.row + i] || 0

  // Align style
  const textAlign = cellData?.align || 'l'

  // Size Logic: All units are strictly 'mm' in data. Convert to 'px' for CSS using 'scale'.
  const fontSizeMm = cellData?.fontSize || 4.23 // Default to ~12pt in mm
  const fontFamily = cellData?.font || 'sans-serif'
  const color = cellData?.color || '#000000'
  const background = cellData?.bg || '#ffffff'

  const isBold = !!cellData?.bold
  const isItalic = !!cellData?.italic

  // Standard alignments map to CSS
  const alignMap = { l: 'left', c: 'center', r: 'right' }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(value.length, value.length)
    }
  }, [])

  if (!stageNode) return null

  // PADDING Constants from TableRenderer (in mm)
  // TableRenderer uses: PADDING_X = 0.5, PADDING_Y = 1.6
  const PADDING_X_MM = 0.5
  const PADDING_Y_MM = 1.6

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${cellX * scale}px`,
    top: `${cellY * scale}px`,
    width: `${cellW * scale}px`,
    height: `${cellH * scale}px`,
    fontSize: `${fontSizeMm * scale}px`, // mm -> px
    fontFamily,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    color,
    backgroundColor: background === 'transparent' ? 'white' : background,
    border: '2px solid #3b82f6', // Focus ring
    // CSS Padding: Top Right Bottom Left.
    // Match TableRenderer: Y=1.6mm, X=0.5mm
    padding: `${PADDING_Y_MM * scale}px ${PADDING_X_MM * scale}px`,
    // biome-ignore lint/suspicious/noExplicitAny: textAlign type mismatch with CSS
    textAlign: alignMap[textAlign] as any,
    resize: 'none',
    overflow: 'hidden',
    zIndex: 1000,
    outline: 'none',
    lineHeight: 1.15, // Match typical canvas line-height
    boxSizing: 'border-box', // Important for padding to be included in width/height
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onFinish()
    }
    if (e.key === 'Escape') {
      onFinish()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setValue(val)
    onUpdate(val)
  }

  return (
    <textarea
      ref={textareaRef}
      style={style}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onFinish}
    />
  )
}
