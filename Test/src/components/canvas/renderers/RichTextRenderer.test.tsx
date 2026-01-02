import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RichTextRenderer } from '@/components/canvas/renderers/RichTextRenderer'
import { calculateRichTextLayout } from '@/components/canvas/renderers/richTextLayout'

// Mock react-konva
vi.mock('react-konva', () => ({
    Group: ({ children }: any) => <div data-testid="Group">{children}</div>,
    Text: (props: any) => <div data-testid="Text" data-text={props.text} data-x={props.x} data-y={props.y} />,
}))

// Mock layout logic
vi.mock('@/components/canvas/renderers/richTextLayout', () => ({
    calculateRichTextLayout: vi.fn(),
}))

describe('RichTextRenderer', () => {
    const defaultProps = {
        fragments: [{ text: 'Test' }],
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        align: 'l' as const,
        vAlign: 't' as const,
        defaultFontSize: 12,
        defaultFontFamily: 'Arial',
        defaultColor: '#000',
        keyPrefix: 'test',
    }

    it('renders calculated layout nodes', () => {
        // Mock layout return
        vi.mocked(calculateRichTextLayout).mockReturnValue([
            {
                text: 'Test',
                x: 0,
                y: 0,
                width: 40,
                height: 14,
                fs: 12,
                fam: 'Arial',
                color: '#000',
                bold: false,
                italic: false,
            }
        ])

        const result = render(<RichTextRenderer {...defaultProps} />)

        // Should call layout calculation
        expect(calculateRichTextLayout).toHaveBeenCalledWith(
            defaultProps.fragments,
            100, // width
            50, // height
            'l',
            't',
            12,
            'Arial',
            '#000',
            false // wrap default
        )

        // Should render Text with offset x/y
        const textNode = result.getByTestId('Text')
        expect(textNode).toHaveAttribute('data-text', 'Test')
        expect(textNode).toHaveAttribute('data-x', '10') // 10 + 0
        expect(textNode).toHaveAttribute('data-y', '20') // 20 + 0
    })

    it('renders multiple fragments', () => {
        vi.mocked(calculateRichTextLayout).mockReturnValue([
            { text: 'A', x: 0, y: 0, width: 10, height: 10, fs: 10, fam: 'Arial', color: '#000' },
            { text: 'B', x: 10, y: 0, width: 10, height: 10, fs: 10, fam: 'Arial', color: '#000' }
        ])

        const result = render(<RichTextRenderer {...defaultProps} />)
        const textNodes = result.getAllByTestId('Text')
        expect(textNodes).toHaveLength(2)
    })
})
