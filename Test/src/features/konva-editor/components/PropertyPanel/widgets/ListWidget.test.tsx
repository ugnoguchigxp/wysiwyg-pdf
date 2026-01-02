import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ListWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/ListWidget'
import { getListTypeFromText, applyListFormatting, removeListFormatting } from '@/features/konva-editor/utils/textList'

const resolveText = (_key: string, fallback: string) => fallback

// Mock textList utils to isolate widget logic
vi.mock('@/features/konva-editor/utils/textList', () => ({
    applyListFormatting: vi.fn(),
    getListTypeFromText: vi.fn(),
    removeListFormatting: vi.fn(),
}))

describe('features/konva-editor/components/PropertyPanel/widgets/ListWidget', () => {
    const defaultProps = {
        config: { type: 'list', props: {} } as any,
        node: { id: 'n1', t: 'text', text: 'Hello' } as any,
        onChange: vi.fn(),
        resolveText
    }

    it('renders bullet and number buttons', () => {
        render(<ListWidget {...defaultProps} />)
        expect(screen.getByTitle('Bulleted list')).toBeInTheDocument()
        expect(screen.getByTitle('Numbered list')).toBeInTheDocument()
    })

    it('highlights active list type', () => {
        vi.mocked(getListTypeFromText).mockReturnValue('bullet')
        render(<ListWidget {...defaultProps} />)

        const bulletBtn = screen.getByTitle('Bulleted list')
        expect(bulletBtn.className).toContain('bg-primary')
    })

    it('applies list formatting when clicking inactive type', () => {
        vi.mocked(getListTypeFromText).mockReturnValue(undefined)
        vi.mocked(applyListFormatting).mockReturnValue('- Hello')
        const onChange = vi.fn()

        render(<ListWidget {...defaultProps} onChange={onChange} />)

        fireEvent.click(screen.getByTitle('Bulleted list'))

        expect(applyListFormatting).toHaveBeenCalledWith('Hello', 'bullet', { vertical: false })
        expect(onChange).toHaveBeenCalledWith({ text: '- Hello' })
    })

    it('removes list formatting when clicking active type', () => {
        vi.mocked(getListTypeFromText).mockReturnValue('number')
        vi.mocked(removeListFormatting).mockReturnValue('Hello')
        const onChange = vi.fn()

        render(<ListWidget {...defaultProps} onChange={onChange} node={{ ...defaultProps.node, text: '1. Hello' } as any} />)

        fireEvent.click(screen.getByTitle('Numbered list'))

        expect(removeListFormatting).toHaveBeenCalledWith('1. Hello', { vertical: false })
        expect(onChange).toHaveBeenCalledWith({ text: 'Hello' })
    })

    it('returns null if node is not text', () => {
        const { container } = render(<ListWidget {...defaultProps} node={{ t: 'shape' } as any} />)
        expect(container.firstChild).toBeNull()
    })
})
