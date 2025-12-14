import { describe, expect, it, vi } from 'vitest'

const { debugSpy } = vi.hoisted(() => ({
  debugSpy: vi.fn(),
}))

vi.mock('../../@/utils/logger', () => ({
  createContextLogger: () => ({
    debug: debugSpy,
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import {
  PT_PER_PX,
  PX_PER_PT,
  constrain,
  distance,
  getPaperSize,
  getResizeHandleAtPoint,
  isPointInRect,
  isPointNearLine,
  isWithinCanvasBounds,
  logCoordinateConversion,
  pxToPt,
  ptToPx,
  roundPx,
  roundPt,
  snapToGrid,
  snapToGridPx,
} from '../../@/features/report-editor/pdf-editor/utils/coordinates'

describe('pdf-editor/utils/coordinates', () => {
  it('converts between pt and px with expected ratios', () => {
    expect(PX_PER_PT).toBeCloseTo(96 / 72)
    expect(PT_PER_PX).toBeCloseTo(72 / 96)
    expect(ptToPx(72)).toBeCloseTo(96)
    expect(pxToPt(96)).toBeCloseTo(72)
  })

  it('getPaperSize supports landscape by swapping dimensions', () => {
    const portrait = getPaperSize('A4', 'portrait')
    const landscape = getPaperSize('A4', 'landscape')

    expect(landscape.widthPt).toBe(portrait.heightPt)
    expect(landscape.heightPt).toBe(portrait.widthPt)
  })

  it('getPaperSize supports other presets', () => {
    expect(getPaperSize('Letter').widthPt).toBeGreaterThan(0)
    expect(getPaperSize('Legal').heightPt).toBeGreaterThan(0)
    expect(getPaperSize('A5').widthPt).toBeGreaterThan(0)
    expect(getPaperSize('B5').heightPt).toBeGreaterThan(0)
  })

  it('rounding and snapping behave as expected', () => {
    expect(roundPt(1.234)).toBe(1.23)
    expect(roundPt(1.235)).toBe(1.24)
    expect(roundPx(1.6)).toBe(2)

    expect(snapToGrid(23, 10)).toBe(20)
    expect(snapToGridPx(96, 10)).toBeCloseTo(ptToPx(70)) // 96px -> 72pt -> snapped to 70pt
  })

  it('constrain, bounds and distance helpers work', () => {
    expect(constrain(5, 0, 10)).toBe(5)
    expect(constrain(-1, 0, 10)).toBe(0)
    expect(constrain(99, 0, 10)).toBe(10)

    expect(isWithinCanvasBounds(0, 0, 10, 10)).toBe(true)
    expect(isWithinCanvasBounds(11, 0, 10, 10)).toBe(false)

    expect(distance(0, 0, 3, 4)).toBe(5)
  })

  it('hit testing helpers work', () => {
    expect(isPointInRect(5, 5, 0, 0, 10, 10)).toBe(true)
    expect(isPointInRect(-1, 5, 0, 0, 10, 10)).toBe(false)

    // Near a horizontal segment
    expect(isPointNearLine(5, 1, 0, 0, 10, 0, 2)).toBe(true)
    expect(isPointNearLine(5, 10, 0, 0, 10, 0, 2)).toBe(false)

    // Before segment start (param < 0)
    expect(isPointNearLine(-1, 0, 0, 0, 10, 0, 2)).toBe(true)
    // After segment end (param > 1)
    expect(isPointNearLine(11, 0, 0, 0, 10, 0, 2)).toBe(true)
  })

  it('getResizeHandleAtPoint detects handles around a rect', () => {
    expect(getResizeHandleAtPoint(0, 0, 0, 0, 10, 10)).toBe('nw')
    expect(getResizeHandleAtPoint(10, 10, 0, 0, 10, 10)).toBe('se')
    expect(getResizeHandleAtPoint(5, 0, 0, 0, 10, 10)).toBe('n')
    expect(getResizeHandleAtPoint(999, 999, 0, 0, 10, 10)).toBeNull()
  })

  it('logCoordinateConversion calls logger.debug', () => {
    logCoordinateConversion('x', 12.6, 9.444)
    expect(debugSpy).toHaveBeenCalledWith('x:', { px: 13, pt: 9.44 })
  })
})
