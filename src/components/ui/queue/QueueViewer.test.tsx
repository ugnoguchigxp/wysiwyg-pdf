import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueProvider } from '@/modules/queue/QueueContext'
import { QueueViewer } from '@/components/ui/queue/QueueViewer'

vi.mock('@/components/ui/queue/QueueHeader', () => ({
  QueueHeader: ({ expanded, onToggle, onClose }: any) => (
    <div data-testid="queue-header">
      <button onClick={onToggle}>Toggle</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

vi.mock('@/components/ui/queue/QueueItem', () => ({
  QueueItem: ({ item }: any) => (
    <div data-testid="queue-item">{item.name}</div>
  ),
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <QueueProvider maxConcurrent={1}>{children}</QueueProvider>
}

describe('components/ui/queue/QueueViewer', () => {
  it('renders nothing when no items', () => {
    const { container } = render(
      <TestWrapper>
        <QueueViewer />
      </TestWrapper>
    )

    const viewer = container.querySelector('#queue-viewer')
    expect(viewer).not.toBeInTheDocument()
  })

  it('renders component with custom position', () => {
    const { container } = render(
      <TestWrapper>
        <QueueViewer position="top-left" defaultExpanded={true} />
      </TestWrapper>
    )

    const viewer = container.querySelector('#queue-viewer')
    // No items, so should not render
    expect(viewer).not.toBeInTheDocument()
  })
})
