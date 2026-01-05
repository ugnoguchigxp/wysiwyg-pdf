import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    calculateVerticalTextHeight,
    calculateInitialTextBoxSize,
    applyTextLayoutUpdates
} from '@/features/konva-editor/utils/textLayout'
import { ptToMm } from '@/utils/units'

// Mock dependencies
vi.mock('@/features/konva-editor/utils/textUtils', () => ({
    measureText: vi.fn(),
    calculateTextDimensions: vi.fn()
}))

import { measureText, calculateTextDimensions } from '@/features/konva-editor/utils/textUtils'

describe('features/konva-editor/utils/textLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('calculateVerticalTextHeight', () => {
        it('calculates height based on max line length', () => {
            // "AB\nC" -> max length 2. height = 2 * fontSize + padding*2
            const height = calculateVerticalTextHeight('AB\nC', 10, 5)
            // 2 * 10 + 5*2 = 20 + 10 = 30
            expect(height).toBe(30)
        })

        it('handles empty text', () => {
            const height = calculateVerticalTextHeight('', 10, 5)
            // max(0, 1) = 1 char height min. 1 * 10 + 10 = 20
            expect(height).toBe(20)
        })
    })

    describe('calculateInitialTextBoxSize', () => {
        it('calculates size based on measureText', () => {
            vi.mocked(measureText).mockReturnValue({ width: 50, height: 20 })
            const font = { family: 'Arial', sizeMm: 10 }

            // 96 DPI: 1px = 0.264583 mm
            // w = pxToMm(50 + 10) = pxToMm(60) ~= 15.875
            // h = pxToMm(20 + 4) = pxToMm(24) ~= 6.35

            const size = calculateInitialTextBoxSize('hello', font)

            expect(measureText).toHaveBeenCalled()
            expect(size.w).toBeCloseTo(15.875, 1)
            expect(size.h).toBeCloseTo(6.35, 1)
        })
    })

    describe('applyTextLayoutUpdates', () => {
        const baseNode: any = {
            id: 't1',
            t: 'text',
            text: 'foo',
            fontSize: ptToMm(10),
            padding: 5,
            vertical: false,
            font: 'Arial',
            fontWeight: 400
        }

        it('returns updates as is if no layout keys changed', () => {
            const updates = { x: 100 }
            const result = applyTextLayoutUpdates(baseNode, updates)
            expect(result).toEqual(updates)
        })

        it('recalculates dimensions if checking vertical false explicitly', () => {
            // Scenario: vertical prop passed as false
            const updates = { vertical: false }
            vi.mocked(calculateTextDimensions).mockReturnValue({ w: 100, h: 50 } as any)

            const result = applyTextLayoutUpdates(baseNode, updates)

            expect(calculateTextDimensions).toHaveBeenCalledWith('foo', expect.objectContaining({ isVertical: false }))
            expect(result).toEqual({ vertical: false, w: 100, h: 50 })
        })

        it('recalculates height if checking vertical true explicitly', () => {
            // Scenario: vertical prop passed as true
            const updates = { vertical: true }
            // text 'foo' len 3. fontSize ~3.5mm. padding 5.
            // h = 3 * 3.5 + 10 = 20.5

            const result = applyTextLayoutUpdates(baseNode, updates)
            expect((result as any).vertical).toBe(true)
            expect(result.h).toBeGreaterThan(0)
        })

        it('handles layout updates when vertical is already true on node', () => {
            const verticalNode = { ...baseNode, vertical: true }
            const updates = { text: 'longer' } // layout key change

            const result = applyTextLayoutUpdates(verticalNode, updates)
            expect(result.h).toBeGreaterThan(0)
            // Should delete w if present to let it float or handle elsewhere? logic says delete w
            expect(result).not.toHaveProperty('w')
        })

        it('recalculates dimensions for normal text updates', () => {
            const updates = { text: 'bar' }
            vi.mocked(calculateTextDimensions).mockReturnValue({ w: 80, h: 40 } as any)

            const result = applyTextLayoutUpdates(baseNode, updates)
            expect(calculateTextDimensions).toHaveBeenCalledWith('bar', expect.anything())
            expect(result).toEqual({ ...updates, w: 80, h: 40 })
        })
    })
})
