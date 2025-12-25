import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const groupProps: any[] = []
const rectProps: any[] = []
const ellipseProps: any[] = []

vi.mock('react-konva', async () => {
  const React = await import('react')
  return {
    Group: React.forwardRef((props: any, ref: any) => {
      if (ref) {
        if (typeof ref === 'function') ref({ id: props.id })
        else ref.current = { id: props.id }
      }
      groupProps.push(props)
      return <div data-testid="Group">{props.children}</div>
    }),
    Rect: (props: any) => {
      rectProps.push(props)
      return <div data-testid="Rect" />
    },
    Ellipse: (props: any) => {
      ellipseProps.push(props)
      return <div data-testid="Ellipse" />
    },
  }
})

import { ShapeElement } from '@/features/konva-editor/renderers/bed-elements/ShapeElement'

describe('ShapeElement', () => {
  beforeEach(() => {
    groupProps.length = 0
    rectProps.length = 0
    ellipseProps.length = 0
  })

  it('renders a rect with selected styling', () => {
    const element = {
      id: 'shape-1',
      t: 'shape',
      shape: 'rect',
      x: 10,
      y: 20,
      w: 100,
      h: 40,
      r: 0,
      radius: 6,
      fill: '#fff',
    } as any

    render(
      <ShapeElement
        element={element}
        isSelected={true}
        onSelect={() => {}}
        onChange={() => {}}
      />
    )

    expect(rectProps[0].cornerRadius).toBe(6)
    expect(rectProps[0].stroke).toBe('#3b82f6')
    expect(rectProps[0].strokeWidth).toBe(2)
  })

  it('renders an ellipse and updates position on drag end', () => {
    const onChange = vi.fn()
    const element = {
      id: 'shape-2',
      t: 'shape',
      shape: 'ellipse',
      x: 0,
      y: 0,
      w: 50,
      h: 30,
      r: 0,
      fill: '#eee',
    } as any

    render(
      <ShapeElement
        element={element}
        isSelected={false}
        onSelect={() => {}}
        onChange={onChange}
      />
    )

    expect(ellipseProps[0].radiusX).toBe(25)
    expect(ellipseProps[0].radiusY).toBe(15)

    const dragEndEvent = {
      target: {
        x: () => 12,
        y: () => 34,
      },
    }

    groupProps[0].onDragEnd(dragEndEvent as any)

    expect(onChange).toHaveBeenCalledWith({ x: 12, y: 34 })
  })
})
