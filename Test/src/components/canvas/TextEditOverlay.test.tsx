import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TextEditOverlay } from '../../../../src/components/canvas/TextEditOverlay'

describe('components/canvas/TextEditOverlay', () => {
  it('computes textarea style using stage absolute position and element style', () => {
    const stageNode = {
      findOne: vi.fn(() => ({
        getAbsolutePosition: () => ({ x: 100, y: 200 }),
      })),
    } as any

    const { rerender } = render(
      <TextEditOverlay
        element={{
          id: 't1',
          t: 'text',
          s: 's1',
          x: 0,
          y: 0,
          w: 50,
          h: 20,
          r: 30,
          text: 'hello',
          font: 'Arial',
          fontSize: 10,
          fill: '#111',
          italic: true,
          underline: true,
          lineThrough: true,
          align: 'j',
        } as any}
        scale={2}
        stageNode={stageNode}
        onUpdate={() => {}}
        onFinish={() => {}}
      />
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveStyle({ left: '100px', top: '200px' })
    expect(textarea).toHaveStyle({ width: '100px', height: '40px' })
    expect(textarea).toHaveStyle({ fontSize: '20px', fontStyle: 'italic' })
    expect(textarea).toHaveStyle({ textAlign: 'justify' })
    expect(textarea).toHaveStyle({ transform: 'rotate(30deg)' })

    // cover right + default (left) alignment branches
    rerender(
      <TextEditOverlay
        element={{
          id: 't1',
          t: 'text',
          s: 's1',
          x: 0,
          y: 0,
          w: 50,
          h: 20,
          r: 0,
          text: 'hello',
          align: 'r',
        } as any}
        scale={1}
        stageNode={stageNode}
        onUpdate={() => {}}
        onFinish={() => {}}
      />
    )
    expect(screen.getByRole('textbox')).toHaveStyle({ textAlign: 'right' })

    rerender(
      <TextEditOverlay
        element={{
          id: 't1',
          t: 'text',
          s: 's1',
          x: 0,
          y: 0,
          w: 50,
          h: 20,
          r: 0,
          text: 'hello',
          align: 'l',
        } as any}
        scale={1}
        stageNode={stageNode}
        onUpdate={() => {}}
        onFinish={() => {}}
      />
    )
    expect(screen.getByRole('textbox')).toHaveStyle({ textAlign: 'left' })

    rerender(
      <TextEditOverlay
        element={{
          id: 't1',
          t: 'text',
          s: 's1',
          x: 0,
          y: 0,
          w: 50,
          h: 20,
          r: 0,
          text: 'hello',
          align: 'c',
        } as any}
        scale={1}
        stageNode={stageNode}
        onUpdate={() => {}}
        onFinish={() => {}}
      />
    )
    expect(screen.getByRole('textbox')).toHaveStyle({ textAlign: 'center' })
  })

  it('calls onUpdate on change and onFinish on Escape / Ctrl+Enter / blur', () => {
    const onUpdate = vi.fn()
    const onFinish = vi.fn()

    const stageNode = {
      findOne: vi.fn(() => ({
        getAbsolutePosition: () => ({ x: 0, y: 0 }),
      })),
    } as any

    render(
      <TextEditOverlay
        element={{
          id: 't1',
          t: 'text',
          s: 's1',
          x: 0,
          y: 0,
          w: 50,
          h: 20,
          r: 0,
          text: '',
        } as any}
        scale={1}
        stageNode={stageNode}
        onUpdate={onUpdate}
        onFinish={onFinish}
      />
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'a' } })
    expect(onUpdate).toHaveBeenLastCalledWith('a')

    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(onFinish).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })
    expect(onFinish).toHaveBeenCalledTimes(2)

    fireEvent.blur(textarea)
    expect(onFinish).toHaveBeenCalledTimes(3)
  })

  it('syncs textarea value when element.text changes and ignores Shift+Enter', () => {
    const onFinish = vi.fn()
    const onUpdate = vi.fn()

    const stageNode = {
      findOne: vi.fn(() => ({
        getAbsolutePosition: () => ({ x: 0, y: 0 }),
      })),
    } as any

    const { rerender } = render(
      <TextEditOverlay
        element={{
          id: 't1',
          t: 'text',
          s: 's1',
          x: 0,
          y: 0,
          w: 50,
          h: 20,
          r: 0,
          text: 'a',
        } as any}
        scale={1}
        stageNode={stageNode}
        onUpdate={onUpdate}
        onFinish={onFinish}
      />
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('a')

    rerender(
      <TextEditOverlay
        element={{
          id: 't1',
          t: 'text',
          s: 's1',
          x: 0,
          y: 0,
          w: 50,
          h: 20,
          r: 0,
          text: 'b',
        } as any}
        scale={1}
        stageNode={stageNode}
        onUpdate={onUpdate}
        onFinish={onFinish}
      />
    )

    expect(textarea.value).toBe('b')

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('handles missing stage/node defensively and supports justify/right alignment', () => {
    const onFinish = vi.fn()

    // stageNode null -> effect should bail
    render(
      <TextEditOverlay
        element={{ id: 't1', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'x', align: 'j' } as any}
        scale={1}
        stageNode={null}
        onUpdate={() => {}}
        onFinish={onFinish}
      />
    )

    // stageNode.findOne returns null -> effect should bail
    const stageNode = { findOne: vi.fn(() => null) } as any
    render(
      <TextEditOverlay
        element={{ id: 't2', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'x', align: 'r' } as any}
        scale={1}
        stageNode={stageNode}
        onUpdate={() => {}}
        onFinish={onFinish}
      />
    )

    // still renders textarea and key handlers work
    const textarea = screen.getAllByRole('textbox')[0] as HTMLTextAreaElement
    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(onFinish).toHaveBeenCalled()
  })
})
