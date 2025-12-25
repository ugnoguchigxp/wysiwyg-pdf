import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ShapeRenderer } from '@/components/canvas/renderers/ShapeRenderer'

const recorded = {
  Rect: [] as any[],
  Ellipse: [] as any[],
  Line: [] as any[],
  Star: [] as any[],
  Path: [] as any[],
}

const resetRecorded = () => {
  recorded.Rect.length = 0
  recorded.Ellipse.length = 0
  recorded.Line.length = 0
  recorded.Star.length = 0
  recorded.Path.length = 0
}

const record = (key: keyof typeof recorded, props: any) => {
  recorded[key].push(props)
}

vi.mock('react-konva', () => ({
  Rect: (props: any) => {
    record('Rect', props)
    return <div data-testid="Rect" />
  },
  Ellipse: (props: any) => {
    record('Ellipse', props)
    return <div data-testid="Ellipse" />
  },
  Line: (props: any) => {
    record('Line', props)
    return <div data-testid="Line" />
  },
  Star: (props: any) => {
    record('Star', props)
    return <div data-testid="Star" />
  },
  Path: (props: any) => {
    record('Path', props)
    return <div data-testid="Path" />
  },
}))

describe('components/canvas/renderers/ShapeRenderer', () => {
  const commonProps = { id: 's1', ref: () => { } } as any

  it('renders rect and circle with expected geometry', () => {
    resetRecorded()

    render(
      <ShapeRenderer
        element={{ id: 'r1', t: 'shape', shape: 'rect', x: 10, y: 20, w: 40, h: 50, fill: 'red' } as any}
        commonProps={commonProps}
      />
    )
    const rectProps = recorded.Rect[0]
    expect(rectProps.fill).toBe('red')
    expect(rectProps.cornerRadius).toBeUndefined()

    render(
      <ShapeRenderer
        element={{ id: 'c1', t: 'shape', shape: 'circle', x: 10, y: 20, w: 40, h: 50, fill: 'blue' } as any}
        commonProps={commonProps}
      />
    )
    const ellipseProps = recorded.Ellipse[0]
    expect(ellipseProps.x).toBe(30)
    expect(ellipseProps.y).toBe(45)
    expect(ellipseProps.radiusX).toBe(20)
    expect(ellipseProps.radiusY).toBe(25)
  })

  it('renders line-based shapes and paths', () => {
    resetRecorded()

    render(
      <ShapeRenderer
        element={{ id: 't1', t: 'shape', shape: 'triangle', w: 40, h: 30, fill: 'green' } as any}
        commonProps={commonProps}
      />
    )
    expect(recorded.Line[0].points).toEqual([20, 0, 40, 30, 0, 30])

    render(
      <ShapeRenderer
        element={{ id: 'd1', t: 'shape', shape: 'diamond', w: 40, h: 30, fill: 'orange' } as any}
        commonProps={commonProps}
      />
    )
    expect(recorded.Line[1].points).toEqual([20, 0, 40, 15, 20, 30, 0, 15])

    render(
      <ShapeRenderer
        element={{ id: 'a1', t: 'shape', shape: 'arrow-r', w: 24, h: 24, fill: 'black' } as any}
        commonProps={commonProps}
      />
    )
    expect(recorded.Path[0].data).toContain('M20 12')
  })

  it('renders star and default fallback', () => {
    resetRecorded()

    render(
      <ShapeRenderer
        element={{ id: 's1', t: 'shape', shape: 'star', x: 0, y: 0, w: 40, h: 40, fill: 'gold' } as any}
        commonProps={commonProps}
      />
    )
    const starProps = recorded.Star[0]
    expect(starProps.numPoints).toBe(5)
    expect(starProps.outerRadius).toBe(20)

    render(
      <ShapeRenderer
        element={{ id: 'u1', t: 'shape', shape: 'unknown', w: 10, h: 10, fill: 'gray' } as any}
        commonProps={commonProps}
      />
    )
    const fallbackRect = recorded.Rect[0]
    expect(fallbackRect.fill).toBe('gray')
  })

  it('covers trapezoid, cylinder, and icon-like paths', () => {
    resetRecorded()

    render(
      <ShapeRenderer
        element={{ id: 't1', t: 'shape', shape: 'trapezoid', w: 50, h: 40, fill: 'pink' } as any}
        commonProps={commonProps}
      />
    )
    expect(recorded.Line[0].points).toEqual([10, 0, 40, 0, 50, 40, 0, 40])

    render(
      <ShapeRenderer
        element={{ id: 'cyl', t: 'shape', shape: 'cylinder', w: 60, h: 30, fill: 'teal' } as any}
        commonProps={commonProps}
      />
    )
    expect(recorded.Rect[0].fill).toBe('teal')

    render(
      <ShapeRenderer
        element={{ id: 'au', t: 'shape', shape: 'arrow-u', w: 24, h: 24, fill: 'black' } as any}
        commonProps={commonProps}
      />
    )
    render(
      <ShapeRenderer
        element={{ id: 'ad', t: 'shape', shape: 'arrow-d', w: 24, h: 24, fill: 'black' } as any}
        commonProps={commonProps}
      />
    )
    render(
      <ShapeRenderer
        element={{ id: 'al', t: 'shape', shape: 'arrow-l', w: 24, h: 24, fill: 'black' } as any}
        commonProps={commonProps}
      />
    )
    render(
      <ShapeRenderer
        element={{ id: 'tree', t: 'shape', shape: 'tree', w: 24, h: 24, fill: 'black' } as any}
        commonProps={commonProps}
      />
    )
    render(
      <ShapeRenderer
        element={{ id: 'house', t: 'shape', shape: 'house', w: 24, h: 24, fill: 'black' } as any}
        commonProps={commonProps}
      />
    )

    expect(recorded.Path.length).toBeGreaterThanOrEqual(5)
  })
})
