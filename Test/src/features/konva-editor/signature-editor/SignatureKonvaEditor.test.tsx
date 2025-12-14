import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const stageState = vi.hoisted(() => ({
  pointer: { x: 1, y: 2 },
  toDataURL: vi.fn(() => 'data:image/png;base64,sig'),
}))

vi.mock('react-konva', async () => {
  const React = (await import('react')).default

  const Stage = React.forwardRef((props: { children?: React.ReactNode; onMouseDown?: (e: unknown) => void; onMouseMove?: (e: unknown) => void; onMouseUp?: (e: unknown) => void; onTouchStart?: (e: unknown) => void; onTouchMove?: (e: unknown) => void; onTouchEnd?: (e: unknown) => void }, ref: React.ForwardedRef<unknown>) => {
    const stageObj = {
      toDataURL: stageState.toDataURL,
      getPointerPosition: () => stageState.pointer,
      getStage: () => stageObj,
    }
    if (typeof ref === 'function') ref(stageObj)
    else if (ref) ref.current = stageObj

    const wrap = (handler?: (e: { target: unknown }) => void) => () => handler?.({ target: stageObj })

    return (
      <div
        data-testid="stage"
        onMouseDown={wrap(props.onMouseDown)}
        onMouseMove={wrap(props.onMouseMove)}
        onMouseUp={wrap(props.onMouseUp)}
        onTouchStart={wrap(props.onTouchStart)}
        onTouchMove={wrap(props.onTouchMove)}
        onTouchEnd={wrap(props.onTouchEnd)}
      >
        {props.children}
      </div>
    )
  })

  const Layer = (props: { children?: React.ReactNode }) => <div data-testid="layer">{props.children}</div>
  const Line = (props: { points?: number[] }) => <div data-testid="line" data-points={props.points?.length ?? 0} />

  return { Stage, Layer, Line }
})

vi.mock('konva', () => ({ default: {} }))

import { SignatureKonvaEditor } from '@/features/konva-editor/signature-editor/SignatureKonvaEditor'

describe('SignatureKonvaEditor', () => {
  it('draws, clears, cancels, downloads, and saves', () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { })

    render(<SignatureKonvaEditor onSave={onSave} onCancel={onCancel} />)

    fireEvent.mouseDown(screen.getByTestId('stage'))
    fireEvent.mouseMove(screen.getByTestId('stage'))
    fireEvent.mouseUp(screen.getByTestId('stage'))

    expect(screen.getAllByTestId('line').length).toBe(1)

    fireEvent.click(screen.getByText('Download'))
    expect(stageState.toDataURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith('data:image/png;base64,sig')

    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Clear'))
    expect(screen.queryAllByTestId('line').length).toBe(0)
  })
})
