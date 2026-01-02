import React from 'react'
import type { TableNode } from '@/types/canvas'
import { mmToPt, ptToMm } from '@/utils/units'

const mmToPtValue = (mm: number | undefined) => mmToPt(mm ?? 0)
const mmPt = (mm: number | undefined) => `${mm ?? 0}mm`

export const RenderTable = ({ element }: { element: TableNode }) => {
    const { table } = element
    const { rows, cols, cells } = table
    const rowCount = rows.length
    const colCount = cols.length

    const occupied = Array(rowCount)
        .fill(null)
        .map(() => Array(colCount).fill(false))

    return (
        <table
            style={{
                width: mmPt(element.w),
                height: mmPt(element.h),
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                position: 'absolute',
                left: mmPt(element.x),
                top: mmPt(element.y),
                // zIndex: element.z, // Not used
            }}
        >
            <colgroup>
                {cols.map((w, i) => (
                    <col key={i} style={{ width: mmPt(w) }} />
                ))}
            </colgroup>
            <tbody>
                {rows.map((h, rowIndex) => (
                    <tr key={rowIndex} style={{ height: mmPt(h) }}>
                        {cols.map((_, colIndex) => {
                            if (occupied[rowIndex][colIndex]) return null
                            const cell = cells.find((c) => c.r === rowIndex && c.c === colIndex)

                            const rowSpan = cell?.rs || 1
                            const colSpan = cell?.cs || 1

                            if (rowSpan > 1 || colSpan > 1) {
                                for (let r = 0; r < rowSpan; r++) {
                                    for (let c = 0; c < colSpan; c++) {
                                        if (rowIndex + r < rowCount && colIndex + c < colCount) {
                                            occupied[rowIndex + r][colIndex + c] = true
                                        }
                                    }
                                }
                            }

                            if (!cell) return <td key={`${rowIndex}-${colIndex}`} />

                            const fontSize = cell.fontSize ?? ptToMm(12)
                            const borderW = cell.borderW ?? (cell.border ? 0.2 : 0)
                            const borderColor = cell.borderColor || cell.border || '#ccc'

                            const borderStyle: React.CSSProperties = {}

                            // Base border match background to prevent white gaps
                            if (cell.bg) {
                                borderStyle.border = `0.5pt solid ${cell.bg}`
                                // Overlap background to cover gaps
                                borderStyle.boxShadow = `0 0 0 1px ${cell.bg}`
                            }

                            if (cell.borders) {
                                const mapBorder = (
                                    b: { style?: string; width?: number; color?: string } | undefined
                                ) => {
                                    if (!b || !b.style || b.style === 'none') {
                                        // Fallback to background overlap if no visible border
                                        return cell.bg ? `0.5pt solid ${cell.bg}` : 'none'
                                    }
                                    return `${mmToPtValue(b.width ?? 0.2)}pt ${b.style} ${b.color ?? '#000'}`
                                }
                                if (cell.borders.t) borderStyle.borderTop = mapBorder(cell.borders.t)
                                if (cell.borders.r) borderStyle.borderRight = mapBorder(cell.borders.r)
                                if (cell.borders.b) borderStyle.borderBottom = mapBorder(cell.borders.b)
                                if (cell.borders.l) borderStyle.borderLeft = mapBorder(cell.borders.l)
                            } else {
                                if (borderW > 0) {
                                    borderStyle.border = `${mmToPtValue(borderW)}pt solid ${borderColor}`
                                }
                                // If borderW is 0, we leave the base background-colored border
                            }

                            return (
                                <td
                                    key={`${rowIndex}-${colIndex}`}
                                    colSpan={colSpan}
                                    rowSpan={rowSpan}
                                    style={{
                                        ...borderStyle,
                                        backgroundColor: cell.bg || 'transparent',
                                        fontFamily: cell.font || 'Helvetica',
                                        fontSize: `${mmToPtValue(fontSize)}pt`,
                                        textAlign:
                                            cell.align === 'r' ? 'right' : cell.align === 'c' ? 'center' : 'left',
                                        verticalAlign:
                                            cell.vAlign === 't' ? 'top' : cell.vAlign === 'm' ? 'middle' : 'bottom',
                                        color: cell.color || '#000000',
                                        padding: '1pt 2pt',
                                        overflow: 'visible',
                                        wordBreak: 'normal',
                                        whiteSpace: cell.wrap ? 'pre-wrap' : 'pre',
                                        lineHeight: 1.15,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            width: '100%',
                                            height: '100%',
                                            justifyContent:
                                                cell.align === 'r'
                                                    ? 'flex-end'
                                                    : cell.align === 'c'
                                                        ? 'center'
                                                        : 'flex-start',
                                            alignItems:
                                                cell.vAlign === 'm'
                                                    ? 'center'
                                                    : cell.vAlign === 'b'
                                                        ? 'flex-end'
                                                        : 'flex-start',
                                        }}
                                    >
                                        {cell.v}
                                    </div>
                                </td>
                            )
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
