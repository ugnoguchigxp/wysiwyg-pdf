import { describe, expect, it } from 'vitest'

import { ptToPx, pxToPt } from '@/utils/coordinates'

describe('utils/coordinates', () => {
  it('converts between pt and px', () => {
    expect(ptToPx(72)).toBeCloseTo(96, 10)
    expect(pxToPt(96)).toBeCloseTo(72, 10)
  })
})
