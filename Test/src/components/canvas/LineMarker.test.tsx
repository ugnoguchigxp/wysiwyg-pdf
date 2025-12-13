import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-konva', () => ({
  Line: (props: any) => <div data-testid="Line" data-props={JSON.stringify(props)} />,
  Circle: (props: any) => <div data-testid="Circle" data-props={JSON.stringify(props)} />,
  RegularPolygon: (props: any) => (
    <div data-testid="RegularPolygon" data-props={JSON.stringify(props)} />
  ),
}))

import { LineMarker } from '../../../../src/components/canvas/LineMarker'

describe('components/canvas/LineMarker', () => {
  it('returns null for type=none', () => {
    const { container } = render(
      <LineMarker x={0} y={0} angle={0} type="none" color="red" />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders correct marker types', () => {
    const { rerender } = render(
      <LineMarker x={1} y={2} angle={Math.PI / 2} type="arrow" color="black" />
    )
    expect(screen.getByTestId('Line')).toBeInTheDocument()

    rerender(<LineMarker x={1} y={2} angle={0} type="circle" color="black" />)
    expect(screen.getByTestId('Circle')).toBeInTheDocument()

    rerender(<LineMarker x={1} y={2} angle={0} type="diamond" color="black" />)
    expect(screen.getByTestId('RegularPolygon')).toBeInTheDocument()
  })

  it('returns null for unknown type (defensive default)', () => {
    const { container } = render(
      <LineMarker x={0} y={0} angle={0} type={'unknown' as any} color="red" />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
