import { describe, expect, it } from 'vitest'

import {
  getPageDimensions,
  getPresentationPageDimensions,
} from '@/features/konva-editor/utils/pageUtils'
import type { LengthUnit } from '@/utils/units'
import { ptToMm } from '@/utils/units'

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
    expect(getPageDimensions({ width: 300, height: 200, unit: 'pt' as LengthUnit })).toEqual({
      width: ptToMm(200),
      height: ptToMm(300),
    })
  })

  it('getPresentationPageDimensions scales presets and custom objects', () => {
    const custom = getPresentationPageDimensions({ width: 100, height: 200, unit: 'pt' as LengthUnit })
    expect(custom).toEqual({ width: ptToMm(100) * 0.7, height: ptToMm(200) * 0.7 })

    expect(getPresentationPageDimensions('A4').width).toBeGreaterThan(0)
    expect(getPresentationPageDimensions('A5').height).toBeGreaterThan(0)
    expect(getPresentationPageDimensions('B5').height).toBeGreaterThan(0)
    expect(getPresentationPageDimensions('Letter').width).toBeGreaterThan(0)

    // default branch
    expect(getPresentationPageDimensions('Unknown' as unknown as 'A4').width).toBeGreaterThan(0)
  })
})

