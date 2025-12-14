import { describe, expect, it, vi } from 'vitest'

import { measureText } from '../../@/features/report-editor/pdf-editor/utils/textUtils'

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

    const res = measureText('a\nabcd\nab', {
      family: 'Meiryo',
      size: 20,
      weight: 700,
      italic: true,
    })

    // max width is longest line ("abcd" => 4 * 10)
    expect(res.width).toBe(40)
    // lineHeight = size * 1.5 => 30, 3 lines => 90
    expect(res.height).toBe(90)

    expect(lastFont).toBe('italic 700 20px Meiryo')

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
      italic: false,
    })

    expect(res.width).toBe(10)
    expect(res.height).toBe(12 * 1.5)
    expect(lastFont).toBe('400 12px Meiryo')

    createElementSpy.mockRestore()
  })
})
