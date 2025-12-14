import { describe, expect, it } from 'vitest'

import { PEN_CURSOR_URL } from '@/features/konva-editor/cursors'

describe('features/konva-editor/cursors', () => {
  it('exports a data-url cursor string', () => {
    expect(PEN_CURSOR_URL).toContain("data:image/svg+xml")
    expect(PEN_CURSOR_URL).toContain('auto')
    expect(PEN_CURSOR_URL).toContain('url(')
  })
})

