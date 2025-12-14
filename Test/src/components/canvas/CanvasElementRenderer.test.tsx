import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const findImageWithExtensionSpy = vi.fn()

vi.mock('react-konva', () => ({
  Arrow: (props: any) => <div data-testid="Arrow" data-props={JSON.stringify(props)} />,
  Circle: (props: any) => <div data-testid="Circle" data-props={JSON.stringify(props)} />,
  Ellipse: (props: any) => <div data-testid="Ellipse" data-props={JSON.stringify(props)} />,
  Group: ({ children, ...props }: any) => (
    <div data-testid="Group" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
  Image: (props: any) => <div data-testid="KonvaImage" data-props={JSON.stringify(props)} />,
  Line: (props: any) => <div data-testid="Line" data-props={JSON.stringify(props)} />,
  Path: (props: any) => <div data-testid="Path" data-props={JSON.stringify(props)} />,
  Rect: (props: any) => <div data-testid="Rect" data-props={JSON.stringify(props)} />,
  RegularPolygon: (props: any) => <div data-testid="RegularPolygon" data-props={JSON.stringify(props)} />,
  Star: (props: any) => <div data-testid="Star" data-props={JSON.stringify(props)} />,
  Text: (props: any) => <div data-testid="Text" data-props={JSON.stringify(props)} />,
}))

vi.mock('@/features/report-editor/components/WysiwygCanvas/canvasImageUtils', () => ({
  findImageWithExtension: (...args: any[]) => findImageWithExtensionSpy(...args),
}))

import { CanvasElementRenderer } from '@/components/canvas/CanvasElementRenderer'

describe('components/canvas/CanvasElementRenderer', () => {
  it('returns custom renderer result when provided', () => {
    render(
      <CanvasElementRenderer
        element={{ id: 'n', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'x' } as any}
        isSelected={false}
        onSelect={() => { }}
        onChange={() => { }}
        renderCustom={() => <div data-testid="custom" />}
      />
    )

    expect(screen.getByTestId('custom')).toBeInTheDocument()
  })

  it('maps text alignment props correctly', () => {
    render(
      <CanvasElementRenderer
        element={{
          id: 't1',
          t: 'text',
          s: 's',
          x: 0,
          y: 0,
          w: 100,
          h: 10,
          text: 'hello',
          align: 'c',
          vAlign: 'b',
          italic: true,
          fontWeight: 700,
          underline: true,
          lineThrough: true,
        } as any}
        isSelected={false}
        onSelect={() => { }}
        onChange={() => { }}
      />
    )

    const props = JSON.parse(screen.getByTestId('Text').getAttribute('data-props') || '{}')
    expect(props.align).toBe('center')
    expect(props.verticalAlign).toBe('bottom')
    expect(props.fontStyle).toContain('italic')
    expect(props.fontStyle).toContain('bold')
    expect(props.textDecoration).toContain('underline')
    expect(props.textDecoration).toContain('line-through')
  })

  it('renders image placeholder when src is empty', () => {
    render(
      <CanvasElementRenderer
        element={{ id: 'img', t: 'image', s: 's', x: 0, y: 0, w: 10, h: 10, src: '' } as any}
        isSelected={false}
        onSelect={() => { }}
        onChange={() => { }}
      />
    )

    const textProps = JSON.parse(screen.getByTestId('Text').getAttribute('data-props') || '{}')
    expect(textProps.text).toBe('Image')
  })

  it('renders KonvaImage after loading a data url', async () => {
    const OriginalImage = window.Image

    class MockImage {
      onload: null | (() => void) = null
      onerror: null | (() => void) = null
      set src(_v: string) {
        queueMicrotask(() => this.onload?.())
      }
    }

    // @ts-expect-error - test override
    window.Image = MockImage

    render(
      <CanvasElementRenderer
        element={{
          id: 'img',
          t: 'image',
          s: 's',
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          src: 'data:image/png;base64,AA==',
        } as any}
        isSelected={false}
        onSelect={() => { }}
        onChange={() => { }}
      />
    )

    await waitFor(() => expect(screen.getByTestId('KonvaImage')).toBeInTheDocument())
    expect(findImageWithExtensionSpy).not.toHaveBeenCalled()

    window.Image = OriginalImage
  })

  it('renders signature strokes as lines', () => {
    render(
      <CanvasElementRenderer
        element={{
          id: 'sig',
          t: 'signature',
          s: 's',
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          strokes: [
            [0, 0, 1, 1],
            [2, 2, 3, 3],
          ],
          stroke: '#000',
          strokeW: 2,
        } as any}
        isSelected={false}
        onSelect={() => { }}
        onChange={() => { }}
      />
    )

    // 1 transparent Rect + 2 stroke lines
    expect(screen.getAllByTestId('Line')).toHaveLength(2)
    expect(screen.getByTestId('Rect')).toBeInTheDocument()
  })
  it('renders shapes (rect, circle)', () => {
    // Rect
    render(
      <CanvasElementRenderer
        element={{ id: 'r1', t: 'shape', s: 'surface', shape: 'rect', x: 10, y: 10, w: 50, h: 50, fill: 'red' } as any}
        isSelected={false}
        onChange={() => { }}
        onSelect={() => { }}
      />
    )
    let props = JSON.parse(screen.getByTestId('Rect').getAttribute('data-props') || '{}')
    expect(props.fill).toBe('red')
    expect(props.width).toBe(50)

    // Circle (renders as Ellipse)
    render(
      <CanvasElementRenderer
        element={{ id: 'c1', t: 'shape', s: 'surface', shape: 'circle', x: 20, y: 20, w: 40, h: 40, fill: 'blue' } as any}
        isSelected={false}
        onChange={() => { }}
        onSelect={() => { }}
      />
    )
    props = JSON.parse(screen.getByTestId('Ellipse').getAttribute('data-props') || '{}')
    expect(props.fill).toBe('blue')
  })

  it('renders lines (Arrow/Line)', () => {
    render(
      <CanvasElementRenderer
        element={{
          id: 'l1',
          t: 'line',
          s: 'surface',
          pts: [0, 0, 100, 100],
          stroke: 'green',
          strokeW: 5,
        } as any}
        isSelected={false}
        onChange={() => { }}
        onSelect={() => { }}
      />
    )
    const line = screen.getByTestId('Line')
    expect(line).toBeInTheDocument()

    const props = JSON.parse(line.getAttribute('data-props') || '{}')
    expect(props.stroke).toBe('green')
    expect(props.strokeWidth).toBe(5)
  })

  it('renders table', () => {
    // Setup minimal table
    const tableNode = {
      id: 'tbl1',
      t: 'table',
      s: 'surface',
      x: 0,
      y: 0,
      w: 100,
      h: 40,
      table: {
        rows: [20, 20],
        cols: [50, 50],
        cells: [
          { r: 0, c: 0, v: 'A1', id: 'c1' },
          { r: 0, c: 1, v: 'B1', id: 'c2' },
          { r: 1, c: 0, v: 'A2', id: 'c3' },
          { r: 1, c: 1, v: 'B2', id: 'c4' },
        ],
      },
    } as any

    render(
      <CanvasElementRenderer
        element={tableNode}
        isSelected={false}
        onChange={() => { }}
        onSelect={() => { }}
      />
    )

    // Should render Groups for table/cells
    expect(screen.getAllByTestId('Group').length).toBeGreaterThan(0)

    // Should render Rects (cells)
    expect(screen.getAllByTestId('Rect').length).toBeGreaterThan(0)

    // Should render Texts (content)
    const texts = screen.getAllByTestId('Text')
    expect(texts.length).toBeGreaterThan(0)

    const a1 = texts.find(el => {
      const p = JSON.parse(el.getAttribute('data-props') || '{}')
      return p.text === 'A1'
    })
    expect(a1).toBeTruthy()
  })

  it('renders groups (returns null/empty as default fallback handled by parent)', () => {
    const { container } = render(
      <CanvasElementRenderer
        element={{
          id: 'g1',
          t: 'group',
          s: 'surface',
          x: 0,
          y: 0,
          w: 100,
          h: 100,
          children: ['c1'],
        } as any}
        isSelected={false}
        onChange={() => { }}
        onSelect={() => { }}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
