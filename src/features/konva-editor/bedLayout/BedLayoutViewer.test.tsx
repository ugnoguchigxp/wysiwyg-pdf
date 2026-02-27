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
  BedElement: (props: any) => (
    <div
      data-testid={`bed-${props.bedStatus?.status ?? 'none'}`}
      data-group-color={props.groupColor ?? ''}
    />
  ),
  BedOverlayText: () => <div data-testid="bed-overlay" />,
}))

import { BedLayoutViewer } from '@/features/konva-editor/viewers/BedLayoutViewer'

describe('BedLayoutViewer', () => {
  const createDoc = (options?: {
    groupId?: string
    legacyGroupColor?: string
  }) =>
    ({
      v: 1,
      id: 'doc',
      title: 'bed-layout',
      unit: 'mm',
      surfaces: [{ id: 'layout', type: 'canvas', w: 300, h: 200 }],
      nodes: [
        {
          id: 'bed1',
          t: 'widget',
          widget: 'bed',
          s: 'layout',
          data: options?.groupId ? { groupId: options.groupId } : undefined,
        },
      ],
      data: options?.legacyGroupColor
        ? {
            bedGroups: [{ id: 'legacy-group', name: 'Legacy Group', color: options.legacyGroupColor }],
          }
        : undefined,
    }) as any

  it('renders background and custom bed with dashboard status', () => {
    const doc = createDoc()

    render(<BedLayoutViewer document={doc} zoom={1} dashboardData={{ bed1: { status: 'active' } as any }} />)

    expect(screen.getByTestId('paper-size').textContent).toBe('300x200')
    expect(screen.getByTestId('paper-bg')).toBeInTheDocument()
    expect(screen.getByTestId('bed-active')).toBeInTheDocument()
  })

  it('uses bedGroups prop to resolve group color', () => {
    const doc = createDoc()

    render(
      <BedLayoutViewer
        document={doc}
        zoom={1}
        bedGroups={[{ id: 'group-1', name: 'Group 1', color: '#3b82f6', bedIds: ['bed1'] }]}
      />
    )

    expect(screen.getByTestId('bed-none')).toHaveAttribute('data-group-color', '#3b82f6')
  })

  it('falls back to document.data.bedGroups when bedGroups prop is not provided', () => {
    const doc = createDoc({ groupId: 'legacy-group', legacyGroupColor: '#ef4444' })

    render(<BedLayoutViewer document={doc} zoom={1} />)

    expect(screen.getByTestId('bed-none')).toHaveAttribute('data-group-color', '#ef4444')
  })

  it('prioritizes bedGroups prop over legacy document group data', () => {
    const doc = createDoc({ groupId: 'legacy-group', legacyGroupColor: '#ef4444' })

    render(
      <BedLayoutViewer
        document={doc}
        zoom={1}
        bedGroups={[{ id: 'group-1', name: 'Group 1', color: '#10b981', bedIds: ['bed1'] }]}
      />
    )

    expect(screen.getByTestId('bed-none')).toHaveAttribute('data-group-color', '#10b981')
  })
})
