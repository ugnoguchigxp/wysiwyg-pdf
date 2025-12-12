import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Bold,
  Italic,
  Strikethrough,
  Underline,
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
import type { ITableElement } from '../../types/wysiwyg'
import { BindingSelector } from './BindingSelector'

type TableCellStyles = ITableElement['cells'][number]['styles']

const applyStyleUpdates = (
  styles: TableCellStyles,
  updates: Partial<TableCellStyles>
): TableCellStyles => {
  const nextStyles: TableCellStyles = { ...styles }

  const setStyleProp = <K extends keyof TableCellStyles>(key: K, value: TableCellStyles[K]) => {
    nextStyles[key] = value
  }

  if (updates.font) {
    nextStyles.font = { ...(styles.font || {}), ...updates.font }
  }

  ;(Object.keys(updates) as Array<keyof TableCellStyles>).forEach((key) => {
    if (key === 'font') return
    const value = updates[key]
    if (value !== undefined) {
      setStyleProp(key, value)
    }
  })

  return nextStyles
}

interface TablePropertiesProps {
  element: ITableElement
  onUpdate: (updates: Partial<ITableElement>) => void
  // We need to know which cell is selected to insert properly
  // Since we don't have separate selection state in the panel (yet),
  // we might need to rely on the user selecting a cell via editing interaction
  // OR add a "selectedCell" concept to the Properties Panel.
  // For now, let's implement basic "Append" and "Remove Last" if no selection,
  // or simple index inputs.
  // Better: We receive the editingCell from parent if available.
  selectedCell?: { row: number; col: number } | null
}

