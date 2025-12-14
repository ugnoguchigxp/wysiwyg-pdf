import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/ui/Tooltip', () => ({
  TooltipProvider: ({ children }: any) => children,
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/DropdownMenu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => children,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

import { Toolbar } from '@/features/bed-layout-editor/components/Toolbar/Toolbar'

describe('bedLayout Toolbar', () => {
  it('selects tools and handles zoom boundaries', () => {
    const onSelectTool = vi.fn()
    const onZoomIn = vi.fn()
    const onZoomOut = vi.fn()

    const { rerender } = render(
      <Toolbar
        activeTool="text"
        onToolSelect={onSelectTool}
        onAddElement={vi.fn()}
        onSelectElement={vi.fn()}
        zoom={1}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'px',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )

    fireEvent.click(screen.getByLabelText('Image'))
    expect(onSelectTool).toHaveBeenCalledWith('select')

    fireEvent.click(screen.getByLabelText('Zoom in'))
    expect(onZoomIn).toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText('Zoom out'))
    expect(onZoomOut).toHaveBeenCalled()

    rerender(
      <Toolbar
        activeTool="text"
        onToolSelect={onSelectTool}
        onAddElement={vi.fn()}
        onSelectElement={vi.fn()}
        zoom={2}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'px',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )
    expect(screen.getByLabelText('Zoom in')).toBeDisabled()

    rerender(
      <Toolbar
        activeTool="text"
        onToolSelect={onSelectTool}
        onAddElement={vi.fn()}
        onSelectElement={vi.fn()}
        zoom={0.25}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'px',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )
    expect(screen.getByLabelText('Zoom out')).toBeDisabled()
  })
})
