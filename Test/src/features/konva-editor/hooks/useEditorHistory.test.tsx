import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import React from 'react'

import { useEditorHistory } from '@/features/konva-editor/hooks/useEditorHistory'

type AnyDoc = any

const baseFormDoc = (): AnyDoc => ({
  id: 'f1',
  type: 'form',
  name: 'Form',
  paper: { size: 'A4', orientation: 'portrait', width: 100, height: 200 },
  elementsById: {},
  elementOrder: [],
})

const baseBedDoc = (): AnyDoc => ({
  id: 'bdoc',
  type: 'bed_layout',
  name: 'Bed',
  layout: { mode: 'landscape', width: 300, height: 200 },
  elementsById: {},
  elementOrder: [],
})

describe('useEditorHistory', () => {
  it('executes operations and supports undo/redo (form)', () => {
    const { result } = renderHook(() => {
      const [doc, setDoc] = React.useState(baseFormDoc())
      return { doc, ...useEditorHistory(doc, setDoc) }
    })

    act(() => {
      result.current.execute({
        kind: 'create-element',
        element: { id: 't1', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'x' },
      })
    })
    expect(result.current.doc.elementOrder).toEqual(['t1'])
    expect(result.current.canUndo).toBe(true)

    act(() => {
      result.current.execute({
        kind: 'update-element',
        id: 't1',
        prev: { text: 'x' },
        next: { text: 'y' },
      })
    })
    expect(result.current.doc.elementsById.t1.text).toBe('y')

    // Update for a missing id should no-op (branch coverage)
    act(() => {
      result.current.execute({
        kind: 'update-element',
        id: 'missing',
        prev: {},
        next: { text: 'z' },
      })
    })
    expect(result.current.doc.elementsById.missing).toBeUndefined()

    act(() => result.current.undo())
    // first undo reverts the no-op update on missing id
    expect(result.current.doc.elementsById.t1.text).toBe('y')
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.undo())
    expect(result.current.doc.elementsById.t1.text).toBe('x')

    act(() => result.current.redo())
    expect(result.current.doc.elementsById.t1.text).toBe('y')

    act(() => {
      result.current.execute({
        kind: 'delete-element',
        id: 't1',
        prevElement: result.current.doc.elementsById.t1,
      })
    })
    expect(result.current.doc.elementsById.t1).toBeUndefined()

    act(() => result.current.undo())
    expect(result.current.doc.elementsById.t1).toBeTruthy()

    act(() => result.current.clear())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('supports bed layout documents and history trimming to MAX_HISTORY_SIZE', () => {
    const { result } = renderHook(() => {
      const [doc, setDoc] = React.useState(baseBedDoc())
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

    expect(result.current.doc.elementOrder).toHaveLength(51)

    // Undo 51 times: only last 50 are guaranteed to be undoable due to trimming
    for (let i = 0; i < 51; i++) act(() => result.current.undo())

    // At least one element should remain (the oldest entry fell off history)
    expect(result.current.doc.elementOrder.length).toBeGreaterThan(0)

    // Reorder branch coverage
    act(() => {
      result.current.execute({
        kind: 'reorder-elements',
        prevOrder: result.current.doc.elementOrder,
        nextOrder: [...result.current.doc.elementOrder].reverse(),
      })
    })
    expect(result.current.doc.elementOrder[0]).toBe(`e${0}`)
  })

  it('supports reorder/undo/redo and unknown operations (default branches)', () => {
    // Form doc
    const { result: form } = renderHook(() => {
      const [doc, setDoc] = React.useState(baseFormDoc())
      return { doc, ...useEditorHistory(doc, setDoc) }
    })

    // no-op guards
    act(() => form.current.undo())
    act(() => form.current.redo())

    act(() =>
      form.current.execute({
        kind: 'create-element',
        element: { id: 'a', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'a' },
      })
    )
    act(() =>
      form.current.execute({
        kind: 'create-element',
        element: { id: 'b', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'b' },
      })
    )

    act(() =>
      form.current.execute({
        kind: 'reorder-elements',
        prevOrder: ['a', 'b'],
        nextOrder: ['b', 'a'],
      })
    )
    expect(form.current.doc.elementOrder).toEqual(['b', 'a'])

    act(() => form.current.undo())
    expect(form.current.doc.elementOrder).toEqual(['a', 'b'])

    act(() => form.current.redo())
    expect(form.current.doc.elementOrder).toEqual(['b', 'a'])

    // hit default branch in apply/revert (defensive)
    act(() => form.current.execute({ kind: 'unknown' } as any))
    act(() => form.current.undo())

    // Bed layout doc
    const { result: bed } = renderHook(() => {
      const [doc, setDoc] = React.useState(baseBedDoc())
      return { doc, ...useEditorHistory(doc, setDoc) }
    })

    act(() =>
      bed.current.execute({
        kind: 'create-element',
        element: { id: 'x', t: 'shape', s: 's', x: 0, y: 0, w: 1, h: 1, shape: 'rect' },
      })
    )

    // update missing id branch for bed layout
    act(() =>
      bed.current.execute({ kind: 'update-element', id: 'missing', prev: {}, next: { x: 1 } } as any)
    )
    act(() => bed.current.undo())

    // default branch in apply/revert for bed layout
    act(() => bed.current.execute({ kind: 'unknown' } as any))
    act(() => bed.current.undo())
  })

  it('covers apply/revert branches for all operation kinds', () => {
    const { result: form } = renderHook(() => {
      const [doc, setDoc] = React.useState(baseFormDoc())
      return { doc, ...useEditorHistory(doc, setDoc) }
    })

    // create -> undo -> redo
    act(() =>
      form.current.execute({
        kind: 'create-element',
        element: { id: 'c', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'c' },
      })
    )
    expect(form.current.doc.elementOrder).toEqual(['c'])
    act(() => form.current.undo())
    expect(form.current.doc.elementOrder).toEqual([])
    act(() => form.current.redo())
    expect(form.current.doc.elementOrder).toEqual(['c'])

    // update -> undo -> redo
    act(() =>
      form.current.execute({
        kind: 'update-element',
        id: 'c',
        prev: { text: 'c' },
        next: { text: 'cc' },
      })
    )
    expect(form.current.doc.elementsById.c.text).toBe('cc')
    act(() => form.current.undo())
    expect(form.current.doc.elementsById.c.text).toBe('c')
    act(() => form.current.redo())
    expect(form.current.doc.elementsById.c.text).toBe('cc')

    // reorder -> undo
    act(() =>
      form.current.execute({
        kind: 'create-element',
        element: { id: 'd', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'd' },
      })
    )
    act(() =>
      form.current.execute({
        kind: 'reorder-elements',
        prevOrder: ['c', 'd'],
        nextOrder: ['d', 'c'],
      })
    )
    expect(form.current.doc.elementOrder).toEqual(['d', 'c'])
    act(() => form.current.undo())
    expect(form.current.doc.elementOrder).toEqual(['c', 'd'])

    // delete -> undo
    const prevElement = form.current.doc.elementsById.c
    act(() => form.current.execute({ kind: 'delete-element', id: 'c', prevElement }))
    expect(form.current.doc.elementsById.c).toBeUndefined()
    act(() => form.current.undo())
    expect(form.current.doc.elementsById.c).toBeTruthy()

    // Bed layout: same branches
    const { result: bed } = renderHook(() => {
      const [doc, setDoc] = React.useState(baseBedDoc())
      return { doc, ...useEditorHistory(doc, setDoc) }
    })

    act(() =>
      bed.current.execute({
        kind: 'create-element',
        element: { id: 'e', t: 'shape', s: 's', x: 0, y: 0, w: 1, h: 1, shape: 'rect' },
      })
    )
    act(() =>
      bed.current.execute({
        kind: 'update-element',
        id: 'e',
        prev: { x: 0 },
        next: { x: 10 },
      })
    )
    expect((bed.current.doc.elementsById.e as any).x).toBe(10)
    act(() => bed.current.undo())
    expect((bed.current.doc.elementsById.e as any).x).toBe(0)

    act(() =>
      bed.current.execute({
        kind: 'reorder-elements',
        prevOrder: ['e'],
        nextOrder: ['e'],
      })
    )
    act(() => bed.current.undo())

    const bedPrev = bed.current.doc.elementsById.e
    act(() => bed.current.execute({ kind: 'delete-element', id: 'e', prevElement: bedPrev }))
    act(() => bed.current.undo())
    expect(bed.current.doc.elementsById.e).toBeTruthy()
  })
})
