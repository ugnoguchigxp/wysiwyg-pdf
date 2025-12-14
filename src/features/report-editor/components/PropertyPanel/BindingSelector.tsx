import { Database } from 'lucide-react'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

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
  label = 'Data Binding',
  onOpenModal,
  i18nOverrides,
}) => {
  const { t } = useTranslation()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const displayLabel = label === 'Data Binding' ? resolveText('data_binding', 'Data Binding') : label

  if (!binding) {
    return (
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          className="font-normal"
          onClick={onOpenModal}
          type="button"
        >
          <span>{displayLabel}</span>
        </Button>
      </div>
    )
  }

  // Display logic
  const displayText = binding.field || binding.fieldId || binding.path || ''

  return (
    <div className="mb-4 p-2.5 bg-blue-50/50 border border-blue-100 rounded">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-blue-600" />
          <span className="text-[11px] font-semibold text-blue-900">{displayLabel}</span>
        </div>
      </div>

      <div className="bg-white border border-blue-100 rounded px-2 py-1.5 mb-2">
        <div className="text-sm font-medium text-gray-900 break-all leading-tight">
          {displayText}
        </div>
        {binding.sourceId && (
          <div className="text-[10px] text-gray-500 mt-0.5">
            {resolveText('data_binding_source', 'Source')}: {binding.sourceId}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          className="px-2 py-1 h-6 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          onClick={() => onUpdate(undefined)}
          type="button"
        >
          {resolveText('data_binding_remove', 'Remove')}
        </button>
        {onOpenModal && (
          <button
            className="px-2 py-1 h-6 text-[10px] bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded transition-colors shadow-sm"
            onClick={onOpenModal}
            type="button"
          >
            {resolveText('data_binding_change', 'Change')}
          </button>
        )}
      </div>
    </div>
  )
}
