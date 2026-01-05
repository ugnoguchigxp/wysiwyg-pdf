import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BedLayoutEditor } from '@/features/bed-layout-editor/BedLayoutEditor'

const stage = {
  toDataURL: vi.fn(() => 'data:image/png;base64,bed'),
  find: vi.fn((_sel: string) => []),
  findOne: vi.fn((_sel: string) => ({
    visible: () => true,
    hide: () => { },
    show: () => { },
  })),
}

vi.mock('@/components/canvas/KonvaCanvasEditor', async () => {
  const React = (await import('react')).default
  return {
    KonvaCanvasEditor: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        getStage: () => stage,
        copy: vi.fn(),
        paste: vi.fn(),
      }))

      const custom =
        props.elements?.length > 0 && props.renderCustom
          ? props.renderCustom(props.elements[0], { ref: null }, () => null)
          : null

      return (
        <div data-testid="konva-editor-mock">
          <div data-testid="paper-size">
            {props.paperWidth}x{props.paperHeight}
          </div>
          <button type="button" onClick={() => props.onDelete?.()}>
            delete
          </button>
          <div data-testid="bg">{props.background}</div>
          <div data-testid="custom">{custom}</div>
          {props.elements?.map((el: any) => (
            <div key={el.id} data-testid={`node-${el.id}`}>
              {el.t}
            </div>
          ))}
          <button
            data-testid="trigger-reorder"
            onClick={() => props.onReorderNodes?.(['2', '1'])}
          >
            Reorder
          </button>
        </div>
      )
    }),
  }
})

vi.mock('@/features/konva-editor/viewers/components/PaperBackground', () => ({
  PaperBackground: () => <div data-testid="paper-bg" />,
}))

vi.mock('@/features/konva-editor/renderers/bed-elements/BedElement', () => ({
  BedElement: () => <div data-testid="bed-element" />,
}))

describe('BedLayoutEditor', () => {
  it('computes paper size, renders custom bed element, deletes, and downloads image', () => {
    const onDelete = vi.fn()
    const ref = React.createRef<any>()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { })

    const doc = {
      v: 1,
      id: 'doc',
      title: 'bed-layout',
      unit: 'mm',
      surfaces: [{ id: 'layout', type: 'canvas', w: 300, h: 200 }],
      nodes: [{ id: 'bed1', t: 'widget', widget: 'bed', s: 'layout' }],
    } as any

    render(
      <BedLayoutEditor
        ref={ref}
        document={doc}
        zoom={1}
        selection={['bed1']}
        onSelect={() => { }}
        onChangeElement={() => { }}
        onDelete={onDelete}
      />
    )

    expect(screen.getByTestId('paper-size').textContent).toBe('300x200')
    expect(screen.getByTestId('paper-bg')).toBeInTheDocument()
    expect(screen.getByTestId('bed-element')).toBeInTheDocument()

    fireEvent.click(screen.getByText('delete'))
    expect(onDelete).toHaveBeenCalledWith('bed1')

    ref.current?.downloadImage()
    expect(stage.toDataURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })

  it('passes onReorderNodes to KonvaCanvasEditor', () => {
    const onReorderNodes = vi.fn()
    const doc = {
      v: 1,
      id: 'doc',
      title: 'bed',
      unit: 'mm',
      surfaces: [{ id: 'layout', type: 'canvas', w: 100, h: 100 }],
      nodes: [
        { id: '1', t: 'widget', widget: 'bed', s: 'layout' },
        { id: '2', t: 'text', s: 'layout' }
      ],
    } as any

    render(
      <BedLayoutEditor
        document={doc}
        zoom={1}
        selection={[]}
        onSelect={() => { }}
        onChangeElement={() => { }}
        onReorderNodes={onReorderNodes}
      />
    )

    // Simulate reorder action from the mock
    const btn = screen.getByTestId('trigger-reorder')
    fireEvent.click(btn)

    // Verify callback was called with values simulated by the mock
    expect(onReorderNodes).toHaveBeenCalledWith(['2', '1'])
  })
})
