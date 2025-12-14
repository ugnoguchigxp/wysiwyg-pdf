import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ArrowSelector } from '../../../@/features/report-editor/components/PropertiesPanel/ArrowSelector'

describe('ArrowSelector', () => {
  it('renders and calls onChange', () => {
    const onChange = vi.fn()
    render(<ArrowSelector value="none" onChange={onChange} label="Start" />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'diamond' } })
    expect(onChange).toHaveBeenCalledWith('diamond')
  })
})

