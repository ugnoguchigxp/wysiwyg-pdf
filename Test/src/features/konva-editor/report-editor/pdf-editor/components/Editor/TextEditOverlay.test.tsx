import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../@/features/report-editor/pdf-editor/utils/coordinates', () => ({
  ptToPx: (pt: number) => pt,
}))

import { TextEditOverlay } from '../../../@/features/report-editor/components/Editor/TextEditOverlay'

describe('report-editor TextEditOverlay', () => {
  it('positions textarea and handles Enter/Escape', () => {
    const onTextChange = vi.fn()
    const onComplete = vi.fn()
    const onCancel = vi.fn()

    render(
      <TextEditOverlay
        item={{
          id: 't',
          type: 'text',
          x: 10,
          y: 20,
          width: 30,
          height: 40,
          texts: ['a'],
          style: { 'font-size': 12, 'font-family': ['Arial'], 'font-style': ['bold', 'italic'], color: '#111' },
        } as any}
        textEditValue="hello"
        zoom={200}
        panOffset={{ x: 1, y: 2 }}
        onTextChange={onTextChange}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('hello')

    fireEvent.change(textarea, { target: { value: 'x' } })
    expect(onTextChange).toHaveBeenCalledWith('x')

    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(onComplete).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

