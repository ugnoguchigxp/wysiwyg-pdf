import { describe, expect, it } from 'vitest'

import { extractBedList, getLayoutBoundingBox } from '@/features/bed-layout-dashboard/utils/layoutUtils'
import type { Doc } from '@/types/canvas'

describe('bedlayout-dashboard/utils/layoutUtils', () => {
  it('getLayoutBoundingBox returns null when nodes is missing', () => {
    const doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'pt',
      surfaces: [],
    } as any
    expect(getLayoutBoundingBox(doc)).toBeNull()
  })

  it('getLayoutBoundingBox returns null when document has no visible elements', () => {
    const doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'pt',
      surfaces: [],
      nodes: [{ id: 'n1', t: 'text', s: 's', x: 0, y: 0, w: 10, h: 10, text: 'x', hidden: true }],
    } satisfies Doc

    expect(getLayoutBoundingBox(doc)).toBeNull()
  })

  it('getLayoutBoundingBox includes line points with stroke width padding', () => {
    const doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'pt',
      surfaces: [],
      nodes: [
        { id: 'l1', t: 'line', s: 's', pts: [10, 20, 30, 40], stroke: '#000', strokeW: 4 },
      ],
    } satisfies Doc

    const box = getLayoutBoundingBox(doc)
    expect(box).not.toBeNull()
    expect(box).toEqual({ x: 8, y: 18, width: 24, height: 24 })
  })

  it('getLayoutBoundingBox uses default line stroke width when missing', () => {
    const doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'pt',
      surfaces: [],
      nodes: [
        { id: 'l1', t: 'line', s: 's', pts: [0, 0, 10, 10], stroke: '#000', strokeW: undefined as any },
      ],
    } satisfies Doc

    const box = getLayoutBoundingBox(doc)
    expect(box).toEqual({ x: -0.5, y: -0.5, width: 11, height: 11 })
  })

  it('getLayoutBoundingBox includes x/y/w/h based nodes', () => {
    const doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'pt',
      surfaces: [],
      nodes: [
        { id: 't1', t: 'text', s: 's', x: 5, y: 10, w: 20, h: 10, text: 'x' },
        { id: 'r1', t: 'shape', s: 's', x: 0, y: 0, w: 5, h: 5, shape: 'rect' },
      ],
    } satisfies Doc

    expect(getLayoutBoundingBox(doc)).toEqual({ x: 0, y: 0, width: 25, height: 20 })
  })

  it('getLayoutBoundingBox skips unsupported elements defensively', () => {
    const doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'pt',
      surfaces: [],
      nodes: [{ id: 'x', t: 'widget', s: 's' } as any],
    } satisfies Doc

    expect(getLayoutBoundingBox(doc)).toBeNull()
  })

  it('extractBedList returns sorted bed widgets with fallback name', () => {
    const doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'pt',
      surfaces: [],
      nodes: [
        { id: 'b2', t: 'widget', s: 's', x: 0, y: 0, w: 1, h: 1, widget: 'bed', name: 'Bed 10' },
        { id: 'b1', t: 'widget', s: 's', x: 0, y: 0, w: 1, h: 1, widget: 'bed' },
        { id: 'x', t: 'widget', s: 's', x: 0, y: 0, w: 1, h: 1, widget: 'other' },
      ],
    } satisfies Doc

    expect(extractBedList(doc)).toEqual([
      { id: 'b2', name: 'Bed 10' },
      { id: 'b1', name: 'Bed b1' },
    ])
  })

  it('extractBedList returns empty list when nodes is missing', () => {
    const doc = { v: 1, id: 'd', title: 't', unit: 'pt', surfaces: [] } as any
    expect(extractBedList(doc)).toEqual([])
  })
})
