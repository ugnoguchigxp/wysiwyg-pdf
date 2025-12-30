import { describe, expect, it } from 'vitest'
import { sanitizeHex, sanitizeNum } from '@/features/slide-editor/utils/pptxExport'

describe('features/slide-editor/utils/pptxExport', () => {
  describe('sanitizeHex', () => {
    it('strips hash from hex color', () => {
      expect(sanitizeHex('#FFFFFF')).toBe('FFFFFF')
      expect(sanitizeHex('#ffffff')).toBe('ffffff')
    })

    it('expands 3-char hex to 6-char', () => {
      expect(sanitizeHex('#FFF')).toBe('FFFFFF')
      expect(sanitizeHex('#abc')).toBe('aabbcc')
    })

    it('returns default for invalid hex', () => {
      expect(sanitizeHex('invalid')).toBe('000000')
      expect(sanitizeHex('')).toBe('000000')
      expect(sanitizeHex(undefined)).toBe('000000')
    })

    it('returns default color for invalid 3-char hex', () => {
      expect(sanitizeHex('#GGG', 'default')).toBe('default')
    })

    it('returns valid 6-char hex unchanged', () => {
      expect(sanitizeHex('123456')).toBe('123456')
      expect(sanitizeHex('ABCDEF')).toBe('ABCDEF')
    })
  })

  describe('sanitizeNum', () => {
    it('returns valid number', () => {
      expect(sanitizeNum(42)).toBe(42)
      expect(sanitizeNum(3.14)).toBe(3.14)
      expect(sanitizeNum(-10)).toBe(-10)
      expect(sanitizeNum(0)).toBe(0)
    })

    it('returns 0 for invalid input', () => {
      expect(sanitizeNum(undefined)).toBe(0)
      expect(sanitizeNum(null as any)).toBe(0)
      expect(sanitizeNum(NaN)).toBe(0)
      expect(sanitizeNum(Infinity)).toBe(0)
    })
  })
})
