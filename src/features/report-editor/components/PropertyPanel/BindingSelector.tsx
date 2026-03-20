import { Database, X } from 'lucide-react'
import type React from 'react'
import { useI18n } from '@/i18n/I18nContext'

export interface BindingInfo {
  field?: string
  // Legacy support or extended info
  sourceId?: string
  fieldId?: string
  path?: string
}

interface BindingSelectorProps {
  binding?: BindingInfo
  onUpdate: (binding: BindingInfo | undefined) => void
  label?: string
  onOpenModal?: () => void
  i18nOverrides?: Record<string, string>
}

export const BindingSelector: React.FC<BindingSelectorProps> = ({
  binding,
  onUpdate,
  label,
  onOpenModal,
  i18nOverrides,
}) => {
  const { t } = useI18n()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const displayLabel = label ?? resolveText('data_binding', 'Data Binding')
  const value = binding?.field || ''

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] text-muted-foreground flex items-center gap-1.5">
          <Database size={14} className="text-blue-500" />
          {displayLabel}
        </label>
        {onOpenModal && (
          <button
            onClick={onOpenModal}
            className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5"
            type="button"
          >
            {resolveText('change', 'Select')}
          </button>
        )}
      </div>

      <div className="relative group">
        <textarea
          value={value}
          onChange={(e) => onUpdate({ ...binding, field: e.target.value, path: e.target.value })}
          placeholder="{Table}.[Field]"
          className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background min-h-[40px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono leading-tight"
          rows={Math.max(1, value.split('\n').length)}
        />
        {value && (
          <button
            onClick={() => onUpdate(undefined)}
            className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
            type="button"
            title={resolveText('remove', 'Remove')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {binding?.sourceId && (
        <div className="text-[10px] text-muted-foreground bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/50 inline-block">
          {resolveText('source', 'Source')}: {binding.sourceId}
        </div>
      )}
    </div>
  )
}
