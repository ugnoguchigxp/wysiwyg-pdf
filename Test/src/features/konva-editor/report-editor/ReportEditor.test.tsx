import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const konvaMockState = vi.hoisted(() => ({ selectedId: 'none', selectedCell: 'none' }))

vi.mock(
  '@/features/report-editor/components/Toolbar/WysiwygEditorToolbar',
  () => ({
    WysiwygEditorToolbar: (props: any) => (
      <div>
        <div data-testid="toolbar-zoom">{props.zoom}</div>
        <div data-testid="toolbar-active-tool">{props.activeTool}</div>
        <button type="button" onClick={() => props.onZoomChange(150)}>
          zoom150
        </button>
        <button type="button" onClick={() => props.onToolSelect('text')}>
          tool-text
        </button>
      </div>
    ),
  })
)

vi.mock('@/features/report-editor/ReportKonvaEditor', async () => {
  const React = (await import('react')).default
  return {
    ReportKonvaEditor: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ downloadImage: vi.fn() }))
      React.useEffect(() => {
        konvaMockState.selectedId = props.selectedElementId ?? 'none'
      })
      return (
        <div>
          <div data-testid="konva-selected">{props.selectedElementId ?? 'none'}</div>
          <button type="button" onClick={() => props.onElementSelect({ id: 'el1' })}>
            select-el1
          </button>
          <button type="button" onClick={() => props.onSelectedCellChange?.({ elementId: 'el1', row: 1, col: 2 })}>
            select-cell
          </button>
        </div>
      )
    }),
  }
})

vi.mock(
  '@/features/report-editor/components/PropertyPanel/WysiwygPropertiesPanel',
  () => ({
    WysiwygPropertiesPanel: (props: any) => {
      konvaMockState.selectedCell = props.selectedCell ? 'set' : 'none'
      return (
        <div>
          <div data-testid="props-selected">{props.selectedElementId ?? 'none'}</div>
          <div data-testid="props-cell">{props.selectedCell ? 'set' : 'none'}</div>
        </div>
      )
    },
  })
)

import { ReportEditor } from '@/features/report-editor/ReportEditor'

describe('ReportEditor', () => {
  it('wires toolbar, editor, and properties; clears selection on tool switch', () => {
    const onTemplateChange = vi.fn()
    const templateDoc = {
      v: 1,
      id: 'doc',
      title: 't',
      unit: 'pt',
      surfaces: [{ id: 'p1', type: 'page', w: 100, h: 100 }],
      nodes: [],
    } as any

    render(<ReportEditor templateDoc={templateDoc} onTemplateChange={onTemplateChange} />)

    expect(screen.getByTestId('toolbar-zoom').textContent).toBe('100')
    fireEvent.click(screen.getByText('zoom150'))
    expect(screen.getByTestId('toolbar-zoom').textContent).toBe('150')

    fireEvent.click(screen.getByText('select-el1'))
    expect(screen.getByTestId('konva-selected').textContent).toBe('el1')
    expect(screen.getByTestId('props-selected').textContent).toBe('el1')

    fireEvent.click(screen.getByText('select-cell'))
    expect(screen.getByTestId('props-cell').textContent).toBe('set')

    fireEvent.click(screen.getByText('tool-text'))
    expect(screen.getByTestId('konva-selected').textContent).toBe('none')
    expect(screen.getByTestId('props-selected').textContent).toBe('none')
    expect(screen.getByTestId('props-cell').textContent).toBe('none')
  })
})
