import { describe, it, expect } from 'vitest'
import {
    getRowY,
    getColX,
    getRowHeight,
    getColWidth,
    getCellAt,
} from './tableUtils'
import type { TableNode } from '@/types/canvas'

describe('tableUtils', () => {
    describe('getRowY', () => {
        const rows = [10, 20, 30]

        it('calculates Y position correctly', () => {
            expect(getRowY(rows, 0)).toBe(0)
            expect(getRowY(rows, 1)).toBe(10)
            expect(getRowY(rows, 2)).toBe(10 + 20)
            expect(getRowY(rows, 3)).toBe(10 + 20 + 30) // Out of bounds but valid sum
        })

        it('handles undefined rows gracefully', () => {
            // @ts-ignore - testing robustness
            const sparseRows = [10, undefined, 30]
            expect(getRowY(sparseRows as any, 3)).toBe(10 + 30)
        })
    })

    describe('getColX', () => {
        const cols = [10, 20, 30]

        it('calculates X position correctly', () => {
            expect(getColX(cols, 0)).toBe(0)
            expect(getColX(cols, 1)).toBe(10)
            expect(getColX(cols, 2)).toBe(10 + 20)
        })
    })

    describe('getRowHeight', () => {
        const rows = [10, 20, 30, 40]

        it('calculates single row height', () => {
            expect(getRowHeight(rows, 0)).toBe(10)
            expect(getRowHeight(rows, 2)).toBe(30)
        })

        it('calculates spanned row height', () => {
            expect(getRowHeight(rows, 0, 2)).toBe(10 + 20)
            expect(getRowHeight(rows, 1, 3)).toBe(20 + 30 + 40)
        })
    })

    describe('getColWidth', () => {
        const cols = [10, 20, 30, 40]

        it('calculates single col width', () => {
            expect(getColWidth(cols, 0)).toBe(10)
        })

        it('calculates spanned col width', () => {
            expect(getColWidth(cols, 0, 2)).toBe(10 + 20)
        })
    })

    describe('getCellAt', () => {
        const table: TableNode = {
            id: 'table1',
            t: 'table',
            x: 100,
            y: 100,
            rotation: 0,
            table: {
                rows: [10, 20, 30], // Heights
                cols: [15, 25, 35], // Widths
            },
        } as unknown as TableNode // Simplified mock

        const displayScale = 1

        it('returns null if pointer is null', () => {
            expect(getCellAt(table, null, displayScale)).toBeNull()
        })

        it('returns correct cell when pointer is inside', () => {
            // Table starts at 100, 100
            // Col 0: 100-115, Row 0: 100-110
            expect(getCellAt(table, { x: 105, y: 105 }, displayScale)).toEqual({
                row: 0,
                col: 0,
            })

            // Col 1: 115-140, Row 1: 110-130
            expect(getCellAt(table, { x: 120, y: 115 }, displayScale)).toEqual({
                row: 1,
                col: 1,
            })
        })

        it('handles scale correctly', () => {
            const scale = 2
            // Logic coords: 105, 105. Screen coords: 210, 210
            expect(getCellAt(table, { x: 210, y: 210 }, scale)).toEqual({
                row: 0,
                col: 0,
            })
        })

        it('returns null when pointer is outside table (left/top)', () => {
            expect(getCellAt(table, { x: 99, y: 105 }, displayScale)).toBeNull()
            expect(getCellAt(table, { x: 105, y: 99 }, displayScale)).toBeNull()
        })

        it('returns null when pointer is outside table (right/bottom)', () => {
            // Total w = 15+25+35 = 75. 100+75 = 175
            // Total h = 10+20+30 = 60. 100+60 = 160
            expect(getCellAt(table, { x: 176, y: 105 }, displayScale)).toBeNull()
            expect(getCellAt(table, { x: 105, y: 161 }, displayScale)).toBeNull()
        })

        it('resolves edges correctly (inclusive start, exclusive end)', () => {
            // Col 0 ends at 115. Col 1 starts at 115.
            expect(getCellAt(table, { x: 115, y: 105 }, displayScale)).toEqual({
                row: 0,
                col: 1,
            })

            // Row 0 ends at 110, Row 1 starts at 110
            expect(getCellAt(table, { x: 105, y: 110 }, displayScale)).toEqual({
                row: 1,
                col: 0,
            })
        })
    })
})
