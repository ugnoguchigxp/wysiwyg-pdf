import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LabelFieldWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/LabelFieldWidget'
import { NumberInputWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/NumberInputWidget'
import { SelectWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/SelectWidget'
import { SliderWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/SliderWidget'
import { PolygonWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/PolygonWidget'
import { CheckboxWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/CheckboxWidget'
import { ImageWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/ImageWidget'

const resolveText = (_key: string, fallback?: string) => fallback || _key

describe('PropertyPanel widgets', () => {
  it('updates label field widget values', () => {
    const onChange = vi.fn()
    render(
      <LabelFieldWidget
        config={{ type: 'label-field', props: { fieldKey: 'name', placeholder: 'Name' } } as any}
        node={{ id: 'n1', t: 'widget', name: 'Bed-01' } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const input = screen.getByPlaceholderText('Name')
    fireEvent.change(input, { target: { value: 'Bed-02' } })

    expect(onChange).toHaveBeenCalledWith({ name: 'Bed-02' })
  })

  it('updates number input widget values and shows unit', () => {
    const onChange = vi.fn()
    render(
      <NumberInputWidget
        config={{ type: 'number-input', props: { fieldKey: 'strokeW', min: 0, max: 10, step: 0.5, unit: 'pt' } } as any}
        node={{ id: 'n1', t: 'shape', strokeW: 2 } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '3.5' } })

    expect(onChange).toHaveBeenCalledWith({ strokeW: 3.5 })
    expect(screen.getByText('pt')).toBeInTheDocument()
  })

  it('handles nested select widget values', () => {
    const onChange = vi.fn()
    render(
      <SelectWidget
        config={{
          type: 'select',
          props: {
            fieldKey: 'data.orientation',
            options: [
              { value: 'horizontal', labelKey: 'horizontal' },
              { value: 'vertical', labelKey: 'vertical' },
            ],
          },
        } as any}
        node={{ id: 'n1', t: 'widget', data: { orientation: 'vertical', other: 'x' } } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'horizontal' } })

    expect(onChange).toHaveBeenCalledWith({
      data: { orientation: 'horizontal', other: 'x' },
    })
  })

  it('renders slider widget with value and updates on change', () => {
    const onChange = vi.fn()
    render(
      <SliderWidget
        config={{ type: 'slider', props: { fieldKey: 'opacity', min: 0, max: 1, step: 0.1, showValue: true } } as any}
        node={{ id: 'n1', t: 'shape', opacity: 0.5 } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    expect(screen.getByText('opacity: 0.5')).toBeInTheDocument()
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '0.8' } })

    expect(onChange).toHaveBeenCalledWith({ opacity: 0.8 })
  })

  it('renders polygon widget for shape nodes only', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <PolygonWidget
        config={{ type: 'polygon', props: { min: 3, max: 10, step: 1 } } as any}
        node={{ id: 'n1', t: 'text' } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    expect(screen.queryByRole('slider')).toBeNull()

    rerender(
      <PolygonWidget
        config={{ type: 'polygon', props: { min: 3, max: 10, step: 1 } } as any}
        node={{ id: 'n2', t: 'shape', sides: 6 } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '7' } })

    expect(onChange).toHaveBeenCalledWith({ sides: 7 })
  })

  it('handles routing checkbox for line nodes', () => {
    const onChange = vi.fn()
    render(
      <CheckboxWidget
        config={{ type: 'checkbox', props: { fieldKey: 'routing' } } as any}
        node={{ id: 'l1', t: 'line', routing: 'orthogonal', pts: [0, 0, 10, 0, 20, 20] } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith({ routing: 'straight', pts: [0, 0, 20, 20] })
  })

  it('applies default frame values when enabling hasFrame', () => {
    const onChange = vi.fn()
    render(
      <CheckboxWidget
        config={{ type: 'checkbox', props: { fieldKey: 'hasFrame' } } as any}
        node={{ id: 't1', t: 'text', hasFrame: false } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith({
      hasFrame: true,
      borderWidth: 0.2,
      borderColor: '#000000',
      backgroundColor: '#FFFFFF',
      padding: 0.5,
    })
  })

  it('sets routing to orthogonal when enabled', () => {
    const onChange = vi.fn()
    render(
      <CheckboxWidget
        config={{ type: 'checkbox', props: { fieldKey: 'routing' } } as any}
        node={{ id: 'l2', t: 'line', routing: 'straight', pts: [0, 0, 10, 10] } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith({ routing: 'orthogonal' })
  })

  it('updates a simple boolean field', () => {
    const onChange = vi.fn()
    render(
      <CheckboxWidget
        config={{ type: 'checkbox', props: { fieldKey: 'locked' } } as any}
        node={{ id: 'n1', t: 'shape', locked: false } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith({ locked: true })
  })

  it('resets routing when points are insufficient', () => {
    const onChange = vi.fn()
    render(
      <CheckboxWidget
        config={{ type: 'checkbox', props: { fieldKey: 'routing' } } as any}
        node={{ id: 'l3', t: 'line', routing: 'orthogonal', pts: [0, 0] } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith({ routing: 'straight' })
  })

  it('shows error state when image source is empty', () => {
    render(
      <ImageWidget
        config={{ type: 'image', props: { showPreview: true } } as any}
        node={{ id: 'img1', t: 'image', src: '' } as any}
        onChange={vi.fn()}
        resolveText={resolveText}
      />
    )

    expect(screen.getByText('No Image')).toBeInTheDocument()
  })

  it('shows preview when image source is data url', async () => {
    render(
      <ImageWidget
        config={{ type: 'image', props: { showPreview: true } } as any}
        node={{ id: 'img2', t: 'image', src: 'data:image/png;base64,abc' } as any}
        onChange={vi.fn()}
        resolveText={resolveText}
      />
    )

    expect(await screen.findByAltText('Preview')).toBeInTheDocument()
  })

  it('uploads image file and updates dimensions', () => {
    const onChange = vi.fn()
    const originalFileReader = global.FileReader
    const originalImage = global.Image

    class MockFileReader {
      onload: ((e: { target: { result: string } }) => void) | null = null
      readAsDataURL() {
        if (this.onload) {
          this.onload({ target: { result: 'data:image/png;base64,abc' } })
        }
      }
    }

    class MockImage {
      width = 200
      height = 100
      onload: (() => void) | null = null
      set src(_value: string) {
        this.onload?.()
      }
    }

    global.FileReader = MockFileReader as any
    global.Image = MockImage as any

    const { container } = render(
      <ImageWidget
        config={{ type: 'image', props: { showUploader: true, showPreview: false } } as any}
        node={{ id: 'img3', t: 'image', src: 'data:image/png;base64,abc' } as any}
        onChange={onChange}
        resolveText={resolveText}
      />
    )

    const fileInput = container.querySelector('input[type=\"file\"]') as HTMLInputElement
    const file = new File(['x'], 'test.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        src: 'data:image/png;base64,abc',
      })
    )

    global.FileReader = originalFileReader
    global.Image = originalImage
  })
})
