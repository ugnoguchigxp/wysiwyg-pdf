import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  ArrowDownToLine,
  ArrowUpToLine,
} from 'lucide-react'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { EditableSelect } from '@/components/ui/EditableSelect'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip'
import type { TableNode } from '@/types/canvas'
import { BindingSelector } from './BindingSelector'
import { DEFAULT_FONT_FAMILIES } from '@/features/konva-editor/constants/propertyPanelConfig'

// Helper type for cell properties
type CellProps = TableNode['table']['cells'][number]

interface TablePropertiesProps {
  element: TableNode
  onUpdate: (updates: Partial<TableNode>) => void
  selectedCell?: { row: number; col: number } | null
  i18nOverrides?: Record<string, string>
}

export const TableProperties: React.FC<TablePropertiesProps> = ({
  element,
  onUpdate,
  selectedCell,
  i18nOverrides,
}) => {
  const { t } = useTranslation()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const updateCells = (updates: Partial<CellProps>) => {
    const newCells = [...element.table.cells]

    if (selectedCell) {
      // Update specific cell
      const index = newCells.findIndex(c => c.r === selectedCell.row && c.c === selectedCell.col)
      if (index >= 0) {
        newCells[index] = { ...newCells[index], ...updates }
      } else {
        // Create if missing?
        newCells.push({
          r: selectedCell.row,
          c: selectedCell.col,
          v: '',
          ...updates
        })
      }
    } else {
      // Update all cells (global style)
      const rowCount = element.table.rows.length
      const colCount = element.table.cols.length

      // Respect merged cell spans: do not create/update cells that are covered by another cell's span.
      const covered = Array(rowCount)
        .fill(null)
        .map(() => Array(colCount).fill(false))

      for (const cell of newCells) {
        const rs = cell.rs || 1
        const cs = cell.cs || 1
        if (rs <= 1 && cs <= 1) continue
        for (let rr = 0; rr < rs; rr++) {
          for (let cc = 0; cc < cs; cc++) {
            if (rr === 0 && cc === 0) continue
            const r = cell.r + rr
            const c = cell.c + cc
            if (r >= 0 && r < rowCount && c >= 0 && c < colCount) {
              covered[r][c] = true
            }
          }
        }
      }

      // Materialize missing cells so the global style actually affects the full table.
      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          if (covered[r][c]) continue
          if (!newCells.find(cell => cell.r === r && cell.c === c)) {
            newCells.push({ r, c, v: '' } as CellProps)
          }
        }
      }

      // Apply updates to all non-covered cells (including newly materialized ones)
      for (let i = 0; i < newCells.length; i++) {
        const cell = newCells[i]
        if (!covered[cell.r]?.[cell.c]) {
          newCells[i] = { ...cell, ...updates }
        }
      }
    }

    onUpdate({ table: { ...element.table, cells: newCells } })
  }

  // Get active cell data for UI state
  const isGlobal = !selectedCell
  const defaultCell: Partial<CellProps> = {
    fontSize: 12,
    font: 'Meiryo',
    bg: '#ffffff',
    align: 'l',
    vAlign: 'm',
    color: '#000000',
    borderW: 1,
    borderColor: '#000000',
    border: '#000000',
  }

  let activeData: Partial<CellProps> = defaultCell
  if (selectedCell) {
    const found = element.table.cells.find(c => c.r === selectedCell.row && c.c === selectedCell.col)
    if (found) activeData = found
  } else {
    // Use first cell or defaults
    if (element.table.cells.length > 0) activeData = element.table.cells[0]
  }

  const labelClass = 'block text-[11px] text-theme-text-secondary mb-0.5'
  const headingClass = 'text-[11px] font-medium text-theme-text-secondary mb-1.5'


  const fontSizes = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]
  const borderWidthOptions = [0, 0.5, 1, 1.5, 2, 3, 4]

  return (
    <div className="space-y-4">
      <div>
        <h4 className={headingClass}>
          {isGlobal
            ? resolveText('properties_table_global_style', 'Table Style (All Cells)')
            : resolveText('properties_table_cell_style', 'Cell Style')}
        </h4>

        {isGlobal && (
          <BindingSelector
            label="Repeater Source (Array)"
            binding={element.bind ? { field: element.bind } : undefined}
            onUpdate={(binding) => onUpdate({ bind: binding?.field })}
            i18nOverrides={i18nOverrides}
          />
        )}

        {!isGlobal && selectedCell && (
          <div className="text-[10px] text-blue-500 mb-2">
            {resolveText('properties_table_selected_cell', 'Selected')}: R{selectedCell.row + 1}:C
            {selectedCell.col + 1}
          </div>
        )}

        <div className="space-y-3">
          {/* Font Settings */}
          <div>
            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              <div>
                <label className={labelClass}>{resolveText('properties_font', 'Font')}</label>
                <EditableSelect
                  value={activeData.font || 'Meiryo'}
                  onChange={(val) => updateCells({ font: String(val) })}
                  options={DEFAULT_FONT_FAMILIES}
                  className="w-full"
                />
              </div>
              <div>
                <label className={labelClass}>{resolveText('properties_size', 'Size')}</label>
                <EditableSelect
                  value={activeData.fontSize || 12}
                  onChange={(val) => updateCells({ fontSize: Number(val) })}
                  options={fontSizes}
                  className="w-full"
                />
              </div>
              <div>
                <label className={labelClass}>{resolveText('properties_color', 'Color')}</label>
                <input
                  type="color"
                  className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
                  value={activeData.color || '#000000'}
                  onChange={(e) => updateCells({ color: e.target.value })}
                />
              </div>
            </div>

            {/* Style Buttons (Bold/Italic etc - Not in schema for CellData explicitly? 
                 Schema: `fontSize`, `font`, `align`, `bg`.
                 If schema is strict, we can't do bold/italic in table cells yet.
                 Refactoring plan said "minimal fields".
                 I will skip bold/italic controls for table cells for now or use `font` string (e.g. "Bold 12px Arial").
                 Ill keep alignment and bg.
             */}
          </div>

          {/* Alignment */}
          <div>
            <label className={`${labelClass} font-medium`}>
              {resolveText('properties_align', 'Alignment')}
            </label>
            <div className="flex bg-theme-bg-primary rounded border border-theme-border p-0.5 mb-2">
              <TooltipProvider>
                {/* Left */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => updateCells({ align: 'l' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.align === 'l' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignLeft size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>{resolveText('side_left', 'Left')}</p></TooltipContent>
                </Tooltip>
                {/* Center */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => updateCells({ align: 'c' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.align === 'c' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignCenter size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>{resolveText('center', 'Center')}</p></TooltipContent>
                </Tooltip>
                {/* Right */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => updateCells({ align: 'r' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.align === 'r' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignRight size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>{resolveText('side_right', 'Right')}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Vertical Alignment */}
          <div>
            <label className={`${labelClass} font-medium`}>
              {resolveText('properties_vertical_align', 'Vertical Alignment')}
            </label>
            <div className="flex bg-theme-bg-primary rounded border border-theme-border p-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => updateCells({ vAlign: 't' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.vAlign === 't' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <ArrowUpToLine size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>{resolveText('top', 'Top')}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => updateCells({ vAlign: 'm' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.vAlign === 'm' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignVerticalJustifyCenter size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>{resolveText('middle', 'Middle')}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => updateCells({ vAlign: 'b' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.vAlign === 'b' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <ArrowDownToLine size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>{resolveText('bottom', 'Bottom')}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Background / Border (one row) */}
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className={labelClass}>
                {resolveText('properties_background_color', 'Background Color')}
              </label>
              <input
                type="color"
                className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
                value={activeData.bg || '#ffffff'}
                onChange={(e) => updateCells({ bg: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>{resolveText('properties_border_color', 'Border Color')}</label>
              <input
                type="color"
                className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
                value={activeData.borderColor || activeData.border || '#000000'}
                onChange={(e) => updateCells({ borderColor: e.target.value, border: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>{resolveText('properties_border_width', 'Border Width')}</label>
              <EditableSelect
                value={activeData.borderW ?? (activeData.border ? 1 : 0)}
                onChange={(val) => updateCells({ borderW: Number(val) })}
                options={borderWidthOptions}
                className="w-full"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
