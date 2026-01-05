import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const keyboard = vi.hoisted(() => ({ last: null as any }))

vi.mock('@/components/canvas/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: (cfg: any) => {
    keyboard.last = cfg
  },
}))

vi.mock('@/components/canvas/CanvasElementRenderer', () => ({
  CanvasElementRenderer: (props: any) => (
    <div>
      <button
        type="button"
        data-testid={`el-${props.element.id}`}
        onClick={() => props.onSelect?.()}
        onDoubleClick={() => props.onDblClick?.()}
      >
        {props.element.id}
      </button>
      {props.element.t === 'table' && (
        <>
          <button
            type="button"
            data-testid={`cell-${props.element.id}-0-0`}
            onClick={() => props.onCellClick?.(props.element.id, 0, 0)}
            onDoubleClick={() => props.onCellDblClick?.(props.element.id, 0, 0)}
          >
            cell
          </button>
          <button
            type="button"
            data-testid={`ctx-${props.element.id}-0-0`}
            onClick={() =>
              props.onContextMenu?.({
                evt: { preventDefault: () => { }, clientX: 12, clientY: 34 },
                target: {
                  id: () => `${props.element.id}_cell_0_0`,
                  getParent: () => null,
                },
              })
            }
          >
            ctx
          </button>
        </>
      )}
    </div>
  ),
}))

vi.mock('@/components/canvas/TextEditOverlay', () => ({
  TextEditOverlay: (props: any) => {
    const didRun = React.useRef(false)
    React.useEffect(() => {
      if (didRun.current) return
      didRun.current = true
      props.onUpdate?.('Updated')
      props.onFinish?.()
    }, [props.onFinish, props.onUpdate])
    return <div data-testid="text-edit-overlay" />
  },
}))

vi.mock('@/features/konva-editor/utils/canvasImageUtils', () => ({
  findImageWithExtension: vi.fn(async () => ({ url: 'x', img: {} })),
}))

vi.mock('@/features/konva-editor/utils/textUtils', () => ({
  calculateTextDimensions: () => ({ w: 123, h: 45 }),
  measureText: () => ({ width: 100, height: 20 }),
}))

