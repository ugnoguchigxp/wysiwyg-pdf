import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SlideEditor } from '@/features/slide-editor/components/SlideEditor'
import { exportToPptx } from '@/features/slide-editor/utils/pptxExport'

// Mock export
vi.mock('@/features/slide-editor/utils/pptxExport', () => ({
    exportToPptx: vi.fn().mockResolvedValue(undefined)
}))

// Mock sub-components/hooks to simplify integration test
const mockSetDoc = vi.fn()
const mockUndo = vi.fn()
const mockRedo = vi.fn()
window.alert = vi.fn()

vi.mock('@/features/slide-editor/hooks/useSlideHistory', () => ({
    useSlideHistory: () => ({
        doc: {
            surfaces: [{ id: 's1', type: 'slide', w: 100, h: 100, bg: '#fff' }],
            nodes: [],
            id: 'd1',
            title: 't',
            v: 1
        },
        setDoc: mockSetDoc,
        undo: mockUndo,
        redo: mockRedo,
        canUndo: true,
        canRedo: true
    })
}))

vi.mock('@/features/slide-editor/hooks/useFitToScreen', () => ({
    useFitToScreen: () => ({ zoom: 100, calculateZoom: vi.fn() })
}))

vi.mock('@/features/slide-editor/hooks/useSlideOperations', () => ({
    useSlideOperations: () => ({
        handleAddSlide: vi.fn(),
        handleSelectTemplate: vi.fn()
    })
}))

// Mock Layouts
vi.mock('@/components/layout/LeftSidebar', () => ({
    LeftSidebar: () => <div data-testid="left-sidebar" />
}))
vi.mock('@/components/layout/RightSidebar', () => ({
    RightSidebar: () => <div data-testid="right-sidebar" />
}))
vi.mock('@/features/report-editor/components/PropertyPanel/WysiwygPropertiesPanel', () => ({
    WysiwygPropertiesPanel: () => <div data-testid="prop-panel" />
}))
vi.mock('@/components/canvas/KonvaCanvasEditor', () => ({
    KonvaCanvasEditor: ({ onChange, onSelect }: any) => (
        <div data-testid="canvas-editor">
            <button data-testid="canvas-change" onClick={() => onChange({ nodes: [] })} />
            <button data-testid="canvas-select" onClick={() => onSelect(['el1'])} />
        </div>
    )
}))
vi.mock('@/features/slide-editor/components/TopToolbar', () => ({
    TopToolbar: ({ onExport, onSaveMaster }: any) => (
        <div data-testid="top-toolbar">
            <button data-testid="btn-export" onClick={onExport} />
            <button data-testid="btn-save-master" onClick={onSaveMaster} />
        </div>
    )
}))
vi.mock('@/features/slide-editor/components/SlideListPanel', () => ({
    SlideListPanel: () => <div data-testid="slide-list-panel" />
}))

describe('SlideEditor', () => {
    it('renders main layout components', () => {
        render(<SlideEditor />)
        expect(screen.getByTestId('top-toolbar')).toBeDefined()
        expect(screen.getByTestId('canvas-editor')).toBeDefined()
    })

    it('handles canvas changes', () => {
        render(<SlideEditor />)
        fireEvent.click(screen.getByTestId('canvas-change'))
        expect(mockSetDoc).toHaveBeenCalled()
    })

    it('handles element selection', () => {
        render(<SlideEditor />)
        fireEvent.click(screen.getByTestId('canvas-select'))
        // No direct assertion on state, but verifies no crash and code path execution
    })

    it('handles export', () => {
        render(<SlideEditor />)
        fireEvent.click(screen.getByTestId('btn-export'))
        expect(exportToPptx).toHaveBeenCalled()
    })

    it('handles save master', () => {
        render(<SlideEditor />)
        fireEvent.click(screen.getByTestId('btn-save-master'))
    })
})
