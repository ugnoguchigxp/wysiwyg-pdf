import type React from 'react'
import type { SelectWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { UnifiedNode } from '@/types/canvas'
import { WidgetLabel, WidgetSelect } from '../shared'
import type { WidgetProps } from './types'

export const SelectWidget: React.FC<WidgetProps<SelectWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const { fieldKey, options } = config.props

  const labelKey =
    config.labelKey ?? (fieldKey === 'strokeW' ? 'properties_stroke_width' : fieldKey)
  const fallbackLabel = fieldKey === 'strokeW' ? 'StrokeWidth' : fieldKey

  // Handle nested field keys like 'data.orientation'
  const getValue = (): string => {
    const keys = fieldKey.split('.')
    let value: unknown = node
    for (const key of keys) {
      value = (value as Record<string, unknown>)?.[key]
    }
    return (value as string) ?? options[0]?.value ?? ''
  }

  const setValue = (newValue: string) => {
    const keys = fieldKey.split('.')
    if (keys.length === 1) {
      onChange({ [fieldKey]: newValue } as unknown as Partial<UnifiedNode>)
    } else {
      // Handle nested updates
      const rootKey = keys[0]
      const existingData = (node as unknown as Record<string, unknown>)[rootKey] ?? {}
      const nestedKey = keys.slice(1).join('.')
      onChange({
        [rootKey]: { ...(existingData as object), [nestedKey]: newValue },
      } as unknown as Partial<UnifiedNode>)
    }
  }

  return (
    <div>
      <WidgetLabel>{resolveText(labelKey, fallbackLabel)}</WidgetLabel>
      <WidgetSelect value={getValue()} onChange={(e) => setValue(e.target.value)}>
        {options.map((opt: { value: string; labelKey: string }) => (
          <option key={opt.value} value={opt.value}>
            {resolveText(opt.labelKey, opt.value)}
          </option>
        ))}
      </WidgetSelect>
    </div>
  )
}
