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
