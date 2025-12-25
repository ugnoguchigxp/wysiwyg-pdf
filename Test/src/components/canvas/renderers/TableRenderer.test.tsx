import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TableRenderer } from '@/components/canvas/renderers/TableRenderer'

const recorded = {
  Group: [] as any[],
  Rect: [] as any[],
  Text: [] as any[],
}

const resetRecorded = () => {
  recorded.Group.length = 0
  recorded.Rect.length = 0
  recorded.Text.length = 0
}

const record = (key: keyof typeof recorded, props: any) => {
  recorded[key].push(props)
}

vi.mock('react-konva', () => ({
  Group: ({ children, ...props }: any) => {
    record('Group', props)
    return <div data-testid="Group">{children}</div>
  },
  Rect: (props: any) => {
    record('Rect', props)
    return <div data-testid="Rect" />
  },
  Text: (props: any) => {
    record('Text', props)
    return <div data-testid="Text" />
  },
}))

describe('components/canvas/renderers/TableRenderer', () => {
  const commonProps = {
    onSelect: vi.fn(),
    onMouseDown: vi.fn(),
    onTap: vi.fn(),
    ref: vi.fn(),
  } as any

  const baseTable = {
    id: 'tbl1',
    t: 'table',
    x: 0,
    y: 0,
    w: 100,
    h: 40,
    table: {
      rows: [20, 20],
      cols: [50, 50],
      cells: [
        { r: 0, c: 0, v: 'A1', rs: 1, cs: 1 },
        { r: 0, c: 1, v: 'B1', rs: 1, cs: 1 },
        { r: 1, c: 0, v: 'A2', rs: 1, cs: 1 },
        { r: 1, c: 1, v: 'B2', rs: 1, cs: 1 },
      ],
    },
  }

  it('renders merged cells only once', () => {
    resetRecorded()
    const table = {
      ...baseTable,
      table: {
        ...baseTable.table,
        cells: [{ r: 0, c: 0, v: 'M', rs: 2, cs: 2 }],
      },
    }

    render(
      <TableRenderer
        element={table as any}
        commonProps={commonProps}
        isSelected={false}
        invScale={1}
        onChange={vi.fn()}
      />
    )

    const renderedTexts = recorded.Text.filter((t) => t.text === 'M')
    expect(renderedTexts).toHaveLength(1)
  })

  it('handles row resize drag end', () => {
    resetRecorded()
    const onChange = vi.fn()

    render(
      <TableRenderer
        element={baseTable as any}
        commonProps={commonProps}
        isSelected
        invScale={1}
        onChange={onChange}
      />
    )

    const rowHandle = recorded.Rect.find((r) => r.draggable && r.width === 100)
    expect(rowHandle).toBeTruthy()

    const target = {
      fill: vi.fn(),
      y: vi.fn(() => 18),
      position: vi.fn(),
    }
    rowHandle.onDragStart({ target })
    rowHandle.onDragEnd({ target, cancelBubble: false })

    expect(target.fill).toHaveBeenCalledWith('transparent')
    expect(onChange).toHaveBeenCalled()
  })

  it('handles column resize drag end', () => {
    resetRecorded()
    const onChange = vi.fn()

    render(
      <TableRenderer
        element={baseTable as any}
        commonProps={commonProps}
        isSelected
        invScale={1}
        onChange={onChange}
      />
    )

    const colHandle = recorded.Rect.find((r) => r.draggable && r.height === 40)
    expect(colHandle).toBeTruthy()

    const target = {
      fill: vi.fn(),
      x: vi.fn(() => 30),
      position: vi.fn(),
    }
    colHandle.onDragStart({ target })
    colHandle.onDragEnd({ target, cancelBubble: false })

    expect(target.fill).toHaveBeenCalledWith('transparent')
    expect(onChange).toHaveBeenCalled()
  })

  it('shows selected cell outline and triggers cell click', () => {
    resetRecorded()
    const onCellClick = vi.fn()

    render(
      <TableRenderer
        element={baseTable as any}
        commonProps={commonProps}
        isSelected
        invScale={1}
        onChange={vi.fn()}
        onCellClick={onCellClick}
        selectedCell={{ row: 0, col: 0 }}
      />
    )

    const selectedOutline = recorded.Rect.find((r) => r.stroke === '#3b82f6' && r.dash)
    expect(selectedOutline).toBeTruthy()

    const cellGroup = recorded.Group.find((g) => typeof g.onClick === 'function')
    cellGroup.onClick({ cancelBubble: false })
    expect(onCellClick).toHaveBeenCalledWith('tbl1', 0, 0)
  })
})
