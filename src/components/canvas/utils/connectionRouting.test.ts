import { describe, expect, it } from 'vitest'
import { getAnchorPointAndDirection, getOrthogonalConnectionPath, getOrthogonalPath } from '@/components/canvas/utils/connectionRouting'

describe('components/canvas/utils/connectionRouting', () => {
  describe('getAnchorPointAndDirection', () => {
    it('returns correct top anchor point and direction', () => {
      const result = getAnchorPointAndDirection({ x: 10, y: 20, w: 100, h: 50 }, 't')
      expect(result.x).toBe(60)
      expect(result.y).toBe(20)
      expect(result.nx).toBe(0)
      expect(result.ny).toBe(-1)
    })

    it('returns correct bottom anchor point and direction', () => {
      const result = getAnchorPointAndDirection({ x: 10, y: 20, w: 100, h: 50 }, 'b')
      expect(result.x).toBe(60)
      expect(result.y).toBe(70)
      expect(result.nx).toBe(0)
      expect(result.ny).toBe(1)
    })

    it('returns correct left anchor point and direction', () => {
      const result = getAnchorPointAndDirection({ x: 10, y: 20, w: 100, h: 50 }, 'l')
      expect(result.x).toBe(10)
      expect(result.y).toBe(45)
      expect(result.nx).toBe(-1)
      expect(result.ny).toBe(0)
    })

    it('returns correct right anchor point and direction', () => {
      const result = getAnchorPointAndDirection({ x: 10, y: 20, w: 100, h: 50 }, 'r')
      expect(result.x).toBe(110)
      expect(result.y).toBe(45)
      expect(result.nx).toBe(1)
      expect(result.ny).toBe(0)
    })

    it('returns correct top-left anchor point and direction', () => {
      const result = getAnchorPointAndDirection({ x: 10, y: 20, w: 100, h: 50 }, 'tl')
      expect(result.x).toBe(10)
      expect(result.y).toBe(20)
      expect(result.nx).toBe(-1)
      expect(result.ny).toBe(-1)
    })

    it('returns correct top-right anchor point and direction', () => {
      const result = getAnchorPointAndDirection({ x: 10, y: 20, w: 100, h: 50 }, 'tr')
      expect(result.x).toBe(110)
      expect(result.y).toBe(20)
      expect(result.nx).toBe(1)
      expect(result.ny).toBe(-1)
    })

    it('returns correct bottom-left anchor point and direction', () => {
      const result = getAnchorPointAndDirection({ x: 10, y: 20, w: 100, h: 50 }, 'bl')
      expect(result.x).toBe(10)
      expect(result.y).toBe(70)
      expect(result.nx).toBe(-1)
      expect(result.ny).toBe(1)
    })

    it('returns correct bottom-right anchor point and direction', () => {
      const result = getAnchorPointAndDirection({ x: 10, y: 20, w: 100, h: 50 }, 'br')
      expect(result.x).toBe(110)
      expect(result.y).toBe(70)
      expect(result.nx).toBe(1)
      expect(result.ny).toBe(1)
    })

    it('returns correct auto anchor point and direction', () => {
      const result = getAnchorPointAndDirection({ x: 10, y: 20, w: 100, h: 50 }, 'auto')
      expect(result.x).toBe(60)
      expect(result.y).toBe(45)
      expect(result.nx).toBe(0)
      expect(result.ny).toBe(0)
    })
  })

  describe('getOrthogonalConnectionPath', () => {
    it('calculates path for horizontal connection', () => {
      const result = getOrthogonalConnectionPath(
        { x: 10, y: 50, w: 100, h: 50 },
        'r',
        { x: 200, y: 50, w: 100, h: 50 },
        'l'
      )
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThanOrEqual(4)
      expect(result[0]).toBe(110)
      expect(result[1]).toBe(75)
    })

    it('calculates path for vertical connection', () => {
      const result = getOrthogonalConnectionPath(
        { x: 50, y: 10, w: 100, h: 50 },
        'b',
        { x: 50, y: 200, w: 100, h: 50 },
        't'
      )
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThanOrEqual(4)
    })

    it('handles diagonal anchor resolution', () => {
      const result = getOrthogonalConnectionPath(
        { x: 0, y: 0, w: 100, h: 50 },
        'br',
        { x: 200, y: 100, w: 100, h: 50 },
        'tl'
      )
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('getOrthogonalPath', () => {
    it('calculates path with explicit end direction', () => {
      const result = getOrthogonalPath(
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 100, y: 0 },
        { x: -1, y: 0 }
      )
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThanOrEqual(2)
    })

    it('calculates path with inferred end direction (horizontal preference)', () => {
      const result = getOrthogonalPath(
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 100, y: 0 },
        null
      )
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThanOrEqual(2)
    })

    it('calculates path with inferred end direction (vertical preference)', () => {
      const result = getOrthogonalPath(
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 100 },
        null
      )
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThanOrEqual(2)
    })
  })
})
