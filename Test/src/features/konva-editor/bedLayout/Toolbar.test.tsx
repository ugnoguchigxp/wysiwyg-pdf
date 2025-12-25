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
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )

    fireEvent.click(screen.getByLabelText('toolbar_image'))
    expect(onSelectTool).toHaveBeenCalledWith('select')

    fireEvent.click(screen.getByLabelText('toolbar_zoom_in'))
    expect(onZoomIn).toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText('toolbar_zoom_out'))
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
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )
    expect(screen.getByLabelText('toolbar_zoom_in')).toBeDisabled()

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
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )
    expect(screen.getByLabelText('toolbar_zoom_out')).toBeDisabled()
  })

  it('adds text element on text tool click', () => {
    const onAddElement = vi.fn()
    const onSelectElement = vi.fn()

    render(
      <Toolbar
        activeTool="select"
        onToolSelect={vi.fn()}
        onAddElement={onAddElement}
        onSelectElement={onSelectElement}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )

    fireEvent.click(screen.getByLabelText('toolbar_text'))

    expect(onAddElement).toHaveBeenCalledWith(
      expect.objectContaining({
        t: 'text',
        s: 'layout',
      })
    )
    expect(onSelectElement).toHaveBeenCalled()
  })

  it('adds image element on image tool click', () => {
    const onAddElement = vi.fn()
    const onSelectElement = vi.fn()

    render(
      <Toolbar
        activeTool="select"
        onToolSelect={vi.fn()}
        onAddElement={onAddElement}
        onSelectElement={onSelectElement}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )

    fireEvent.click(screen.getByLabelText('toolbar_image'))

    expect(onAddElement).toHaveBeenCalledWith(
      expect.objectContaining({
        t: 'image',
        s: 'layout',
        src: '',
      })
    )
  })

  it('adds bed element on bed tool click', () => {
    const onAddElement = vi.fn()
    const onSelectElement = vi.fn()

    render(
      <Toolbar
        activeTool="select"
        onToolSelect={vi.fn()}
        onAddElement={onAddElement}
        onSelectElement={onSelectElement}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )

    fireEvent.click(screen.getByLabelText('toolbar_bed'))

    expect(onAddElement).toHaveBeenCalledWith(
      expect.objectContaining({
        t: 'widget',
        widget: 'bed',
        s: 'layout',
      })
    )
  })

  it('adds wall line element on line tool click', () => {
    const onAddElement = vi.fn()

    render(
      <Toolbar
        activeTool="select"
        onToolSelect={vi.fn()}
        onAddElement={onAddElement}
        onSelectElement={vi.fn()}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )

    fireEvent.click(screen.getByLabelText('toolbar_wall'))

    expect(onAddElement).toHaveBeenCalledWith(
      expect.objectContaining({
        t: 'line',
        s: 'layout',
        name: 'Wall',
      })
    )
  })

  it('adds shape elements from dropdown', () => {
    const onAddElement = vi.fn()

    render(
      <Toolbar
        activeTool="select"
        onToolSelect={vi.fn()}
        onAddElement={onAddElement}
        onSelectElement={vi.fn()}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
      />
    )

    const shapeButtons = screen.getAllByRole('button')
    const circleButton = shapeButtons.find((btn) => btn.innerHTML.includes('Circle'))

    if (circleButton) {
      fireEvent.click(circleButton)
      expect(onAddElement).toHaveBeenCalledWith(
        expect.objectContaining({
          t: 'shape',
          shape: 'circle',
          s: 'layout',
        })
      )
    }
  })

  it('handles copy and paste operations', () => {
    const onCopy = vi.fn()
    const onPaste = vi.fn()

    render(
      <Toolbar
        activeTool="select"
        onToolSelect={vi.fn()}
        onAddElement={vi.fn()}
        onSelectElement={vi.fn()}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
        onCopy={onCopy}
        onPaste={onPaste}
      />
    )

    fireEvent.click(screen.getByLabelText('toolbar_copy'))
    expect(onCopy).toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText('toolbar_paste'))
    expect(onPaste).toHaveBeenCalled()
  })

  it('uses i18n overrides when provided', () => {
    const onAddElement = vi.fn()

    render(
      <Toolbar
        activeTool="select"
        onToolSelect={vi.fn()}
        onAddElement={onAddElement}
        onSelectElement={vi.fn()}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'mm',
          surfaces: [{ id: 'layout', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } }],
          nodes: [],
        } as any}
        i18nOverrides={{ toolbar_default_text: 'Custom Text' }}
      />
    )

    fireEvent.click(screen.getByLabelText('toolbar_text'))

    expect(onAddElement).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Custom Text',
      })
    )
  })

  it('uses provided surfaceId for element placement', () => {
    const onAddElement = vi.fn()

    render(
      <Toolbar
        activeTool="select"
        onToolSelect={vi.fn()}
        onAddElement={onAddElement}
        onSelectElement={vi.fn()}
        zoom={1}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        document={{
          v: 1,
          id: 'doc1',
          title: 'Test Doc',
          unit: 'mm',
          surfaces: [
            { id: 'surface1', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } },
            { id: 'surface2', type: 'canvas', w: 800, h: 600, margin: { t: 0, r: 0, b: 0, l: 0 } },
          ],
          nodes: [],
        } as any}
        surfaceId="surface2"
      />
    )

    fireEvent.click(screen.getByLabelText('toolbar_text'))

    expect(onAddElement).toHaveBeenCalledWith(
      expect.objectContaining({
        s: 'surface2',
      })
    )
  })
})
