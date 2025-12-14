import { describe, expect, it } from 'vitest'

import { ptToPx, pxToPt } from '@/utils/coordinates'

describe('coordinates', () => {
  it('ptToPx / pxToPt round-trip sanity', () => {
    expect(ptToPx(72)).toBe(96)
    expect(pxToPt(96)).toBe(72)
  })
})
