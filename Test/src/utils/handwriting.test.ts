import { describe, expect, it } from 'vitest'
import { buildStrokeConfig, buildPathData, toPointPairs, createHandwritingPath } from '@/utils/handwriting'

describe('handwriting', () => {
    describe('buildStrokeConfig', () => {
        it('returns correct config based on width and input', () => {
            const config = buildStrokeConfig(2, true)
            expect(config.size).toBe(8.5) // 2 * 4.25
            expect(config.simulatePressure).toBe(true)
            expect(config.easing).toBeDefined()
        })

        it('disables simulatePressure when requested', () => {
            const config = buildStrokeConfig(1, false)
            expect(config.simulatePressure).toBe(false)
        })
    })

    describe('toPointPairs', () => {
        it('converts flat array to point pairs', () => {
            const flat = [0, 0, 10, 10, 20, 20]
            const pairs = toPointPairs(flat)
            expect(pairs).toEqual([
                [0, 0],
                [10, 10],
                [20, 20],
            ])
        })

        it('handles empty array', () => {
            expect(toPointPairs([])).toEqual([])
        })
    })

    describe('buildPathData', () => {
        it('returns empty string for empty points', () => {
            expect(buildPathData([])).toBe('')
        })

        it('constructs SVG path data', () => {
            // Simple test to ensure it produces string starting with M
            const points = [[0, 0], [10, 10], [20, 20]]
            const path = buildPathData(points)
            expect(path).toMatch(/^M/)
        })
    })

    describe('createHandwritingPath', () => {
        it('returns empty string if not enough points', () => {
            // implementation requires at least 4 points (2 pairs? no, flat string length checked?)
            // The implementation checks: if (flatPoints.length < 4) return ''
            expect(createHandwritingPath([0, 0], 2)).toBe('')
        })

        it('generates path for valid input', () => {
            const flat = [0, 0, 10, 10, 20, 20, 30, 30]
            const path = createHandwritingPath(flat, 2, undefined, false)
            expect(path).toBeTruthy()
            expect(path).toMatch(/^M/)
        })

        it('handles pressure data', () => {
            const flat = [0, 0, 10, 10]
            const pressure = [0.1, 0.9]
            const path = createHandwritingPath(flat, 2, pressure, true)
            expect(path).toBeTruthy()
        })
    })
})
