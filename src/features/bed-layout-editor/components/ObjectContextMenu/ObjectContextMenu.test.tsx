import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ObjectContextMenu } from '@/features/bed-layout-editor/components/ObjectContextMenu/ObjectContextMenu'

describe('ObjectContextMenu', () => {
  it('renders when visible and fires actions / closes on outside click', () => {
    const onAction = vi.fn()
    const onClose = vi.fn()

    render(<ObjectContextMenu visible x={10} y={20} onClose={onClose} onAction={onAction} />)
    const buttons = screen.getAllByRole('button')

    fireEvent.click(buttons[0])
    expect(onAction).toHaveBeenCalledWith('bringToFront')

    fireEvent.click(buttons[1])
    expect(onAction).toHaveBeenCalledWith('sendToBack')

    fireEvent.click(buttons[2])
    expect(onAction).toHaveBeenCalledWith('bringForward')

    fireEvent.click(buttons[3])
    expect(onAction).toHaveBeenCalledWith('sendBackward')

    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalled()
  })

  it('returns null when not visible', () => {
    const { container } = render(
      <ObjectContextMenu visible={false} x={0} y={0} onClose={() => {}} onAction={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('prevents context menu on the menu itself', () => {
    const onClose = vi.fn()
    const onAction = vi.fn()

    render(<ObjectContextMenu visible x={10} y={20} onClose={onClose} onAction={onAction} />)

    const menu = screen.getByRole('menu')
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    })
    fireEvent(menu, contextMenuEvent)
    expect(contextMenuEvent.defaultPrevented).toBe(true)
  })
})
