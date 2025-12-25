import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Doc, TextNode, SignatureNode } from '@/types/canvas'
import { ptToMm } from '@/utils/units'

vi.mock('@/features/konva-editor/utils/textUtils', () => ({
  measureText: () => ({ width: 50, height: 10 }),
  calculateTextDimensions: () => ({ w: 12, h: 8 }),
}))

vi.mock('@/features/konva-editor/utils/canvasImageUtils', () => ({
  findImageWithExtension: vi.fn(async () => ({ url: 'x', img: {} })),
}))

// Make Radix Select test-friendly (native select)
vi.mock('@/components/ui/Select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <select
      aria-label="select"
      value={value}
      onChange={(e) => onValueChange?.((e.target as HTMLSelectElement).value)}
    >
      {children}
    </select>
  ),
  SelectGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectLabel: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
  SelectSeparator: () => null,
}))

vi.mock('@/components/ui/Tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { WysiwygPropertiesPanel } from '@/features/report-editor/components/PropertyPanel/WysiwygPropertiesPanel'

describe('WysiwygPropertiesPanel', () => {
  it('updates text element and recalculates size on font size change', () => {
    const onTemplateChange = vi.fn()
    const doc: Doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'mm',
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100 }],
      nodes: [
        {
          id: 't1',
          t: 'text',
          s: 'p1',
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          text: 'Hello',
          fontSize: ptToMm(12),
          fill: '#000000',
        } as TextNode,
      ],
    }

    render(
      <WysiwygPropertiesPanel
        templateDoc={doc}
        selectedElementId="t1"
        currentPageId="p1"
        onTemplateChange={onTemplateChange}
      />
    )

    // Find the numeric size <select> (font family select has string options like "Meiryo")
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    const sizeSelect = selects.find((sel) =>
      Array.from(sel.options).some((opt) => opt.value === '14')
    )
    expect(sizeSelect).toBeTruthy()

    fireEvent.change(sizeSelect!, { target: { value: '14' } })
    expect(onTemplateChange).toHaveBeenCalled()
    const next = onTemplateChange.mock.calls.at(-1)?.[0] as Doc
    const updated = next.nodes.find((n: { id: string }) => n.id === 't1') as TextNode
    expect(updated.fontSize).toBe(ptToMm(14))
    // Font size change should recalculate element size
    expect(updated.w).toBeGreaterThan(10)
    expect(updated.h).toBeGreaterThan(0)
  })

  it('renders signature panel and finish button when activeTool=signature and no selection', () => {
    const onToolSelect = vi.fn()
    const onDrawingSettingsChange = vi.fn()
    render(
      <WysiwygPropertiesPanel
        templateDoc={{
          v: 1,
          id: 'd',
          title: 't',
          unit: 'mm',
          surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100 }],
          nodes: [{ id: 'sig', t: 'signature', s: 'p1', x: 0, y: 0, w: 10, h: 10, strokes: [], stroke: '#000', strokeW: 1 } as SignatureNode],
        } as Doc}
        selectedElementId={null}
        onTemplateChange={() => { }}
        currentPageId="p1"
        activeTool="signature"
        onToolSelect={onToolSelect}
        drawingSettings={{ stroke: '#000000', strokeWidth: 2, tolerance: 2.0 }}
        onDrawingSettingsChange={onDrawingSettingsChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'properties_finish_drawing' }))
    expect(onToolSelect).toHaveBeenCalledWith('select')
  })

  it('updates canvas background and grid settings when no selection', () => {
    const onTemplateChange = vi.fn()
    const onShowGridChange = vi.fn()
    const onGridSizeChange = vi.fn()
    const onSnapStrengthChange = vi.fn()

    const doc: Doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'mm',
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100, bg: '#ffffff' }],
      nodes: [],
    }

    render(
      <WysiwygPropertiesPanel
        templateDoc={doc}
        selectedElementId={null}
        onTemplateChange={onTemplateChange}
        currentPageId="p1"
        showGrid={true}
        onShowGridChange={onShowGridChange}
        gridSize={13}
        onGridSizeChange={onGridSizeChange}
        snapStrength={0}
        onSnapStrengthChange={onSnapStrengthChange}
      />
    )

    const colorInput = screen.getByDisplayValue('#ffffff')
    fireEvent.change(colorInput, { target: { value: '#ff0000' } })
    expect(onTemplateChange).toHaveBeenCalled()

    const imageInput = screen.getByPlaceholderText('properties_image_url_placeholder')
    fireEvent.change(imageInput, { target: { value: 'http://example.com/bg.png' } })
    expect(onTemplateChange).toHaveBeenCalled()

    const [gridToggle, snapToggle] = screen.getAllByRole('checkbox')
    fireEvent.click(gridToggle)
    expect(onShowGridChange).toHaveBeenCalledWith(false)

    const gridSelect = screen.getByRole('combobox')
    fireEvent.change(gridSelect, { target: { value: '21' } })
    expect(onGridSizeChange).toHaveBeenCalledWith(21)

    fireEvent.click(snapToggle)
    expect(onSnapStrengthChange).toHaveBeenCalledWith(13)
  })

  it('updates signature drawing settings', () => {
    const onToolSelect = vi.fn()
    const onDrawingSettingsChange = vi.fn()
    render(
      <WysiwygPropertiesPanel
        templateDoc={{
          v: 1,
          id: 'd',
          title: 't',
          unit: 'mm',
          surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100 }],
          nodes: [],
        } as Doc}
        selectedElementId={null}
        onTemplateChange={() => {}}
        currentPageId="p1"
        activeTool="signature"
        onToolSelect={onToolSelect}
        drawingSettings={{ stroke: '#000000', strokeWidth: 2, simplification: 0 }}
        onDrawingSettingsChange={onDrawingSettingsChange}
      />
    )

    const colorInput = screen.getByDisplayValue('#000000')
    fireEvent.change(colorInput, { target: { value: '#123456' } })

    const thicknessInput = screen.getByDisplayValue('2')
    fireEvent.change(thicknessInput, { target: { value: '2.2' } })

    const simplificationSlider = screen.getByRole('slider')
    fireEvent.change(simplificationSlider, { target: { value: '1.5' } })

    expect(onDrawingSettingsChange).toHaveBeenCalled()
  })
})
