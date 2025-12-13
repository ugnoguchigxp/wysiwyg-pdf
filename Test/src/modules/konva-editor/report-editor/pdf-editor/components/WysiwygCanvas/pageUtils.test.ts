import { describe, expect, it } from 'vitest'

import {
  getPageDimensions,
  getPresentationPageDimensions,
} from '../../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/components/WysiwygCanvas/pageUtils'

describe('pageUtils', () => {
  it('getPageDimensions supports presets and custom objects', () => {
    expect(getPageDimensions('A4').width).toBeGreaterThan(0)
    expect(getPageDimensions('A5').height).toBeGreaterThan(0)
    expect(getPageDimensions('B5').height).toBeGreaterThan(0)
    expect(getPageDimensions('Letter').width).toBeGreaterThan(0)

    // default branch
    expect(getPageDimensions('Unknown' as any).width).toBeGreaterThan(0)

    // custom object (swap when width > height)
    expect(getPageDimensions({ width: 300, height: 200, unit: 'pt' } as any)).toEqual({
      width: 200,
      height: 300,
    })
  })

  it('getPresentationPageDimensions scales presets and custom objects', () => {
    const custom = getPresentationPageDimensions({ width: 100, height: 200, unit: 'pt' } as any)
    expect(custom).toEqual({ width: 70, height: 140 })

    expect(getPresentationPageDimensions('A4').width).toBeGreaterThan(0)
    expect(getPresentationPageDimensions('A5').height).toBeGreaterThan(0)
    expect(getPresentationPageDimensions('B5').height).toBeGreaterThan(0)
    expect(getPresentationPageDimensions('Letter').width).toBeGreaterThan(0)

    // default branch
    expect(getPresentationPageDimensions('Unknown' as any).width).toBeGreaterThan(0)
  })
})

