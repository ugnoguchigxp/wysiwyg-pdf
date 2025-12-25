import type React from 'react'
import type { BorderWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { ShapeNode } from '@/types/canvas'
import { ColorInput } from '../ColorInput'
import { WidgetInput, WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const BorderWidget: React.FC<WidgetProps<BorderWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const props = config.props ?? { showColor: true, showWidth: false }
  const shapeNode = node as ShapeNode

  return (
    <div className="space-y-2">
      {props.showColor && (
        <div>
          <WidgetLabel>
            {resolveText(config.labelKey ?? 'properties_border_color', 'BorderColor')}
          </WidgetLabel>
          <ColorInput
            value={shapeNode.stroke ?? '#000000'}
            onChange={(color, options) => onChange({ stroke: color }, options)}
          />
        </div>
      )}
      {props.showWidth && (
        <div>
          <WidgetLabel>{resolveText('properties_border_width', 'Border Width')}</WidgetLabel>
          <WidgetInput
            type="number"
            min={0}
            step={0.2}
            value={shapeNode.strokeW ?? 0.2}
            onChange={(e) => onChange({ strokeW: Math.max(0, Number(e.target.value)) })}
          />
        </div>
      )}
    </div>
  )
}
