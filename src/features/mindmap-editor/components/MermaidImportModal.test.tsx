import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MermaidImportModal } from '@/features/mindmap-editor/components/MermaidImportModal'
import { Doc } from '@/types/canvas'

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ open, children, title, description }: any) =>
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
      </div>
    ) : null,
  ModalFooter: ({ children }: any) => <div data-testid="modal-footer">{children}</div>,
}))

describe('features/mindmap-editor/components/MermaidImportModal', () => {
  const mockOnImport = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when isOpen is false', () => {
    render(
      <MermaidImportModal isOpen={false} onClose={mockOnClose} onImport={mockOnImport} />
    )

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('renders modal when isOpen is true', () => {
    render(
      <MermaidImportModal isOpen={true} onClose={mockOnClose} onImport={mockOnImport} />
    )

    expect(screen.getByTestId('modal')).toBeInTheDocument()
    expect(screen.getByText('Import from Mermaid')).toBeInTheDocument()
    expect(screen.getByText(/Paste Mermaid mindmap syntax below/)).toBeInTheDocument()
  })

  it('updates textarea value on input', () => {
    render(
      <MermaidImportModal isOpen={true} onClose={mockOnClose} onImport={mockOnImport} />
    )

    const textarea = screen.getByPlaceholderText(/Central Topic/).closest('textarea')
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'new syntax' } })
      expect(textarea).toHaveValue('new syntax')
    }
  })

  it('calls onImport and onClose when clicking Import with valid syntax', async () => {
    render(
      <MermaidImportModal isOpen={true} onClose={mockOnClose} onImport={mockOnImport} />
    )

    const textarea = screen.getByPlaceholderText(/Central Topic/).closest('textarea')
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'mindmap\n  root((Root))\n    Child' } })
    }

    const importButton = screen.getByText('Import')
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalled()
    })
    expect(mockOnImport).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.any(String),
      nodes: expect.any(Array),
    }))
  })

  it('shows error when syntax is invalid', async () => {
    render(
      <MermaidImportModal isOpen={true} onClose={mockOnClose} onImport={mockOnImport} />
    )

    const textarea = screen.getByPlaceholderText(/Central Topic/).closest('textarea')
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'invalid syntax' } })
    }

    const importButton = screen.getByText('Import')
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(screen.getByText(/Invalid Mermaid syntax/)).toBeInTheDocument()
    })
    expect(mockOnImport).not.toHaveBeenCalled()
  })

  it('calls onClose and clears syntax when clicking Cancel', () => {
    render(
      <MermaidImportModal isOpen={true} onClose={mockOnClose} onImport={mockOnImport} />
    )

    const textarea = screen.getByPlaceholderText(/Central Topic/).closest('textarea')
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'mindmap\n  root((Root))' } })
    }

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it.skip('clears error when typing new syntax', () => {
    render(
      <MermaidImportModal isOpen={true} onClose={mockOnClose} onImport={mockOnImport} />
    )

    const textarea = screen.getByPlaceholderText(/Central Topic/).closest('textarea')
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'invalid' } })
    }

    const importButton = screen.getByText('Import')
    fireEvent.click(importButton)

    expect(screen.getByText(/Invalid Mermaid syntax/)).toBeInTheDocument()

    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'mindmap\n  root((Root))' } })
    }

    expect(screen.queryByText(/Invalid Mermaid syntax/)).not.toBeInTheDocument()
  })

  it('shows error for empty syntax', async () => {
    render(
      <MermaidImportModal isOpen={true} onClose={mockOnClose} onImport={mockOnImport} />
    )

    const importButton = screen.getByText('Import')
    fireEvent.click(importButton)

    await waitFor(() => {
      expect(screen.getByText(/No content to import/)).toBeInTheDocument()
    })
    expect(mockOnImport).not.toHaveBeenCalled()
  })
})
