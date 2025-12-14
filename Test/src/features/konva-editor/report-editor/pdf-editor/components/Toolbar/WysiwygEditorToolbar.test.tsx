import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WysiwygEditorToolbar } from '../../../@/features/report-editor/components/Toolbar/WysiwygEditorToolbar'
import type { ITemplateDoc } from '../../../@/features/konva-editor/types'

// Mock useTranslation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultVal: string) => defaultVal || key,
    }),
}))

// Mock Radix UI Tooltip to simply render children
vi.mock('../../../../../../components/ui/Tooltip', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock DropdownMenu
vi.mock('../../../../../../components/ui/DropdownMenu', () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))


const mockDoc: ITemplateDoc = {
    meta: { id: 'test', name: 'Test', version: 1 },
    pages: [{ id: 'page-1', size: 'A4', margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'mm' }, background: { color: "#fff" } }],
    elements: [],
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
        const signatureBtn = screen.getByLabelText('Signature')
        expect(signatureBtn).toBeInTheDocument()
    })

    it('calls onToolSelect("signature") when Signature tool is clicked', () => {
        render(<WysiwygEditorToolbar {...defaultProps} />)
        const signatureBtn = screen.getByLabelText('Signature')
        fireEvent.click(signatureBtn)
        // Depending on implementation detail (span wrapper), click might need to bubble.
        // fireEvent.click usually works fine.
        expect(defaultProps.onToolSelect).toHaveBeenCalledWith('signature')
    })

    it('highlights Signature tool when activeTool is "signature"', () => {
        render(<WysiwygEditorToolbar {...defaultProps} activeTool="signature" />)
        const signatureBtn = screen.getByLabelText('Signature')
        // Check for active class or style - based on TOOLBAR_BUTTON_ACTIVE_CLASS in source
        // border-theme-object-primary is a good indicator, or text-theme-object-primary
        expect(signatureBtn.className).toContain('border-theme-object-primary')
    })

    it('does not highlight Signature tool when activeTool is "select"', () => {
        render(<WysiwygEditorToolbar {...defaultProps} activeTool="select" />)
        const signatureBtn = screen.getByLabelText('Signature')
        // Should have standard border
        expect(signatureBtn.className).toContain('border-theme-border')
        expect(signatureBtn.className).not.toContain('border-theme-object-primary')
    })
})
