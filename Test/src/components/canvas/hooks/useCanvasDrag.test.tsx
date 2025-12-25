import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCanvasDrag } from '@/components/canvas/hooks/useCanvasDrag'

vi.mock('@/components/canvas/utils/nodeOperations', () => ({
  calculateNodeMoveUpdates: vi.fn(() => [{ id: 'test', x: 10, y: 20 }]),
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
      target: {
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
})
