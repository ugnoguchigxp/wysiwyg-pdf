import { fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'

import { SimpleTreeTable } from '@/components/ui/SimpleTreeTable'

type Row = { id: string; label: string; value: string; children?: Row[] }

const columns: ColumnDef<Row>[] = [
  { id: 'label', accessorKey: 'label', header: 'Label', cell: (info) => info.getValue() as string },
  { id: 'value', accessorKey: 'value', header: 'Value', cell: (info) => info.getValue() as string },
]

describe('components/ui/SimpleTreeTable', () => {
  it('shows empty state when no rows', () => {
    render(<SimpleTreeTable data={[]} columns={columns} />)
    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('expands/collapses rows and calls onRowClick', () => {
    const onRowClick = vi.fn()

    const data: Row[] = [
      {
        id: 'p1',
        label: 'Parent',
        value: 'P',
        children: [{ id: 'c1', label: 'Child', value: 'C' }],
      },
    ]

    render(
      <SimpleTreeTable
        data={data}
        columns={columns}
        onRowClick={onRowClick}
        getRowId={(r) => r.id}
        getSubRows={(r) => r.children}
      />
    )

    // Clicking row triggers onRowClick
    fireEvent.click(screen.getByText('Parent'))
    expect(onRowClick).toHaveBeenCalledWith(data[0])

    // Expand via expander (should not propagate row click)
    onRowClick.mockClear()
    const expander = screen.getAllByRole('button').find((b) => b.querySelector('svg'))
    expect(expander).toBeTruthy()
    fireEvent.click(expander!)

    expect(screen.getByText('Child')).toBeInTheDocument()
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('renders placeholder headers and non-expandable root indentation branch', () => {
    // Mix grouped + ungrouped columns to force placeholder headers.
    const groupedColumns: ColumnDef<Row>[] = [
      { id: 'label', accessorKey: 'label', header: 'Label', cell: (info) => info.getValue() as string },
      {
        header: 'Group',
        columns: [
          { id: 'value', accessorKey: 'value', header: 'Value', cell: (info) => info.getValue() as string },
        ],
      },
    ]

    render(
      <SimpleTreeTable
        data={[{ id: 'r1', label: 'Root', value: 'V' }]}
        columns={groupedColumns}
        getRowId={(r) => r.id}
      />
    )

    // Header should contain both group and leaf headers (with placeholders in between)
    expect(screen.getByText('Group')).toBeInTheDocument()
    expect(screen.getByText('Label')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()

    // Root row without children uses the non-expandable indentation branch
    expect(screen.getByText('Root')).toBeInTheDocument()
  })
})
