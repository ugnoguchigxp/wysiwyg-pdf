import { describe, expect, it, vi, beforeEach } from 'vitest'
import { calculatePasteNodes } from './clipboardUtils'
import type { UnifiedNode } from '@/types/canvas'

vi.mock('@/utils/browser', () => ({
    generateUUID: vi.fn(() => 'new-uuid'),
}))

describe('features/report-editor/utils/clipboardUtils', () => {
    const mockNode: UnifiedNode = {
        id: 'old-id',
        t: 'text',
        s: 'old-surface',
        x: 10,
        y: 20,
        w: 100,
        h: 20,
        text: 'Hello',
    } as any

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('calculates new positions and IDs for pasted nodes', () => {
        const surfaceId = 'new-surface'
        const surfaceWidth = 210 // A4 mm
        const pasteCount = 2

        const result = calculatePasteNodes([mockNode], surfaceId, surfaceWidth, pasteCount)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('new-uuid')
        expect(result[0].s).toBe(surfaceId)
        // offset = 210 * 0.01 * 2 = 4.2
        expect(result[0].x).toBeCloseTo(14.2)
        expect(result[0].y).toBeCloseTo(24.2)
    })

    it('handles nodes without x/y (if any) gracefully', () => {
        const nodeNoPos = { id: 'old', t: 'widget', s: 'old' } as any
        const result = calculatePasteNodes([nodeNoPos], 'new', 100, 1)

        expect(result[0].id).toBe('new-uuid')
        expect(result[0].s).toBe('new')
        expect(result[0].x).toBeUndefined()
    })

    it('works in non-browser environments by relying on safe generator', () => {
        // This is implicitly tested by the mock, but the logic itself doesn't use window/document.
        const result = calculatePasteNodes([mockNode], 's', 100, 1)
        expect(result).toBeDefined()
    })
})
