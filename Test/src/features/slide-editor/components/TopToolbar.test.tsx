import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TopToolbar } from '@/features/slide-editor/components/TopToolbar'
import type { Doc } from '@/types/canvas'
import { SLIDE_LAYOUTS } from '@/features/slide-editor/constants/layouts'

// Mock icons to avoid rendering issues and keep snapshots small (though we aren't using snapshots here)
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        // @ts-ignore
        ...actual,
        // Mock specific icons used if needed, or rely on auto-mocking by simple render
    }
})

// Mock UI components
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
    Button: ({ children, onClick, disabled, variant }: any) => (
        <button onClick={onClick} disabled={disabled} data-variant={variant}>
            {children}
        </button>
    ),
}))

const mockDoc: Doc = {
    v: 1, id: 'd1', title: 'test', unit: 'mm', surfaces: [], nodes: []
}

describe('TopToolbar', () => {
    const defaultProps = {
        doc: mockDoc,
        currentSlideId: 's1',
        onDocChange: vi.fn(),
        onSelectElement: vi.fn(),
        zoom: 100,
        onZoomChange: vi.fn(),
        onPlay: vi.fn(),
        onExport: vi.fn(),
        canUndo: false,
        canRedo: false,
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        activeTool: 'cursor',
        onToolSelect: vi.fn(),
        onAddSlide: vi.fn(),
        isMasterEditMode: false,
        onToggleMasterEdit: vi.fn(),
    }

    it('renders basic controls', () => {
        render(<TopToolbar {...defaultProps} />)
        expect(screen.getByText('スライドレイアウト')).toBeDefined()
        expect(screen.getByText('Play')).toBeDefined()
        expect(screen.getByText('100%')).toBeDefined()
        expect(screen.getByText('マスター編集')).toBeDefined()
    })

    it('calls onAddSlide when layout selected', () => {
        render(<TopToolbar {...defaultProps} />)
        // Click layout dropdown (trigger)
        // In our mock, trigger renders children. Content is also rendered (simplified mock)
        // We can just find the layout button

        // SLIDE_LAYOUTS[0] is 'blank' usually?
        const layoutId = SLIDE_LAYOUTS[0].id
        const layoutLabel = SLIDE_LAYOUTS[0].label

        const layoutBtn = screen.getByText(layoutLabel).closest('button')
        fireEvent.click(layoutBtn!)

        expect(defaultProps.onAddSlide).toHaveBeenCalledWith(layoutId)
    })

    it('toggles master edit mode', () => {
        render(<TopToolbar {...defaultProps} />)
        const toggleBtn = screen.getByText('マスター編集').closest('button')
        fireEvent.click(toggleBtn!)
        expect(defaultProps.onToggleMasterEdit).toHaveBeenCalled()
    })

    it('renders master controls in master edit mode', () => {
        render(<TopToolbar {...defaultProps} isMasterEditMode={true} />)
        expect(screen.getByText('マスター編集中')).toBeDefined()
        // Should show "Save Master" instead of Play
        expect(screen.queryByText('Play')).toBeNull()
        expect(screen.getByText('マスター保存')).toBeDefined()
    })

    it('handles zoom changes', () => {
        render(<TopToolbar {...defaultProps} />)
        // Zoom In/Out buttons are icons. accessible via clicks on buttons wrapping them.
        // We can find by parent div of zoom text?
        // Let's rely on order or test id if we added it. 
        // Or simpler: text '100%'. Previous sibling is Out, Next is In.

        const zoomDisplay = screen.getByText('100%')
        const zoomOut = zoomDisplay.previousElementSibling
        const zoomIn = zoomDisplay.nextElementSibling

        fireEvent.click(zoomOut!)
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(90)

        fireEvent.click(zoomIn!)
        expect(defaultProps.onZoomChange).toHaveBeenCalledWith(110)
    })
})
