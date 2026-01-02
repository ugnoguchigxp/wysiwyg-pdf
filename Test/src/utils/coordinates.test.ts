import { describe, expect, it } from 'vitest'
import { ptToPx, pxToPt } from '@/utils/coordinates'

describe('coordinates', () => {
    describe('ptToPx', () => {
        it('converts pt to px correctly with default DPI (96)', () => {
            // 1pt = 1/72 inch
            // 1px = 1/96 inch
            // 1pt = 96/72 px = 1.3333 px
            expect(ptToPx(10)).toBeCloseTo(13.3333, 4)
            expect(ptToPx(72)).toBeCloseTo(96, 4)
        })

        it('converts pt to px correctly with custom DPI', () => {
            // 72 DPI -> 1pt = 1px
            expect(ptToPx(10, { dpi: 72 })).toBeCloseTo(10, 4)
        })
    })

    describe('pxToPt', () => {
        it('converts px to pt correctly with default DPI (96)', () => {
            // 96px = 1 inch = 72pt
            expect(pxToPt(96)).toBeCloseTo(72, 4)
            expect(pxToPt(13.3333)).toBeCloseTo(10, 4)
        })

        it('converts px to pt correctly with custom DPI', () => {
            // 72 DPI -> 1px = 1pt
            expect(pxToPt(10, { dpi: 72 })).toBeCloseTo(10, 4)
        })
    })
})
