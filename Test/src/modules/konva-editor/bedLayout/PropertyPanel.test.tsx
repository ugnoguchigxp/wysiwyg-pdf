import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../../src/components/ui/Tooltip', () => ({
  TooltipProvider: ({ children }: any) => children,
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('../../../../../src/components/ui/EditableSelect', () => ({
  EditableSelect: ({ value, onChange }: any) => (
    <input
      aria-label="EditableSelect"
      value={value}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
    />
  ),
}))

vi.mock(
  '../../../../../src/modules/konva-editor/report-editor/pdf-editor/utils/textUtils',
  () => ({
    measureText: () => ({ width: 100, height: 20 }),
  })
)

vi.mock(
  '../../../../../src/modules/konva-editor/report-editor/pdf-editor/components/WysiwygCanvas/canvasImageUtils',
  () => ({
    findImageWithExtension: vi.fn(async (src: string) => ({ url: `resolved:${src}` })),
  })
)

vi.mock(
  '../../../../../src/modules/konva-editor/report-editor/pdf-editor/components/PropertiesPanel/ShapeSelector',
  () => ({
    ShapeSelector: ({ onChange }: any) => (
      <button type="button" onClick={() => onChange('dotted')}>
        ShapeSelector
      </button>
    ),
  })
)

import { PropertyPanel } from '../../../../../src/modules/konva-editor/bedLayout/components/PropertyPanel'

describe('bedLayout PropertyPanel', () => {
  it('renders layout properties when no element is selected', () => {
    const onDocumentChange = vi.fn()
    const doc = {
      type: 'bed-layout',
      layout: { width: 100, height: 200 },
      elementOrder: [],
      elementsById: {},
    } as any

    render(
      <PropertyPanel
        selectedElement={null}
        onChange={() => {}}
        onDelete={() => {}}
        document={doc}
        onDocumentChange={onDocumentChange}
      />
    )

    const [widthInput, heightInput] = screen.getAllByRole('spinbutton') as HTMLInputElement[]
    fireEvent.change(widthInput, { target: { value: '150' } })
    expect(onDocumentChange).toHaveBeenCalledWith(expect.objectContaining({ layout: { width: 150, height: 200 } }))

    fireEvent.change(heightInput, { target: { value: '250' } })
    expect(onDocumentChange).toHaveBeenCalledWith(expect.objectContaining({ layout: { width: 100, height: 250 } }))
  })

  it('auto-resizes text on font changes', () => {
    const onChange = vi.fn()
    const selected = {
      id: 't1',
      t: 'text',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      font: 'Meiryo',
      fontSize: 12,
      fontWeight: 400,
      fill: '#000000',
      align: 'l',
      text: 'Hello',
    } as any

    const { container } = render(
      <PropertyPanel selectedElement={selected} onChange={onChange} onDelete={() => {}} />
    )

    const boldButton = container.querySelector('svg.lucide-bold')?.closest('button')
    expect(boldButton).toBeTruthy()
    fireEvent.click(boldButton as HTMLButtonElement)
    expect(onChange).toHaveBeenCalledWith('t1', expect.objectContaining({ fontWeight: 700, w: 110, h: 24 }))

    fireEvent.change(screen.getByLabelText('EditableSelect'), { target: { value: '18' } })
    expect(onChange).toHaveBeenCalledWith('t1', expect.objectContaining({ fontSize: 18, w: 110, h: 24 }))
  })

  it('renders image preview via asset resolver', async () => {
    const selected = { id: 'img1', t: 'image', x: 0, y: 0, w: 10, h: 10, src: 'asset-id' } as any
    render(<PropertyPanel selectedElement={selected} onChange={() => {}} onDelete={() => {}} />)
    expect(await screen.findByAltText('Preview')).toBeInTheDocument()
    expect(screen.getByAltText('Preview')).toHaveAttribute('src', 'resolved:asset-id')
  })

  it('updates line/shape/bed properties via controls', () => {
    const onChange = vi.fn()

    render(
      <PropertyPanel
        selectedElement={{ id: 'l1', t: 'line', stroke: '#000000', strokeW: 2, dash: [] } as any}
        onChange={onChange}
        onDelete={() => {}}
      />
    )
    fireEvent.click(screen.getByText('ShapeSelector'))
    expect(onChange).toHaveBeenCalledWith('l1', expect.objectContaining({ dash: [0.001, 2] }))

    render(
      <PropertyPanel
        selectedElement={{ id: 's1', t: 'shape', fill: '#ffffff', stroke: '#000000', strokeW: 1 } as any}
        onChange={onChange}
        onDelete={() => {}}
      />
    )
    fireEvent.change(screen.getAllByLabelText('Fill Color')[0], { target: { value: '#ff0000' } })
    expect(onChange).toHaveBeenCalledWith('s1', expect.objectContaining({ fill: '#ff0000' }))

    render(
      <PropertyPanel
        selectedElement={{ id: 'bed1', t: 'widget', widget: 'bed', data: { label: 'A', orientation: 'horizontal' } } as any}
        onChange={onChange}
        onDelete={() => {}}
      />
    )
    fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'B' } })
    expect(onChange).toHaveBeenCalledWith('bed1', expect.objectContaining({ data: expect.objectContaining({ label: 'B' }) }))
  })
})
