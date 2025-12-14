import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import type { ITemplateDoc } from '../@/features/konva-editor/types'
import { useReportHistory } from '../@/features/report-editor/hooks/useReportHistory'

describe('useReportHistory (react)', () => {
  const makeDoc = (): ITemplateDoc => ({
    meta: { id: 'doc-1', name: 'Test', version: 1 },
    pages: [
      {
        id: 'page-1',
        size: 'A4',
        margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'pt' },
        background: { color: '#fff' },
      },
    ],
    elements: [],
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
        meta: { ...prev.meta, version: prev.meta.version + 1 },
      }))
    })

    expect(result.current.document.meta.version).toBe(2)
    expect(result.current.canUndo).toBe(true)

    act(() => result.current.undo())
    expect(result.current.document.meta.version).toBe(1)

    act(() => result.current.redo())
    expect(result.current.document.meta.version).toBe(2)
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
        meta: { ...prev.meta, version: 2 },
      }))
    })

    expect(result.current.canUndo).toBe(true)

    act(() => {
      result.current.reset({
        ...makeDoc(),
        meta: { id: 'doc-2', name: 'Reset', version: 10 },
      })
    })

    expect(result.current.document.meta.id).toBe('doc-2')
    expect(result.current.document.meta.version).toBe(10)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })
})
