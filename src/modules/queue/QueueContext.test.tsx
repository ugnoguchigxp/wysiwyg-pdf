import React, { useContext } from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
    if (!queueContext) throw new Error('Context not found')

    expect((queueContext as QueueContextType).addTask).toBeDefined()
    expect(typeof (queueContext as QueueContextType).addTask).toBe('function')
  })

  it('addTask returns a task id', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())
    if (!queueContext) throw new Error('Context not found')
    const ctx = queueContext as QueueContextType

    let taskId: string | undefined
    act(() => {
      taskId = ctx.addTask('Test Task', async () => {
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
    if (!queueContext) throw new Error('Context not found')
    const ctx = queueContext as QueueContextType

    expect(ctx.stats.total).toBe(0)
    expect(ctx.stats.pending).toBe(0)
    expect(ctx.stats.completed).toBe(0)
  })

  it('provides cancelTask function', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())
    if (!queueContext) throw new Error('Context not found')
    const ctx = queueContext as QueueContextType

    expect(ctx.cancelTask).toBeDefined()
    expect(typeof ctx.cancelTask).toBe('function')
  })

  it('provides removeTask function', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())
    if (!queueContext) throw new Error('Context not found')
    const ctx = queueContext as QueueContextType

    expect(ctx.removeTask).toBeDefined()
    expect(typeof ctx.removeTask).toBe('function')
  })

  it('provides clear and clearCompleted functions', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())
    if (!queueContext) throw new Error('Context not found')
    const ctx = queueContext as QueueContextType

    expect(ctx.clear).toBeDefined()
    expect(ctx.clearCompleted).toBeDefined()
  })

  it('items starts as empty array', async () => {
    let queueContext: QueueContextType | null = null

    render(
      <QueueProvider>
        <QueueConsumer onContext={(ctx) => { queueContext = ctx }} />
      </QueueProvider>
    )

    await waitFor(() => expect(queueContext).not.toBeNull())
    if (!queueContext) throw new Error('Context not found')
    const ctx = queueContext as QueueContextType

    expect(ctx.items).toEqual([])
  })
})

