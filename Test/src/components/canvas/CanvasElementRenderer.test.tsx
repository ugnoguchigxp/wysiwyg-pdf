import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const findImageWithExtensionSpy = vi.fn()

vi.mock('react-konva', () => ({
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
  Star: (props: any) => <div data-testid="Star" data-props={JSON.stringify(props)} />,
  Text: (props: any) => <div data-testid="Text" data-props={JSON.stringify(props)} />,
}))

vi.mock('../../../../src/modules/konva-editor/report-editor/pdf-editor/components/WysiwygCanvas/canvasImageUtils', () => ({
  findImageWithExtension: (...args: any[]) => findImageWithExtensionSpy(...args),
}))

import { CanvasElementRenderer } from '../../../../src/components/canvas/CanvasElementRenderer'

describe('components/canvas/CanvasElementRenderer', () => {
  it('returns custom renderer result when provided', () => {
    render(
      <CanvasElementRenderer
        element={{ id: 'n', t: 'text', s: 's', x: 0, y: 0, w: 1, h: 1, text: 'x' } as any}
        isSelected={false}
        onSelect={() => {}}
        onChange={() => {}}
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
        onSelect={() => {}}
        onChange={() => {}}
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
        onSelect={() => {}}
        onChange={() => {}}
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
        onSelect={() => {}}
        onChange={() => {}}
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
        onSelect={() => {}}
        onChange={() => {}}
      />
    )

    // 1 transparent Rect + 2 stroke lines
    expect(screen.getAllByTestId('Line')).toHaveLength(2)
    expect(screen.getByTestId('Rect')).toBeInTheDocument()
  })
})