export const TableProperties: React.FC<TablePropertiesProps> = ({
  element,
  onUpdate,
  selectedCell,
}) => {
  const { t } = useTranslation()

  const updateCurrentCell = (updates: Partial<TableCellStyles>) => {
    if (!selectedCell) return

    const cellIndex = element.cells.findIndex(
      (c) => c.row === selectedCell.row && c.col === selectedCell.col
    )

    let newCells
    if (cellIndex >= 0) {
      newCells = [...element.cells]
      const oldStyles = newCells[cellIndex].styles || ({} as TableCellStyles)
      const newStyles = applyStyleUpdates(oldStyles, updates)

      newCells[cellIndex] = {
        ...newCells[cellIndex],
        styles: newStyles,
      }
    } else {
      newCells = [
        ...element.cells,
        {
          row: selectedCell.row,
          col: selectedCell.col,
          content: '',
          styles: { ...updates },
        },
      ]
    }
    onUpdate({ cells: newCells })
  }

  const updateAllCells = (updates: Partial<TableCellStyles>) => {
    const newCells = element.cells.map((cell) => {
      const oldStyles = cell.styles || {}
      const newStyles = applyStyleUpdates(oldStyles, updates)
      return { ...cell, styles: newStyles }
    })
    onUpdate({ cells: newCells })
  }

  const currentCellData = selectedCell
    ? element.cells.find((c) => c.row === selectedCell.row && c.col === selectedCell.col) || {
        row: selectedCell.row,
        col: selectedCell.col,
        content: '',
        styles: {},
      }
    : null

  // Use first cell as default for global controls or fallback
  const firstCell = element.cells[0] || {}
  const firstCellStyles = firstCell.styles || {}
  // Ensure we have a valid font object with defaults if missing
  const defaultFont = { family: 'Meiryo', size: 11, weight: 400, color: '#000000' }

  const isGlobal = !selectedCell
  const activeData = isGlobal ? { styles: firstCellStyles } : currentCellData!
  // Safe font access
  const activeFont = (activeData.styles?.font || defaultFont) as typeof defaultFont & {
    italic?: boolean
    underline?: boolean
    strikethrough?: boolean
  }

  const handleUpdate = (updates: Partial<TableCellStyles>) => {
    if (isGlobal) {
      updateAllCells(updates)
    } else {
      updateCurrentCell(updates)
    }
  }

  const handleFontUpdate = (fontUpdates: Partial<TableCellStyles['font']>) => {
    handleUpdate({ font: { ...activeFont, ...fontUpdates } })
  }

  const labelClass = 'block text-[11px] text-theme-text-secondary mb-0.5'
  const headingClass = 'text-[11px] font-medium text-theme-text-secondary mb-1.5'
  const inputClass =
    'w-full px-1.5 py-1 border border-theme-border rounded text-[11px] bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent'

  const fontSizes = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]

  return (
    <div className="space-y-4">
      <div>
        <h4 className={headingClass}>
          {isGlobal
            ? t('properties_table_global_style', 'Table Style (All Cells)')
            : t('properties_table_cell_style', 'Cell Style')}
        </h4>

        {isGlobal && (
          <BindingSelector
            label="Repeater Source (Array)"
            binding={element.binding}
            onUpdate={(binding) => onUpdate({ binding })}
          />
        )}

        {!isGlobal && selectedCell && (
          <div className="text-[10px] text-blue-500 mb-2">
            {t('properties_table_selected_cell', 'Selected')}: R{selectedCell.row + 1}:C
            {selectedCell.col + 1}
          </div>
        )}

        <div className="space-y-3">
          {/* Font Settings */}
          <div>
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              <div>
                <label className={labelClass}>{t('properties_size', 'Size')}</label>
                <EditableSelect
                  value={activeFont.size}
                  onChange={(val) => handleFontUpdate({ size: Number(val) })}
                  options={fontSizes}
                  className="w-full"
                />
              </div>
              <div>
                <label className={labelClass}>{t('color', 'Color')}</label>
                <input
                  type="color"
                  className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
                  value={activeFont.color || '#000000'}
                  onChange={(e) => handleFontUpdate({ color: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-1 mb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() =>
                        handleFontUpdate({ weight: activeFont.weight === 700 ? 400 : 700 })
                      }
                      className={`p-1 rounded border ${
                        activeFont.weight === 700
                          ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                          : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                      }`}
                    >
                      <Bold size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('properties_font_style_bold')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleFontUpdate({ italic: !activeFont.italic })}
                      className={`p-1 rounded border ${
                        activeFont.italic
                          ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                          : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                      }`}
                    >
                      <Italic size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('properties_font_style_italic')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleFontUpdate({ underline: !activeFont.underline })}
                      className={`p-1 rounded border ${
                        activeFont.underline
                          ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                          : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                      }`}
                    >
                      <Underline size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('properties_font_style_underline')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleFontUpdate({ strikethrough: !activeFont.strikethrough })}
                      className={`p-1 rounded border ${
                        activeFont.strikethrough
                          ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                          : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                      }`}
                    >
                      <Strikethrough size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('properties_font_style_strikethrough')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className={`${labelClass} font-medium`}>
              {t('properties_align', 'Alignment')}
            </label>
            <div className="flex bg-theme-bg-primary rounded border border-theme-border p-0.5 mb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleUpdate({ align: 'left' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.styles?.align === 'left' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignLeft size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('side_left')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleUpdate({ align: 'center' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.styles?.align === 'center' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignCenter size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('center')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleUpdate({ align: 'right' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.styles?.align === 'right' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignRight size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('side_right')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Vertical Align */}
          <div>
            <label className={`${labelClass} font-medium`}>
              {t('properties_vertical_align', 'Vertical Align')}
            </label>
            <div className="flex bg-theme-bg-primary rounded border border-theme-border p-0.5 mb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleUpdate({ verticalAlign: 'top' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.styles?.verticalAlign === 'top' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignVerticalJustifyStart size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('side_top')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleUpdate({ verticalAlign: 'middle' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.styles?.verticalAlign === 'middle' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignVerticalJustifyCenter size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('center')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleUpdate({ verticalAlign: 'bottom' })}
                      className={`flex-1 flex items-center justify-center py-1 rounded ${activeData.styles?.verticalAlign === 'bottom' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                    >
                      <AlignVerticalJustifyEnd size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('side_bottom')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className={labelClass}>
              {t('properties_background_color', 'Background Color')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
                value={activeData.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
              />
            </div>
          </div>

          {/* Border Width */}
          <div>
            <label className={labelClass}>{t('properties_border_width', 'Border Width')}</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={activeData.styles?.borderWidth ?? 1}
              onChange={(e) => handleUpdate({ borderWidth: Number(e.target.value) })}
            />
          </div>

          {/* Border Color */}
          <div>
            <label className={labelClass}>{t('properties_border_color', 'Border Color')}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
                value={activeData.styles?.borderColor || '#000000'}
                onChange={(e) => handleUpdate({ borderColor: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
