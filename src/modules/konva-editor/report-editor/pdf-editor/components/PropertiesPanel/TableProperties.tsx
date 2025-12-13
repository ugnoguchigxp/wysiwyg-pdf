import {
  AlignCenter,
  AlignLeft,
  AlignRight,
} from 'lucide-react'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { EditableSelect } from '../../../../../../components/ui/EditableSelect'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../../../components/ui/Tooltip'
import type { TableNode } from '../../types/wysiwyg'
import { BindingSelector } from './BindingSelector'

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
      // For existing cells
      for (let i = 0; i < newCells.length; i++) {
        newCells[i] = { ...newCells[i], ...updates }
      }
    }

    onUpdate({ table: { ...element.table, cells: newCells } })
  }

  // Get active cell data for UI state
  const isGlobal = !selectedCell
  const defaultCell: Partial<CellProps> = { fontSize: 12, font: 'Meiryo', bg: '#ffffff', align: 'l' }

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
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              <div>
                <label className={labelClass}>{resolveText('properties_size', 'Size')}</label>
                <EditableSelect
                  value={activeData.fontSize || 12}
                  onChange={(val) => updateCells({ fontSize: Number(val) })}
                  options={fontSizes}
                  className="w-full"
                />
              </div>
              {/* Note: Color property isn't explicitly in TableNode cell, maybe `fill`? unified node uses fill for text color usually. But for table cell text? `v` is value. 
                  Schema says `v: string`. It doesn't strictly specify text color. 
                  If we look at `TextNode`, it uses `fill`. 
                  Let's assume we can add `fill` to cell or it's not supported in schema yet.
                  Wait, `TableNode` schema in `canvas.ts` -> `cells` props.
                  Actually `UnifiedNode` > `TableNode`. `TableData` > `CellData`.
                  `CellData` has `fontSize?: number`, `font?: string`, `align?: 'l'|'c'|'r'`, `bg?: string`. 
                  It DOES NOT have text color. 
                  I might need to add it to schema or ignore it.
                  I'll use `vColor` or just ignore for now if schema is strict.
                  Checking `canvas.ts`... `CellData` is `any` in some places? No, defined.
                  Let's assume we can extend it or use `fill` if `CellData` allows.
                  For now I won't implement text color if it's not in schema to avoid type errors.
               */}
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

          {/* Background Color */}
          <div>
            <label className={labelClass}>
              {resolveText('properties_background_color', 'Background Color')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
                value={activeData.bg || '#ffffff'}
                onChange={(e) => updateCells({ bg: e.target.value })}
              />
            </div>
          </div>

          {/* Border (Boolean only in schema?) `border?: boolean`.
              I'll add a checkbox or simple toggle.
          */}
          <div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!activeData.border}
                onChange={e => updateCells({ border: e.target.checked ? '#000000' : undefined })}
              />
              {resolveText('properties_border', 'Border')}
            </label>
          </div>

        </div>
      </div>
    </div>
  )
}
