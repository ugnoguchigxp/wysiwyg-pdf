import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TextEditOverlay } from '@/components/canvas/TextEditOverlay'
import type { TextNode } from '@/types/canvas'

describe('components/canvas/TextEditOverlay', () => {
  it('renders textarea and calls onUpdate; finishes on Escape', () => {
    const onUpdate = vi.fn()
    const onFinish = vi.fn()

    const element: TextNode = {
      id: 't1',
      t: 'text',
      s: 's1',
      x: 10,
      y: 20,
      w: 30,
      h: 40,
      text: 'hello',
      font: 'Arial',
      fontSize: 12,
      fill: '#111',
      align: 'l',
      r: 0,
    }

    render(
      <TextEditOverlay
        element={element}
        scale={1}
        stageNode={null}
        onUpdate={onUpdate}
        onFinish={onFinish}
      />
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('hello')

    fireEvent.change(textarea, { target: { value: 'x' } })
    expect(onUpdate).toHaveBeenCalledWith('x')

    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(onFinish).toHaveBeenCalledTimes(1)
  })
})

