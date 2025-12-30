import React, { useContext } from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueProvider, QueueContext, type QueueContextType } from '@/modules/queue/QueueContext'

const TestComponent = () => {
  return (
    <div>
      <button>Test</button>
      <div data-testid="test-component">Test</div>
    </div>
  )
}

// Helper component to access context
const QueueConsumer: React.FC<{ onContext: (ctx: QueueContextType) => void }> = ({ onContext }) => {
  const ctx = useContext(QueueContext)
  React.useEffect(() => {
    if (ctx) onContext(ctx)
  }, [ctx, onContext])
  return <div data-testid="consumer">Consumer</div>
}

describe('modules/queue/QueueContext', () => {
  it('renders QueueProvider with children', () => {
    render(
      <QueueProvider>
        <TestComponent />
      </QueueProvider>
    )

    expect(screen.getByTestId('test-component')).toBeInTheDocument()
  })

  it('renders QueueProvider with maxConcurrent', () => {
    render(
      <QueueProvider maxConcurrent={2}>
        <TestComponent />
      </QueueProvider>
    )

    expect(screen.getByTestId('test-component')).toBeInTheDocument()
  })

  it('provides QueueContext', () => {
    const { container } = render(
      <QueueProvider>
        <div data-testid="context-provider">
          <TestComponent />
        </div>
      </QueueProvider>
    )

    expect(container.querySelector('[data-testid="context-provider"]')).toBeInTheDocument()
  })

  it('provides addTask function', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())

    expect(queueContext?.addTask).toBeDefined()
    expect(typeof queueContext?.addTask).toBe('function')
  })

  it('addTask returns a task id', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())

    let taskId: string | undefined
    act(() => {
      taskId = queueContext?.addTask('Test Task', async () => {
        return 'result'
      })
    })

    expect(taskId).toBeDefined()
    expect(typeof taskId).toBe('string')
  })

  it('stats starts at zero', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())

    expect(queueContext?.stats.total).toBe(0)
    expect(queueContext?.stats.pending).toBe(0)
    expect(queueContext?.stats.completed).toBe(0)
  })

  it('provides cancelTask function', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())

    expect(queueContext?.cancelTask).toBeDefined()
    expect(typeof queueContext?.cancelTask).toBe('function')
  })

  it('provides removeTask function', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())

    expect(queueContext?.removeTask).toBeDefined()
    expect(typeof queueContext?.removeTask).toBe('function')
  })

  it('provides clear and clearCompleted functions', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())

    expect(queueContext?.clear).toBeDefined()
    expect(queueContext?.clearCompleted).toBeDefined()
  })

  it('items starts as empty array', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())

    expect(queueContext?.items).toEqual([])
  })
})

