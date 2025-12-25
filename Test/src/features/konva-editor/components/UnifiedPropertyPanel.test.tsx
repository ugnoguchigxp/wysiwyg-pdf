// @ts-nocheck
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UnifiedPropertyPanel } from '@/features/konva-editor/components/PropertyPanel/UnifiedPropertyPanel'
import type { PropertyPanelConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { TextNode, UnifiedNode } from '@/types/canvas'

vi.mock('@/i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}))

vi.mock('@/features/konva-editor/utils/textUtils', () => ({
  measureText: vi.fn(() => ({ width: 50, height: 10 })),
}))

describe('UnifiedPropertyPanel', () => {
  const baseConfig: PropertyPanelConfig = {
    editorType: 'bedLayout',
    layout: { width: 240, padding: 8, sectionGap: 8 },
    defaultSections: [
      {
        id: 'common-delete',
        labelKey: 'delete-section',
        widgets: [
          {
            type: 'custom',
            props: { renderKey: 'deleteButton' },
          },
        ],
      },
    ],
    objects: [
      {
        objectType: 'text',
        header: { labelKey: 'text-header' },
        sections: [
          {
            id: 'text-style',
            labelKey: 'Text',
            collapsible: true,
            defaultCollapsed: true,
            widgets: [
              {
                type: 'custom',
                props: { renderKey: 'customWidget' },
              },
            ],
          },
        ],
      },
      {
        objectType: 'shape',
        header: { labelKey: 'shape-header' },
        sections: [
          {
            id: 'shape-section',
            labelKey: 'Shape',
            widgets: [
              {
                type: 'custom',
                props: { renderKey: 'shapeWidget' },
              },
            ],
          },
        ],
      },
    ],
  }

  const customRenderers = (onTrigger: (updates: Partial<UnifiedNode>) => void, onDelete?: (id: string) => void) => ({
    customWidget: ({ onChange }: any) => (
      <button type="button" onClick={() => onChange({ fontSize: 10 })}>
        apply-font
      </button>
    ),
    shapeWidget: ({ onChange }: any) => (
      <button type="button" onClick={() => onChange({ x: 5 })}>
        move
      </button>
    ),
    deleteButton: ({ node }: any) =>
      onDelete ? (
        <button type="button" onClick={() => onDelete(node.id)}>
          delete-me
        </button>
      ) : null,
  })

  it('renders sections and toggles collapse', () => {
    const onChange = vi.fn()

    render(
      <UnifiedPropertyPanel
        config={baseConfig}
        selectedNode={{ id: 't1', t: 'text', text: 'Hello', fontSize: 8 } as TextNode}
        onChange={onChange}
        customRenderers={customRenderers(onChange)}
      />
    )

    // Section is collapsed by default; clicking header expands it
    const header = screen.getByText('Text')
    fireEvent.click(header)
    expect(screen.getByText('apply-font')).toBeInTheDocument()
  })

  it('reflows text nodes when font-related updates are applied', () => {
    const onChange = vi.fn()

    render(
      <UnifiedPropertyPanel
        config={baseConfig}
        selectedNode={{
          id: 't1',
          t: 'text',
          text: 'Hello',
          font: 'Meiryo',
          fontSize: 8,
          fontWeight: 400,
          w: 10,
          h: 10,
        } as TextNode}
        onChange={onChange}
        customRenderers={customRenderers(onChange)}
      />
    )

    fireEvent.click(screen.getByText('Text'))
    fireEvent.click(screen.getByText('apply-font'))

    expect(onChange).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        fontSize: 10,
        w: expect.any(Number),
        h: expect.any(Number),
      }),
      undefined
    )
  })

  it('passes updates through for non-text nodes without reflow', () => {
    const onChange = vi.fn()

    render(
      <UnifiedPropertyPanel
        config={baseConfig}
        selectedNode={{ id: 's1', t: 'shape', shape: 'rect', x: 0, y: 0 } as UnifiedNode}
        onChange={onChange}
        customRenderers={customRenderers(onChange)}
      />
    )

    fireEvent.click(screen.getByText('move'))

    expect(onChange).toHaveBeenCalledWith('s1', expect.objectContaining({ x: 5 }), undefined)
  })

  it('renders delete custom renderer when provided', () => {
    const onChange = vi.fn()
    const onDelete = vi.fn()

    render(
      <UnifiedPropertyPanel
        config={baseConfig}
        selectedNode={{ id: 's1', t: 'shape', shape: 'rect', x: 0, y: 0 } as UnifiedNode}
        onChange={onChange}
        onDelete={onDelete}
        customRenderers={customRenderers(onChange, onDelete)}
      />
    )

    fireEvent.click(screen.getByText('delete-me'))
    expect(onDelete).toHaveBeenCalledWith('s1')
  })

  it('renders empty state when no node and emptyStateContent is provided', () => {
    const onChange = vi.fn()
    const empty = <div data-testid="empty-state">empty</div>
    render(
      <UnifiedPropertyPanel
        config={baseConfig}
        selectedNode={null}
        onChange={onChange}
        emptyStateContent={empty}
      />
    )

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})
