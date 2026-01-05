import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

describe('components/ui/DropdownMenu', () => {
  it('renders items when open', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Label</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem inset>
                Item <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem checked>Checked</DropdownMenuCheckboxItem>
              <DropdownMenuRadioGroup value="a">
                <DropdownMenuRadioItem value="a">Radio A</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSub open>
                <DropdownMenuSubTrigger inset>More</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Sub Item</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    )

    expect(screen.getByText('Item')).toBeInTheDocument()
    expect(screen.getByText('Checked')).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'Radio A' })).toBeInTheDocument()
    expect(screen.getByText('Sub Item')).toBeInTheDocument()
  })
})
