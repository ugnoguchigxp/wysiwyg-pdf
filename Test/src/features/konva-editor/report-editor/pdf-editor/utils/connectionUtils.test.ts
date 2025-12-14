import { describe, expect, it } from 'vitest'

import { simplifyPoints } from '@/utils/geometry'

describe('geometry/simplifyPoints', () => {
  it('returns endpoints when tolerance is high', () => {
    // points along a polyline
    const pts = [0, 0, 5, 1, 10, 0]
    expect(simplifyPoints(pts, 100)).toEqual([0, 0, 10, 0])
  })

  it('keeps farthest point when tolerance is low', () => {
    const pts = [0, 0, 5, 10, 10, 0]
    const simplified = simplifyPoints(pts, 0.1)
    // should contain at least 3 points (6 numbers)
    expect(simplified.length).toBeGreaterThanOrEqual(6)
  })
})
