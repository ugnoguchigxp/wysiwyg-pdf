import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Doc, TextNode, SignatureNode } from '../../../../../../../../src/types/canvas'

vi.mock('../../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/utils/textUtils', () => ({
  measureText: () => ({ width: 50, height: 10 }),
}))

vi.mock('../../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/components/WysiwygCanvas/canvasImageUtils', () => ({
  findImageWithExtension: vi.fn(async () => ({ url: 'x', img: {} })),
}))

// Make Radix Select test-friendly (native select)
vi.mock('../../../../../../../../src/components/ui/Select', () => ({
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

vi.mock('../../../../../../../../src/components/ui/Tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { WysiwygPropertiesPanel } from '../../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/components/PropertiesPanel/WysiwygPropertiesPanel'

describe('WysiwygPropertiesPanel', () => {
  it('updates text element and recalculates size on font size change', () => {
    const onTemplateChange = vi.fn()
    const doc: Doc = {
      v: 1,
      id: 'd',
      title: 't',
      unit: 'pt',
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100 }],
      nodes: [
        { id: 't1', t: 'text', s: 'p1', x: 0, y: 0, w: 10, h: 10, text: 'Hello', fontSize: 12, fill: '#000000' } as TextNode,
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

    // The first select in text props is font size
    fireEvent.change(screen.getByLabelText('select'), { target: { value: '14' } })
    expect(onTemplateChange).toHaveBeenCalled()
    const next = onTemplateChange.mock.calls.at(-1)?.[0] as Doc
    const updated = next.nodes.find((n) => n.id === 't1') as TextNode
    expect(updated.fontSize).toBe(14)
    // width/height derived from mocked measureText + padding
    expect(updated.w).toBe(60)
    expect(updated.h).toBe(14)
  })

  it('renders signature panel and finish button when activeTool=signature and no selection', () => {
    const onToolSelect = vi.fn()
    render(
      <WysiwygPropertiesPanel
        templateDoc={{
          v: 1,
          id: 'd',
          title: 't',
          unit: 'pt',
          surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100 }],
          nodes: [{ id: 'sig', t: 'signature', s: 'p1', x: 0, y: 0, w: 10, h: 10, strokes: [], stroke: '#000', strokeW: 1 } as SignatureNode],
        } as Doc}
        selectedElementId={null}
        onTemplateChange={() => { }}
        currentPageId="p1"
        activeTool="signature"
        onToolSelect={onToolSelect}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Finish Drawing' }))
    expect(onToolSelect).toHaveBeenCalledWith('select')
  })
})
