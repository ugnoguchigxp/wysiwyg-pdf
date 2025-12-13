import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const keyboard = vi.hoisted(() => ({ last: null as any }))

vi.mock('../../../../../src/components/canvas/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: (cfg: any) => {
    keyboard.last = cfg
  },
}))

vi.mock('../../../../../src/components/canvas/CanvasElementRenderer', () => ({
  CanvasElementRenderer: (props: any) => (
    <button
      type="button"
      data-testid={`el-${props.element.id}`}
      onClick={() => props.onSelect?.()}
      onDoubleClick={() => props.onDblClick?.()}
    >
      {props.element.id}
    </button>
  ),
}))

const stageState = vi.hoisted(() => ({
  pointer: { x: 20, y: 40 },
  toDataURL: vi.fn(() => 'data:image/png;base64,xxx'),
}))

vi.mock('react-konva', async () => {
  const React = (await import('react')).default

  const Stage = React.forwardRef((props: any, ref: any) => {
    const stageObj = {
      toDataURL: stageState.toDataURL,
      setPointersPositions: () => {},
      getPointerPosition: () => stageState.pointer,
      getAbsoluteTransform: () => ({
        copy: () => ({
          invert: () => {},
          point: (p: any) => p,
        }),
      }),
      getStage: () => stageObj,
      name: () => '',
    }

    if (typeof ref === 'function') ref(stageObj)
    else if (ref) ref.current = stageObj

    return (
      <div
        data-testid="stage"
        onMouseDown={() => props.onMouseDown?.({ target: stageObj })}
        onMouseMove={() => props.onMouseMove?.({ target: stageObj })}
        onMouseUp={() => props.onMouseUp?.({ target: stageObj })}
      >
        {props.children}
      </div>
    )
  })

  const Layer = (props: any) => <div data-testid={`layer-${props.name ?? 'layer'}`}>{props.children}</div>
  const Rect = (props: any) => <div data-testid={`rect-${props.name ?? ''}`} data-fill={props.fill} />
  const Image = (props: any) => <div data-testid={`image-${props.name ?? ''}`} />

  return { Stage, Layer, Rect, Image }
})

import { ReportKonvaEditor } from '../../../../../src/modules/konva-editor/report-editor/ReportKonvaEditor'

beforeEach(() => {
  if (!globalThis.crypto || !('randomUUID' in globalThis.crypto)) {
    ;(globalThis as any).crypto = { randomUUID: () => 'uuid' }
  }
})

describe('ReportKonvaEditor', () => {
  it('selects/deselects and supports delete via keyboard shortcuts', () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()

    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100, bg: '#fff' }],
      nodes: [{ id: 't1', t: 'text', s: 'p1', x: 1, y: 2, w: 10, h: 10, text: 'hi' }],
    } as any

    render(
      <ReportKonvaEditor
        templateDoc={doc}
        zoom={1}
        selectedElementId="t1"
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
      />
    )

    fireEvent.click(screen.getByTestId('el-t1'))
    expect(onElementSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }))

    keyboard.last?.onDelete?.()
    expect(onTemplateChange).toHaveBeenCalledWith(expect.objectContaining({ nodes: [] }))
    expect(onElementSelect).toHaveBeenCalledWith(null)

    fireEvent.mouseDown(screen.getByTestId('stage'))
    expect(onElementSelect).toHaveBeenCalledWith(null)
  })

  it('supports signature drawing commit and move/selectAll shortcuts', () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()

    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100, bg: '#fff' }],
      nodes: [{ id: 't1', t: 'text', s: 'p1', x: 1, y: 2, w: 10, h: 10, text: 'hi' }],
    } as any

    const { rerender } = render(
      <ReportKonvaEditor
        templateDoc={doc}
        zoom={1}
        selectedElementId="t1"
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
        activeTool="signature"
      />
    )

    fireEvent.mouseDown(screen.getByTestId('stage'))
    fireEvent.mouseMove(screen.getByTestId('stage'))
    fireEvent.mouseUp(screen.getByTestId('stage'))

    rerender(
      <ReportKonvaEditor
        templateDoc={doc}
        zoom={1}
        selectedElementId="t1"
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
        activeTool="select"
      />
    )
    expect(onTemplateChange).toHaveBeenCalledWith(expect.objectContaining({ nodes: expect.any(Array) }))

    keyboard.last?.onSelectAll?.()
    expect(onElementSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }))

    keyboard.last?.onMoveRight?.(1)
    expect(onTemplateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [expect.objectContaining({ id: 't1', x: 2, y: 2 })],
      })
    )
  })

  it('supports drop binding and downloadImage via ref', () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()
    const ref = React.createRef<any>()

    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100, bg: '#fff' }],
      nodes: [],
    } as any

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const { container } = render(
      <ReportKonvaEditor
        ref={ref}
        templateDoc={doc}
        zoom={2}
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
      />
    )

    const payload = { type: 'binding', data: { fieldId: 'cat.f1', text: 'Hello' } }
    const dropTarget = container.firstElementChild as HTMLElement
    fireEvent.drop(dropTarget, {
      dataTransfer: {
        dropEffect: 'copy',
        getData: (type: string) => (type === 'application/json' ? JSON.stringify(payload) : ''),
      },
    })

    expect(onTemplateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [expect.objectContaining({ t: 'text', bind: 'cat.f1', text: 'Hello', x: 10, y: 20 })],
      })
    )
    expect(onElementSelect).toHaveBeenCalledWith(expect.objectContaining({ t: 'text', bind: 'cat.f1' }))

    ref.current?.downloadImage()
    expect(stageState.toDataURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })
})
