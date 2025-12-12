import { describe, expect, it } from 'vitest'

import {
  A4_HEIGHT_PT,
  A4_WIDTH_PT,
  A5_HEIGHT_PT,
  A5_WIDTH_PT,
  B5_HEIGHT_PT,
  B5_WIDTH_PT,
  LEGAL_HEIGHT_PT,
  LEGAL_WIDTH_PT,
  LETTER_HEIGHT_PT,
  LETTER_WIDTH_PT,
  PX_PER_PT,
  PT_PER_PX,
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
  roundPt,
  snapToGrid,
  snapToGridPx,
} from '../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/utils/coordinates'

describe('coordinates utils', () => {
  it('ptToPx and pxToPt are inverse-ish', () => {
    const pt = 10
    const px = ptToPx(pt)
    expect(px).toBeCloseTo(pt * PX_PER_PT)
    expect(pxToPt(px)).toBeCloseTo(pt)
    expect(PX_PER_PT * PT_PER_PX).toBeCloseTo(1)
  })

  it('roundPt rounds to 2 decimals', () => {
    expect(roundPt(1.234)).toBe(1.23)
    expect(roundPt(1.235)).toBe(1.24)
  })

  it('snapToGrid snaps', () => {
    expect(snapToGrid(12, 5)).toBe(10)
    expect(snapToGrid(13, 5)).toBe(15)
  })

  it('getPaperSize returns correct dimensions and swaps for landscape', () => {
    const a4p = getPaperSize('A4', 'portrait')
    expect(a4p.widthPt).toBe(A4_WIDTH_PT)
    expect(a4p.heightPt).toBe(A4_HEIGHT_PT)

    const a4l = getPaperSize('A4', 'landscape')
    expect(a4l.widthPt).toBe(A4_HEIGHT_PT)
    expect(a4l.heightPt).toBe(A4_WIDTH_PT)

    expect(getPaperSize('A5').widthPt).toBe(A5_WIDTH_PT)
    expect(getPaperSize('A5').heightPt).toBe(A5_HEIGHT_PT)
    expect(getPaperSize('B5').widthPt).toBe(B5_WIDTH_PT)
    expect(getPaperSize('B5').heightPt).toBe(B5_HEIGHT_PT)
    expect(getPaperSize('Letter').widthPt).toBe(LETTER_WIDTH_PT)
    expect(getPaperSize('Letter').heightPt).toBe(LETTER_HEIGHT_PT)
    expect(getPaperSize('Legal').widthPt).toBe(LEGAL_WIDTH_PT)
    expect(getPaperSize('Legal').heightPt).toBe(LEGAL_HEIGHT_PT)
  })

  it('snapToGridPx snaps in pixel space using pt grid size', () => {
    const gridPt = 10
    const px = ptToPx(12) // 12pt expressed in px
    const snappedPx = snapToGridPx(px, gridPt)
    expect(pxToPt(snappedPx)).toBeCloseTo(10)
  })

  it('constrain clamps', () => {
    expect(constrain(5, 0, 10)).toBe(5)
    expect(constrain(-1, 0, 10)).toBe(0)
    expect(constrain(11, 0, 10)).toBe(10)
  })

  it('isWithinCanvasBounds includes edges', () => {
    expect(isWithinCanvasBounds(0, 0, 10, 10)).toBe(true)
    expect(isWithinCanvasBounds(10, 10, 10, 10)).toBe(true)
    expect(isWithinCanvasBounds(-1, 0, 10, 10)).toBe(false)
    expect(isWithinCanvasBounds(0, 11, 10, 10)).toBe(false)
  })

  it('distance computes euclidean distance', () => {
    expect(distance(0, 0, 3, 4)).toBe(5)
  })

  it('isPointInRect works on edges', () => {
    expect(isPointInRect(0, 0, 0, 0, 10, 10)).toBe(true)
    expect(isPointInRect(10, 10, 0, 0, 10, 10)).toBe(true)
    expect(isPointInRect(11, 10, 0, 0, 10, 10)).toBe(false)
  })

  it('isPointNearLine handles degenerate and segment bounds', () => {
    // degenerate line (lenSq = 0)
    expect(isPointNearLine(0, 0, 0, 0, 0, 0, 0)).toBe(true)

    // param < 0 branch
    expect(isPointNearLine(-10, 0, 0, 0, 10, 0, 1)).toBe(false)
    expect(isPointNearLine(-0.2, 0, 0, 0, 10, 0, 1)).toBe(true)

    // param > 1 branch
    expect(isPointNearLine(10.2, 0, 0, 0, 10, 0, 1)).toBe(true)

    // on segment (param between 0..1)
    expect(isPointNearLine(5, 0.4, 0, 0, 10, 0, 1)).toBe(true)
  })

  it('getResizeHandleAtPoint detects handles and null', () => {
    const rx = 10
    const ry = 20
    const rw = 100
    const rh = 50

    expect(getResizeHandleAtPoint(rx, ry, rx, ry, rw, rh)).toBe('nw')
    expect(getResizeHandleAtPoint(rx + rw, ry, rx, ry, rw, rh)).toBe('ne')
    expect(getResizeHandleAtPoint(rx, ry + rh, rx, ry, rw, rh)).toBe('sw')
    expect(getResizeHandleAtPoint(rx + rw, ry + rh, rx, ry, rw, rh)).toBe('se')
    expect(getResizeHandleAtPoint(rx + rw / 2, ry, rx, ry, rw, rh)).toBe('n')
    expect(getResizeHandleAtPoint(rx + rw / 2, ry + rh, rx, ry, rw, rh)).toBe('s')
    expect(getResizeHandleAtPoint(rx + rw, ry + rh / 2, rx, ry, rw, rh)).toBe('e')
    expect(getResizeHandleAtPoint(rx, ry + rh / 2, rx, ry, rw, rh)).toBe('w')

    expect(getResizeHandleAtPoint(0, 0, rx, ry, rw, rh)).toBe(null)
  })

  it('logCoordinateConversion does not throw', () => {
    expect(() => logCoordinateConversion('x', 10.2, 7.65)).not.toThrow()
  })
})
