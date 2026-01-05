import { describe, expect, it, vi } from 'vitest'
import { calculateRichTextLayout, measureTextWidth } from '@/components/canvas/renderers/richTextLayout'
import type { RichTextFragment } from '@/types/canvas'

// Mock canvas context for measureTextWidth
// BUT measureTextWidth creates canvas internally if document exists.
// In jsdom environment, document.createElement('canvas') works.
// We need to mock getContext('2d').measureText to return predictable width.

describe('richTextLayout', () => {
    // Mock canvas measurement
    beforeAll(() => {
        const mockMeasureText = (text: string) => ({ width: text.length * 10 } as TextMetrics)

        // Mock document.createElement if needed, but jsdom has it.
        // We override getContext to return our mock.
        const originalCreateElement = document.createElement.bind(document)
        vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
            if (tagName === 'canvas') {
                return {
                    getContext: (type: string) => {
                        if (type === '2d') {
                            return {
                                measureText: mockMeasureText,
                                font: '',
                            }
                        }
                        return null
                    }
                } as any
            }
            return originalCreateElement(tagName)
        })
    })

    afterAll(() => {
        vi.restoreAllMocks()
    })

    const baseFragments: RichTextFragment[] = [
        { text: 'Hello', fontSize: 12, font: 'Arial' },
        { text: 'World', fontSize: 12, font: 'Arial', bold: true }
    ]

    it('measures text width correctly (10px per char mock)', () => {
        expect(measureTextWidth('abc', 12, 'Arial', false, false)).toBe(30)
    })

    it('calculates layout for single line fitting width', () => {
        // "Hello" (50px) + "World" (50px) = 100px. Width 200px.
        const fragments = [...baseFragments]
        const layout = calculateRichTextLayout(
            fragments,
            200,
            100,
            'l',
            't',
            12,
            'Arial',
            '#000',
            true
        )

        expect(layout.length).toBe(2)
        // First chunk "Hello"
        expect(layout[0].text).toBe('Hello')
        expect(layout[0].x).toBe(0)
        expect(layout[0].y).toBe(0)

        // Second chunk "World"
        expect(layout[1].text).toBe('World')
        expect(layout[1].x).toBe(50) // Starts after 50px
    })

    it('wraps text when exceeding width', () => {
        // "Hello" (50px) + "World" (50px) = 100px. Width 80px.
        // Should wrap "World" or split?
        // Logic is char-by-char if needed, or by fragmented chunks?
        // calculateRichTextLayout processes fragments.
        // "Hello" fits (50 <= 80).
        // "World" fits remaining (30)? No.
        // So "World" should wrap to next line.

        const fragments = [...baseFragments]
        const layout = calculateRichTextLayout(
            fragments,
            80,
            100,
            'l',
            't',
            12,
            'Arial',
            '#000',
            true
        )
        // Expected: 
        // Line 1: "Hello" (50px)
        // Line 2: "World" (50px)

        expect(layout.length).toBe(3)
        expect(layout[0].text).toBe('Hello')
        expect(layout[0].y).toBe(0)

        expect(layout[1].text).toBe('Wor')
        expect(layout[1].x).toBe(50) // Fits on first line
        expect(layout[1].y).toBe(0)

        expect(layout[2].text).toBe('ld')
        expect(layout[2].x).toBe(0) // New line
        expect(layout[2].y).toBeGreaterThan(12)
    })

    it('handles alignment (center)', () => {
        // "Hello" (50px). Width 100px. Center.
        // OffsetX = (100 - 50) / 2 = 25.
        const fragments = [{ text: 'Hello', fontSize: 12 }]
        const layout = calculateRichTextLayout(
            fragments,
            100,
            100,
            'c',
            't',
            12,
            'Arial',
            '#000',
            true
        )

        expect(layout[0].x).toBe(25)
    })

    it('handles vertical alignment (middle)', () => {
        // Content height ~ 13.8. Box height 100.
        // OffsetY = (100 - 13.8) / 2 = 43.1
        const fragments = [{ text: 'Hello', fontSize: 12 }]
        const layout = calculateRichTextLayout(
            fragments,
            100,
            100,
            'l',
            'm',
            12,
            'Arial',
            '#000',
            true
        )

        expect(layout[0].y).toBeGreaterThan(30)
        expect(layout[0].y).toBeLessThan(50)
    })

    it('splits long word if it exceeds full width', () => {
        // "HelloWarning" (120px). Width 50px.
        // Should split
        const fragments = [{ text: 'HelloWarning', fontSize: 12 }]
        const layout = calculateRichTextLayout(
            fragments,
            50,
            100,
            'l',
            't',
            12,
            'Arial',
            '#000',
            true
        )

        // It should produce multiple chunks
        expect(layout.length).toBeGreaterThan(1)
        expect(layout[0].text.length).toBeLessThan(12)
        // Check accumulation
        const fullText = layout.map(l => l.text).join('')
        expect(fullText).toBe('HelloWarning')
    })
})
