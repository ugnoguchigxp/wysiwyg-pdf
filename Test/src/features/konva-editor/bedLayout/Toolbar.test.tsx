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

import { Toolbar } from '@/features/bed-layout-editor/components/Toolbar'

describe('bedLayout Toolbar', () => {
  it('selects tools and handles zoom boundaries', () => {
    const onSelectTool = vi.fn()
    const onZoomIn = vi.fn()
    const onZoomOut = vi.fn()

    const { rerender } = render(
      <Toolbar
        activeTool="text"
        onSelectTool={onSelectTool}
        zoom={1}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
    )

    fireEvent.click(screen.getByLabelText('Image'))
    expect(onSelectTool).toHaveBeenCalledWith('image')

    fireEvent.click(screen.getByLabelText('Zoom in'))
    expect(onZoomIn).toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText('Zoom out'))
    expect(onZoomOut).toHaveBeenCalled()

    rerender(
      <Toolbar
        activeTool="text"
        onSelectTool={onSelectTool}
        zoom={2}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
    )
    expect(screen.getByLabelText('Zoom in')).toBeDisabled()

    rerender(
      <Toolbar
        activeTool="text"
        onSelectTool={onSelectTool}
        zoom={0.25}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
    )
    expect(screen.getByLabelText('Zoom out')).toBeDisabled()
  })
})
