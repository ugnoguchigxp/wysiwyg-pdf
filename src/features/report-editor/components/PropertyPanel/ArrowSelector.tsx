/**
 * Arrow Selector Component
 * Dropdown selector for line arrow types
 */

import type React from 'react'
import { useId } from 'react'
import { useI18n } from '@/i18n/I18nContext'
import type { ArrowType } from '@/types/canvas'

interface IArrowSelectorProps {
  value: ArrowType
  onChange: (value: ArrowType) => void
  label: string
}

const arrowTypeOptions: { value: ArrowType; labelKey: string; fallback: string }[] = [
  { value: 'none', labelKey: 'properties_arrow_none', fallback: 'None' },
  { value: 'standard', labelKey: 'properties_arrow_standard', fallback: 'Standard' },
  { value: 'filled', labelKey: 'properties_arrow_filled', fallback: 'Filled' },
  { value: 'triangle', labelKey: 'properties_arrow_triangle', fallback: 'Triangle' },
  { value: 'open', labelKey: 'properties_arrow_open', fallback: 'Open' },
  { value: 'circle', labelKey: 'properties_arrow_circle', fallback: 'Circle' },
  { value: 'diamond', labelKey: 'properties_arrow_diamond', fallback: 'Diamond' },
  { value: 'square', labelKey: 'properties_arrow_square', fallback: 'Square' },
]

export const ArrowSelector: React.FC<IArrowSelectorProps> = ({ value, onChange, label }) => {
  const { t } = useI18n()
  const selectId = useId()
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700" htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value as ArrowType)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {arrowTypeOptions.map((type) => (
          <option key={type.value} value={type.value}>
            {t(type.labelKey, type.fallback)}
          </option>
        ))}
      </select>
    </div>
  )
}
