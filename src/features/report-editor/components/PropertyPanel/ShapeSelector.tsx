import type React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useI18n } from '@/i18n/I18nContext'

export interface ShapeOption {
  value: string
  label: string
  icon: React.ReactNode
}

interface ShapeSelectorProps {
  value: string
  onChange: (value: string) => void
  options: ShapeOption[]
  className?: string
  placeholder?: string
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({
  value,
  onChange,
  options,
  className = '',
  placeholder,
}) => {
  const { t } = useI18n()
  const effectivePlaceholder = placeholder ?? t('select_placeholder', 'Select...')

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`w-full ${className}`}
        style={{
          minHeight: '32px',
          height: '32px',
          padding: '4px 8px',
          fontSize: '11px',
        }}
      >
        <SelectValue placeholder={effectivePlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            style={{
              minHeight: '32px',
              padding: '6px 8px 6px 32px', // Adjust padding for checkmark
              fontSize: '12px',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-4 h-4 text-theme-text-primary">
                {option.icon}
              </span>
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
