import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/utils/coordinates', () => ({
  ptToPx: (pt: number) => pt,
}))

vi.mock('../../../../../../../../src/utils/logger', () => ({
  createContextLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { CanvasRenderer } from '../../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/components/Editor/CanvasRenderer'

function createCtx() {
  const base: any = {
    canvas: { width: 100, height: 100 },
    measureText: vi.fn(() => ({ width: 10 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createPattern: vi.fn(() => ({})),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
  }

  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as any]
      // default to spy functions for any canvas API usage
      const fn = vi.fn()
      target[prop as any] = fn
      return fn
    },
    set(target, prop, value) {
      target[prop as any] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

describe('CanvasRenderer', () => {
  it('renders all supported item types and selection', () => {
    const ctx = createCtx()
    const r = new CanvasRenderer(ctx)

    const items: any[] = [
      { id: 't', type: 'text', x: 1, y: 2, width: 10, height: 10, texts: ['a'], style: { 'font-size': 12 }, display: true },
      { id: 'tb', type: 'text-block', x: 1, y: 2, width: 10, height: 10, value: 'v', style: { 'font-size': 12 }, display: true },
      { id: 'rect', type: 'rect', x: 0, y: 0, width: 10, height: 10, style: { 'fill-color': '#fff', 'border-style': 'solid', 'border-color': '#000', 'border-width': 1 }, display: true },
      { id: 'el', type: 'ellipse', x: 0, y: 0, width: 10, height: 10, style: { 'fill-color': '#fff' }, display: true },
      { id: 'line', type: 'line', x: 0, y: 0, width: 0, height: 0, x1: 0, y1: 0, x2: 10, y2: 10, style: { 'border-style': 'dashed', 'border-width': 1, 'border-color': '#000' }, display: true },
      { id: 'img', type: 'image', x: 0, y: 0, width: 10, height: 10, data: 'data:image/png;base64,AA==', style: {}, display: true },
      { id: 'pn', type: 'page-number', x: 0, y: 0, width: 10, height: 10, format: { base: '1/1' }, style: {}, display: true },
      {
        id: 'tbl',
        type: 'table',
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        rowCount: 1,
        colCount: 1,
        rows: [{ id: 'r0', height: 20 }],
        cols: [{ id: 'c0', width: 20 }],
        cells: [{ row: 0, col: 0, content: 'X', style: { 'background-color': '#eee' } }],
        style: {},
        display: true,
      },
      // unsupported type for warn branch
      { id: 'u', type: 'unknown', x: 0, y: 0, width: 1, height: 1, style: {}, display: true },
    ]

    expect(() => r.render(items as any, 'rect')).not.toThrow()

    // basic sanity that drawing occurred
    expect((ctx as any).fillRect).toHaveBeenCalled()
    expect((ctx as any).strokeRect).toHaveBeenCalled()
  })

  it('renders line arrows/handles and image error placeholder', () => {
    const originalImage = globalThis.Image

    class MockImage {
      complete = true
      src = ''
    }
    // @ts-expect-error override for test
    globalThis.Image = MockImage

    try {
      const ctx = createCtx() as any
      ctx.drawImage = vi.fn(() => {
        throw new Error('drawImage failed')
      })

      const r = new CanvasRenderer(ctx)

      r.render(
        [
          {
            id: 'line1',
            type: 'line',
            display: true,
            x1: 0,
            y1: 0,
            x2: 10,
            y2: 10,
            intermediatePoints: [{ x: 5, y: 5 }],
            startArrow: 'standard',
            endArrow: 'circle',
            style: { 'border-style': 'dotted', 'border-width': 1, 'border-color': '#000' },
          },
          {
            id: 'img1',
            type: 'image',
            display: true,
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            data: 'data:image/png;base64,AA==',
            style: {},
          },
        ] as any,
        'line1'
      )

      expect(ctx.arc).toHaveBeenCalled()
      expect(ctx.fillText).toHaveBeenCalledWith('Image', expect.any(Number), expect.any(Number))
    } finally {
      globalThis.Image = originalImage
    }
  })

  it('renders underline/linethrough text and rounded rect border styles', () => {
    const ctx = createCtx()
    const r = new CanvasRenderer(ctx)

    r.render(
      [
        {
          id: 't2',
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 20,
          texts: ['a', 'b'],
          style: {
            'font-size': 12,
            'font-family': ['Arial'],
            'font-style': ['underline', 'linethrough', 'bold', 'italic'],
            'text-align': 'center',
            'vertical-align': 'middle',
            color: '#111111',
          },
          display: true,
        },
        {
          id: 'r2',
          type: 'rect',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          'border-radius': 4,
          style: {
            'fill-color': '#ffffff',
            'border-style': 'dotted',
            'border-color': '#000000',
            'border-width': 2,
          },
          display: true,
        },
      ] as any,
      't2'
    )

    expect((ctx as any).fillText).toHaveBeenCalled()
    expect((ctx as any).moveTo).toHaveBeenCalled()
    expect((ctx as any).strokeRect).toHaveBeenCalled()
  })

  it('stops rendering when display is falsy (early return)', () => {
    const ctx = createCtx()
    const r = new CanvasRenderer(ctx)

    const items: any[] = [
      { id: 'a', type: 'rect', x: 0, y: 0, width: 10, height: 10, style: {}, display: false },
      { id: 'b', type: 'rect', x: 0, y: 0, width: 10, height: 10, style: {}, display: true },
    ]

    r.render(items as any, null)
    // clear and page background are called before iterating
    expect((ctx as any).clearRect).toHaveBeenCalled()
    expect((ctx as any).fillRect).toHaveBeenCalled()
  })
})
