import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Modal, ModalFooter } from '@/components/ui/Modal'

describe('components/ui/Modal', () => {
  it('renders content when open and calls onClose on close', () => {
    const onClose = vi.fn()

    render(
      <Modal
        defaultOpen
        title="Title"
        description="Desc"
        onClose={onClose}
        footer={<button type="button">Ok</button>}
      >
        <div>Body</div>
      </Modal>
    )

    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByText('Desc')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ok' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('supports non-draggable mode without drag handle cursor', () => {
    render(
      <Modal defaultOpen draggable={false} title="Title">
        <div>Body</div>
      </Modal>
    )

    const handle = screen.getByLabelText('modal_drag_handle')
    expect(handle).toBeInTheDocument()
    expect(handle).not.toHaveClass('cursor-move')

    // mouse down should be ignored when draggable=false (covers early return)
    fireEvent.mouseDown(handle, { clientX: 1, clientY: 2 })
  })

  it('opens via trigger (uncontrolled) and closes via close button', () => {
    const onClose = vi.fn()

    render(
      <Modal trigger={<button type="button">Open</button>} title="Title" onClose={onClose}>
        <div>Body</div>
      </Modal>
    )

    expect(screen.queryByText('Body')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByText('Body')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('controlled mode calls onOpenChange and onClose', () => {
    const onClose = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <Modal open title="Title" onOpenChange={onOpenChange} onClose={onClose}>
        <div>Body</div>
      </Modal>
    )

    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('draggable mode updates position on drag and handles key events', () => {
    render(
      <Modal defaultOpen title="Title">
        <div>Body</div>
      </Modal>
    )

    const handle = screen.getByLabelText('modal_drag_handle')
    fireEvent.mouseDown(handle, { clientX: 50, clientY: 60 })

    fireEvent.mouseMove(document, { clientX: 70, clientY: 90 })
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('style') || '').toContain('translate(calc(-50% +')
    expect(dialog.getAttribute('style') || '').toContain('cursor: grabbing')

    fireEvent.keyDown(handle, { key: 'Enter' })
    fireEvent.keyDown(handle, { key: ' ' })

    fireEvent.mouseUp(document)
  })

  it('renders ModalFooter', () => {
    render(
      <ModalFooter className="x">
        <button type="button">A</button>
      </ModalFooter>
    )
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()
  })

  it('supports noPadding and missing title', () => {
    render(
      <Modal defaultOpen noPadding>
        <div>Body</div>
      </Modal>
    )
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByText('dialog')).toBeInTheDocument()
  })
})
