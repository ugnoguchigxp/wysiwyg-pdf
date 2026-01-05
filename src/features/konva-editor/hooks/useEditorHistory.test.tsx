import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import React from 'react'

import { useEditorHistory } from '@/features/konva-editor/hooks/useEditorHistory'
import type { Doc } from '@/features/konva-editor/types'

const baseDoc = (): Doc => ({
  v: 1,
  id: 'doc-1',
  title: 'Doc',
  unit: 'mm' as const,
  surfaces: [{ id: 'page-1', type: 'page' as const, w: 100, h: 200, bg: '#ffffff' }],
  nodes: [],
})

describe('useEditorHistory', () => {
  it('executes operations and supports undo/redo', () => {
    const { result } = renderHook(() => {
      const [doc, setDoc] = React.useState(baseDoc())
      return { doc, ...useEditorHistory(doc, setDoc) }
    })

    act(() => {
      result.current.execute({
        kind: 'create-element',
        element: { id: 't1', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'x' },
      })
    })
    expect(result.current.doc.nodes.map((n: any) => n.id)).toEqual(['t1'])
    expect(result.current.canUndo).toBe(true)

    act(() => {
      result.current.execute({
        kind: 'update-element',
        id: 't1',
        prev: { text: 'x' },
        next: { text: 'y' },
      })
    })
    expect((result.current.doc.nodes.find((n: any) => n.id === 't1') as any).text).toBe('y')

    act(() => result.current.undo())
    expect((result.current.doc.nodes.find((n: any) => n.id === 't1') as any).text).toBe('x')
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.redo())
    expect((result.current.doc.nodes.find((n: any) => n.id === 't1') as any).text).toBe('y')

    act(() => {
      result.current.execute({
        kind: 'delete-element',
        id: 't1',
        prevElement: result.current.doc.nodes.find((n: any) => n.id === 't1') as any,
      })
    })
    expect(result.current.doc.nodes.find((n: any) => n.id === 't1')).toBeUndefined()

    act(() => result.current.undo())
    expect(result.current.doc.nodes.find((n: any) => n.id === 't1')).toBeTruthy()

    act(() => result.current.clear())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('supports history trimming to MAX_HISTORY_SIZE', () => {
    const { result } = renderHook(() => {
      const [doc, setDoc] = React.useState(baseDoc())
      return { doc, ...useEditorHistory(doc, setDoc) }
    })

    // create 51 elements to exceed MAX_HISTORY_SIZE (50)
    for (let i = 0; i < 51; i++) {
      act(() => {
        result.current.execute({
          kind: 'create-element',
          element: { id: `e${i}`, t: 'shape', s: 's', x: 0, y: 0, w: 1, h: 1, shape: 'rect' },
        })
      })
    }

    expect(result.current.doc.nodes).toHaveLength(51)

    // Undo 51 times: only last 50 are guaranteed to be undoable due to trimming
    for (let i = 0; i < 51; i++) act(() => result.current.undo())

    // At least one element should remain (the oldest entry fell off history)
    expect(result.current.doc.nodes.length).toBeGreaterThan(0)

    // Reorder branch coverage
    act(() => {
      result.current.execute({
        kind: 'reorder-elements',
        prevOrder: result.current.doc.nodes.map((n: any) => n.id),
        nextOrder: [...result.current.doc.nodes.map((n: any) => n.id)].reverse(),
      })
    })
    expect(result.current.doc.nodes[0]?.id).toBe('e0')
  })

  it('supports no-op guards and unknown operations (default branches)', () => {
    const { result } = renderHook(() => {
      const [doc, setDoc] = React.useState(baseDoc())
      return { doc, ...useEditorHistory(doc, setDoc) }
    })

    // no-op guards
    act(() => result.current.undo())
    act(() => result.current.redo())

    // hit default branch in apply/revert (defensive)
    act(() => result.current.execute({ kind: 'unknown' } as any))
    act(() => result.current.undo())
  })
})
