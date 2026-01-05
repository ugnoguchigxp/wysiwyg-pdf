import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StrokeWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/StrokeWidget'

const resolveText = (_key: string, fallback?: string) => fallback || _key

describe('StrokeWidget', () => {
  it('renders stroke color and width inputs', () => {
    const onChange = vi.fn()
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showColor: true, showWidth: true } } as any}
        node={{ id: 'n1', t: 'shape', stroke: '#ff0000', strokeW: 2 } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    expect(screen.getByText('Stroke Color')).toBeInTheDocument()
    expect(screen.getByText('Line Width')).toBeInTheDocument()
    expect(screen.getByText('#ff0000')).toBeInTheDocument()
  })

  it('updates stroke width on change', () => {
    const onChange = vi.fn()
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showWidth: true } } as any}
        node={{ id: 'n1', t: 'shape', strokeW: 2 } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const widthInput = screen.getByRole('spinbutton')
    fireEvent.change(widthInput, { target: { value: '5' } })

    expect(onChange).toHaveBeenCalledWith({ strokeW: 5 })
  })

  it('does not render color input when showColor is false', () => {
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showColor: false, showWidth: true } } as any}
        node={{ id: 'n1', t: 'shape', stroke: '#ff0000' } as any}
        onChange={vi.fn()}
        resolveText={resolveText}
      />
    )

    expect(screen.queryByText('Stroke Color')).not.toBeInTheDocument()
    expect(screen.getByText('Line Width')).toBeInTheDocument()
  })

  it('does not render width input when showWidth is false', () => {
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showColor: true, showWidth: false } } as any}
        node={{ id: 'n1', t: 'shape', strokeW: 2 } as any}
        onChange={vi.fn()}
        resolveText={resolveText}
      />
    )

    expect(screen.getByText('Stroke Color')).toBeInTheDocument()
    expect(screen.queryByText('Line Width')).not.toBeInTheDocument()
  })

  it('uses default stroke color when not provided', () => {
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showColor: true } } as any}
        node={{ id: 'n1', t: 'shape' } as any}
        onChange={vi.fn()}
        resolveText={resolveText}
      />
    )

    expect(screen.getByText('#000000')).toBeInTheDocument()
  })

  it('uses default stroke width when not provided', () => {
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showWidth: true } } as any}
        node={{ id: 'n1', t: 'shape' } as any}
        onChange={vi.fn()}
        resolveText={resolveText}
      />
    )

    const widthInput = screen.getByRole('spinbutton')
    expect(widthInput).toHaveValue(0.2)
  })

  it('respects maxWidth config', () => {
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showWidth: true, maxWidth: 10 } } as any}
        node={{ id: 'n1', t: 'shape', strokeW: 5 } as any}
        onChange={vi.fn()}
        resolveText={resolveText}
      />
    )

    const widthInput = screen.getByRole('spinbutton')
    expect(widthInput).toHaveAttribute('max', '10')
  })

  it('prevents negative stroke width values', () => {
    const onChange = vi.fn()
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showWidth: true } } as any}
        node={{ id: 'n1', t: 'shape', strokeW: 2 } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const widthInput = screen.getByRole('spinbutton')
    fireEvent.change(widthInput, { target: { value: '-5' } })

    expect(onChange).toHaveBeenCalledWith({ strokeW: 0 })
  })

  it('handles shape nodes', () => {
    const onChange = vi.fn()
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showColor: true, showWidth: true } } as any}
        node={{ id: 's1', t: 'shape', stroke: '#0000ff', strokeW: 3 } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    expect(screen.getByText('Stroke Color')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toHaveValue(3)
    expect(screen.getByText('#0000ff')).toBeInTheDocument()
  })

  it('handles line nodes', () => {
    const onChange = vi.fn()
    render(
      <StrokeWidget
        config={{ type: 'stroke', props: { showColor: true, showWidth: true } } as any}
        node={{ id: 'l1', t: 'line', stroke: '#00ffff', strokeW: 1.5 } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    expect(screen.getByText('Stroke Color')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toHaveValue(1.5)
    expect(screen.getByText('#00ffff')).toBeInTheDocument()
  })
})
