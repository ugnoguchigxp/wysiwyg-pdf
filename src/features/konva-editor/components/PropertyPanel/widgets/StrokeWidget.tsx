import type React from 'react'
import type { StrokeWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { LineNode, ShapeNode } from '@/types/canvas'
import { ColorInput } from '../ColorInput'
import { WidgetInput, WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const StrokeWidget: React.FC<WidgetProps<StrokeWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const props = config.props ?? { showColor: true, showWidth: true }
  const strokeNode = node as ShapeNode | LineNode

  return (
    <div className="space-y-2">
      {props.showColor && (
        <div>
          <WidgetLabel>{resolveText('properties_stroke_color', 'Stroke Color')}</WidgetLabel>
          <ColorInput
            value={strokeNode.stroke ?? '#000000'}
            onChange={(color, options) => onChange({ stroke: color }, options)}
          />
        </div>
      )}
      {props.showWidth && (
        <div>
          <WidgetLabel>
            {resolveText(config.labelKey ?? 'properties_line_width', 'Line Width')}
          </WidgetLabel>
          <WidgetInput
            type="number"
            min={0}
            max={props.maxWidth ?? 20}
            step={props.step ?? 0.2}
            value={strokeNode.strokeW ?? 0.2}
            onChange={(e) => onChange({ strokeW: Math.max(0, Number(e.target.value)) })}
          />
        </div>
      )}
    </div>
  )
}
