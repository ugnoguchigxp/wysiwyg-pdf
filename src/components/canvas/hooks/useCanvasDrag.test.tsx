import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCanvasDrag } from '@/components/canvas/hooks/useCanvasDrag'
import { calculateNodeMoveUpdates } from '@/components/canvas/utils/nodeOperations'
import { getAnchorPointAndDirection, getOrthogonalConnectionPath } from '@/components/canvas/utils/connectionRouting'

vi.mock('@/components/canvas/utils/nodeOperations', () => ({
  calculateNodeMoveUpdates: vi.fn(() => [{ id: 'test', x: 10, y: 20 }]),
}))

vi.mock('@/components/canvas/utils/connectionRouting', () => ({
  getAnchorPointAndDirection: vi.fn(() => ({ x: 0, y: 0, nx: 0, ny: 0 })),
  getOrthogonalConnectionPath: vi.fn(() => [10, 10, 20, 10, 30, 30]),
}))

describe('components/canvas/hooks/useCanvasDrag', () => {
  it('returns handleDragEnd and handleDragMove functions', () => {
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useCanvasDrag({
        element: { id: 'test', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
        allElements: [],
        onChange,
      })
    )

    expect(result.current.handleDragEnd).toBeDefined()
    expect(result.current.handleDragMove).toBeDefined()
    expect(typeof result.current.handleDragEnd).toBe('function')
    expect(typeof result.current.handleDragMove).toBe('function')
  })

  it('handles drag end for line element', () => {
    const onChange = vi.fn()
    const mockEvent = {
      currentTarget: {
        x: vi.fn(() => 10),
        y: vi.fn(() => 20),
      },
    } as any

    const { result } = renderHook(() =>
      useCanvasDrag({
        element: { id: 'line1', t: 'line', pts: [0, 0, 100, 100], stroke: '#000', strokeW: 1, s: 'surface' } as any,
        allElements: [],
        onChange,
      })
    )

    act(() => {
      result.current.handleDragEnd(mockEvent)
    })

    expect(onChange).toHaveBeenCalled()
    expect(mockEvent.currentTarget.x).toHaveBeenCalledWith(0)
    expect(mockEvent.currentTarget.y).toHaveBeenCalledWith(0)
  })

  it('handles drag move without error when element is not WH element', () => {
    const mockEvent = {
      target: {
        getStage: vi.fn(() => null),
      },
    } as any

    const { result } = renderHook(() =>
      useCanvasDrag({
        element: { id: 'line1', t: 'line', pts: [0, 0, 100, 100], stroke: '#000', strokeW: 1, s: 'surface' } as any,
        allElements: [],
        onChange: vi.fn(),
      })
    )

    expect(() => {
      act(() => {
        result.current.handleDragMove(mockEvent)
      })
    }).not.toThrow()
  })

  it('adjusts circle-like shape position on drag end', () => {
    const onChange = vi.fn()
    const element = { id: 'shape1', t: 'shape', shape: 'circle', x: 0, y: 0, w: 20, h: 40, s: 'surface' } as any
    const mockEvent = {
      currentTarget: {
        x: vi.fn(() => 100),
        y: vi.fn(() => 80),
      },
    } as any

    const { result } = renderHook(() =>
      useCanvasDrag({
        element,
        allElements: [],
        onChange,
      })
    )

    act(() => {
      result.current.handleDragEnd(mockEvent)
    })

    expect(calculateNodeMoveUpdates).toHaveBeenCalledWith(
      element,
      { x: 90, y: 60 },
      []
    )
    expect(onChange).toHaveBeenCalled()
  })

  it('updates connected line on drag move (orthogonal routing)', () => {
    const onChange = vi.fn()
    const element = { id: 'node1', t: 'shape', shape: 'circle', x: 0, y: 0, w: 100, h: 80, s: 'surface' } as any
    const other = { id: 'node2', t: 'shape', shape: 'rect', x: 200, y: 100, w: 100, h: 80, s: 'surface' } as any
    const line = {
      id: 'line1',
      t: 'line',
      pts: [0, 0, 0, 0],
      stroke: '#000',
      strokeW: 1,
      s: 'surface',
      routing: 'orthogonal',
      startConn: { nodeId: 'node1', anchor: 'auto' },
      endConn: { nodeId: 'node2', anchor: 'auto' },
    } as any

    const lineBody = { points: vi.fn() }
    const startHandle = { position: vi.fn() }
    const endHandle = { position: vi.fn() }
    const startMarker = { position: vi.fn(), rotation: vi.fn() }
    const endMarker = { position: vi.fn(), rotation: vi.fn() }
    const lineGroup = {
      findOne: vi.fn((selector: string) => {
        if (selector === '.line-body') return lineBody
        if (selector === '.line-handle-start') return startHandle
        if (selector === '.line-handle-end') return endHandle
        if (selector === '.line-marker-start') return startMarker
        if (selector === '.line-marker-end') return endMarker
        return null
      }),
    }
    const stage = {
      findOne: vi.fn(() => lineGroup),
      batchDraw: vi.fn(),
    }
    const mockEvent = {
      currentTarget: {
        x: vi.fn(() => 120),
        y: vi.fn(() => 140),
        getStage: vi.fn(() => stage),
      },
    } as any

    const { result } = renderHook(() =>
      useCanvasDrag({
        element,
        allElements: [element, other, line],
        onChange,
      })
    )

    act(() => {
      result.current.handleDragMove(mockEvent)
    })

    expect(getOrthogonalConnectionPath).toHaveBeenCalled()
    const [startGeo] = (getOrthogonalConnectionPath as any).mock.calls[0]
    expect(startGeo.x).toBe(70)
    expect(startGeo.y).toBe(100)
    expect(lineBody.points).toHaveBeenCalledWith([10, 10, 20, 10, 30, 30])
    expect(startHandle.position).toHaveBeenCalledWith({ x: 10, y: 10 })
    expect(endHandle.position).toHaveBeenCalledWith({ x: 30, y: 30 })
    expect(startMarker.position).toHaveBeenCalledWith({ x: 10, y: 10 })
    expect(endMarker.position).toHaveBeenCalledWith({ x: 30, y: 30 })
    expect(stage.findOne).toHaveBeenCalledWith('#line1')
    expect(stage.batchDraw).toHaveBeenCalled()
  })

  it('updates connected line on drag move (straight routing)', () => {
    const onChange = vi.fn()
    const element = { id: 'node1', t: 'shape', shape: 'rect', x: 0, y: 0, w: 100, h: 80, s: 'surface' } as any
    const other = { id: 'node2', t: 'shape', shape: 'rect', x: 200, y: 100, w: 100, h: 80, s: 'surface' } as any
    const line = {
      id: 'line2',
      t: 'line',
      pts: [0, 0, 0, 0],
      stroke: '#000',
      strokeW: 1,
      s: 'surface',
      startConn: { nodeId: 'node1', anchor: 'auto' },
      endConn: { nodeId: 'node2', anchor: 'auto' },
    } as any

    ;(getAnchorPointAndDirection as any)
      .mockReturnValueOnce({ x: 5, y: 6, nx: 0, ny: 0 })
      .mockReturnValueOnce({ x: 15, y: 16, nx: 0, ny: 0 })

    const lineBody = { points: vi.fn() }
    const lineGroup = {
      findOne: vi.fn((selector: string) => {
        if (selector === '.line-body') return lineBody
        return null
      }),
    }
    const stage = {
      findOne: vi.fn(() => lineGroup),
      batchDraw: vi.fn(),
    }
    const mockEvent = {
      currentTarget: {
        x: vi.fn(() => 120),
        y: vi.fn(() => 140),
        getStage: vi.fn(() => stage),
      },
    } as any

    const { result } = renderHook(() =>
      useCanvasDrag({
        element,
        allElements: [element, other, line],
        onChange,
      })
    )

    act(() => {
      result.current.handleDragMove(mockEvent)
    })

    expect(getAnchorPointAndDirection).toHaveBeenCalledTimes(2)
    expect(lineBody.points).toHaveBeenCalledWith([5, 6, 15, 16])
    expect(stage.findOne).toHaveBeenCalledWith('#line2')
    expect(stage.batchDraw).toHaveBeenCalled()
  })
})
