import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCanvasTransform } from '@/components/canvas/hooks/useCanvasTransform'

vi.mock('@/components/canvas/utils/lineUtils', () => ({
  getUpdateForConnectedLines: vi.fn(() => []),
}))

describe('components/canvas/hooks/useCanvasTransform', () => {
  it('returns handleTransformEnd function', () => {
    const onChange = vi.fn()
    const shapeRef = { current: null } as any

    const { result } = renderHook(() =>
      useCanvasTransform({
        element: { id: 'test', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
        allElements: [],
        shapeRef,
        onChange,
      })
    )

    expect(result.current.handleTransformEnd).toBeDefined()
    expect(typeof result.current.handleTransformEnd).toBe('function')
  })

  it('does not call onChange when ref is null', () => {
    const onChange = vi.fn()
    const shapeRef = { current: null } as any

    const { result } = renderHook(() =>
      useCanvasTransform({
        element: { id: 'test', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
        allElements: [],
        shapeRef,
        onChange,
      })
    )

    act(() => {
      result.current.handleTransformEnd()
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('handles line elements without error', () => {
    const onChange = vi.fn()
    const shapeRef = { current: null } as any

    const { result } = renderHook(() =>
      useCanvasTransform({
        element: { id: 'line1', t: 'line', pts: [0, 0, 100, 100], stroke: '#000', strokeW: 1, s: 'surface' } as any,
        allElements: [],
        shapeRef,
        onChange,
      })
    )

    act(() => {
      result.current.handleTransformEnd()
    })

    expect(onChange).not.toHaveBeenCalled()
  })
})
