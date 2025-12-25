import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const keyboard = vi.hoisted(() => ({ last: null as any }))

vi.mock('@/components/canvas/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: (cfg: any) => {
    keyboard.last = cfg
  },
}))

vi.mock('@/components/canvas/CanvasElementRenderer', () => ({
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
  gridVisible: true,
}))

vi.mock('react-konva', async () => {
  const React = (await import('react')).default

  const Stage = React.forwardRef((props: any, ref: any) => {
    const gridNode = {
      visible: () => stageState.gridVisible,
      hide: () => {
        stageState.gridVisible = false
      },
      show: () => {
        stageState.gridVisible = true
      },
    }

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
      find: (_selector: string) => [],
      findOne: (selector: string) => {
        if (selector === '.grid-layer') return gridNode
        return null
      },
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

import { ReportKonvaEditor } from '../../../../../src/features/report-editor/ReportKonvaEditor'
import type { Doc } from '../../../../../src/types/canvas'
import { ptToMm, pxToMm } from '../../../../../src/utils/units'
import { useCanvasTransform } from '../../../../../src/components/canvas/hooks/useCanvasTransform'

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
    expect(onTemplateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([expect.objectContaining({ id: 't1', x: 2, y: 2 })]),
      }),
      undefined
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

    expect(onTemplateChange).toHaveBeenCalled()
    const next = onTemplateChange.mock.calls[0]?.[0] as Doc
    const added = (next.nodes ?? []).find((n: any) => n.t === 'text' && n.bind === 'cat.f1') as any
    expect(added).toBeTruthy()
    expect(added.text).toBe('Hello')
    expect(added.fontSize).toBeCloseTo(ptToMm(12), 10)
    expect(added.x).toBeCloseTo(pxToMm(10, { dpi: 96 }), 10)
    expect(added.y).toBeCloseTo(pxToMm(20, { dpi: 96 }), 10)

    expect(onElementSelect).toHaveBeenCalledWith(expect.objectContaining({ t: 'text', bind: 'cat.f1' }))

    ref.current?.downloadImage()
    expect(stageState.toDataURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })

  it('scales signature strokes when transformer resizes the element', () => {
    const shapeRef: React.MutableRefObject<any> = { current: null }
    const node = {
      width: () => 10,
      height: () => 5,
      scaleX: vi.fn((value?: number) => (value === undefined ? 2 : undefined)),
      scaleY: vi.fn((value?: number) => (value === undefined ? 3 : undefined)),
      x: () => 0,
      y: () => 0,
      rotation: () => 0,
    }
    shapeRef.current = node

    const signatureElement: any = {
      id: 'sig-1',
      t: 'signature',
      s: 'p1',
      w: 10,
      h: 5,
      strokes: [[0, 0, 1, 1]],
      x: 0,
      y: 0,
      stroke: '#000000',
      strokeW: 0.2,
    }

    const onChange = vi.fn()

    const TransformHarness = () => {
      const { handleTransformEnd } = useCanvasTransform({
        element: signatureElement,
        shapeRef,
        onChange,
      })
      React.useEffect(() => {
        handleTransformEnd()
      }, [handleTransformEnd])
      return null
    }

    render(<TransformHarness />)

    expect(onChange).toHaveBeenCalled()
    const updates = onChange.mock.calls[0]?.[0]
    expect(updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'sig-1',
          w: 20,
          h: 15,
          strokes: [[0, 0, 2, 3]],
        }),
      ])
    )
  })
})
