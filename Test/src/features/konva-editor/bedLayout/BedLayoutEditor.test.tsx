import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const stage = { toDataURL: vi.fn(() => 'data:image/png;base64,bed') }

vi.mock('@/components/canvas/KonvaCanvasEditor', async () => {
  const React = (await import('react')).default
  return {
    KonvaCanvasEditor: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        getStage: () => stage,
      }))

      const custom =
        props.elements?.length > 0 && props.renderCustom
          ? props.renderCustom(props.elements[0], { ref: null }, () => null)
          : null

      return (
        <div>
          <div data-testid="paper-size">
            {props.paperWidth}x{props.paperHeight}
          </div>
          <button type="button" onClick={() => props.onDelete?.()}>
            delete
          </button>
          <div data-testid="bg">{props.background}</div>
          <div data-testid="custom">{custom}</div>
        </div>
      )
    }),
  }
})

vi.mock('@/features/bed-layout-editor/components/PaperBackground', () => ({
  PaperBackground: () => <div data-testid="paper-bg" />,
}))

vi.mock('@/features/bed-layout-editor/elements/BedElement', () => ({
  BedElement: () => <div data-testid="bed-element" />,
}))

import { BedLayoutEditor } from '@/features/bed-layout-editor/BedLayoutEditor'

describe('BedLayoutEditor', () => {
  it('computes paper size, renders custom bed element, deletes, and downloads image', () => {
    const onDelete = vi.fn()
    const ref = React.createRef<any>()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const doc = {
      type: 'bed-layout',
      layout: { width: 300, height: 200 },
      elementOrder: ['bed1'],
      elementsById: {
        bed1: { id: 'bed1', t: 'widget', widget: 'bed' },
      },
    } as any

    render(
      <BedLayoutEditor
        ref={ref}
        document={doc}
        zoom={1}
        selection={['bed1']}
        onSelect={() => {}}
        onChangeElement={() => {}}
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
})

