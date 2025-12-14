import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from '@/components/ui/Button'

const TestIcon = (props: any) => <svg data-testid="icon" {...props} />

describe('components/ui/Button', () => {
  it('renders children and is clickable by default', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('disables itself when loading/success/error', () => {
    const { rerender, container } = render(<Button loading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(container.querySelector('.animate-spin')).toBeTruthy()

    rerender(<Button success>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()

    rerender(<Button error>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('supports asChild rendering via Slot', () => {
    render(
      <Button asChild>
        <a href="/x">Go</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).toHaveAttribute('href', '/x')
  })

  it('renders icon without children', () => {
    render(<Button icon={TestIcon} aria-label="icon-only" />)
    expect(screen.getByRole('button', { name: 'icon-only' })).toBeEnabled()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders icon with children', () => {
    render(<Button icon={TestIcon}>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
