import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCanvasTransform } from '@/components/canvas/hooks/useCanvasTransform'
import { getUpdateForConnectedLines } from '@/components/canvas/utils/lineUtils'

vi.mock('@/components/canvas/utils/lineUtils', () => ({
  getUpdateForConnectedLines: vi.fn(() => []),
}))

describe('components/canvas/hooks/useCanvasTransform', () => {
  describe('Basic behavior', () => {
    it('returns handleTransformEnd function', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'test', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
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
          shapeRef,
          onChange,
        })
      )

      act(() => {
        result.current.handleTransformEnd()
      })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('resets scale to 1 after transform', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: vi.fn(() => 2),
        scaleY: vi.fn(() => 2),
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'text1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      expect(node.scaleX).toHaveBeenCalledWith(1)
      expect(node.scaleY).toHaveBeenCalledWith(1)
    })
  })

  describe('Text element transform', () => {
    it('updates text element position and size on transform', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 1.5,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'text1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates).toHaveLength(1)
      expect(updates[0]?.id).toBe('text1')
      expect(updates[0]?.x).toBe(10)
      expect(updates[0]?.y).toBe(20)
      expect(updates[0]?.w).toBe(200)
      expect(updates[0]?.h).toBe(75)
    })

    it('updates text element with rotation', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 45,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'text1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.r).toBe(45)
    })

    it('applies minimum width and height of 5', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 10,
        height: () => 5,
        x: () => 0,
        y: () => 0,
        scaleX: () => 0.1,
        scaleY: () => 0.5,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'text1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.w).toBeGreaterThanOrEqual(5)
      expect(updates[0]?.h).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Table element transform', () => {
    it('updates table element width and height', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 3,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'table1', t: 'table', x: 0, y: 0, w: 100, h: 50, s: 'surface', table: { cols: [50], rows: [25, 25], cells: [] } } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const updates = onChange.mock.calls[0]?.[0] as any[]
      const update = updates[0]
      expect(update?.w).toBe(200)
      expect(update?.h).toBe(150)
      expect(update?.table?.cols).toEqual([100])
      expect(update?.table?.rows).toEqual([75, 75])
    })

    it('updates table with multiple columns and rows', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'table1', t: 'table', x: 0, y: 0, w: 100, h: 50, s: 'surface', table: { cols: [50, 50], rows: [25, 25], cells: [] } } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      const update = updates[0]
      expect(update?.table?.cols).toEqual([100, 100])
      expect(update?.table?.rows).toEqual([50, 50])
    })

    it('updates table element with rotation', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 90,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'table1', t: 'table', x: 0, y: 0, w: 100, h: 50, s: 'surface', table: { cols: [50, 50], rows: [25, 25], cells: [] } } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.r).toBe(90)
    })
  })

  describe('Signature element transform', () => {
    it('scales signature strokes on resize', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 2.5,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'sig1', t: 'signature', x: 0, y: 0, w: 100, h: 50, s: 'surface', strokes: [[0, 0, 10, 10], [20, 20, 30, 30]] } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const updates = onChange.mock.calls[0]?.[0] as any[]
      const update = updates[0]
      expect(update?.strokes).toEqual([[0, 0, 20, 25], [40, 50, 60, 75]])
    })

    it('scales complex strokes correctly', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 0,
        y: () => 0,
        scaleX: () => 3,
        scaleY: () => 4,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'sig1', t: 'signature', x: 0, y: 0, w: 100, h: 50, s: 'surface', strokes: [[0, 0, 10, 10, 20, 20]] } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.strokes).toEqual([[0, 0, 30, 40, 60, 80]])
    })

    it('updates signature width and height', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 3,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'sig1', t: 'signature', x: 0, y: 0, w: 100, h: 50, s: 'surface', strokes: [[0, 0, 10, 10]] } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.w).toBe(200)
      expect(updates[0]?.h).toBe(150)
    })
  })

  describe('Shape element transform', () => {
    it('adjusts circle position on transform', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 100,
        x: () => 50,
        y: () => 50,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'shape1', t: 'shape', x: 0, y: 0, w: 100, h: 100, s: 'surface', shape: 'circle' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.x).toBe(-50)
      expect(updates[0]?.y).toBe(-50)
    })

    it('adjusts star position on transform', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 100,
        x: () => 60,
        y: () => 60,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'shape1', t: 'shape', x: 0, y: 0, w: 100, h: 100, s: 'surface', shape: 'star' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.x).toBe(-40)
      expect(updates[0]?.y).toBe(-40)
    })

    it('adjusts pentagon position on transform', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 80,
        height: () => 80,
        x: () => 40,
        y: () => 40,
        scaleX: () => 1.5,
        scaleY: () => 1.5,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'shape1', t: 'shape', x: 0, y: 0, w: 80, h: 80, s: 'surface', shape: 'pentagon' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.x).toBe(-20)
      expect(updates[0]?.y).toBe(-20)
    })

    it('adjusts hexagon position on transform', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 100,
        x: () => 50,
        y: () => 50,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'shape1', t: 'shape', x: 0, y: 0, w: 100, h: 100, s: 'surface', shape: 'hexagon' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.x).toBe(-50)
      expect(updates[0]?.y).toBe(-50)
    })

    it('does not adjust rectangle position on transform', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 50,
        y: () => 50,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'shape1', t: 'shape', x: 0, y: 0, w: 100, h: 100, s: 'surface', shape: 'rectangle' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.x).toBe(50)
      expect(updates[0]?.y).toBe(50)
    })
  })

  describe('Line element transform', () => {
    it('handles line elements without calling onChange', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'line1', t: 'line', x: 0, y: 0, w: 100, h: 100, s: 'surface', pts: [0, 0, 100, 100], stroke: '#000', strokeW: 1 } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('Connected lines update', () => {
    it('calls getUpdateForConnectedLines when allElements is provided', () => {
      vi.mocked(getUpdateForConnectedLines).mockReturnValue([{ id: 'line1', pts: [10, 10, 110, 110] }])

      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'text1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
          allElements: [] as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      expect(getUpdateForConnectedLines).toHaveBeenCalledWith(
        'text1',
        expect.any(Object),
        []
      )
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('does not call getUpdateForConnectedLines when allElements is not provided', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 2,
        scaleY: () => 2,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'text1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      expect(getUpdateForConnectedLines).not.toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('handles zero scale correctly', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => 0,
        scaleY: () => 0,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'text1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.w).toBe(5)
      expect(updates[0]?.h).toBe(5)
    })

    it('handles negative scale (flip) - applies minimum constraint', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 10,
        y: () => 20,
        scaleX: () => -1,
        scaleY: () => -1,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'text1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.x).toBe(10)
      expect(updates[0]?.y).toBe(20)
      expect(updates[0]?.w).toBe(5)
      expect(updates[0]?.h).toBe(5)
    })

    it('handles very large scale values', () => {
      const onChange = vi.fn()
      const shapeRef = { current: null } as any
      const node = {
        width: () => 100,
        height: () => 50,
        x: () => 0,
        y: () => 0,
        scaleX: () => 100,
        scaleY: () => 100,
        rotation: () => 0,
      }

      const { result } = renderHook(() =>
        useCanvasTransform({
          element: { id: 'text1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any,
          shapeRef,
          onChange,
        })
      )

      act(() => {
        shapeRef.current = node
        result.current.handleTransformEnd()
      })

      const updates = onChange.mock.calls[0]?.[0] as any[]
      expect(updates[0]?.w).toBe(10000)
      expect(updates[0]?.h).toBe(5000)
    })
  })
})
