import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SlidePreview } from '@/features/slide-editor/components/SlidePreview'

vi.mock('@/components/canvas/CanvasElementRenderer', () => ({
  CanvasElementRenderer: ({ element }: any) => (
    <div data-testid={`element-${element.id}`}>{element.id}</div>
  ),
}))

vi.mock('react-konva', () => ({
  Stage: ({ children, width, height }: any) => (
    <div data-testid="stage" style={{ width, height }}>
      {children}
    </div>
  ),
  Layer: ({ children }: any) => <div data-testid="layer">{children}</div>,
  Rect: ({ width, height, fill }: any) => (
    <div data-testid="rect" style={{ width, height, backgroundColor: fill }} />
  ),
}))

describe('features/slide-editor/components/SlidePreview', () => {
  it('renders slide with nodes', () => {
    const surface = { id: 's1', type: 'slide', w: 297, h: 210, bg: '#ffffff' }
    const nodes = [
      { id: 'n1', t: 'text', s: 's1', x: 10, y: 10, w: 100, h: 20, text: 'Test' },
      { id: 'n2', t: 'shape', s: 's1', x: 50, y: 50, w: 50, h: 50, fill: 'red' },
    ]

    render(
      <SlidePreview
        width={500}
        height={400}
        surface={surface}
        nodes={nodes as any}
      />
    )

    expect(screen.getByTestId('stage')).toBeInTheDocument()
    expect(screen.getByTestId('element-n1')).toBeInTheDocument()
    expect(screen.getByTestId('element-n2')).toBeInTheDocument()
  })

  it('returns null when surface has no dimensions', () => {
    const surface = { id: 's1', type: 'slide', w: 0, h: 0, bg: '#ffffff' }
    const nodes: any[] = []

    const { container } = render(
      <SlidePreview
        width={500}
        height={400}
        surface={surface}
        nodes={nodes}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('returns null when container has no dimensions', () => {
    const surface = { id: 's1', type: 'slide', w: 297, h: 210, bg: '#ffffff' }
    const nodes: any[] = []

    const { container } = render(
      <SlidePreview
        width={0}
        height={0}
        surface={surface}
        nodes={nodes}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('calculates correct scale to fit container', () => {
    const surface = { id: 's1', type: 'slide', w: 297, h: 210, bg: '#ffffff' }
    const nodes: any[] = []

    render(
      <SlidePreview
        width={500}
        height={400}
        surface={surface}
        nodes={nodes}
      />
    )

    const stage = screen.getByTestId('stage')
    // Scale should be min(500/297, 400/210) = min(1.68, 1.90) = 1.68
    expect(stage).toBeInTheDocument()
  })
})
