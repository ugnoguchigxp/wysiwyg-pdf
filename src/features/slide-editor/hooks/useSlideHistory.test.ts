import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useSlideHistory } from './useSlideHistory'
import type { Doc } from '@/types/canvas'

describe('useSlideHistory', () => {
    const initialDoc: Doc = {
        v: 1,
        id: 'doc-1',
        title: 'Slides',
        unit: 'mm',
        surfaces: [],
        nodes: [],
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    it('updates state and handles undo/redo', () => {
        const { result } = renderHook(() => useSlideHistory(initialDoc))
        const nextDoc = { ...initialDoc, title: 'Updated Slides' }

        act(() => {
            result.current.setDoc(nextDoc)
        })

        expect(result.current.doc.title).toBe('Updated Slides')
        expect(result.current.canUndo).toBe(true)

        act(() => {
            result.current.undo()
        })

        expect(result.current.doc.title).toBe('Slides')
    })
})
