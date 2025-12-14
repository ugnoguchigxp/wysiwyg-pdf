import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DataBindingModal } from '../../../@/features/report-editor/components/PropertiesPanel/DataBindingModal'

describe('DataBindingModal', () => {
  it('filters and selects field in field mode', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <DataBindingModal
        isOpen
        onClose={onClose}
        schema={{
          categories: [
            {
              id: 'cat',
              label: 'Category',
              fields: [{ id: 'f1', label: 'Field One', type: 'string' }],
            },
          ],
        } as any}
        onSelect={onSelect}
        mode="field"
      />
    )

    // search filters
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'field' } })

    // Expand the category to reveal filtered fields
    const table = screen.getByRole('table')
    const [expandButton] = within(table).getAllByRole('button')
    fireEvent.click(expandButton)

    fireEvent.click(screen.getByText('Field One'))

    expect(onSelect).toHaveBeenCalledWith({
      field: 'cat.f1',
      sourceId: 'cat',
      fieldId: 'f1',
      path: 'f1',
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('selects category in repeater mode', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <DataBindingModal
        isOpen
        onClose={onClose}
        schema={{
          categories: [
            {
              id: 'cat',
              label: 'Category',
              fields: [{ id: 'f1', label: 'Field One', type: 'string' }],
            },
          ],
        } as any}
        onSelect={onSelect}
        mode="repeater"
      />
    )

    fireEvent.click(screen.getByText('Category'))
    expect(onSelect).toHaveBeenCalledWith({
      field: 'cat',
      sourceId: 'cat',
      fieldId: 'cat',
      path: 'cat',
    })
    expect(onClose).toHaveBeenCalled()
  })
})
