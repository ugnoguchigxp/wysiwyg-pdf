import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueueProvider } from '@/modules/queue/QueueContext'
import { useQueue } from '@/modules/queue/hooks'
import { QueueHeader } from '@/components/ui/queue/QueueHeader'

const SimpleHeaderTest = () => {
  const queue = useQueue()

  return (
    <div>
      <QueueHeader expanded={true} onToggle={vi.fn()} onClose={queue.clear} />
    </div>
  )
}

describe('components/ui/queue/QueueHeader', () => {
  it('renders header with props', () => {
    render(
      <QueueProvider>
        <SimpleHeaderTest />
      </QueueProvider>
    )

    expect(screen.getByText('(0 / 0)')).toBeInTheDocument()
  })

  it('renders collapsed header', () => {
    const onToggle = vi.fn()
    render(
      <QueueProvider>
        <QueueHeader expanded={false} onToggle={onToggle} onClose={vi.fn()} />
      </QueueProvider>
    )

    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })
})
