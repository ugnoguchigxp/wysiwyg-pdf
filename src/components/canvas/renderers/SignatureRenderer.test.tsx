import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SignatureRenderer } from '@/components/canvas/renderers/SignatureRenderer'

const pathSpy = vi.fn()
vi.mock('@/utils/handwriting', () => ({
  createHandwritingPath: (...args: any[]) => pathSpy(...args),
}))

const recorded = {
  Group: [] as any[],
  Line: [] as any[],
  Path: [] as any[],
  Rect: [] as any[],
}

const resetRecorded = () => {
  recorded.Group.length = 0
  recorded.Line.length = 0
  recorded.Path.length = 0
  recorded.Rect.length = 0
}

const record = (key: keyof typeof recorded, props: any) => {
  recorded[key].push(props)
}

vi.mock('react-konva', () => ({
  Group: ({ children, ...props }: any) => {
    record('Group', props)
    return <div data-testid="Group">{children}</div>
  },
  Line: (props: any) => {
    record('Line', props)
    return <div data-testid="Line" />
  },
  Path: (props: any) => {
    record('Path', props)
    return <div data-testid="Path" />
  },
  Rect: (props: any) => {
    record('Rect', props)
    return <div data-testid="Rect" />
  },
}))

describe('components/canvas/renderers/SignatureRenderer', () => {
  const commonProps = { id: 'sig1', ref: () => { } } as any

  it('renders handwriting paths and hit area', () => {
    resetRecorded()

    render(
      <SignatureRenderer
        element={{
          id: 'sig1',
          t: 'signature',
          x: 0,
          y: 0,
          w: 200,
          h: 100,
          strokes: [
            [0, 0, 10, 10],
            [5, 5, 15, 15],
          ],
          stroke: '#111111',
          strokeW: 0.5,
        } as any}
        commonProps={commonProps}
        stageScale={2}
      />
    )

    expect(recorded.Line.length).toBe(2)
    expect(recorded.Line[0].points).toEqual([0, 0, 10, 10])
    expect(recorded.Line[0].stroke).toBe('#111111')
    expect(recorded.Line[0].strokeWidth).toBe(0.5)
    const rectProps = recorded.Rect[0]
    expect(rectProps.width).toBe(200)
    expect(rectProps.height).toBe(100)
    expect(rectProps.hitStrokeWidth).toBeGreaterThanOrEqual(10)
  })
})
