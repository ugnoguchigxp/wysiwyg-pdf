import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueProvider } from '@/modules/queue/QueueContext'
import { QueueItem } from '@/components/ui/queue/QueueItem'
import type { IQueueItem } from '@/modules/queue/Queue.schema'

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <QueueProvider>{children}</QueueProvider>
}

describe('components/ui/queue/QueueItem', () => {
  it('renders pending task', () => {
    const item: IQueueItem = {
      id: 'test-1',
      name: 'Test Task',
      status: 'pending',
      progress: 0,
      handler: async () => { },
    }

    render(
      <TestWrapper>
        <QueueItem item={item} />
      </TestWrapper>
    )

    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders in_progress task', () => {
    const item: IQueueItem = {
      id: 'test-2',
      name: 'Running Task',
      status: 'in_progress',
      progress: 50,
      handler: async () => { },
    }

    render(
      <TestWrapper>
        <QueueItem item={item} />
      </TestWrapper>
    )

    expect(screen.getByText('Running Task')).toBeInTheDocument()
  })

  it('renders failed task with error message', () => {
    const item: IQueueItem = {
      id: 'test-4',
      name: 'Failed Task',
      status: 'failed',
      progress: 75,
      error: 'Something went wrong',
      handler: async () => { },
    }

    render(
      <TestWrapper>
        <QueueItem item={item} />
      </TestWrapper>
    )

    expect(screen.getByText('Failed Task')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
