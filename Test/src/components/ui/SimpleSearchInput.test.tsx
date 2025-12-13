import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SimpleSearchInput } from '../../../../src/components/ui/SimpleSearchInput'

describe('components/ui/SimpleSearchInput', () => {
  it('calls onSearch on input change', () => {
    const onSearch = vi.fn()

    render(<SimpleSearchInput onSearch={onSearch} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })

    expect(onSearch).toHaveBeenCalled()
    expect(onSearch).toHaveBeenLastCalledWith('abc')
  })

  it('allows overriding placeholder via props', () => {
    render(<SimpleSearchInput placeholder="Find..." />)
    expect(screen.getByPlaceholderText('Find...')).toBeInTheDocument()
  })
})
