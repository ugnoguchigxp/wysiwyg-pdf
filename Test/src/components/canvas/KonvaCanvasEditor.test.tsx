import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

let lastStageProps: any = null
let stageTestEvent: any = null

vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => {
    lastStageProps = props
    return (
      <div data-testid="Stage" onMouseDown={() => props.onMouseDown?.(stageTestEvent)}>
        {children}
      </div>
    )
  },
  Layer: ({ children }: any) => <div data-testid="Layer">{children}</div>,
}))

const rendererPropsById = new Map<string, any>()
const rendererTestEventById = new Map<string, any>()
const rendererSpy = vi.fn((props: any) => {
  rendererPropsById.set(props.element.id, props)
  // expose callbacks by rendering a button
  return (
    <button
      type="button"
      data-testid={`el-${props.element.id}`}
      onClick={() => props.onSelect?.(rendererTestEventById.get(props.element.id))}
      onDoubleClick={() => props.onDblClick?.()}
    >
      {props.element.id}
    </button>
  )
})

vi.mock('@/components/canvas/CanvasElementRenderer', () => ({
  CanvasElementRenderer: (props: any) => rendererSpy(props),
}))

const shortcutsSpy = vi.fn()
vi.mock('@/components/canvas/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: (handlers: any) => shortcutsSpy(handlers),
}))

vi.mock('@/components/canvas/TextEditOverlay', () => ({
  TextEditOverlay: ({ element, onUpdate, onFinish }: any) => (
    <div data-testid="TextEditOverlay">
      <span>{element.id}</span>
      <button type="button" onClick={() => onUpdate('updated')}>
        update
      </button>
      <button type="button" onClick={() => onFinish()}>
        finish
      </button>
    </div>
  ),
}))

import { KonvaCanvasEditor } from '@/components/canvas/KonvaCanvasEditor'

describe('components/canvas/KonvaCanvasEditor', () => {
  it('selects, multi-selects and edits text on double click', () => {
    const onSelect = vi.fn()
    const onChange = vi.fn()

    const elements = [
      { id: 't1', t: 'text', s: 's', x: 0, y: 0, w: 10, h: 10, text: 'x' },
      { id: 'r1', t: 'shape', s: 's', x: 0, y: 0, w: 10, h: 10, shape: 'rect' },
    ] as any

    const ref = React.createRef<any>()

    const { rerender } = render(
      <KonvaCanvasEditor
        ref={ref}
        elements={elements}
        selectedIds={[]}
        onSelect={onSelect}
        onChange={onChange}
        zoom={2}
        paperWidth={100}
        paperHeight={50}
      />
    )

    expect(ref.current.getStage()).toBeNull()
    expect(screen.getByTestId('Stage')).toBeInTheDocument()
    expect(screen.getAllByTestId('Layer')).toHaveLength(2)

    // Select single element
    rendererTestEventById.set('t1', { evt: {} })
    fireEvent.click(screen.getByTestId('el-t1'))
    expect(onSelect).toHaveBeenLastCalledWith(['t1'])

    // Multi-select with shift
    onSelect.mockClear()
    rerender(
      <KonvaCanvasEditor
        elements={elements}
        selectedIds={['t1']}
        onSelect={onSelect}
        onChange={onChange}
        zoom={1}
        paperWidth={1}
        paperHeight={1}
      />
    )
    rendererTestEventById.set('r1', { evt: { shiftKey: true } })
    fireEvent.click(screen.getByTestId('el-r1'))
    expect(onSelect).toHaveBeenLastCalledWith(['t1', 'r1'])

    // Double click text opens overlay
    fireEvent.doubleClick(screen.getByTestId('el-t1'))
    expect(screen.getByTestId('TextEditOverlay')).toBeInTheDocument()

    // Update text and finish
    fireEvent.click(screen.getByRole('button', { name: 'update' }))
    expect(onChange).toHaveBeenLastCalledWith('t1', { text: 'updated' })
    fireEvent.click(screen.getByRole('button', { name: 'finish' }))
  })

  it('clicking stage background clears selection and closes editor', () => {
    const onSelect = vi.fn()
    const onChange = vi.fn()

    render(
      <KonvaCanvasEditor
        elements={[{ id: 't1', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'x' } as any]}
        selectedIds={['t1']}
        onSelect={onSelect}
        onChange={onChange}
        zoom={1}
        paperWidth={1}
        paperHeight={1}
      />
    )

    stageTestEvent = {
      target: {
        getStage: () => lastStageProps.__stage,
        name: () => 'paper-background',
      },
    }
    lastStageProps.__stage = stageTestEvent.target
    fireEvent.mouseDown(screen.getByTestId('Stage'))
    expect(onSelect).toHaveBeenLastCalledWith([])
  })

  it('readOnly prevents selection and editing', () => {
    const onSelect = vi.fn()
    const onChange = vi.fn()

    render(
      <KonvaCanvasEditor
        elements={[{ id: 't1', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'x' } as any]}
        selectedIds={[]}
        onSelect={onSelect}
        onChange={onChange}
        zoom={1}
        paperWidth={1}
        paperHeight={1}
        readOnly
      />
    )

    rendererTestEventById.set('t1', { evt: {} })
    fireEvent.click(screen.getByTestId('el-t1'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
