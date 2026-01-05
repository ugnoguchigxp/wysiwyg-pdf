import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Doc } from '@/types/canvas'
import { useReportHistory } from '@/features/report-editor/hooks/useReportHistory'

describe('useReportHistory', () => {
  const makeDoc = (): Doc => ({
    v: 1,
    id: 'doc-1',
    title: 'Test',
    unit: 'mm',
    surfaces: [{ id: 'page-1', type: 'page', w: 100, h: 100 }],
    nodes: [],
  })

  it('initializes with provided document', () => {
    const { result } = renderHook(() => useReportHistory(makeDoc()))
    expect(result.current.document.id).toBe('doc-1')
  })
})
