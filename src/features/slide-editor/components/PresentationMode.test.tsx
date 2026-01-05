import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PresentationMode } from '@/features/slide-editor/components/PresentationMode'

vi.mock('@/components/canvas/CanvasElementRenderer', () => ({
  CanvasElementRenderer: ({ element }: any) => (
    <div data-testid={`element-${element.id}`}>{element.id}</div>
  ),
}))

vi.mock('react-konva', () => ({
  Stage: ({ children }: any) => <div data-testid="stage">{children}</div>,
  Layer: ({ children }: any) => <div data-testid="layer">{children}</div>,
  Rect: ({ width, height, fill }: any) => (
    <div data-testid="rect" style={{ width, height, backgroundColor: fill }} />
  ),
}))

describe('features/slide-editor/components/PresentationMode', () => {
  const mockDoc = {
    id: 'doc1',
    v: 1,
    unit: 'mm',
    surfaces: [
      { id: 's1', type: 'slide', w: 297, h: 210, bg: '#ffffff' },
      { id: 's2', type: 'slide', w: 297, h: 210, bg: '#eeeeee' },
    ],
    nodes: [
      { id: 'n1', t: 'text', s: 's1', x: 10, y: 10, w: 100, h: 20, text: 'Slide 1' },
      { id: 'n2', t: 'text', s: 's2', x: 20, y: 30, w: 100, h: 20, text: 'Slide 2' },
    ],
  } as any

  it('renders first slide by default', () => {
    const onExit = vi.fn()
    render(
      <PresentationMode
        doc={mockDoc}
        initialSlideId="s1"
        onExit={onExit}
      />
    )

    expect(screen.getByTestId('stage')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('calls onExit when close button is clicked', () => {
    const onExit = vi.fn()
    render(
      <PresentationMode
        doc={mockDoc}
        initialSlideId="s1"
        onExit={onExit}
      />
    )

    const closeButtons = screen.getAllByTitle('Close')
    expect(closeButtons.length).toBeGreaterThan(0)
    const closeButton = closeButtons[0]
    closeButton.click()
    expect(onExit).toHaveBeenCalled()
  })
})
