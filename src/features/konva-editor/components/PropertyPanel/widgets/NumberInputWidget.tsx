import type React from 'react'
import type { NumberInputWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { UnifiedNode } from '@/types/canvas'
import { WidgetInput, WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const NumberInputWidget: React.FC<WidgetProps<NumberInputWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const { fieldKey, min, max, step = 1, unit } = config.props
  const value = (node as unknown as Record<string, number>)[fieldKey] ?? 0

  return (
    <div>
      <WidgetLabel>{resolveText(config.labelKey ?? fieldKey, fieldKey)}</WidgetLabel>
      <div className="flex items-center gap-1">
        <WidgetInput
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) =>
            onChange({
              [fieldKey]: parseFloat(e.target.value),
            } as unknown as Partial<UnifiedNode>)
          }
        />
        {unit && <span className="text-[12px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}
