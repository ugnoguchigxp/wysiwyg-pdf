import type React from 'react'
import type { SliderWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { UnifiedNode } from '@/types/canvas'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const SliderWidget: React.FC<WidgetProps<SliderWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const { fieldKey, min, max, step = 1, showValue } = config.props
  const value = (node as unknown as Record<string, number>)[fieldKey] ?? min

  return (
    <div>
      <WidgetLabel>
        {resolveText(config.labelKey ?? fieldKey, fieldKey)}
        {showValue && `: ${value}`}
      </WidgetLabel>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          onChange({
            [fieldKey]: parseFloat(e.target.value),
          } as unknown as Partial<UnifiedNode>)
        }
        className="w-full accent-accent"
      />
    </div>
  )
}
