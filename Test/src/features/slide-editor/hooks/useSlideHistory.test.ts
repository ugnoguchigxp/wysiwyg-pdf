import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useSlideHistory } from '@/features/slide-editor/hooks/useSlideHistory'
import type { Doc } from '@/types/canvas'

const createMockDoc = (id: string): Doc => ({
    v: 1,
    id,
    title: 'Test Doc',
    unit: 'mm',
    surfaces: [],
    nodes: []
})

describe('useSlideHistory', () => {
    it('should initialize with initial doc', () => {
        const initialDoc = createMockDoc('init')
        const { result } = renderHook(() => useSlideHistory(initialDoc))

        expect(result.current.doc).toEqual(initialDoc)
        expect(result.current.canUndo).toBe(false)
        expect(result.current.canRedo).toBe(false)
    })

    it('should add to history when setDoc is called', () => {
        const initialDoc = createMockDoc('init')
        const { result } = renderHook(() => useSlideHistory(initialDoc))

        const newDoc = createMockDoc('v2')
        act(() => {
            result.current.setDoc(newDoc)
        })

        expect(result.current.doc).toEqual(newDoc)
        expect(result.current.canUndo).toBe(true)
    })

    it('should undo and redo', () => {
        const initialDoc = createMockDoc('init')
        const { result } = renderHook(() => useSlideHistory(initialDoc))

        const newDoc = createMockDoc('v2')
        act(() => {
            result.current.setDoc(newDoc)
        })

        expect(result.current.doc).toEqual(newDoc)

        act(() => {
            result.current.undo()
        })
        expect(result.current.doc).toEqual(initialDoc)
        expect(result.current.canRedo).toBe(true)

        act(() => {
            result.current.redo()
        })
        expect(result.current.doc).toEqual(newDoc)
    })

    it('should reset history', () => {
        const initialDoc = createMockDoc('init')
        const { result } = renderHook(() => useSlideHistory(initialDoc))

        const newDoc = createMockDoc('v2')
        act(() => {
            result.current.setDoc(newDoc)
        })

        const resetDoc = createMockDoc('reset')
        act(() => {
            result.current.reset(resetDoc)
        })

        expect(result.current.doc).toEqual(resetDoc)
        expect(result.current.canUndo).toBe(false)
        expect(result.current.canRedo).toBe(false)
    })

    it('should not save to history if saveToHistory is false', () => {
        const initialDoc = createMockDoc('init')
        const { result } = renderHook(() => useSlideHistory(initialDoc))

        const newDoc = createMockDoc('v2')
        act(() => {
            result.current.setDoc(newDoc, { saveToHistory: false })
        })

        expect(result.current.doc).toEqual(newDoc)
        expect(result.current.canUndo).toBe(false)
    })

    it('should not update history if doc content matches deeply (and force is false)', () => {
        const initialDoc = createMockDoc('init')
        const { result } = renderHook(() => useSlideHistory(initialDoc))

        // Same doc content
        const sameDoc = createMockDoc('init')
        act(() => {
            result.current.setDoc(sameDoc)
        })

        expect(result.current.canUndo).toBe(false)

        // Force update
        act(() => {
            result.current.setDoc(sameDoc, { force: true })
        })

        // Force update might currently behave differently depending on implementation (does it push to history even if same?)
        // Looking at implementation: if (!force && JSON.stringify... return prev)
        // So if force is true, it proceeds.
        expect(result.current.canUndo).toBe(true)
    })
})
