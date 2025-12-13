import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../../../../../src/utils/logger', () => ({
  createContextLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import {
  drawBackgroundImage,
  drawImageElement,
  drawTableElement,
  findImageWithExtension,
  preloadBackgroundImage,
} from '../../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/components/WysiwygCanvas/canvasImageUtils'

function createCtx() {
  const base: any = { canvas: { width: 100, height: 100 } }
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as any]
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

describe('canvasImageUtils', () => {
  it('findImageWithExtension supports data url and handles error', async () => {
    const OriginalImage = globalThis.Image
    class MockImage {
      onload: null | (() => void) = null
      onerror: null | (() => void) = null
      set src(v: string) {
        if (v.includes('ok')) queueMicrotask(() => this.onload?.())
        else queueMicrotask(() => this.onerror?.())
      }
    }
    // @ts-expect-error test override
    globalThis.Image = MockImage

    const ok = await findImageWithExtension('data:ok')
    expect(ok?.url).toBe('data:ok')

    const ng = await findImageWithExtension('data:ng')
    expect(ng).toBeNull()

    globalThis.Image = OriginalImage
  })

  it('findImageWithExtension tries extensions with assetBaseUrl', async () => {
    const OriginalImage = globalThis.Image
    class MockImage {
      onload: null | (() => void) = null
      onerror: null | (() => void) = null
      set src(v: string) {
        // succeed on png
        if (v.endsWith('.png')) queueMicrotask(() => this.onload?.())
        else queueMicrotask(() => this.onerror?.())
      }
    }
    // @ts-expect-error test override
    globalThis.Image = MockImage
    ;(globalThis as any).__WYSIWYG_PDF__ = { assetBaseUrl: 'https://example.com//' }

    const res = await findImageWithExtension('asset1')
    expect(res?.url).toContain('/assets/images/asset1.png')

    globalThis.Image = OriginalImage
    delete (globalThis as any).__WYSIWYG_PDF__
  })

  it('drawImageElement draws placeholders and cached images', () => {
    const ctx = createCtx()
    const setImageCache = vi.fn()
    const cache = new Map<string, any>()

    drawImageElement(
      ctx,
      { id: 'i', t: 'image', s: 's', x: 0, y: 0, w: 10, h: 10, src: '' } as any,
      cache as any,
      setImageCache as any,
      { loading: 'Loading...', placeholder: 'Image' }
    )
    expect((ctx as any).fillText).toHaveBeenCalled()

    cache.set('http://x', { complete: true })
    drawImageElement(
      ctx,
      { id: 'i', t: 'image', s: 's', x: 0, y: 0, w: 10, h: 10, src: 'http://x' } as any,
      cache as any,
      setImageCache as any,
      { loading: 'Loading...', placeholder: 'Image' }
    )
    expect((ctx as any).drawImage).toHaveBeenCalled()
  })

  it('drawTableElement renders cells and text alignment', () => {
    const ctx = createCtx()
    drawTableElement(ctx, {
      id: 't',
      t: 'table',
      s: 's',
      x: 0,
      y: 0,
      w: 20,
      h: 20,
      table: {
        rows: [10],
        cols: [10],
        cells: [
          { r: 0, c: 0, v: 'L', border: '1', align: 'l' },
          { r: 0, c: 0, v: 'C', border: '1', align: 'c' },
          { r: 0, c: 0, v: 'R', border: '1', align: 'r' },
        ],
      },
    } as any)

    expect((ctx as any).fillText).toHaveBeenCalled()
    expect((ctx as any).strokeRect).toHaveBeenCalled()
  })

  it('drawBackgroundImage handles data/url and id based paths', () => {
    const ctx = createCtx()
    const cache = new Map<string, any>()

    drawBackgroundImage(ctx, 'data:bg', 100, 100, cache as any, { loading: 'L', imageLoading: (n) => n })
    expect((ctx as any).fillText).toHaveBeenCalled()

    cache.set('data:bg', { complete: true })
    drawBackgroundImage(ctx, 'data:bg', 100, 100, cache as any)
    expect((ctx as any).drawImage).toHaveBeenCalled()

    drawBackgroundImage(ctx, 'id1', 100, 100, cache as any, { loading: 'L', imageLoading: (n) => `loading:${n}` })
    expect((ctx as any).fillText).toHaveBeenCalledWith('loading:id1', 50, 50)
  })

  it('preloadBackgroundImage populates cache and ignores duplicates', async () => {
    const OriginalImage = globalThis.Image
    class MockImage {
      onload: null | (() => void) = null
      onerror: null | (() => void) = null
      set src(_v: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    // @ts-expect-error test override
    globalThis.Image = MockImage

    const cache = new Map<string, any>()
    const setCache = vi.fn((updater: any) => {
      // emulate react setState
      cache.clear()
      const next = updater(new Map())
      for (const [k, v] of next.entries()) cache.set(k, v)
    })

    preloadBackgroundImage('asset1', cache as any, setCache as any)
    await new Promise((r) => setTimeout(r, 0))
    expect(setCache).toHaveBeenCalled()

    // duplicate should no-op
    setCache.mockClear()
    preloadBackgroundImage('asset1', cache as any, setCache as any)
    expect(setCache).not.toHaveBeenCalled()

    globalThis.Image = OriginalImage
  })
})
