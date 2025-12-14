import { describe, expect, it, vi } from 'vitest'

import type { IEditorEllipse, IEditorItem, IEditorLine, IEditorRect } from '../../@/features/report-editor/pdf-editor/types/editorTypes'
import {
  drawConnectionGuide,
  drawConnectionPoints,
  findNearbyConnectionPoint,
  getConnectionPoint,
  updateLineConnectionPositions,
} from '../../@/features/report-editor/pdf-editor/utils/connectionUtils'

describe('connectionUtils', () => {
  const rect = (overrides: Partial<IEditorRect> = {}): IEditorRect => ({
    id: 'rect-1',
    type: 'rect',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    style: {},
    ...overrides,
  })

  const ellipse = (overrides: Partial<IEditorEllipse> = {}): IEditorEllipse => ({
    id: 'ellipse-1',
    type: 'ellipse',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    style: {},
    ...overrides,
  })

  const line = (overrides: Partial<IEditorLine> = {}): IEditorLine => ({
    id: 'line-1',
    type: 'line',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    x1: 0,
    y1: 0,
    x2: 10,
    y2: 10,
    style: {},
    ...overrides,
  })

  it('getConnectionPoint returns correct positions for all points (rect)', () => {
    const el = rect({ x: 10, y: 20, width: 100, height: 50 })

    expect(getConnectionPoint(el, 'top-left')).toEqual({ x: 10, y: 20 })
    expect(getConnectionPoint(el, 'left')).toEqual({ x: 10, y: 45 })
    expect(getConnectionPoint(el, 'bottom-left')).toEqual({ x: 10, y: 70 })
    expect(getConnectionPoint(el, 'bottom')).toEqual({ x: 60, y: 70 })
    expect(getConnectionPoint(el, 'bottom-right')).toEqual({ x: 110, y: 70 })
    expect(getConnectionPoint(el, 'right')).toEqual({ x: 110, y: 45 })
    expect(getConnectionPoint(el, 'top-right')).toEqual({ x: 110, y: 20 })
    expect(getConnectionPoint(el, 'top')).toEqual({ x: 60, y: 20 })
  })

  it('getConnectionPoint falls back to center for unknown connectionPoint', () => {
    const el = ellipse({ x: 0, y: 0, width: 10, height: 20 })
    expect(getConnectionPoint(el, 'top')).toEqual({ x: 5, y: 0 })
    // force default branch
    expect(getConnectionPoint(el, 'unknown' as never)).toEqual({ x: 5, y: 10 })
  })

  it('findNearbyConnectionPoint returns null when nothing is within radius', () => {
    const elements: IEditorItem[] = [rect({ id: 'r1' }), ellipse({ id: 'e1' })]
    expect(findNearbyConnectionPoint(1000, 1000, elements)).toBe(null)
  })

  it('findNearbyConnectionPoint skips lines and excluded element', () => {
    const elements: IEditorItem[] = [
      line({ id: 'l1' }),
      // Unsupported shape type should be ignored
      ({ id: 'u1', type: 'triangle', x: 0, y: 0, width: 10, height: 10, style: {} } as unknown as IEditorItem),
      rect({ id: 'r1', x: 0, y: 0, width: 10, height: 10 }),
    ]

    // point is exactly at top-left of r1 but excluded
    expect(findNearbyConnectionPoint(0, 0, elements, 'r1', 30)).toBe(null)
  })

  it('findNearbyConnectionPoint finds nearest among candidates', () => {
    const r1 = rect({ id: 'r1', x: 0, y: 0, width: 10, height: 10 })
    const r2 = rect({ id: 'r2', x: 100, y: 100, width: 10, height: 10 })

    const elements: IEditorItem[] = [r1, r2]

    const nearest = findNearbyConnectionPoint(1, 1, elements, undefined, 20)
    expect(nearest).not.toBe(null)
    expect(nearest?.element.id).toBe('r1')
    expect(nearest?.connectionPoint).toBe('top-left')
  })

  it('drawConnectionPoints draws eight points', () => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D

    drawConnectionPoints(ctx, rect({ x: 0, y: 0, width: 10, height: 10 }), (pt) => pt * 2)

    // 8 connection points
    expect(ctx.arc).toHaveBeenCalledTimes(8)
    expect(ctx.fill).toHaveBeenCalledTimes(8)
    expect(ctx.stroke).toHaveBeenCalledTimes(8)
    expect(ctx.save).toHaveBeenCalledTimes(1)
    expect(ctx.restore).toHaveBeenCalledTimes(1)

    // one of the points should be scaled by ptToPx
    const firstArcCall = (ctx.arc as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(firstArcCall?.[0]).toBeTypeOf('number')
  })

  it('drawConnectionGuide highlights shape and connection point', () => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
    } as unknown as CanvasRenderingContext2D

    drawConnectionGuide(
      ctx,
      rect({ x: 1, y: 2, width: 3, height: 4 }),
      'top-left',
      (pt) => pt * 10
    )

    expect(ctx.strokeRect).toHaveBeenCalledTimes(1)
    expect(ctx.arc).toHaveBeenCalledTimes(1)
    expect(ctx.fillText).toHaveBeenCalledTimes(1)
    expect(ctx.save).toHaveBeenCalledTimes(1)
    expect(ctx.restore).toHaveBeenCalledTimes(1)
  })

  it('updateLineConnectionPositions returns null for non-line items', () => {
    const notLine = rect({ id: 'x', type: 'rect' }) as unknown as IEditorItem
    expect(updateLineConnectionPositions(notLine, [])).toBe(null)
  })

  it('updateLineConnectionPositions returns null when there are no valid connections', () => {
    const l = line({ id: 'l1' })
    const updates = updateLineConnectionPositions(l, [l])
    expect(updates).toBe(null)
  })

  it('updateLineConnectionPositions updates endpoints when connected elements exist', () => {
    const r = rect({ id: 'r1', x: 10, y: 20, width: 100, height: 50 })
    const e = ellipse({ id: 'e1', x: 0, y: 0, width: 10, height: 20 })

    const l = line({
      id: 'l1',
      startConnection: { elementId: 'r1', connectionPoint: 'bottom' },
      endConnection: { elementId: 'e1', connectionPoint: 'top' },
    })

    const updates = updateLineConnectionPositions(l, [r, e, l])
    expect(updates).toEqual({ x1: 60, y1: 70, x2: 5, y2: 0 })
  })

  it('updateLineConnectionPositions ignores missing/wrong-type connected elements', () => {
    const l = line({
      id: 'l1',
      startConnection: { elementId: 'line-2', connectionPoint: 'top-left' },
      endConnection: { elementId: 'line-2', connectionPoint: 'top-left' },
    })

    const updates = updateLineConnectionPositions(l, [line({ id: 'line-2' })])
    expect(updates).toBe(null)
  })
})
