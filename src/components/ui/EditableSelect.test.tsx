import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EditableSelect } from '@/components/ui/EditableSelect'

describe('components/ui/EditableSelect', () => {
  it('opens on focus and selecting an option calls onChange with a string', () => {
    const onChange = vi.fn()

    render(<EditableSelect value="" onChange={onChange} options={[1, '2']} placeholder="p" />)

    const input = screen.getByPlaceholderText('p')
    fireEvent.focus(input)

    fireEvent.click(screen.getByRole('button', { name: '1' }))
    expect(onChange).toHaveBeenCalledWith('1')
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument()
  })

  it('closes when clicking outside', () => {
    const onChange = vi.fn()

    const { unmount } = render(
      <div>
        <EditableSelect value="" onChange={onChange} options={['A']} placeholder="p" />
        <button type="button">outside</button>
      </div>
    )

    fireEvent.focus(screen.getByPlaceholderText('p'))
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()

    // toggle button click (ChevronDown) should close/open
    const toggle = screen.getAllByRole('button').find((b) => b.querySelector('svg'))
    expect(toggle).toBeTruthy()
    fireEvent.click(toggle!)
    expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument()

    fireEvent.focus(screen.getByPlaceholderText('p'))
    fireEvent.change(screen.getByPlaceholderText('p'), { target: { value: 'X' } })
    expect(onChange).toHaveBeenLastCalledWith('X')

    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }))
    expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument()

    // cover effect cleanup
    expect(() => unmount()).not.toThrow()
  })
})
