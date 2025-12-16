import { describe, expect, it } from 'vitest'

import {
  getPageDimensions,
  getPresentationPageDimensions,
} from '@/features/konva-editor/utils/pageUtils'
import type { LengthUnit } from '@/utils/units'

describe('pageUtils', () => {
  it('getPageDimensions supports presets and custom objects', () => {
    expect(getPageDimensions('A4').width).toBeGreaterThan(0)
    expect(getPageDimensions('A5').height).toBeGreaterThan(0)
    expect(getPageDimensions('B5').height).toBeGreaterThan(0)
    expect(getPageDimensions('Letter').width).toBeGreaterThan(0)

    // default branch
    expect(getPageDimensions('Unknown' as unknown as 'A4').width).toBeGreaterThan(0)

    // custom object (swap when width > height)
    expect(getPageDimensions({ width: 300, height: 200, unit: 'pt' as LengthUnit }).height).toBeGreaterThan(0)
    // Actually the original code expected value. Let's match original content but change cast.
    expect(getPageDimensions({ width: 300, height: 200, unit: 'pt' as LengthUnit })).toEqual({
      width: 200,
      height: 300,
    })
  })

  it('getPresentationPageDimensions scales presets and custom objects', () => {
    const custom = getPresentationPageDimensions({ width: 100, height: 200, unit: 'pt' as LengthUnit })
    expect(custom).toEqual({ width: 70, height: 140 })

    expect(getPresentationPageDimensions('A4').width).toBeGreaterThan(0)
    expect(getPresentationPageDimensions('A5').height).toBeGreaterThan(0)
    expect(getPresentationPageDimensions('B5').height).toBeGreaterThan(0)
    expect(getPresentationPageDimensions('Letter').width).toBeGreaterThan(0)

    // default branch
    expect(getPresentationPageDimensions('Unknown' as unknown as 'A4').width).toBeGreaterThan(0)
  })
})