const stageState = vi.hoisted(() => ({
  pointer: { x: 20, y: 40 },
  toDataURL: vi.fn(() => 'data:image/png;base64,xxx'),
  gridVisible: true,
  transformers: [] as any[],
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
      setPointersPositions: () => { },
      getPointerPosition: () => stageState.pointer,
      getAbsoluteTransform: () => ({
        copy: () => ({
          invert: () => { },
          point: (p: any) => p,
        }),
      }),
      getStage: () => stageObj,
      find: (_selector: string) => stageState.transformers,
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
  const Line = (props: any) => <div data-testid="line-element" data-points={JSON.stringify(props.points)} />

  return { Stage, Layer, Rect, Image, Line }
})

import { ReportKonvaEditor } from '@/features/report-editor/ReportKonvaEditor'
import type { Doc } from '@/types/canvas'
import { ptToMm, pxToMm } from '@/utils/units'
import { useCanvasTransform } from '@/components/canvas/hooks/useCanvasTransform'

beforeEach(() => {
  if (!globalThis.crypto || !('randomUUID' in globalThis.crypto)) {
    ; (globalThis as any).crypto = { randomUUID: () => 'uuid' }
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

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { })

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
    expect(added.text).toBe('{Hello}')
    expect(added.fontSize).toBeCloseTo(ptToMm(10), 10)
    expect(added.x).toBeCloseTo(pxToMm(10, { dpi: 96 }), 10)
    expect(added.y).toBeCloseTo(pxToMm(20, { dpi: 96 }), 10)

    expect(onElementSelect).toHaveBeenCalledWith(expect.objectContaining({ t: 'text', bind: 'cat.f1' }))

    const transformer = {
      getClassName: () => 'Transformer',
      visible: () => true,
      hide: vi.fn(),
      show: vi.fn(),
    }
    stageState.transformers = [transformer]

    ref.current?.downloadImage()
    expect(stageState.toDataURL).toHaveBeenCalled()
    expect(transformer.hide).toHaveBeenCalled()
    expect(transformer.show).toHaveBeenCalled()
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

  it('renders background image when surface background is an asset path', async () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()

    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100, bg: 'assets/page-bg' }],
      nodes: [],
    } as any

    render(
      <ReportKonvaEditor
        templateDoc={doc}
        zoom={1}
        selectedElementId={undefined}
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('image-_background')).toBeInTheDocument()
    })
  })

  it('copies and pastes the selected element with offset', () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()
    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100, bg: '#fff' }],
      nodes: [{ id: 't1', t: 'text', s: 'p1', x: 10, y: 20, w: 10, h: 10, text: 'hi' }],
    } as any

    localStorage.clear()
      ; (globalThis.crypto as any).randomUUID = () => 'pasted-id'

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

    act(() => {
      keyboard.last?.onCopy?.()
      keyboard.last?.onPaste?.()
    })

    const updated = onTemplateChange.mock.calls.at(-1)?.[0] as Doc
    const pasted = updated.nodes.find((n: any) => n.id === 'pasted-id') as any
    expect(pasted).toBeTruthy()
    expect(pasted!.x).toBe(11)
    expect(pasted!.y).toBe(21)
  })

  it('ignores move shortcuts for line elements', () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()
    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100, bg: '#fff' }],
      nodes: [{ id: 'l1', t: 'line', s: 'p1', pts: [0, 0, 10, 10] }],
    } as any

    render(
      <ReportKonvaEditor
        templateDoc={doc}
        zoom={1}
        selectedElementId="l1"
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
      />
    )

    keyboard.last?.onMoveRight?.(1)
    expect(onTemplateChange).not.toHaveBeenCalled()
  })

  it('updates text dimensions and commits on edit finish', async () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()
    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100, bg: '#fff' }],
      nodes: [
        {
          id: 't1',
          t: 'text',
          s: 'p1',
          x: 10,
          y: 10,
          w: 20,
          h: 5,
          text: 'hello',
          font: 'Helvetica',
          fontSize: 3,
          fontWeight: 400,
          padding: 0,
        },
      ],
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

    fireEvent.doubleClick(screen.getByTestId('el-t1'))

    await waitFor(() => {
      expect(onTemplateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: expect.arrayContaining([
            expect.objectContaining({ id: 't1', text: 'Updated', w: 123, h: 45 }),
          ]),
        }),
        expect.objectContaining({ saveToHistory: false })
      )
    })
  })

  it('edits table cell values on double click and blur', () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()
    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 200, h: 100, bg: '#fff' }],
      nodes: [
        {
          id: 'tbl1',
          t: 'table',
          s: 'p1',
          x: 0,
          y: 0,
          w: 200,
          h: 100,
          table: {
            rows: [50, 50],
            cols: [100, 100],
            cells: [{ r: 0, c: 0, v: 'A' }],
          },
        },
      ],
    } as any

    render(
      <ReportKonvaEditor
        templateDoc={doc}
        zoom={1}
        selectedElementId="tbl1"
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
      />
    )

    fireEvent.doubleClick(screen.getByTestId('cell-tbl1-0-0'))
    expect(onElementSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'tbl1' }))

    const input = screen.getByDisplayValue('A')
    fireEvent.change(input, { target: { value: 'B' } })
    fireEvent.blur(input)

    const updated = onTemplateChange.mock.calls.at(-1)?.[0] as Doc
    const table = updated.nodes.find((n: any) => n.id === 'tbl1') as any
    const cell = table!.table.cells.find((c: any) => c.r === 0 && c.c === 0)
    expect(cell.v).toBe('B')
  })

  it('commits table cell edit on Enter and cancels on Escape', () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()
    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 200, h: 100, bg: '#fff' }],
      nodes: [
        {
          id: 'tbl1',
          t: 'table',
          s: 'p1',
          x: 0,
          y: 0,
          w: 200,
          h: 100,
          table: {
            rows: [50, 50],
            cols: [100, 100],
            cells: [{ r: 0, c: 0, v: 'A' }],
          },
        },
      ],
    } as any

    const { rerender } = render(
      <ReportKonvaEditor
        templateDoc={doc}
        zoom={1}
        selectedElementId="tbl1"
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
      />
    )

    fireEvent.doubleClick(screen.getByTestId('cell-tbl1-0-0'))
    const input = screen.getByDisplayValue('A')
    fireEvent.change(input, { target: { value: 'B' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const updated = onTemplateChange.mock.calls.at(-1)?.[0] as Doc
    const table = updated.nodes.find((n: any) => n.id === 'tbl1') as any
    const cell = table!.table.cells.find((c: any) => c.r === 0 && c.c === 0)
    expect(cell.v).toBe('B')

    onTemplateChange.mockClear()

    rerender(
      <ReportKonvaEditor
        templateDoc={doc}
        zoom={1}
        selectedElementId="tbl1"
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
      />
    )

    fireEvent.doubleClick(screen.getByTestId('cell-tbl1-0-0'))
    const input2 = screen.getByDisplayValue('A')
    fireEvent.keyDown(input2, { key: 'Escape' })

    expect(screen.queryByDisplayValue('A')).not.toBeInTheDocument()
    expect(onTemplateChange).not.toHaveBeenCalled()
  })

  it('applies table context menu actions', () => {
    const onTemplateChange = vi.fn()
    const onElementSelect = vi.fn()
    const doc = {
      surfaces: [{ id: 'p1', type: 'page', w: 200, h: 100, bg: '#fff' }],
      nodes: [
        {
          id: 'tbl1',
          t: 'table',
          s: 'p1',
          x: 0,
          y: 0,
          w: 200,
          h: 100,
          table: {
            rows: [50, 50],
            cols: [100, 100],
            cells: [
              { r: 0, c: 0, v: 'A' },
              { r: 0, c: 1, v: 'B' },
              { r: 1, c: 0, v: 'C' },
              { r: 1, c: 1, v: 'D' },
            ],
          },
        },
      ],
    } as any

    render(
      <ReportKonvaEditor
        templateDoc={doc}
        zoom={1}
        onElementSelect={onElementSelect}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
        activeTool="select"
      />
    )

    fireEvent.click(screen.getByTestId('ctx-tbl1-0-0'))
    fireEvent.click(screen.getByRole('button', { name: 'table_ctx_insert_row_below' }))

    const updated = onTemplateChange.mock.calls.at(-1)?.[0] as Doc
    const table = updated.nodes.find((n: any) => n.id === 'tbl1') as any
    expect(table!.table.rows.length).toBe(3)
  })
})
