import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DataBindingModal } from '@/features/report-editor/components/PropertyPanel/DataBindingModal'

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
    fireEvent.change(screen.getByPlaceholderText('search_placeholder'), {
      target: { value: 'field' },
    })

    // Expand the category to reveal filtered fields
    const table = screen.getByRole('table')
    const [expandButton] = within(table).getAllByRole('button')
    fireEvent.click(expandButton)

    fireEvent.click(screen.getByText('Field One'))
    fireEvent.click(screen.getByRole('button', { name: /apply|Apply/ }))

    expect(onSelect).toHaveBeenCalledWith({
      field: '{Category}.[Field One]',
      sourceId: 'cat',
      fieldId: 'f1',
      path: '{Category}.[Field One]',
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
    fireEvent.click(screen.getByRole('button', { name: /apply|Apply/ }))
    expect(onSelect).toHaveBeenCalledWith({
      field: 'cat',
      sourceId: 'cat',
      fieldId: 'cat',
      path: 'cat',
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('requires delimiter when multiple fields are selected', () => {
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
              fields: [
                { id: 'f1', label: 'Field One', type: 'string' },
                { id: 'f2', label: 'Field Two', type: 'number' },
              ],
            },
          ],
        } as any}
        onSelect={onSelect}
        mode="field"
      />
    )

    const table = screen.getByRole('table')
    const [expandButton] = within(table).getAllByRole('button')
    fireEvent.click(expandButton)

    fireEvent.click(screen.getByText('Field One'))
    fireEvent.click(screen.getByText('Field Two'))

    const delimiterInput = screen.getByPlaceholderText('e.g. -, /, space')
    fireEvent.change(delimiterInput, { target: { value: '' } })

    const applyButton = screen.getByRole('button', { name: /apply|Apply/ })
    expect(applyButton).toBeDisabled()
    expect(
      screen.getByText(
        /Delimiter is required when multiple items are selected\.|data_binding_delimiter_required/
      )
    ).toBeInTheDocument()

    fireEvent.change(delimiterInput, { target: { value: '-' } })
    expect(applyButton).not.toBeDisabled()
  })

  it('applies selection with Ctrl+Enter shortcut', () => {
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

    const table = screen.getByRole('table')
    const [expandButton] = within(table).getAllByRole('button')
    fireEvent.click(expandButton)
    fireEvent.click(screen.getByText('Field One'))

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter', ctrlKey: true })

    expect(onSelect).toHaveBeenCalledWith({
      field: '{Category}.[Field One]',
      sourceId: 'cat',
      fieldId: 'f1',
      path: '{Category}.[Field One]',
    })
    expect(onClose).toHaveBeenCalled()
  })
})
