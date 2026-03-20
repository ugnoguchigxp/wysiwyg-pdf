import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useReportHistory } from './useReportHistory'
import type { Doc } from '@/features/konva-editor/types'

describe('useReportHistory', () => {
    const initialDoc: Doc = {
        v: 1,
        id: 'doc-1',
        title: 'Test Doc',
        unit: 'mm',
        surfaces: [],
        nodes: [],
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    it('initializes with correct present state', () => {
        const { result } = renderHook(() => useReportHistory(initialDoc))
        expect(result.current.document).toEqual(initialDoc)
        expect(result.current.canUndo).toBe(false)
        expect(result.current.canRedo).toBe(false)
    })

    it('updates state and handles undo/redo', () => {
        const { result } = renderHook(() => useReportHistory(initialDoc))
        const nextDoc: Doc = { ...initialDoc, title: 'Updated' }

        act(() => {
            result.current.setDocument(nextDoc)
        })

        expect(result.current.document.title).toBe('Updated')
        expect(result.current.canUndo).toBe(true)

        act(() => {
            result.current.undo()
        })

        expect(result.current.document.title).toBe('Test Doc')
        expect(result.current.canUndo).toBe(false)
        expect(result.current.canRedo).toBe(true)

        act(() => {
            result.current.redo()
        })

        expect(result.current.document.title).toBe('Updated')
        expect(result.current.canRedo).toBe(false)
    })

    it('supports functional updates', () => {
        const { result } = renderHook(() => useReportHistory(initialDoc))

        act(() => {
            result.current.setDocument((prev) => ({ ...prev, title: 'Functional' }))
        })

        expect(result.current.document.title).toBe('Functional')
    })

    it('does not save to history when saveToHistory is false', () => {
        const { result } = renderHook(() => useReportHistory(initialDoc))
        const nextDoc: Doc = { ...initialDoc, title: 'No History' }

        act(() => {
            result.current.setDocument(nextDoc, { saveToHistory: false })
        })

        expect(result.current.document.title).toBe('No History')
        expect(result.current.canUndo).toBe(false)
    })

    it('supports reset with validation', () => {
        const { result } = renderHook(() => useReportHistory(initialDoc))
        const resetDoc: Doc = { ...initialDoc, title: 'Reset' }

        act(() => {
            result.current.reset(resetDoc)
        })

        expect(result.current.document.title).toBe('Reset')
        expect(result.current.canUndo).toBe(false)
        expect(result.current.canRedo).toBe(false)
    })

    it('normalizes loaded table width/height to match cols/rows sum', () => {
        const { result } = renderHook(() => useReportHistory(initialDoc))
        const resetDoc: Doc = {
            ...initialDoc,
            surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297, margin: { t: 0, r: 0, b: 0, l: 0 } }],
            nodes: [
                {
                    id: 'tbl-1',
                    t: 'table',
                    s: 'page-1',
                    x: 0,
                    y: 0,
                    w: 120,
                    h: 40,
                    table: {
                        rows: [10, 20],
                        cols: [50, 60],
                        cells: [
                            { r: 0, c: 0, v: 'A' },
                            { r: 1, c: 1, v: 'B' },
                        ],
                    },
                } as any,
            ],
        }

        act(() => {
            result.current.reset(resetDoc)
        })

        const table = result.current.document.nodes[0] as any
        expect(table.w).toBe(110)
        expect(table.h).toBe(30)
    })

    it('rescales loaded oversized table to drawable width and propagates font/border scale', () => {
        const { result } = renderHook(() => useReportHistory(initialDoc))
        const resetDoc: Doc = {
            ...initialDoc,
            surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297, margin: { t: 0, r: 0, b: 0, l: 0 } }],
            nodes: [
                {
                    id: 'tbl-1',
                    t: 'table',
                    s: 'page-1',
                    x: 0,
                    y: 0,
                    w: 300,
                    h: 40,
                    table: {
                        rows: [20],
                        cols: [150, 150],
                        cells: [
                            {
                                r: 0,
                                c: 0,
                                v: 'A',
                                fontSize: 4,
                                borderW: 0.2,
                                borders: { t: { style: 'solid', width: 0.2, color: '#000' } },
                                richText: [{ text: 'A', fontSize: 4 }],
                            },
                            { r: 0, c: 1, v: 'B' },
                        ],
                    },
                } as any,
            ],
        }

        act(() => {
            result.current.reset(resetDoc)
        })

        const table = result.current.document.nodes[0] as any
        const colsSum = table.table.cols.reduce((sum: number, width: number) => sum + width, 0)
        expect(table.w).toBeCloseTo(210, 3)
        expect(colsSum).toBeCloseTo(table.w, 6)
        expect(table.table.cells[0].fontSize).toBeLessThan(4)
        expect(table.table.cells[0].borderW).toBeLessThan(0.2)
        expect(table.table.cells[0].borders.t.width).toBeLessThan(0.2)
        expect(table.table.cells[0].richText[0].fontSize).toBeLessThan(4)
    })

    it('trims trailing empty cols/rows on load so selection bounds fit visible table', () => {
        const { result } = renderHook(() => useReportHistory(initialDoc))
        const resetDoc: Doc = {
            ...initialDoc,
            surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297, margin: { t: 0, r: 0, b: 0, l: 0 } }],
            nodes: [
                {
                    id: 'tbl-1',
                    t: 'table',
                    s: 'page-1',
                    x: 0,
                    y: 0,
                    w: 300,
                    h: 120,
                    table: {
                        rows: [20, 20, 20, 20, 20, 20],
                        cols: [50, 50, 50, 50, 50, 50],
                        cells: [
                            { r: 0, c: 0, v: 'A' },
                            { r: 1, c: 1, v: 'B' },
                        ],
                    },
                } as any,
            ],
        }

        act(() => {
            result.current.reset(resetDoc)
        })

        const table = result.current.document.nodes[0] as any
        expect(table.table.rows).toHaveLength(2)
        expect(table.table.cols).toHaveLength(2)
        expect(table.w).toBe(100)
        expect(table.h).toBe(40)
    })

    it('handles force option to save history even if content is identical', () => {
        const { result } = renderHook(() => useReportHistory(initialDoc))

        // Normal set with identical content shouldn't add to history
        act(() => {
            result.current.setDocument(initialDoc)
        })
        expect(result.current.canUndo).toBe(false)

        // Forced set with identical content should add to history
        act(() => {
            result.current.setDocument(initialDoc, { force: true })
        })
        expect(result.current.canUndo).toBe(true)
    })
})
