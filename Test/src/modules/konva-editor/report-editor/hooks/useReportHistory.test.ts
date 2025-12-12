import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ITemplateDoc } from '../../../../../../src/modules/konva-editor/report-editor/pdf-editor/types/wysiwyg'
import { useReportHistory } from '../../../../../../src/modules/konva-editor/report-editor/hooks/useReportHistory'

describe('useReportHistory', () => {
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

  it('initializes with provided document', () => {
    const { result } = renderHook(() => useReportHistory(makeDoc()))
    expect(result.current.document.meta.id).toBe('doc-1')
  })
})
