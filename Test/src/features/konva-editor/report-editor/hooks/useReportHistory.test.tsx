import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useReportHistory } from '../@/features/report-editor/hooks/useReportHistory'
import type { Doc } from '../@/types/canvas'

const baseDoc = (id: string): Doc => ({
  v: 1,
  id,
  title: 't',
  unit: 'pt',
  surfaces: [],
  nodes: [],
})

describe('useReportHistory', () => {
  it('tracks history and supports undo/redo', () => {
    const { result } = renderHook(() => useReportHistory(baseDoc('a')))

    act(() => {
      result.current.setDocument(baseDoc('b'))
    })

    expect(result.current.document.id).toBe('b')
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)

    act(() => result.current.undo())
    expect(result.current.document.id).toBe('a')
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.redo())
    expect(result.current.document.id).toBe('b')
  })

  it('does not create a new history entry when the document is unchanged', () => {
    const { result } = renderHook(() => useReportHistory(baseDoc('a')))

    act(() => {
      result.current.setDocument(baseDoc('a'))
    })

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('reset replaces present and clears past/future', () => {
    const { result } = renderHook(() => useReportHistory(baseDoc('a')))

    act(() => {
      result.current.setDocument(baseDoc('b'))
    })
    expect(result.current.canUndo).toBe(true)

    act(() => {
      result.current.reset(baseDoc('z'))
    })

    expect(result.current.document.id).toBe('z')
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })
})

