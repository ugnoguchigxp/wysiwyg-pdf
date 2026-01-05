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

vi.mock('@/features/konva-editor/viewers/components/PaperBackground', () => ({
  PaperBackground: () => <div data-testid="paper-bg" />,
}))

vi.mock('@/features/konva-editor/renderers/bed-elements/BedElement', () => ({
  BedElement: (props: any) => <div data-testid={`bed-${props.bedStatus?.status ?? 'none'}`} />,
  BedOverlayText: () => <div data-testid="bed-overlay" />,
}))

import { BedLayoutViewer } from '@/features/konva-editor/viewers/BedLayoutViewer'

describe('BedLayoutViewer', () => {
  it('renders background and custom bed with dashboard status', () => {
    const doc = {
      v: 1,
      id: 'doc',
      title: 'bed-layout',
      unit: 'mm',
      surfaces: [{ id: 'layout', type: 'canvas', w: 300, h: 200 }],
      nodes: [{ id: 'bed1', t: 'widget', widget: 'bed', s: 'layout' }],
    } as any

    render(<BedLayoutViewer document={doc} zoom={1} dashboardData={{ bed1: { status: 'active' } as any }} />)

    expect(screen.getByTestId('paper-size').textContent).toBe('300x200')
    expect(screen.getByTestId('paper-bg')).toBeInTheDocument()
    expect(screen.getByTestId('bed-active')).toBeInTheDocument()
  })
})

