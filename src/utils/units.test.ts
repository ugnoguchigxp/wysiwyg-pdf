import { describe, expect, it } from 'vitest'
import { mmToPx, pxToMm, mmToPt, ptToMm, inToMm, mmToIn, toMm, fromMm, roundTo } from '@/utils/units'

describe('utils/units', () => {
  describe('mmToPx', () => {
    it('converts mm to px with default DPI (96)', () => {
      expect(mmToPx(25.4)).toBeCloseTo(96, 0)
    })

    it('converts mm to px with custom DPI', () => {
      expect(mmToPx(25.4, { dpi: 72 })).toBeCloseTo(72, 0)
    })

    it('handles zero', () => {
      expect(mmToPx(0)).toBe(0)
    })

    it('handles negative values', () => {
      expect(mmToPx(-25.4)).toBeCloseTo(-96, 0)
    })
  })

  describe('pxToMm', () => {
    it('converts px to mm with default DPI (96)', () => {
      expect(pxToMm(96)).toBeCloseTo(25.4, 1)
    })

    it('converts px to mm with custom DPI', () => {
      expect(pxToMm(72, { dpi: 72 })).toBeCloseTo(25.4, 1)
    })

    it('handles zero', () => {
      expect(pxToMm(0)).toBe(0)
    })

    it('handles negative values', () => {
      expect(pxToMm(-96)).toBeCloseTo(-25.4, 1)
    })
  })

  describe('mmToPt', () => {
    it('converts mm to pt', () => {
      expect(mmToPt(25.4)).toBeCloseTo(72, 0)
    })

    it('handles zero', () => {
      expect(mmToPt(0)).toBe(0)
    })
  })

  describe('ptToMm', () => {
    it('converts pt to mm', () => {
      expect(ptToMm(72)).toBeCloseTo(25.4, 1)
    })

    it('handles zero', () => {
      expect(ptToMm(0)).toBe(0)
    })
  })

  describe('inToMm', () => {
    it('converts inches to mm', () => {
      expect(inToMm(1)).toBeCloseTo(25.4, 1)
    })

    it('handles zero', () => {
      expect(inToMm(0)).toBe(0)
    })
  })

  describe('mmToIn', () => {
    it('converts mm to inches', () => {
      expect(mmToIn(25.4)).toBeCloseTo(1, 1)
    })

    it('handles zero', () => {
      expect(mmToIn(0)).toBe(0)
    })
  })

  describe('toMm', () => {
    it('returns same value for mm', () => {
      expect(toMm(10, 'mm')).toBe(10)
    })

    it('converts pt to mm', () => {
      expect(toMm(72, 'pt')).toBeCloseTo(25.4, 1)
    })

    it('converts px to mm', () => {
      expect(toMm(96, 'px')).toBeCloseTo(25.4, 1)
    })

    it('converts inches to mm', () => {
      expect(toMm(1, 'in')).toBeCloseTo(25.4, 1)
    })
  })

  describe('fromMm', () => {
    it('returns same value for mm', () => {
      expect(fromMm(10, 'mm')).toBe(10)
    })

    it('converts mm to pt', () => {
      expect(fromMm(25.4, 'pt')).toBeCloseTo(72, 0)
    })

    it('converts mm to px', () => {
      expect(fromMm(25.4, 'px')).toBeCloseTo(96, 0)
    })

    it('converts mm to inches', () => {
      expect(fromMm(25.4, 'in')).toBeCloseTo(1, 1)
    })
  })

  describe('roundTo', () => {
    it('rounds to 0 decimal places', () => {
      expect(roundTo(1.234, 0)).toBe(1)
    })

    it('rounds to 1 decimal place', () => {
      expect(roundTo(1.234, 1)).toBe(1.2)
    })

    it('rounds to 2 decimal places', () => {
      expect(roundTo(1.234, 2)).toBe(1.23)
    })

    it('rounds up correctly', () => {
      expect(roundTo(1.95, 1)).toBe(2)
    })

    it('handles zero', () => {
      expect(roundTo(0, 2)).toBe(0)
    })

    it('handles negative values', () => {
      expect(roundTo(-1.234, 2)).toBe(-1.23)
    })
  })
})
