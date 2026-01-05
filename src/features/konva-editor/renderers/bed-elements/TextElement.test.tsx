import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const textProps: any[] = []

vi.mock('react-konva', () => ({
  Text: (props: any) => {
    textProps.push(props)
    return <div data-testid="Text" />
  },
}))

import { TextElement } from '@/features/konva-editor/renderers/bed-elements/TextElement'

describe('TextElement', () => {
  beforeEach(() => {
    textProps.length = 0
  })

  it('maps alignment, decorations, and default text', () => {
    const element = {
      id: 'text-1',
      t: 'text',
      x: 5,
      y: 6,
      w: 100,
      h: 30,
      text: '',
      fontSize: 14,
      font: 'Arial',
      fontWeight: 'bold',
      italic: true,
      underline: true,
      fill: '#111',
      align: 'c',
      vAlign: 'b',
      r: 0,
      locked: true,
    } as any

    render(
      <TextElement
        element={element}
        isSelected={false}
        onSelect={() => {}}
        onChange={() => {}}
      />
    )

    expect(textProps[0].text).toBe('Text')
    expect(textProps[0].align).toBe('center')
    expect(textProps[0].verticalAlign).toBe('bottom')
    expect(textProps[0].textDecoration).toBe('underline')
    expect(textProps[0].fontStyle).toContain('bold')
    expect(textProps[0].fontStyle).toContain('italic')
    expect(textProps[0].draggable).toBe(false)
  })

  it('updates position on drag end', () => {
    const onChange = vi.fn()
    const element = {
      id: 'text-2',
      t: 'text',
      x: 0,
      y: 0,
      w: 50,
      h: 20,
      text: 'Hello',
      fontSize: 12,
      font: 'Arial',
      fill: '#000',
      align: 'l',
      vAlign: 't',
      r: 0,
      locked: false,
    } as any

    render(
      <TextElement
        element={element}
        isSelected={false}
        onSelect={() => {}}
        onChange={onChange}
      />
    )

    textProps[0].onDragEnd({
      target: {
        x: () => 20,
        y: () => 30,
      },
    } as any)

    expect(onChange).toHaveBeenCalledWith({ x: 20, y: 30 })
  })
})
