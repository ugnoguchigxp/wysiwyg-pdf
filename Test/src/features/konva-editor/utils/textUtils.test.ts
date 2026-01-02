import { describe, it, expect, vi, afterEach } from 'vitest'
import {
    measureText,
    calculateTextDimensions,
} from '@/features/konva-editor/utils/textUtils'
import { ptToMm, mmToPx } from '@/utils/units'

describe('features/konva-editor/utils/textUtils', () => {
    // Mock Canvas context
    // Mock Canvas context
    const mockMeasureText = vi.fn().mockReturnValue({ width: 0 })
    const mockGetContext = vi.fn(() => ({
        measureText: mockMeasureText,
        font: '',
    }))

    // Setup DOM mocks
    const originalCreateElement = document.createElement

    beforeEach(() => {
        mockMeasureText.mockReturnValue({ width: 10 }) // Default width
        document.createElement = vi.fn((tag) => {
            if (tag === 'canvas') {
                return {
                    getContext: mockGetContext
                } as any
            }
            return originalCreateElement(tag)
        })
    })

    afterEach(() => {
        document.createElement = originalCreateElement
        vi.clearAllMocks()
    })

    describe('measureText', () => {
        it('returns dimensions based on context.measureText', () => {
            mockMeasureText.mockReturnValue({ width: 50 })
            const font = { family: 'Arial', size: 20 }

            const result = measureText('hello', font)

            expect(result.width).toBe(50)
            expect(result.height).toBe(24) // size * 1.2
            expect(mockGetContext).toHaveBeenCalled()
        })

        it('handles missing document/context gracefully (if possible)', () => {
            // Hard to test "missing document" in jsdom env without tearing it down,
            // but can test missing context
            mockGetContext.mockReturnValue(null as any)
            const result = measureText('hello', { family: 'Arial', size: 10 })
            expect(result).toEqual({ width: 0, height: 0 })
        })
    })

    describe('calculateTextDimensions', () => {
        it('calculates dimensions for horizontal text', () => {
            mockMeasureText.mockReturnValue({ width: 100 }) // 100px width
            const text = 'Hello\nWorld'
            const fontSettings = { size: ptToMm(10) } // 10pt approx 3.52mm

            const dims = calculateTextDimensions(text, fontSettings)

            // Horizontal: w = maxLine (100px converted to mm), h = lines * lineHeight
            // 100px at 96dpi -> 26.458mm
            expect(dims.w).toBeCloseTo(26.458, 2)

            // Height: 2 lines * (sizePx * 1.2)
            // sizePx for 10pt is 13.33px
            // single line h = 13.33 * 1.2 = 16px
            // total h = 32px -> 8.46mm
            expect(dims.h).toBeGreaterThan(0)
        })

        it('calculates dimensions for vertical text', () => {
            const text = 'ab'
            const fontSettings = { size: ptToMm(10), isVertical: true }

            const dims = calculateTextDimensions(text, fontSettings)

            // Vertical layout logic:
            // w = numColumns (1 line = 1 col) * columnWidth
            // h = maxChars (2) * charHeight
            expect(dims.w).toBeGreaterThan(0)
            expect(dims.h).toBeGreaterThan(0)
        })

        it('adds padding to dimensions', () => {
            mockMeasureText.mockReturnValue({ width: 10 })
            const fontSettings = { padding: 10 } // 10mm padding
            const dims = calculateTextDimensions('A', fontSettings)

            // Width should includ padding * 2
            // Base width 10px (~2.64mm) + 20mm padding = ~22.64mm
            expect(dims.w).toBeGreaterThan(20)
            expect(dims.h).toBeGreaterThan(20)
        })
    })
})
