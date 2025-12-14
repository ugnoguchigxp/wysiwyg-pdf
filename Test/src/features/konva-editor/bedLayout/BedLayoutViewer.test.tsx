import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/canvas/KonvaViewer', () => ({
  KonvaViewer: (props: any) => (
    <div>
      <div data-testid="paper-size">
        {props.paperWidth}x{props.paperHeight}
      </div>
      <div data-testid="bg">{props.background}</div>
      <div data-testid="custom">
        {props.renderCustom?.(props.elements?.[0], { ref: null }, () => null)}
      </div>
    </div>
  ),
}))

vi.mock('@/features/bed-layout-editor/components/PaperBackground', () => ({
  PaperBackground: () => <div data-testid="paper-bg" />,
}))

vi.mock('@/features/bed-layout-editor/elements/BedElement', () => ({
  BedElement: (props: any) => <div data-testid={`bed-${props.bedStatus?.status ?? 'none'}`} />,
}))

import { BedLayoutViewer } from '@/features/konva-editor/viewers/BedLayoutViewer'

describe('BedLayoutViewer', () => {
  it('renders background and custom bed with dashboard status', () => {
    const doc = {
      type: 'bed-layout',
      layout: { width: 300, height: 200 },
      elementOrder: ['bed1'],
      elementsById: {
        bed1: { id: 'bed1', t: 'widget', widget: 'bed' },
      },
    } as any

    render(<BedLayoutViewer document={doc} zoom={1} dashboardData={{ bed1: { status: 'active' } as any }} />)

    expect(screen.getByTestId('paper-size').textContent).toBe('300x200')
    expect(screen.getByTestId('paper-bg')).toBeInTheDocument()
    expect(screen.getByTestId('bed-active')).toBeInTheDocument()
  })
})

