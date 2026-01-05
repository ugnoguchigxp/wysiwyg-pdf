/**
 * Tests for useSlideHistory hook
 * Covers undo/redo, saveToHistory option, and reset functionality
 */

import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useSlideHistory } from '@/features/slide-editor/hooks/useSlideHistory'
import type { Doc } from '@/types/canvas'

// Mock validateDoc
vi.mock('@/types/doc.schema', () => ({
    validateDoc: vi.fn(() => ({ success: true, errors: [] }))
}))

describe('useSlideHistory', () => {
    const createInitialDoc = (): Doc => ({
        v: 1,
        id: 'test-doc',
        title: 'Initial Title',
        unit: 'mm',
        surfaces: [{ id: 's1', type: 'slide', w: 297, h: 210 }],
        nodes: []
    })

    describe('initialization', () => {
        it('initializes with the provided document', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            expect(result.current.doc).toEqual(initialDoc)
            expect(result.current.canUndo).toBe(false)
            expect(result.current.canRedo).toBe(false)
        })
    })

    describe('setDoc', () => {
        it('updates document and adds to history by default', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            act(() => {
                result.current.setDoc({ ...initialDoc, title: 'Updated Title' })
            })

            expect(result.current.doc.title).toBe('Updated Title')
            expect(result.current.canUndo).toBe(true)
        })

        it('accepts updater function', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            act(() => {
                result.current.setDoc(prev => ({ ...prev, title: 'New Title' }))
            })

            expect(result.current.doc.title).toBe('New Title')
        })

        it('does not add to history when saveToHistory is false', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            act(() => {
                result.current.setDoc(
                    { ...initialDoc, title: 'Updated Title' },
                    { saveToHistory: false }
                )
            })

            expect(result.current.doc.title).toBe('Updated Title')
            expect(result.current.canUndo).toBe(false) // No history saved
        })

        it('does not update if document is unchanged', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            // Set same document
            act(() => {
                result.current.setDoc(initialDoc)
            })

            expect(result.current.canUndo).toBe(false)
        })

        it('updates with force flag even if document is unchanged', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            // Force update with same document
            act(() => {
                result.current.setDoc(initialDoc, { force: true })
            })

            expect(result.current.canUndo).toBe(true)
        })

        it('clears redo history when making new changes', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            // Make change
            act(() => {
                result.current.setDoc({ ...initialDoc, title: 'First Change' })
            })

            // Undo
            act(() => {
                result.current.undo()
            })

            expect(result.current.canRedo).toBe(true)

            // Make new change - should clear redo
            act(() => {
                result.current.setDoc({ ...initialDoc, title: 'New Change' })
            })

            expect(result.current.canRedo).toBe(false)
        })
    })

    describe('undo', () => {
        it('reverts to previous state', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            act(() => {
                result.current.setDoc({ ...initialDoc, title: 'Changed' })
            })

            act(() => {
                result.current.undo()
            })

            expect(result.current.doc.title).toBe('Initial Title')
            expect(result.current.canUndo).toBe(false)
            expect(result.current.canRedo).toBe(true)
        })

        it('does nothing when no history', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            act(() => {
                result.current.undo()
            })

            expect(result.current.doc.title).toBe('Initial Title')
        })

        it('supports multiple undo operations', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            act(() => {
                result.current.setDoc({ ...initialDoc, title: 'First' })
            })
            act(() => {
                result.current.setDoc({ ...result.current.doc, title: 'Second' })
            })
            act(() => {
                result.current.setDoc({ ...result.current.doc, title: 'Third' })
            })

            expect(result.current.doc.title).toBe('Third')

            act(() => {
                result.current.undo()
            })
            expect(result.current.doc.title).toBe('Second')

            act(() => {
                result.current.undo()
            })
            expect(result.current.doc.title).toBe('First')

            act(() => {
                result.current.undo()
            })
            expect(result.current.doc.title).toBe('Initial Title')
        })
    })

    describe('redo', () => {
        it('reapplies undone changes', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            act(() => {
                result.current.setDoc({ ...initialDoc, title: 'Changed' })
            })

            act(() => {
                result.current.undo()
            })

            act(() => {
                result.current.redo()
            })

            expect(result.current.doc.title).toBe('Changed')
            expect(result.current.canRedo).toBe(false)
            expect(result.current.canUndo).toBe(true)
        })

        it('does nothing when no redo history', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            act(() => {
                result.current.redo()
            })

            expect(result.current.doc.title).toBe('Initial Title')
        })

        it('supports multiple redo operations', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            act(() => {
                result.current.setDoc({ ...initialDoc, title: 'First' })
            })
            act(() => {
                result.current.setDoc({ ...result.current.doc, title: 'Second' })
            })

            // Undo both
            act(() => {
                result.current.undo()
            })
            act(() => {
                result.current.undo()
            })

            expect(result.current.doc.title).toBe('Initial Title')

            // Redo both
            act(() => {
                result.current.redo()
            })
            expect(result.current.doc.title).toBe('First')

            act(() => {
                result.current.redo()
            })
            expect(result.current.doc.title).toBe('Second')
        })
    })

    describe('reset', () => {
        it('replaces document and clears history', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            // Make some changes
            act(() => {
                result.current.setDoc({ ...initialDoc, title: 'Changed' })
            })

            expect(result.current.canUndo).toBe(true)

            // Reset with new doc
            const newDoc: Doc = {
                ...createInitialDoc(),
                id: 'new-doc',
                title: 'Reset Doc'
            }

            act(() => {
                result.current.reset(newDoc)
            })

            expect(result.current.doc).toEqual(newDoc)
            expect(result.current.canUndo).toBe(false)
            expect(result.current.canRedo).toBe(false)
        })
    })

    describe('canUndo and canRedo flags', () => {
        it('correctly reflects history state', () => {
            const initialDoc = createInitialDoc()
            const { result } = renderHook(() => useSlideHistory(initialDoc))

            expect(result.current.canUndo).toBe(false)
            expect(result.current.canRedo).toBe(false)

            // Make change
            act(() => {
                result.current.setDoc({ ...initialDoc, title: 'Changed' })
            })

            expect(result.current.canUndo).toBe(true)
            expect(result.current.canRedo).toBe(false)

            // Undo
            act(() => {
                result.current.undo()
            })

            expect(result.current.canUndo).toBe(false)
            expect(result.current.canRedo).toBe(true)
        })
    })
})
