import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SlideListPanel } from '@/features/slide-editor/components/SlideListPanel'
import type { Doc } from '@/types/canvas'

// Mock UI Components
vi.mock('@/components/ui/DropdownMenu', () => ({
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onClick }: any) => (
        <button data-testid="dropdown-item" onClick={onClick}>
            {children}
        </button>
    ),
}))

vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, onClick, disabled, variant, className }: any) => (
        <button onClick={onClick} disabled={disabled} data-variant={variant} className={className}>
            {children}
        </button>
    ),
}))

// Mock ScrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()
window.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}

const mockDoc: Doc = {
    v: 1, id: 'd1', title: 'test', unit: 'mm',
    surfaces: [
        { id: 's1', type: 'slide', w: 100, h: 100, bg: '#fff', masterId: 'm1' },
        { id: 's2', type: 'slide', w: 100, h: 100, bg: '#fff', masterId: 'm1' }
    ],
    nodes: []
}

describe('SlideListPanel', () => {
    const defaultProps = {
        doc: mockDoc,
        currentSlideId: 's1',
        onSlideSelect: vi.fn(),
        onChange: vi.fn(),
        thumbnails: {},
        onAddSlide: vi.fn(),
        isMasterEditMode: false
    }

    it('renders list of slides', () => {
        render(<SlideListPanel {...defaultProps} />)
        // Check for slide numbers
        expect(screen.getByText('1')).toBeDefined()
        expect(screen.getByText('2')).toBeDefined()
        expect(screen.getByText('Slides')).toBeDefined()
    })

    it('handles slide selection', () => {
        render(<SlideListPanel {...defaultProps} />)
        // Click on second slide (Index 1)
        const slide2 = screen.getByText('2').closest('div')?.parentElement
        fireEvent.click(slide2!)
        expect(defaultProps.onSlideSelect).toHaveBeenCalledWith('s2')
    })

    it('displays masters in master mode', () => {
        const masterDoc: Doc = {
            ...mockDoc,
            surfaces: [
                { id: 'm1', type: 'slide', w: 100, h: 100, bg: '#fff' }, // Master (no masterId)
                { id: 'm2', type: 'slide', w: 100, h: 100, bg: '#fff' }
            ]
        }
        render(<SlideListPanel {...defaultProps} doc={masterDoc} currentSlideId='m1' isMasterEditMode={true} />)

        expect(screen.getByText('Slide Layouts')).toBeDefined()
        expect(screen.getAllByText(/[1-2]/)).toHaveLength(2)
        // Should show preview
        // SlidePreview is used in Master Mode.
    })

    it('calls onDelete when delete action triggered', () => {
        // We need to trigger the context menu or dropdown
        // The dropdown is "opacity-0 group-hover:opacity-100"
        // But testing-library fires events regardless of opacity usually.
        // Find the "Delete" menu item. It needs DropdownTrigger click first.

        render(<SlideListPanel {...defaultProps} />)

        // Find trigger. It has MoreHorizontal icon.
        // We can find by role or class. 
        // Simplify: render(<SlideListPanel ... />) and userEvent might be better but let's use fireEvent if we can find it.
        // It's inside the slide thumbnail.

        // Let's rely on keyboard interaction for delete as it's easier to robustly test here?
        // There is 'handleKeyDown' on the thumbnail div.

        const slide1 = screen.getByText('1').closest('div')?.parentElement
        fireEvent.keyDown(slide1!, { key: 'Delete' })

        // Should call onChange with new surfaces list
        expect(defaultProps.onChange).toHaveBeenCalled()
        // New doc should have 1 slide
        const callArgs = vi.mocked(defaultProps.onChange).mock.calls[0][0]
        expect(callArgs.surfaces).toHaveLength(1)
        expect(callArgs.surfaces[0].id).toBe('s2')
    })
    it('handles drag and drop reordering', () => {
        render(<SlideListPanel {...defaultProps} />)
        const slides = screen.getAllByText(/[1-2]$/).map(el => el.closest('div')?.parentElement!)
        const slide1 = slides[0]
        const slide2 = slides[1]

        // Drag Start
        fireEvent.dragStart(slide1, { dataTransfer: { effectAllowed: '', dropEffect: '' } })
        // Drag Over Target
        fireEvent.dragOver(slide2, { dataTransfer: { effectAllowed: '', dropEffect: '' } })
        // Drop
        fireEvent.drop(slide2, { dataTransfer: { effectAllowed: '', dropEffect: '' } })

        expect(defaultProps.onChange).toHaveBeenCalled()
        const callArgs = vi.mocked(defaultProps.onChange).mock.calls[0][0]
        // Slide 1 moved after Slide 2?
        // logic: splice oldIndex(0), 1 -> splice newIndex(1), 0, moved
        // result: [s2, s1]
        expect(callArgs.surfaces[0].id).toBe('s2')
        expect(callArgs.surfaces[1].id).toBe('s1')
    })

    it('handles duplicate action', async () => {
        render(<SlideListPanel {...defaultProps} />)

        // Find Duplicate buttons (mocked as dropdown items)
        // With our mock, content is always rendered in div.
        const duplicateBtns = screen.getAllByText('Duplicate')
        fireEvent.click(duplicateBtns[0])

        expect(defaultProps.onChange).toHaveBeenCalled()
        const callArgs = vi.mocked(defaultProps.onChange).mock.calls[0][0]
        // Doc should have 3 slides now (s1, NEW, s2) or (s1, s1-copy, s2)?
        // Original logic: splice(index+1, 0, newSurface)
        // index of s1 is 0. So insert at 1.
        expect(callArgs.surfaces).toHaveLength(3)
        // Assert ID is unique?
        expect(callArgs.surfaces[1].id).not.toBe('s1')
        expect(callArgs.surfaces[1].id).not.toBe('s2')
    })

    it('prevents deleting last slide', () => {
        const singleSlideDoc = {
            ...mockDoc,
            surfaces: [mockDoc.surfaces[0]]
        }
        render(<SlideListPanel {...defaultProps} doc={singleSlideDoc} />)

        // Try delete
        const slideContainer = screen.getByText('1').closest('div')?.parentElement
        fireEvent.keyDown(slideContainer!, { key: 'Delete' })

        expect(defaultProps.onChange).not.toHaveBeenCalled()
    })
})
