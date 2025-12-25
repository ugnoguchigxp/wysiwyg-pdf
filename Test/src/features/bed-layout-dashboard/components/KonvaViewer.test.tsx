import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { KonvaViewer } from '@/features/bed-layout-dashboard/components/KonvaViewer'
import { Doc } from '@/types/canvas'

vi.mock('react-konva', () => ({
  Stage: ({ children, width, height }: any) => (
    <div role="img" width={width} height={height}>
      {children}
    </div>
  ),
  Layer: ({ children }: any) => <div data-testid="layer">{children}</div>,
  Group: ({ children }: any) => <div data-testid="group">{children}</div>,
}))

vi.mock('@/features/konva-editor/viewers/components/PaperBackground', () => ({
  PaperBackground: () => <div data-testid="paper-background" />,
}))

vi.mock('@/features/bed-layout-dashboard/components/ElementRenderer', () => ({
  ElementRenderer: ({ element, onBedClick }: any) => (
    <button
      type="button"
      data-testid="element-renderer"
      data-element-id={element?.id}
      onClick={() => onBedClick?.(element?.id, { mocked: true })}
    />
  ),
}))

describe('features/bed-layout-dashboard/components/KonvaViewer', () => {
  const createMockDoc = (): Doc => ({
    v: 1,
    id: 'doc1',
    title: 'Test Doc',
    unit: 'mm' as const,
    surfaces: [{ id: 'layout', type: 'canvas', w: 100, h: 200, margin: { t: 0, r: 0, b: 0, l: 0 } }],
    nodes: [
      { id: 'bed1', t: 'widget', widget: 'bed', x: 10, y: 10, w: 50, h: 50, s: 'layout', name: 'A' },
      { id: 'text1', t: 'text', x: 100, y: 50, w: 100, h: 30, s: 'layout', text: 'Hello' },
    ],
  })

  it('renders Stage with correct dimensions', () => {
    render(<KonvaViewer document={createMockDoc()} width={800} />)

    const stage = screen.getByRole('img')
    expect(stage).toBeInTheDocument()
    expect(stage).toHaveAttribute('width', '800')
  })

  it('renders elements', () => {
    render(<KonvaViewer document={createMockDoc()} width={800} />)

    expect(screen.getByTestId('paper-background')).toBeInTheDocument()
    expect(screen.getAllByTestId('element-renderer')).toHaveLength(2)
  })

  it('shows invalid layout message when no valid data', () => {
    render(<KonvaViewer document={createMockDoc()} width={0} />)

    expect(screen.getByText('Invalid Layout Data')).toBeInTheDocument()
  })

  it('passes bedStatusMap to ElementRenderer', () => {
    const bedStatusMap = { bed1: { status: 'occupied', patientId: 'P123' } }

    render(<KonvaViewer document={createMockDoc()} width={800} bedStatusMap={bedStatusMap} />)

    expect(screen.getAllByTestId('element-renderer')).toHaveLength(2)
  })

  it('passes surfaceId prop', () => {
    render(<KonvaViewer document={createMockDoc()} width={800} surfaceId="s1" />)

    expect(screen.getByTestId('paper-background')).toBeInTheDocument()
  })

  it('handles readOnly prop', () => {
    render(<KonvaViewer document={createMockDoc()} width={800} readOnly={true} />)

    expect(screen.getAllByTestId('element-renderer')).toHaveLength(2)
  })

  it('calls onBedClick when bed is clicked', () => {
    const onBedClick = vi.fn()

    render(<KonvaViewer document={createMockDoc()} width={800} onBedClick={onBedClick} />)

    const bedElement = screen
      .getAllByTestId('element-renderer')
      .find((node) => node.getAttribute('data-element-id') === 'bed1')
    bedElement?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onBedClick).toHaveBeenCalledWith('bed1', expect.any(Object))
  })

  it('updates local document when document prop changes', async () => {
    const { rerender } = render(<KonvaViewer document={createMockDoc()} width={800} />)

    const newDoc = {
      ...createMockDoc(),
      nodes: [
        ...createMockDoc().nodes,
        { id: 'text2', t: 'text', x: 120, y: 60, w: 100, h: 30, s: 'layout', text: 'More' },
      ],
    }
    rerender(<KonvaViewer document={newDoc} width={800} />)

    await waitFor(() => {
      expect(screen.getAllByTestId('element-renderer')).toHaveLength(3)
    })
  })

  it('calculates scale based on width and content', () => {
    const doc = createMockDoc()
    render(<KonvaViewer document={doc} width={400} />)

    const stage = screen.getByRole('img')
    const stageWidth = parseFloat(stage.getAttribute('width') || '0')
    expect(stageWidth).toBeGreaterThan(0)
  })
})
