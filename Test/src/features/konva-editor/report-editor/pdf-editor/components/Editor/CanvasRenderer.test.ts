import { describe, expect, it } from 'vitest'

import { ptToPx, pxToPt } from '@/utils/coordinates'

describe('coordinates', () => {
  it('ptToPx / pxToPt round-trip sanity', () => {
    expect(ptToPx(72)).toBeCloseTo(96, 10)
    expect(pxToPt(96)).toBeCloseTo(72, 10)
  })
})
