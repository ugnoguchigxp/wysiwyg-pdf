import { describe, expect, it } from 'vitest'
import { getAnchorPoint } from '@/components/canvas/utils/elementUtils'

describe('components/canvas/utils/elementUtils', () => {
  describe('getAnchorPoint', () => {
    it('returns top-left anchor point', () => {
      const result = getAnchorPoint('tl', 10, 20, 100, 50)
      expect(result.x).toBe(10)
      expect(result.y).toBe(20)
    })

    it('returns top anchor point', () => {
      const result = getAnchorPoint('t', 10, 20, 100, 50)
      expect(result.x).toBe(60)
      expect(result.y).toBe(20)
    })

    it('returns top-right anchor point', () => {
      const result = getAnchorPoint('tr', 10, 20, 100, 50)
      expect(result.x).toBe(110)
      expect(result.y).toBe(20)
    })

    it('returns left anchor point', () => {
      const result = getAnchorPoint('l', 10, 20, 100, 50)
      expect(result.x).toBe(10)
      expect(result.y).toBe(45)
    })

    it('returns right anchor point', () => {
      const result = getAnchorPoint('r', 10, 20, 100, 50)
      expect(result.x).toBe(110)
      expect(result.y).toBe(45)
    })

    it('returns bottom-left anchor point', () => {
      const result = getAnchorPoint('bl', 10, 20, 100, 50)
      expect(result.x).toBe(10)
      expect(result.y).toBe(70)
    })

    it('returns bottom anchor point', () => {
      const result = getAnchorPoint('b', 10, 20, 100, 50)
      expect(result.x).toBe(60)
      expect(result.y).toBe(70)
    })

    it('returns bottom-right anchor point', () => {
      const result = getAnchorPoint('br', 10, 20, 100, 50)
      expect(result.x).toBe(110)
      expect(result.y).toBe(70)
    })

    it('returns center point for unknown anchor', () => {
      const result = getAnchorPoint('auto' as any, 10, 20, 100, 50)
      expect(result.x).toBe(60)
      expect(result.y).toBe(45)
    })

    it('returns center point for default case', () => {
      const result = getAnchorPoint('unknown' as any, 0, 0, 100, 100)
      expect(result.x).toBe(50)
      expect(result.y).toBe(50)
    })
  })
})
