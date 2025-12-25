import '@testing-library/jest-dom/vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MermaidExportModal } from '@/features/mindmap-editor/components/MermaidExportModal'
import type { MindmapGraph } from '@/features/mindmap-editor/types'
import type { Doc } from '@/types/canvas'

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

describe('features/mindmap-editor/components/MermaidExportModal', () => {
  const mockDoc = {
    v:1,
    id: 'doc1',
    title: 'Test Doc',
    unit: 'mm' as const,
    surfaces: [{ id: 's1', type: 'canvas', w: 100, h: 200, margin: { t: 0, r: 0, b: 0, l: 0 } }],
    nodes: [
      { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface', tags: ['root'], text: 'Root' },
    ],
  } as Doc

  const mockGraph: MindmapGraph = {
    rootId: 'root',
    parentIdMap: new Map(),
    childrenMap: new Map([['root', []]]),
    nodeMap: new Map([['root', { id: 'root', t: 'text', text: 'Root' } as any]]),
    linesMap: new Map(),
    linesById: new Map(),
    depthMap: new Map([['root', 0]]),
    isAncestor: () => false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('does not render when isOpen is false', () => {
    render(
      <MermaidExportModal isOpen={false} onClose={vi.fn()} doc={mockDoc} graph={mockGraph} />
    )

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it.skip('renders modal when isOpen is true', () => {
    render(
      <MermaidExportModal isOpen={true} onClose={vi.fn()} doc={mockDoc} graph={mockGraph} />
    )

    expect(screen.getByTestId('modal')).toBeInTheDocument()
    expect(screen.getByText('Export to Mermaid')).toBeInTheDocument()
    expect(screen.getByText(/Copy Mermaid mindmap syntax/)).toBeInTheDocument()
  })

  it('displays mermaid syntax in textarea', () => {
    render(
      <MermaidExportModal isOpen={true} onClose={vi.fn()} doc={mockDoc} graph={mockGraph} />
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea).toBeInTheDocument()
    expect(textarea.value).toContain('mindmap')
    expect(textarea.value).toContain('Root')
    expect(textarea.readOnly).toBe(true)
  })

  it('calls clipboard.writeText when clicking Copy button', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText: mockWriteText } })

    render(
      <MermaidExportModal isOpen={true} onClose={vi.fn()} doc={mockDoc} graph={mockGraph} />
    )

    const copyButton = screen.getByText('Copy to Clipboard')
    await act(async () => {
      fireEvent.click(copyButton)
    })

    expect(mockWriteText).toHaveBeenCalled()
    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('mindmap'))
  })

  it('calls onClose when clicking Close button', () => {
    const mockOnClose = vi.fn()

    render(
      <MermaidExportModal isOpen={true} onClose={mockOnClose} doc={mockDoc} graph={mockGraph} />
    )

    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})
