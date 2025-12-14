import {
  type ColumnDef,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/utils'

interface SimpleTreeTableProps<TData, TValue = unknown> {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
  onRowClick?: (row: TData) => void
  className?: string
  getRowId?: (row: TData) => string
  getSubRows?: (row: TData) => TData[] | undefined
}

export const SimpleTreeTable = <TData, TValue = unknown>({
  data,
  columns,
  onRowClick,
  className,
  getRowId,
  getSubRows,
}: SimpleTreeTableProps<TData, TValue>) => {
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <div
      className={cn(
        'w-full border border-theme-border rounded-md overflow-hidden bg-white',
        className
      )}
    >
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-theme-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-2 font-normal">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-theme-border last:border-0 hover:bg-gray-50 transition-colors',
                  onRowClick ? 'cursor-pointer' : ''
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 align-middle">
                    {/* Add expander for the first column if row can expand */}
                    {cell.column.id === 'label' && row.getCanExpand() ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            row.toggleExpanded()
                          }}
                          className="p-0.5 rounded hover:bg-gray-200"
                        >
                          <ChevronRight
                            size={14}
                            className={cn(
                              'transition-transform',
                              row.getIsExpanded() ? 'rotate-90' : ''
                            )}
                          />
                        </button>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ) : cell.column.id === 'label' ? (
                      // Indent for non-expandable children to align with expandable parents?
                      // Simple indentation based on depth
                      <div
                        style={{
                          paddingLeft: row.depth > 0 ? `${row.depth * 1.5}rem` : '1.25rem',
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      {table.getRowModel().rows.length === 0 && (
        <div className="p-4 text-center text-gray-400">No data found</div>
      )}
    </div>
  )
}
