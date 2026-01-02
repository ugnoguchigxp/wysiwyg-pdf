import React from 'react'
import { Rect } from 'react-konva'
import type Konva from 'konva'
import type { UnifiedNode, TableNode } from '@/types/canvas'

interface TableResizeHandlesProps {
    tableElement: TableNode
    rows: number[]
    cols: number[]
    getRowY: (index: number) => number
    getColX: (index: number) => number
    invScale: number
    onChange: (newAttrs: Partial<UnifiedNode> & { id?: string }) => void
}

export const TableResizeHandles: React.FC<TableResizeHandlesProps> = ({
    tableElement,
    rows,
    cols,
    getRowY,
    getColX,
    invScale,
    onChange,
}) => {
    const handles: React.ReactNode[] = []
    const HANDLE_SIZE = 8 * invScale
    const MIN_ROW = 10
    const MIN_COL = 10
    const rowCount = rows.length
    const colCount = cols.length
    const totalW = cols.reduce((acc, v) => acc + (v ?? 0), 0)
    const totalH = rows.reduce((acc, v) => acc + (v ?? 0), 0)

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

    return <>{handles}</>
}
