import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TableContextMenu } from '@/features/report-editor/components/ContextMenu/TableContextMenu'

describe('TableContextMenu', () => {
  it('renders when visible and fires actions / closes on outside click', () => {
    const onAction = vi.fn()
    const onClose = vi.fn()

    render(<TableContextMenu visible x={10} y={20} onClose={onClose} onAction={onAction} />)
    fireEvent.click(screen.getByRole('button', { name: /table_ctx_insert_row_above/i }))
    expect(onAction).toHaveBeenCalledWith('insertRowAbove')

    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalled()
  })

  it('returns null when not visible', () => {
    const { container } = render(
      <TableContextMenu visible={false} x={0} y={0} onClose={() => {}} onAction={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})

