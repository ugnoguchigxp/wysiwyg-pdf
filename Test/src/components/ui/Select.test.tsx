import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../../../../src/components/ui/Select'

describe('components/ui/Select', () => {
  it('renders trigger and content items when open', () => {
    const { rerender } = render(
      <Select defaultValue="a" open>
        <SelectTrigger aria-label="select">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent width="stretch">
          <SelectGroup>
            <SelectLabel>Group</SelectLabel>
            <SelectItem value="a">A</SelectItem>
            <SelectSeparator />
          </SelectGroup>
        </SelectContent>
      </Select>
    )

    expect(screen.getByLabelText('select')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument()
    expect(screen.getByText('Group')).toBeInTheDocument()

    // cover non-popper position branch
    rerender(
      <Select defaultValue="a" open>
        <SelectTrigger aria-label="select">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )

    // cover popper + width=content branch
    rerender(
      <Select defaultValue="a" open>
        <SelectTrigger aria-label="select">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent width="content">
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )
  })
})
