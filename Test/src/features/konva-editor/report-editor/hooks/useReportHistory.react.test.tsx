import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import type { Doc } from '@/types/canvas'
import { useReportHistory } from '@/features/report-editor/hooks/useReportHistory'

describe('useReportHistory (react)', () => {
  const makeDoc = (): Doc => ({
    v: 1,
    id: 'doc-1',
    title: 'Test',
    unit: 'pt',
    surfaces: [{ id: 'page-1', type: 'page', w: 100, h: 100 }],
    nodes: [],
  })

  it('tracks history and supports undo/redo', () => {
    const { result } = renderHook(() => useReportHistory(makeDoc()))

    act(() => {
      // empty undo/redo should be no-op
      result.current.undo()
      result.current.redo()
    })

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)

    act(() => {
      result.current.setDocument((prev) => ({
        ...prev,
        title: `${prev.title}2`,
      }))
    })

    expect(result.current.document.title).toBe('Test2')
    expect(result.current.canUndo).toBe(true)

    act(() => result.current.undo())
    expect(result.current.document.title).toBe('Test')

    act(() => result.current.redo())
    expect(result.current.document.title).toBe('Test2')
  })

  it('does not push history when document is unchanged (no-op)', () => {
    const { result } = renderHook(() => useReportHistory(makeDoc()))

    act(() => {
      // set the exact same object
      result.current.setDocument(result.current.document)
    })

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('reset clears past/future and sets new present', () => {
    const { result } = renderHook(() => useReportHistory(makeDoc()))

    act(() => {
      result.current.setDocument((prev) => ({
        ...prev,
        title: `${prev.title}-changed`,
      }))
    })

    expect(result.current.canUndo).toBe(true)

    act(() => {
      result.current.reset({
        ...makeDoc(),
        id: 'doc-2',
        title: 'Reset',
      })
    })

    expect(result.current.document.id).toBe('doc-2')
    expect(result.current.document.title).toBe('Reset')
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })
})
