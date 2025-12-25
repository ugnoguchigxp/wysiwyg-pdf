import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { LineRenderer } from '@/components/canvas/renderers/LineRenderer'
import { getOrthogonalPath } from '@/components/canvas/utils/connectionRouting'

vi.mock('@/components/canvas/LineMarker', () => ({
  LineMarker: () => <div data-testid="LineMarker" />,
}))

vi.mock('@/components/canvas/utils/connectionRouting', () => ({
  getAnchorPointAndDirection: vi.fn(() => ({ x: 0, y: 0, nx: 1, ny: 0 })),
  getOrthogonalPath: vi.fn(() => [0, 0, 50, 0, 50, 50]),
}))

const recorded = {
  Group: [] as Array<{ props: any; node: any }>,
  Line: [] as Array<{ props: any; node: any }>,
  Circle: [] as Array<{ props: any; node: any }>,
}

const resetRecorded = () => {
  recorded.Group.length = 0
  recorded.Line.length = 0
  recorded.Circle.length = 0
}

const makeGroupNode = () => ({
  visible: vi.fn(),
  position: vi.fn(),
  rotation: vi.fn(),
  draggable: vi.fn(),
  getLayer: vi.fn(() => ({ batchDraw: vi.fn() })),
})

const makeLineNode = () => ({
  points: vi.fn(),
  getLayer: vi.fn(() => ({ batchDraw: vi.fn() })),
})

const makeCircleNode = () => ({
  position: vi.fn(),
  visible: vi.fn(),
  radius: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  strokeWidth: vi.fn(),
  opacity: vi.fn(),
})

vi.mock('react-konva', () => ({
  Group: ({ children, ...props }: any) => {
    const node = makeGroupNode()
    if (props.ref) props.ref(node)
    recorded.Group.push({ props, node })
    return <div data-testid="Group">{children}</div>
  },
  Line: (props: any) => {
    const node = makeLineNode()
    if (props.ref) props.ref(node)
    recorded.Line.push({ props, node })
    return <div data-testid="Line" />
  },
  Circle: (props: any) => {
    const node = makeCircleNode()
    if (props.ref) props.ref(node)
    recorded.Circle.push({ props, node })
    return <div data-testid="Circle" />
  },
}))

