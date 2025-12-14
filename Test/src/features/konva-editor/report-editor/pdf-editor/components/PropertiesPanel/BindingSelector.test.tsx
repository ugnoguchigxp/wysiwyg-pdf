import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BindingSelector } from '../../../@/features/report-editor/components/PropertiesPanel/BindingSelector'

describe('BindingSelector', () => {
  it('shows button when no binding and opens modal', () => {
    const onOpenModal = vi.fn()
    render(<BindingSelector onUpdate={() => {}} onOpenModal={onOpenModal} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onOpenModal).toHaveBeenCalled()
  })

  it('renders binding info and allows remove', () => {
    const onUpdate = vi.fn()
    const onOpenModal = vi.fn()
    render(
      <BindingSelector
        binding={{ field: 'a.b', sourceId: 'a' }}
        onUpdate={onUpdate}
        onOpenModal={onOpenModal}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onUpdate).toHaveBeenCalledWith(undefined)
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    expect(onOpenModal).toHaveBeenCalled()
  })
})
