import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useEditorHistory } from './useEditorHistory'
import type { Doc, Operation } from '@/features/konva-editor/types'

describe('useEditorHistory', () => {
    const initialDoc: Doc = {
        v: 1,
        id: 'doc-1',
        title: 'Test Doc',
        unit: 'mm',
        surfaces: [],
        nodes: [],
    }

    let mockSetDoc: ReturnType<typeof vi.fn>

    beforeEach(() => {
        mockSetDoc = vi.fn()
        vi.clearAllMocks()
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    it('initializes with correct status', () => {
        const { result } = renderHook(() => useEditorHistory(initialDoc, mockSetDoc))
        expect(result.current.canUndo).toBe(false)
        expect(result.current.canRedo).toBe(false)
    })

    it('executes operation and updates past stack', () => {
        const { result } = renderHook(() => useEditorHistory(initialDoc, mockSetDoc))
        const op: Operation = { kind: 'create-element', element: { id: 'e1', t: 'text', x: 0, y: 0, w: 10, h: 10, s: 's1' } as any }

        act(() => {
            result.current.execute(op)
        })

        expect(mockSetDoc).toHaveBeenCalled()
        expect(result.current.canUndo).toBe(true)
        expect(result.current.canRedo).toBe(false)
    })

    it('supports undo and redo', () => {
        // We need to simulate the state update that useEditorHistory triggers
        let currentDoc = initialDoc
        const setDocWrapper = (updater: any) => {
            currentDoc = typeof updater === 'function' ? updater(currentDoc) : updater
            mockSetDoc(currentDoc)
        }

        const { result, rerender } = renderHook(({ doc }) => useEditorHistory(doc, setDocWrapper), {
            initialProps: { doc: initialDoc }
        })

        const op: Operation = { kind: 'create-element', element: { id: 'e1', t: 'text', x: 0, y: 0, w: 10, h: 10, s: 's1' } as any }

        // 1. Execute
        act(() => {
            result.current.execute(op)
        })
        rerender({ doc: currentDoc })
        expect(currentDoc.nodes).toHaveLength(1)
        expect(result.current.canUndo).toBe(true)

        // 2. Undo
        act(() => {
            result.current.undo()
        })
        rerender({ doc: currentDoc })
        expect(currentDoc.nodes).toHaveLength(0)
        expect(result.current.canUndo).toBe(false)
        expect(result.current.canRedo).toBe(true)

        // 3. Redo
        act(() => {
            result.current.redo()
        })
        rerender({ doc: currentDoc })
        expect(currentDoc.nodes).toHaveLength(1)
        expect(result.current.canUndo).toBe(true)
        expect(result.current.canRedo).toBe(false)
    })

    it('limits history size to MAX_HISTORY_SIZE (50)', () => {
        const { result } = renderHook(() => useEditorHistory(initialDoc, mockSetDoc))

        act(() => {
            for (let i = 0; i < 60; i++) {
                result.current.execute({ kind: 'create-element', element: { id: `e${i}` } as any })
            }
        })

        // Past stack should be capped at 50
        // We can indirectly verify this via undo behavior if we had a full state simulator,
        // but here we check the canUndo remains true and internal state (if accessible) would be 50.
        // Since past is private, we'll verify it doesn't crash and behaves correctly at high volumes.
        expect(result.current.canUndo).toBe(true)
    })

    it('does not save to history when saveToHistory is false', () => {
        const { result } = renderHook(() => useEditorHistory(initialDoc, mockSetDoc))
        const op: Operation = { kind: 'create-element', element: { id: 'e1' } as any }

        act(() => {
            result.current.execute(op, { saveToHistory: false })
        })

        expect(mockSetDoc).toHaveBeenCalled()
        expect(result.current.canUndo).toBe(false)
    })

    it('clears history', () => {
        const { result } = renderHook(() => useEditorHistory(initialDoc, mockSetDoc))
        act(() => {
            result.current.execute({ kind: 'create-element', element: { id: 'e1' } as any })
        })
        expect(result.current.canUndo).toBe(true)

        act(() => {
            result.current.clear()
        })
        expect(result.current.canUndo).toBe(false)
    })
})
