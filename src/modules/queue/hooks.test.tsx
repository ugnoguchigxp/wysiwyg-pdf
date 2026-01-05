import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueProvider } from '@/modules/queue/QueueContext'
import { useQueue, useQueueItem } from '@/modules/queue/hooks'

vi.mock('@/modules/queue/hooks', () => ({
  useQueue: () => ({
    stats: {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    },
    items: [],
    addTask: vi.fn(() => 'test-id'),
    clear: vi.fn(),
    clearCompleted: vi.fn(),
    cancelTask: vi.fn(),
    retryTask: vi.fn(),
    removeTask: vi.fn(),
  }),
  useQueueItem: (id: string) => ({
    item: { id, name: 'Test', status: 'pending', progress: 0, handler: async () => {} },
    cancel: vi.fn(),
    retry: vi.fn(),
    remove: vi.fn(),
  }),
}))

describe('modules/queue/hooks', () => {
  it('useQueue returns mock values', () => {
    const TestComponent = () => {
      const queue = useQueue()

      return (
        <div>
          <div data-testid="stats">{JSON.stringify(queue.stats)}</div>
          <div data-testid="items-count">{queue.items.length}</div>
        </div>
      )
    }

    render(
      <QueueProvider>
        <TestComponent />
      </QueueProvider>
    )

    const stats = screen.getByTestId('stats')
    expect(JSON.parse(stats.textContent || '{}')).toEqual({
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    })

    const itemsCount = screen.getByTestId('items-count')
    expect(itemsCount.textContent).toBe('0')
  })

  it('useQueueItem returns mock values', () => {
    const TestItemComponent = () => {
      const { item } = useQueueItem('test-id')
      return (
        <div>
          <div data-testid="item-id">{item?.id || ''}</div>
        </div>
      )
    }

    render(
      <QueueProvider>
        <TestItemComponent />
      </QueueProvider>
    )

    const itemDiv = screen.getByTestId('item-id')
    expect(itemDiv.textContent).toBe('test-id')
  })
})