describe('components/canvas/renderers/LineRenderer', () => {
  beforeEach(() => {
    resetRecorded()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  const commonProps = {
    onDragStart: vi.fn(),
    onMouseDown: vi.fn(),
    onTap: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
    dragBoundFunc: vi.fn(),
    ref: vi.fn(),
  }

  it('snaps endpoint drag to grid when showGrid is enabled', () => {
    const onChange = vi.fn()
    render(
      <LineRenderer
        element={{ id: 'line1', t: 'line', pts: [0, 0, 100, 0], stroke: '#000', strokeW: 1 } as any}
        commonProps={commonProps as any}
        isSelected
        invScale={1}
        showGrid
        gridSize={10}
        onChange={onChange}
      />
    )

    const startHandle = recorded.Circle.find((c) => c.props.name === 'line-handle-start')
    expect(startHandle).toBeTruthy()

    const dragEvent = {
      target: {
        x: vi.fn(() => 12),
        y: vi.fn(() => 26),
        position: vi.fn(),
        getParent: vi.fn(() => ({ draggable: vi.fn() })),
      },
      evt: { shiftKey: false },
      cancelBubble: false,
    } as any

    startHandle?.props.onDragStart(dragEvent)
    startHandle?.props.onDragMove(dragEvent)

    expect(dragEvent.target.position).toHaveBeenCalledWith({ x: 10, y: 30 })
  })

  it('recomputes orthogonal path during handle drag', () => {
    const onChange = vi.fn()
    render(
      <LineRenderer
        element={{ id: 'line2', t: 'line', pts: [0, 0, 100, 0], stroke: '#000', strokeW: 1, routing: 'orthogonal' } as any}
        commonProps={commonProps as any}
        isSelected
        invScale={1}
        onChange={onChange}
      />
    )

    const startHandle = recorded.Circle.find((c) => c.props.name === 'line-handle-start')
    const lineBody = recorded.Line.find((l) => l.props.name === 'line-body')
    expect(startHandle).toBeTruthy()
    expect(lineBody).toBeTruthy()

    const dragEvent = {
      target: {
        x: vi.fn(() => 20),
        y: vi.fn(() => 30),
        position: vi.fn(),
        getParent: vi.fn(() => ({ draggable: vi.fn() })),
      },
      evt: { shiftKey: false },
      cancelBubble: false,
    } as any

    startHandle?.props.onDragStart(dragEvent)
    startHandle?.props.onDragMove(dragEvent)

    expect(getOrthogonalPath).toHaveBeenCalled()
    expect(lineBody?.node.points).toHaveBeenCalledWith([0, 0, 50, 0, 50, 50])
  })

  it('commits draft points on handle drag end', () => {
    const onChange = vi.fn()
    render(
      <LineRenderer
        element={{ id: 'line3', t: 'line', pts: [0, 0, 100, 0], stroke: '#000', strokeW: 1 } as any}
        commonProps={commonProps as any}
        isSelected
        invScale={1}
        onChange={onChange}
      />
    )

    const startHandle = recorded.Circle.find((c) => c.props.name === 'line-handle-start')
    expect(startHandle).toBeTruthy()

    const dragEvent = {
      target: {
        x: vi.fn(() => 15),
        y: vi.fn(() => 25),
        position: vi.fn(),
        getParent: vi.fn(() => ({ draggable: vi.fn() })),
      },
      evt: { shiftKey: false },
      cancelBubble: false,
    } as any

    startHandle?.props.onDragStart(dragEvent)
    startHandle?.props.onDragMove(dragEvent)
    startHandle?.props.onDragEnd(dragEvent)

    expect(onChange).toHaveBeenCalled()
    vi.runAllTimers()
  })

  it('detaches connections when dragging the whole line', () => {
    const onChange = vi.fn()
    render(
      <LineRenderer
        element={{
          id: 'line4',
          t: 'line',
          pts: [0, 0, 100, 0],
          stroke: '#000',
          strokeW: 1,
          startConn: { nodeId: 'a', anchor: 't' },
          endConn: { nodeId: 'b', anchor: 'b' },
        } as any}
        commonProps={commonProps as any}
        isSelected
        invScale={1}
        onChange={onChange}
      />
    )

    const mainGroup = recorded.Group.find((g) => g.props.id === 'line4')
    expect(mainGroup).toBeTruthy()

    const event = {
      target: {
        x: vi.fn(() => 10),
        y: vi.fn(() => 20),
        position: vi.fn(),
      },
    } as any

    mainGroup?.props.onDragEnd(event)

    expect(onChange).toHaveBeenCalledWith({
      id: 'line4',
      pts: [10, 20, 110, 20],
      startConn: undefined,
      endConn: undefined,
    })
    expect(event.target.position).toHaveBeenCalledWith({ x: 0, y: 0 })
  })

  it('snaps to anchor and commits connection on drag end', () => {
    const onChange = vi.fn()
    const shape = { id: 'shape1', t: 'shape', x: 0, y: 0, w: 100, h: 100 } as any
    const line = { id: 'line5', t: 'line', pts: [10, 10, 80, 10], stroke: '#000', strokeW: 1 } as any

    render(
      <LineRenderer
        element={line}
        commonProps={commonProps as any}
        isSelected
        invScale={1}
        allElements={[line, shape]}
        onChange={onChange}
      />
    )

    const startHandle = recorded.Circle.find((c) => c.props.name === 'line-handle-start')
    const anchorCircle = recorded.Circle.find(
      (c) => c.props.shadowEnabled && c.props.x === 0 && c.props.y === 0
    )
    expect(startHandle).toBeTruthy()
    expect(anchorCircle).toBeTruthy()

    const dragEvent = {
      target: {
        x: vi.fn(() => 2),
        y: vi.fn(() => 2),
        position: vi.fn(),
        getParent: vi.fn(() => ({ draggable: vi.fn() })),
      },
      evt: { shiftKey: false },
      cancelBubble: false,
    } as any

    startHandle?.props.onDragStart(dragEvent)
    startHandle?.props.onDragMove(dragEvent)
    startHandle?.props.onDragEnd(dragEvent)

    expect(anchorCircle?.node.radius).toHaveBeenCalledWith(9)
    expect(anchorCircle?.node.fill).toHaveBeenCalledWith('#059669')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'line5',
        startConn: { nodeId: 'shape1', anchor: 'tl' },
      })
    )
  })

  it('ignores group drag end while handle drag is active', () => {
    const onChange = vi.fn()
    render(
      <LineRenderer
        element={{ id: 'line6', t: 'line', pts: [0, 0, 100, 0], stroke: '#000', strokeW: 1 } as any}
        commonProps={commonProps as any}
        isSelected
        invScale={1}
        onChange={onChange}
      />
    )

    const startHandle = recorded.Circle.find((c) => c.props.name === 'line-handle-start')
    const mainGroup = recorded.Group.find((g) => g.props.id === 'line6')
    expect(startHandle).toBeTruthy()
    expect(mainGroup).toBeTruthy()

    const dragEvent = {
      target: {
        x: vi.fn(() => 10),
        y: vi.fn(() => 10),
        position: vi.fn(),
        getParent: vi.fn(() => ({ draggable: vi.fn() })),
      },
      evt: { shiftKey: false },
      cancelBubble: false,
    } as any

    startHandle?.props.onDragStart(dragEvent)

    const groupEvent = {
      target: {
        x: vi.fn(() => 5),
        y: vi.fn(() => 5),
        position: vi.fn(),
      },
    } as any

    mainGroup?.props.onDragEnd(groupEvent)

    expect(groupEvent.target.position).toHaveBeenCalledWith({ x: 0, y: 0 })
    expect(onChange).not.toHaveBeenCalled()
  })
})
