import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-konva', () => ({
  Group: ({ children }: any) => <div data-testid="Group">{children}</div>,
  Rect: (props: any) => <div data-testid="Rect" data-props={JSON.stringify(props)} />,
}))

import { PaperBackground } from '@/features/konva-editor/viewers/components/PaperBackground'

describe('features/konva-editor/viewers/components/PaperBackground', () => {
  it('renders background rect with dimensions from default surface', () => {
    const doc = {
      id: 'doc1',
      surfaces: [
        { id: 's1', type: 'canvas', x: 0, y: 0, w: 210, h: 297, name: 'Surface' },
      ],
    } as any

    render(<PaperBackground document={doc} />)

    const rect = screen.getByTestId('Rect')
    const props = JSON.parse(rect.getAttribute('data-props') || '{}')
    expect(props.width).toBe(210)
    expect(props.height).toBe(297)
    expect(props.fill).toBe('white')
  })

  it('renders background rect with dimensions from specified surface', () => {
    const doc = {
      id: 'doc1',
      surfaces: [
        { id: 's1', type: 'canvas', x: 0, y: 0, w: 210, h: 297, name: 'Surface 1' },
        { id: 's2', type: 'canvas', x: 0, y: 0, w: 297, h: 210, name: 'Surface 2' },
      ],
    } as any

    render(<PaperBackground document={doc} surfaceId="s2" />)

    const rect = screen.getByTestId('Rect')
    const props = JSON.parse(rect.getAttribute('data-props') || '{}')
    expect(props.width).toBe(297)
    expect(props.height).toBe(210)
  })

  it('falls back to first canvas surface if surfaceId not found', () => {
    const doc = {
      id: 'doc1',
      surfaces: [
        { id: 's1', type: 'print', x: 0, y: 0, w: 100, h: 100, name: 'Print' },
        { id: 's2', type: 'canvas', x: 0, y: 0, w: 200, h: 200, name: 'Canvas' },
      ],
    } as any

    render(<PaperBackground document={doc} surfaceId="nonexistent" />)

    const rect = screen.getByTestId('Rect')
    const props = JSON.parse(rect.getAttribute('data-props') || '{}')
    expect(props.width).toBe(0)
    expect(props.height).toBe(0)
  })

  it('renders zero dimensions if no surfaces', () => {
    const doc = {
      id: 'doc1',
      surfaces: [],
    } as any

    render(<PaperBackground document={doc} />)

    const rect = screen.getByTestId('Rect')
    const props = JSON.parse(rect.getAttribute('data-props') || '{}')
    expect(props.width).toBe(0)
    expect(props.height).toBe(0)
  })
})
