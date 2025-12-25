import type React from 'react'
import type { LabelFieldWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { UnifiedNode } from '@/types/canvas'
import { WidgetInput, WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const LabelFieldWidget: React.FC<WidgetProps<LabelFieldWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const fieldKey = config.props?.fieldKey ?? 'name'

  return (
    <div>
      <WidgetLabel>{resolveText(config.labelKey ?? 'label', 'Label')}</WidgetLabel>
      <WidgetInput
        type="text"
        value={(node as unknown as Record<string, string>)[fieldKey] ?? ''}
        onChange={(e) =>
          onChange({ [fieldKey]: e.target.value } as unknown as Partial<UnifiedNode>)
        }
        placeholder={config.props?.placeholder}
      />
    </div>
  )
}
