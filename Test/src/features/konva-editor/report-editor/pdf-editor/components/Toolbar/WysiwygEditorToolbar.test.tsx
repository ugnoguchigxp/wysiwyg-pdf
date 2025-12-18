import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WysiwygEditorToolbar } from '@/features/report-editor/components/Toolbar/WysiwygEditorToolbar'
import type { Doc } from '@/types/canvas'

// Mock Radix UI Tooltip to simply render children
vi.mock('@/components/ui/Tooltip', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock DropdownMenu
vi.mock('@/components/ui/DropdownMenu', () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockDoc: Doc = {
    v: 1,
    id: 'test',
    title: 'Test',
    unit: 'mm',
    surfaces: [{ id: 'page-1', type: 'page', w: 100, h: 100 }],
    nodes: [],
}

describe('WysiwygEditorToolbar', () => {
    const defaultProps = {
        zoom: 100,
        onZoomChange: vi.fn(),
        templateDoc: mockDoc,
        onTemplateChange: vi.fn(),
        onSelectElement: vi.fn(),
        activeTool: 'select',
        onToolSelect: vi.fn(),
    }

    it('renders Signature tool button', () => {
        render(<WysiwygEditorToolbar {...defaultProps} />)
        // Look for the aria-label used in the component
        const signatureBtn = screen.getByLabelText('toolbar_signature')
        expect(signatureBtn).toBeInTheDocument()
    })

    it('calls onToolSelect("signature") when Signature tool is clicked', () => {
        render(<WysiwygEditorToolbar {...defaultProps} />)
        const signatureBtn = screen.getByLabelText('toolbar_signature')
        fireEvent.click(signatureBtn)
        // Depending on implementation detail (span wrapper), click might need to bubble.
        // fireEvent.click usually works fine.
        expect(defaultProps.onToolSelect).toHaveBeenCalledWith('signature')
    })

    it('highlights Signature tool when activeTool is "signature"', () => {
        render(<WysiwygEditorToolbar {...defaultProps} activeTool="signature" />)
        const signatureBtn = screen.getByLabelText('toolbar_signature')
        // Check for active class or style - based on TOOLBAR_BUTTON_ACTIVE_CLASS in source
        expect(signatureBtn.className).toContain('border-primary')
    })

    it('does not highlight Signature tool when activeTool is "select"', () => {
        render(<WysiwygEditorToolbar {...defaultProps} activeTool="select" />)
        const signatureBtn = screen.getByLabelText('toolbar_signature')
        // Should have standard border
        expect(signatureBtn.className).toContain('border-border')
        expect(signatureBtn.className).not.toContain('border-primary')
    })
})
