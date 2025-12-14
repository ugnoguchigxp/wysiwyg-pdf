import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const canvasRendererSpy = vi.fn((props: any) => {
  props.onSelect?.({} as any)
  props.onChange?.({ id: props.element?.id } as any)
  return <div data-testid="CanvasElementRenderer" />
})

vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => (
    <div data-testid="Stage" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
  Layer: ({ children }: any) => <div data-testid="Layer">{children}</div>,
}))

vi.mock('@/components/canvas/CanvasElementRenderer', () => ({
  CanvasElementRenderer: (props: any) => canvasRendererSpy(props),
}))

import { KonvaViewer } from '@/components/canvas/KonvaViewer'

describe('components/canvas/KonvaViewer', () => {
  it('computes stage size from paper size and zoom and renders elements', () => {
    const ref = React.createRef<any>()
    render(
      <KonvaViewer
        ref={ref}
        elements={[
          { id: 'n1', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'x' } as any,
        ]}
        zoom={2}
        paperWidth={100}
        paperHeight={50}
      />
    )

    const stage = screen.getByTestId('Stage')
    const props = JSON.parse(stage.getAttribute('data-props') || '{}')

    expect(props.width).toBe(200)
    expect(props.height).toBe(100)
    expect(props.scaleX).toBe(2)
    expect(props.scaleY).toBe(2)
    expect(canvasRendererSpy).toHaveBeenCalledTimes(1)
    expect(screen.getAllByTestId('Layer')).toHaveLength(2)

    // cover imperative handle
    expect(ref.current.getStage()).toBeNull()
  })
})
