import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock(
  '@/features/konva-editor/renderers/print/ReportPrintLayout',
  () => ({
    RenderLine: ({ element }: any) => <div data-testid={`print-line-${element.id}`} />,
    RenderShape: ({ element }: any) => <div data-testid={`print-shape-${element.id}`} />,
  })
)

vi.mock(
  '@/features/report-editor/components/WysiwygCanvas/canvasImageUtils',
  () => ({
    findImageWithExtension: vi.fn(async (src: string) => ({ url: `resolved:${src}` })),
  })
)

import { BedPrintLayout } from '@/features/konva-editor/renderers/print/BedPrintLayout'

describe('BedPrintLayout', () => {
  it('renders bed/text/shape/line/image and skips hidden/invalid elements', async () => {
    const doc = {
      type: 'bed-layout',
      layout: { width: 300, height: 200 },
      elementOrder: ['bed1', 't1', 's1', 'l1', 'img1', 'img2', 'hidden', 'invalid'],
      elementsById: {
        bed1: {
          id: 'bed1',
          t: 'widget',
          widget: 'bed',
          x: 10,
          y: 20,
          w: 100,
          h: 60,
          data: { status: 'alarm', label: 'Bed A', patientName: 'P', bloodPressure: '120/80', orientation: 'vertical' },
        },
        t1: { id: 't1', t: 'text', x: 0, y: 0, w: 50, h: 20, text: 'Hello', fontSize: 12, fill: '#000', align: 'l' },
        s1: { id: 's1', t: 'shape', x: 5, y: 5, w: 10, h: 10, shape: 'Rect', stroke: '#000', strokeW: 1, fill: '#fff' },
        l1: { id: 'l1', t: 'line', points: [0, 0, 10, 10], stroke: '#000', strokeW: 1 },
        img1: { id: 'img1', t: 'image', x: 0, y: 30, w: 20, h: 20, src: 'data:image/png;base64,xxx' },
        img2: { id: 'img2', t: 'image', x: 30, y: 30, w: 20, h: 20, src: 'asset-id' },
        hidden: { id: 'hidden', t: 'text', x: 0, y: 60, w: 50, h: 20, text: 'Hidden', hidden: true },
        invalid: { id: 'invalid', t: 'unknown' },
      },
    } as any

    render(<BedPrintLayout document={doc} />)

    expect(screen.getByText('Bed A')).toBeInTheDocument()
    expect(screen.getByText('P')).toBeInTheDocument()
    expect(screen.getByText('120/80')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByTestId('print-shape-s1')).toBeInTheDocument()
    expect(screen.getByTestId('print-line-l1')).toBeInTheDocument()

    expect(await screen.findByAltText('Asset preview')).toBeInTheDocument()
    expect(screen.getAllByAltText('Asset preview').length).toBe(2)
    expect(screen.queryByText('Hidden')).toBeNull()
  })
})
