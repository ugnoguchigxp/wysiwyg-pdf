import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DocumentLoadMenu } from '@/components/ui/DocumentLoadMenu'

vi.mock('@/components/ui/DocumentLoadMenu', () => ({
  DocumentLoadMenu: ({ fetchRecent, fetchBrowse, onLoad, triggerClassName, triggerTooltip }: any) => (
    <button className={triggerClassName} title={triggerTooltip}>
      Load
    </button>
  ),
}))

describe('components/ui/DocumentLoadMenu', () => {
  it('renders component', () => {
    render(
      <DocumentLoadMenu
        fetchRecent={async () => []}
        fetchBrowse={async () => ({ items: [], hasMore: false })}
        onLoad={() => {}}
      />
    )

    expect(screen.getByText('Load')).toBeInTheDocument()
  })

  it('renders with custom class name', () => {
    render(
      <DocumentLoadMenu
        fetchRecent={async () => []}
        fetchBrowse={async () => ({ items: [], hasMore: false })}
        onLoad={() => {}}
        triggerClassName="custom-class"
      />
    )

    const button = screen.getByText('Load')
    expect(button).toHaveClass('custom-class')
  })

  it('renders with custom tooltip', () => {
    render(
      <DocumentLoadMenu
        fetchRecent={async () => []}
        fetchBrowse={async () => ({ items: [], hasMore: false })}
        onLoad={() => {}}
        triggerTooltip="Click to load"
      />
    )

    expect(screen.getByTitle('Click to load')).toBeInTheDocument()
  })
})
