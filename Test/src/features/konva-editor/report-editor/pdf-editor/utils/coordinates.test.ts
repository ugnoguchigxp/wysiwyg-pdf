import { describe, expect, it } from 'vitest'

import { ptToPx, pxToPt } from '@/utils/coordinates'

describe('utils/coordinates', () => {
  it('converts between pt and px', () => {
    expect(ptToPx(72)).toBe(96)
    expect(pxToPt(96)).toBe(72)
  })
})
