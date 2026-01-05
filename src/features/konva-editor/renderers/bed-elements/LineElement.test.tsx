import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const lineProps: any[] = []
const circleProps: any[] = []
const lineRefState: { node: any } = { node: null }

vi.mock('react-konva', async () => {
  const React = await import('react')

  const assignRef = (ref: any, value: any) => {
    if (!ref) return
    if (typeof ref === 'function') {
      ref(value)
    } else {
      ref.current = value
    }
  }

  return {
    Group: React.forwardRef((props: any, ref: any) => {
      assignRef(ref, { id: props.id })
      return <div data-testid="Group">{props.children}</div>
    }),
    Line: React.forwardRef((props: any, ref: any) => {
      const node = {
        points: vi.fn(),
        getLayer: () => ({ batchDraw: vi.fn() }),
        draggable: vi.fn(),
      }
      lineProps.push(props)
      lineRefState.node = node
      assignRef(ref, node)
      return <div data-testid="Line" />
    }),
    Circle: React.forwardRef((props: any, ref: any) => {
      const node = {
        position: vi.fn(),
      }
      circleProps.push(props)
      assignRef(ref, node)
      return <div data-testid="Circle" />
    }),
  }
})

import { LineElement } from '@/features/konva-editor/renderers/bed-elements/LineElement'

describe('LineElement', () => {
  beforeEach(() => {
    lineProps.length = 0
    circleProps.length = 0
    lineRefState.node = null
  })

  it('updates points when dragging the line body', () => {
    const onChange = vi.fn()
    const element = {
      id: 'line-1',
      t: 'line',
      pts: [0, 0, 10, 0],
      stroke: '#000',
      strokeW: 1,
    } as any

    render(
      <LineElement
        element={element}
        isSelected={false}
        onSelect={() => {}}
        onChange={onChange}
      />
    )

    const target = {
      x: vi.fn((value?: number) => (value === undefined ? 5 : value)),
      y: vi.fn((value?: number) => (value === undefined ? 7 : value)),
    }

    lineProps[0].onDragEnd({ target } as any)

    expect(onChange).toHaveBeenCalledWith({ pts: [5, 7, 15, 7] })
    expect(target.x).toHaveBeenCalledWith(0)
    expect(target.y).toHaveBeenCalledWith(0)
  })

  it('snaps handle movement with shift and commits on drag end', () => {
    const onChange = vi.fn()
    const element = {
      id: 'line-2',
      t: 'line',
      pts: [0, 0, 10, 0],
      stroke: '#000',
      strokeW: 1,
    } as any

    render(
      <LineElement
        element={element}
        isSelected={true}
        onSelect={() => {}}
        onChange={onChange}
      />
    )

    const startHandle = circleProps[0]
    const dragStartEvent = { cancelBubble: false }
    startHandle.onDragStart(dragStartEvent as any)

    expect(dragStartEvent.cancelBubble).toBe(true)
    expect(lineRefState.node.draggable).toHaveBeenCalledWith(false)

    const dragMoveEvent = {
      target: {
        x: () => 10,
        y: () => 5,
        position: vi.fn(),
      },
      evt: { shiftKey: true },
      cancelBubble: false,
    }

    startHandle.onDragMove(dragMoveEvent as any)

    expect(dragMoveEvent.target.position).toHaveBeenCalled()
    expect(lineRefState.node.points).toHaveBeenCalled()
    expect(dragMoveEvent.cancelBubble).toBe(true)

    const dragEndEvent = { cancelBubble: false }
    startHandle.onDragEnd(dragEndEvent as any)

    expect(dragEndEvent.cancelBubble).toBe(true)
    expect(lineRefState.node.draggable).toHaveBeenCalledWith(true)
    expect(onChange).toHaveBeenCalledWith({ pts: expect.any(Array) })
  })
})
