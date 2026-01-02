import { describe, it, expect } from 'vitest'
import {
    getPageDimensions,
    getPresentationPageDimensions,
} from '@/features/konva-editor/utils/pageUtils'

describe('features/konva-editor/utils/pageUtils', () => {
    describe('getPageDimensions', () => {
        it('returns correct dimensions for standard sizes', () => {
            expect(getPageDimensions('A4')).toEqual({ width: 210, height: 297 })
            expect(getPageDimensions('A5')).toEqual({ width: 148, height: 210 })
            expect(getPageDimensions('B5')).toEqual({ width: 182, height: 257 })
            expect(getPageDimensions('Letter')).toEqual({ width: 216, height: 279 })
        })

        it('defaults to A4 for unknown string size', () => {
            expect(getPageDimensions('Unknown' as any)).toEqual({ width: 210, height: 297 })
        })

        it('calculates dimensions from custom object size (portrait)', () => {
            const size = { width: 100, height: 200, unit: 'mm' as const }
            // Should return width < height because logic ensures portrait orientation? 
            // Waiting, logic says: wMm > hMm ? { h, w } : { w, h }
            // So it enforces Portrait? Let's check logic:
            // if w > h (Landscape input) -> returns { width: h, height: w } (Portrait output)
            // if w < h (Portrait input) -> returns { width: w, height: h } (Portrait output)
            // Yes, it enforces Portrait.

            expect(getPageDimensions(size)).toEqual({ width: 100, height: 200 })
        })

        it('rotates dimensions to portrait if landscape input provided', () => {
            const size = { width: 297, height: 210, unit: 'mm' as const }
            expect(getPageDimensions(size)).toEqual({ width: 210, height: 297 })
        })

        it('converts units correctly', () => {
            // 1 inch = 25.4 mm
            const size = { width: 10, height: 20, unit: 'in' as const }
            const dims = getPageDimensions(size)
            // 10in = 254mm, 20in = 508mm
            expect(dims.width).toBeCloseTo(254, 1)
            expect(dims.height).toBeCloseTo(508, 1)
        })
    })

    describe('getPresentationPageDimensions', () => {
        const DISPLAY_SCALE = 0.7

        it('applies scale to standard sizes', () => {
            const dims = getPresentationPageDimensions('A4')
            expect(dims.width).toBeCloseTo(297 * DISPLAY_SCALE) // A4 Landscape for presentation
            expect(dims.height).toBeCloseTo(210 * DISPLAY_SCALE)
        })

        it('applies scale to custom sizes', () => {
            const size = { width: 100, height: 50, unit: 'mm' as const }
            const dims = getPresentationPageDimensions(size)
            expect(dims.width).toBeCloseTo(100 * DISPLAY_SCALE)
            expect(dims.height).toBeCloseTo(50 * DISPLAY_SCALE)
        })
    })
})
