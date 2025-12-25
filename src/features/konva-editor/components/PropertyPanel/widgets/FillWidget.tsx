import type React from 'react'
import type { FillWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { ShapeNode } from '@/types/canvas'
import { ColorInput } from '../ColorInput'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const FillWidget: React.FC<WidgetProps<FillWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const fillNode = node as ShapeNode

  return (
    <div>
      <WidgetLabel>{resolveText(config.labelKey ?? 'properties_fill_color', 'Fill')}</WidgetLabel>
      <ColorInput
        value={fillNode.fill ?? '#000000'}
        onChange={(color, options) => onChange({ fill: color }, options)}
      />
    </div>
  )
}
