import type React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'

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
}

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({
  value,
  onChange,
  options,
  className = '',
}) => {
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
        <SelectValue placeholder="Select..." />
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
