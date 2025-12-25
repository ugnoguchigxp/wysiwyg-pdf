import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMindmapHistory } from '@/features/mindmap-editor/hooks/useMindmapHistory'

describe('features/mindmap-editor/hooks/useMindmapHistory', () => {
  const createMockDoc = (id: string) => ({ nodes: [{ id }] } as any)

  describe('initialization', () => {
    it('initializes with initial doc', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      expect(result.current.doc).toEqual(initialDoc)
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })
  })

  describe('setDoc', () => {
    it('updates doc and saves to history', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      expect(result.current.doc).toEqual(createMockDoc('doc2'))
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(false)
    })

    it('updates doc with function updater', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc((prev) => ({ ...prev, nodes: [{ id: 'doc2' }] }))
      })

      expect(result.current.doc).toEqual(createMockDoc('doc2'))
      expect(result.current.canUndo).toBe(true)
    })

    it('updates doc without saving to history', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'), { saveToHistory: false })
      })

      expect(result.current.doc).toEqual(createMockDoc('doc2'))
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })

    it('clears future when updating doc', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)

      act(() => {
        result.current.setDoc(createMockDoc('doc3'))
      })

      expect(result.current.doc).toEqual(createMockDoc('doc3'))
      expect(result.current.canRedo).toBe(false)
    })

    it('does not add to history if doc has not changed', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      expect(result.current.canUndo).toBe(true)
      expect(result.current.doc).toEqual(createMockDoc('doc2'))
    })

    it('adds to history even if doc has not changed when forced', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      expect(result.current.canUndo).toBe(true)

      act(() => {
        result.current.setDoc(createMockDoc('doc2'), { force: true })
      })

      const undoCountBefore = result.current.doc?.nodes?.length
      act(() => {
        result.current.undo()
      })
      expect(result.current.doc).toEqual(createMockDoc('doc2'))
    })
  })

  describe('undo', () => {
    it('undoes to previous doc', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      act(() => {
        result.current.setDoc(createMockDoc('doc3'))
      })

      expect(result.current.doc).toEqual(createMockDoc('doc3'))

      act(() => {
        result.current.undo()
      })

      expect(result.current.doc).toEqual(createMockDoc('doc2'))
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(true)
    })

    it('does nothing when history is empty', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      expect(result.current.canUndo).toBe(false)

      act(() => {
        result.current.undo()
      })

      expect(result.current.doc).toEqual(initialDoc)
      expect(result.current.canUndo).toBe(false)
    })

    it('can undo multiple times', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      act(() => {
        result.current.setDoc(createMockDoc('doc3'))
      })

      act(() => {
        result.current.undo()
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.doc).toEqual(initialDoc)
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(true)
    })
  })

  describe('redo', () => {
    it('redoes to next doc', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.doc).toEqual(initialDoc)
      expect(result.current.canRedo).toBe(true)

      act(() => {
        result.current.redo()
      })

      expect(result.current.doc).toEqual(createMockDoc('doc2'))
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(false)
    })

    it('does nothing when future is empty', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      expect(result.current.canRedo).toBe(false)

      act(() => {
        result.current.redo()
      })

      expect(result.current.doc).toEqual(initialDoc)
      expect(result.current.canRedo).toBe(false)
    })

    it('can redo multiple times', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      act(() => {
        result.current.setDoc(createMockDoc('doc3'))
      })

      act(() => {
        result.current.undo()
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.doc).toEqual(initialDoc)

      act(() => {
        result.current.redo()
      })

      act(() => {
        result.current.redo()
      })

      expect(result.current.doc).toEqual(createMockDoc('doc3'))
    })
  })

  describe('reset', () => {
    it('resets history with new doc', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      act(() => {
        result.current.setDoc(createMockDoc('doc3'))
      })

      act(() => {
        result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)

      act(() => {
        result.current.reset(createMockDoc('doc4'))
      })

      expect(result.current.doc).toEqual(createMockDoc('doc4'))
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles multiple setDoc calls correctly', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      for (let i = 2; i <= 5; i++) {
        act(() => {
          result.current.setDoc(createMockDoc(`doc${i}`))
        })
      }

      expect(result.current.doc).toEqual(createMockDoc('doc5'))
      expect(result.current.canUndo).toBe(true)

      act(() => {
        result.current.undo()
      })

      expect(result.current.doc).toEqual(createMockDoc('doc4'))

      act(() => {
        result.current.undo()
      })

      expect(result.current.doc).toEqual(createMockDoc('doc3'))
    })

    it('handles undo after reset', () => {
      const initialDoc = createMockDoc('doc1')
      const { result } = renderHook(() => useMindmapHistory(initialDoc))

      act(() => {
        result.current.setDoc(createMockDoc('doc2'))
      })

      act(() => {
        result.current.reset(createMockDoc('doc3'))
      })

      expect(result.current.canUndo).toBe(false)

      act(() => {
        result.current.undo()
      })

      expect(result.current.doc).toEqual(createMockDoc('doc3'))
      expect(result.current.canUndo).toBe(false)
    })
  })
})
