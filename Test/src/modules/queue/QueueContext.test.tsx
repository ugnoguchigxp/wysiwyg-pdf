import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QueueProvider, QueueContext } from '@/modules/queue/QueueContext'

const TestComponent = () => {
  return (
    <div>
      <button>Test</button>
      <div data-testid="test-component">Test</div>
    </div>
  )
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
})
