import { describe, it, expect } from 'vitest'
import {
    getStrokesBox,
    processStrokes,
    normalizeStrokes,
} from '@/features/report-editor/utils/signatureUtils'

describe('features/report-editor/utils/signatureUtils', () => {
    describe('getStrokesBox', () => {
        it('calculates bounding box for multiple strokes', () => {
            // Stroke 1: (0,0) -> (10,10)
            // Stroke 2: (20,20) -> (30,5)
            const strokes = [
                [0, 0, 10, 10],
                [20, 20, 30, 5],
            ]
            const box = getStrokesBox(strokes)
            expect(box).toEqual({ x: 0, y: 0, w: 30, h: 20 })
        })

        it('returns default box for empty strokes', () => {
            const box = getStrokesBox([])
            expect(box).toEqual({ x: 0, y: 0, w: 100, h: 50 })
        })

        it('handles negative coordinates', () => {
            const strokes = [[-10, -5, 0, 0]]
            const box = getStrokesBox(strokes)
            expect(box).toEqual({ x: -10, y: -5, w: 10, h: 5 })
        })
    })

    describe('processStrokes', () => {
        it('returns original strokes if no simplification needed', () => {
            const strokes = [[0, 0, 10, 10]]
            const processed = processStrokes(strokes, { simplification: 0 })
            expect(processed).toEqual(strokes)
        })

        it('duplicates single point stroke to make it visible', () => {
            const strokes = [[10, 10]] // length 2
            const processed = processStrokes(strokes)
            expect(processed[0]).toEqual([10, 10, 10, 10])
        })

        it('applies simplification when configured', () => {
            // A straight line with jitter: (0,0) -> (5, 0.1) -> (10,0)
            const strokes = [[0, 0, 5, 0.1, 10, 0]]
            // Simplify should likely remove the middle point if tolerance is high enough
            const processed = processStrokes(strokes, { simplification: 0.5 })
            expect(processed[0].length).toBeLessThan(6)
        })
    })

    describe('normalizeStrokes', () => {
        it('normalizes strokes relative to bounding box', () => {
            const strokes = [[10, 10, 20, 20]]
            const box = { x: 10, y: 10, w: 10, h: 10 }
            const normalized = normalizeStrokes(strokes, box)

            // Should become (0,0) -> (10,10)
            expect(normalized).toEqual([[0, 0, 10, 10]])
        })

        it('rounds coordinates to 2 decimal places', () => {
            const strokes = [[10.123, 10.456]]
            const box = { x: 0, y: 0, w: 100, h: 100 }
            const normalized = normalizeStrokes(strokes, box)
            expect(normalized[0]).toEqual([10.12, 10.46])
        })
    })
})
