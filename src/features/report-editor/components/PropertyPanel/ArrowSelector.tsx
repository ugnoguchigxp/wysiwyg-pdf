/**
 * Arrow Selector Component
 * Dropdown selector for line arrow types
 */

import type React from 'react'
import { useId } from 'react'
import type { ArrowType } from '@/types/canvas'

interface IArrowSelectorProps {
  value: ArrowType
  onChange: (value: ArrowType) => void
  label: string
}

const arrowTypes: { value: ArrowType; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'standard', label: '標準矢印' },
  { value: 'filled', label: '塗りつぶし矢印' },
  { value: 'triangle', label: '三角矢印' },
  { value: 'open', label: '開いた矢印' },
  { value: 'circle', label: '円' },
  { value: 'diamond', label: 'ひし形' },
  { value: 'square', label: '四角' },
]

export const ArrowSelector: React.FC<IArrowSelectorProps> = ({ value, onChange, label }) => {
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
        {arrowTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  )
}
