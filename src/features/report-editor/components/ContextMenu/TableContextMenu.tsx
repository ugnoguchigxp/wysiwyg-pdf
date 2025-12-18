import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { useI18n } from '@/i18n/I18nContext'

interface TableContextMenuProps {
  visible: boolean
  x: number
  y: number
  onClose: () => void
  onAction: (
    action:
      | 'insertRowAbove'
      | 'insertRowBelow'
      | 'insertColLeft'
      | 'insertColRight'
      | 'deleteRow'
      | 'deleteCol'
      | 'mergeRight'
      | 'mergeDown'
      | 'unmerge'
  ) => void
}

export const TableContextMenu: React.FC<TableContextMenuProps> = ({
  visible,
  x,
  y,
  onClose,
  onAction,
}) => {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  if (!visible) return null

  const itemClass =
    'flex items-center w-full px-3 py-2 text-sm text-left hover:bg-accent text-foreground gap-2 cursor-pointer'

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-popover text-popover-foreground border border-border rounded shadow-lg w-56 py-1"
      style={{ top: y, left: x }}
      onContextMenu={(e) => e.preventDefault()}
      role="menu"
      tabIndex={-1}
    >
      <button type="button" onClick={() => onAction('mergeRight')} className={itemClass}>
        {t('table_ctx_merge_right', 'Merge Right')}
      </button>
      <button type="button" onClick={() => onAction('mergeDown')} className={itemClass}>
        {t('table_ctx_merge_down', 'Merge Down')}
      </button>
      <button type="button" onClick={() => onAction('unmerge')} className={itemClass}>
        {t('table_ctx_unmerge', 'Unmerge')}
      </button>

      <div className="my-1 border-t border-border" />

      <button type="button" onClick={() => onAction('insertRowAbove')} className={itemClass}>
        <ArrowUpToLine className="w-4 h-4" />
        {t('table_ctx_insert_row_above', 'Insert Row Above')}
      </button>
      <button type="button" onClick={() => onAction('insertRowBelow')} className={itemClass}>
        <ArrowDownToLine className="w-4 h-4" />
        {t('table_ctx_insert_row_below', 'Insert Row Below')}
      </button>
      <button
        type="button"
        onClick={() => onAction('deleteRow')}
        className={`${itemClass} text-red-500 hover:text-red-600`}
      >
        <Trash2 className="w-4 h-4" />
        {t('table_ctx_delete_row', 'Delete Row')}
      </button>

      <div className="my-1 border-t border-border" />

      <button type="button" onClick={() => onAction('insertColLeft')} className={itemClass}>
        <ArrowLeftToLine className="w-4 h-4" />
        {t('table_ctx_insert_col_left', 'Insert Column Left')}
      </button>
      <button type="button" onClick={() => onAction('insertColRight')} className={itemClass}>
        <ArrowRightToLine className="w-4 h-4" />
        {t('table_ctx_insert_col_right', 'Insert Column Right')}
      </button>
      <button
        type="button"
        onClick={() => onAction('deleteCol')}
        className={`${itemClass} text-red-500 hover:text-red-600`}
      >
        <Trash2 className="w-4 h-4" />
        {t('table_ctx_delete_col', 'Delete Column')}
      </button>
    </div>
  )
}
