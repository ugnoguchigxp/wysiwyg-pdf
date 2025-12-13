import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useEditorState } from '../../../../../src/modules/konva-editor/hooks/useEditorState'

describe('useEditorState', () => {
  it('manages selection', () => {
    const { result } = renderHook(() => useEditorState())

    act(() => result.current.toggleSelection('a'))
    expect(result.current.selection).toEqual(['a'])

    act(() => result.current.toggleSelection('a'))
    expect(result.current.selection).toEqual([])

    act(() => result.current.setSelection(['x', 'y']))
    expect(result.current.selection).toEqual(['x', 'y'])

    act(() => result.current.clearSelection())
    expect(result.current.selection).toEqual([])
  })

  it('manages zoom with bounds', () => {
    const { result } = renderHook(() => useEditorState())

    act(() => result.current.setZoom(1))
    act(() => result.current.zoomIn())
    expect(result.current.zoom).toBe(1.25)

    act(() => result.current.zoomOut())
    expect(result.current.zoom).toBe(1.0)

    act(() => result.current.setZoom(5))
    act(() => result.current.zoomIn())
    expect(result.current.zoom).toBe(5)

    act(() => result.current.setZoom(0.25))
    act(() => result.current.zoomOut())
    expect(result.current.zoom).toBe(0.25)

    act(() => result.current.resetZoom())
    expect(result.current.zoom).toBe(1.0)
  })

  it('manages scroll', () => {
    const { result } = renderHook(() => useEditorState())
    act(() => result.current.setScroll({ x: 10, y: 20 }))
    expect(result.current.scroll).toEqual({ x: 10, y: 20 })
  })
})

