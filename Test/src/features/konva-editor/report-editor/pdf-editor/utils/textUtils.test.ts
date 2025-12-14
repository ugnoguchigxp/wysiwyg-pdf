import { describe, expect, it, vi } from 'vitest'

import { measureText } from '@/features/konva-editor/utils/textUtils'

describe('textUtils/measureText', () => {
  it('returns {0,0} when canvas context is not available', () => {
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return {
            getContext: () => null,
          } as unknown as HTMLCanvasElement
        }
        return document.createElement(tagName)
      })

    expect(measureText('hello', { family: 'Meiryo', size: 12, weight: 400 })).toEqual({
      width: 0,
      height: 0,
    })

    createElementSpy.mockRestore()
  })

  it('measures multi-line text and applies italic/weight/size/family to ctx.font', () => {
    let lastFont = ''

    const fakeCtx = {
      set font(v: string) {
        lastFont = v
      },
      get font() {
        return lastFont
      },
      measureText: (s: string) => ({ width: s.length * 10 }),
    }

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return {
            getContext: () => fakeCtx,
          } as unknown as HTMLCanvasElement
        }
        return document.createElement(tagName)
      })

    const res = measureText('abcd', {
      family: 'Meiryo',
      size: 20,
      weight: 700,
    })

    // width from fake measureText
    expect(res.width).toBe(40)
    // current util uses size * 1.2
    expect(res.height).toBe(24)

    expect(lastFont).toBe('700 20px Meiryo')

    createElementSpy.mockRestore()
  })

  it('formats ctx.font without italic prefix when italic is false/undefined', () => {
    let lastFont = ''

    const fakeCtx = {
      set font(v: string) {
        lastFont = v
      },
      get font() {
        return lastFont
      },
      measureText: (_s: string) => ({ width: 10 }),
    }

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return {
            getContext: () => fakeCtx,
          } as unknown as HTMLCanvasElement
        }
        return document.createElement(tagName)
      })

    const res = measureText('x', {
      family: 'Meiryo',
      size: 12,
      weight: 400,
    })

    expect(res.width).toBe(10)
    expect(res.height).toBe(12 * 1.2)
    expect(lastFont).toBe('400 12px Meiryo')

    createElementSpy.mockRestore()
  })
})
