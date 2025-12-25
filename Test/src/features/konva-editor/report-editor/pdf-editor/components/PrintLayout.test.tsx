import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/konva-editor/utils/canvasImageUtils', () => ({
  findImageWithExtension: vi.fn(async (assetId: string) => ({
    url: `resolved://${assetId}`,
    img: {} as any,
  })),
}))

import { PrintLayout, RenderLine, RenderShape, RenderSignature } from '@/features/konva-editor/renderers/print/ReportPrintLayout'

describe('PrintLayout', () => {
  it('renders pages and elements (including bg image resolution)', async () => {
    render(
      <PrintLayout
        doc={{
          v: 1,
          id: 'd',
          title: 't',
          unit: 'mm',
          surfaces: [
            { id: 'p1', type: 'page', w: 100, h: 100, bg: '#ff0000' },
            { id: 'p2', type: 'page', w: 100, h: 100, bg: 'asset-bg' },
          ],
          nodes: [
            { id: 't1', t: 'text', s: 'p1', x: 1, y: 2, w: 10, h: 10, text: 'Hello', fontSize: 12, align: 'c', vAlign: 'm' },
            { id: 's1', t: 'shape', s: 'p1', x: 0, y: 0, w: 10, h: 10, shape: 'rect', stroke: '#000', strokeW: 1 },
            { id: 'l1', t: 'line', s: 'p1', pts: [0, 0, 10, 10], stroke: '#000', strokeW: 1 },
            { id: 'i1', t: 'image', s: 'p2', x: 0, y: 0, w: 10, h: 10, src: 'asset-img' },
            {
              id: 'tbl',
              t: 'table',
              s: 'p1',
              x: 0,
              y: 0,
              w: 20,
              h: 20,
              table: { rows: [20], cols: [20], cells: [{ r: 0, c: 0, v: 'X', border: '1', bg: '#eee', align: 'c' }] },
            },
            {
              id: 'sig',
              t: 'signature',
              s: 'p1',
              x: 0,
              y: 0,
              w: 10,
              h: 10,
              strokes: [[0, 0, 1, 1]],
              stroke: '#000',
              strokeW: 2,
            },
          ],
        } as any}
        orientation="landscape"
      />
    )

    // text appears
    expect(screen.getByText('Hello')).toBeInTheDocument()

    // page indicator shows 1 / 2
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    // bg image and image element should resolve via mocked finder
    await waitFor(() => {
      // imgs use `alt=""` so they are not accessible roles; check DOM directly
      expect(document.querySelectorAll('img').length).toBeGreaterThanOrEqual(2)
    })
  })

  it('renders helper components', () => {
    const { container: c1 } = render(
      <RenderSignature element={{ strokes: [[0, 0, 1, 1]], stroke: '#000', strokeW: 2 } as any} />
    )
    expect(c1.querySelector('path')).toBeTruthy()

    const { container: c2 } = render(<RenderShape element={{ w: 10, h: 10, shape: 'triangle' } as any} />)
    expect(c2.querySelector('polygon')).toBeTruthy()

    const { container: c3 } = render(
      <RenderLine element={{ pts: [0, 0, 10, 10], stroke: '#000', strokeW: 1 } as any} />
    )
    expect(c3.querySelector('polyline')).toBeTruthy()
  })
})
