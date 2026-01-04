import type React from 'react'
import type { PosSizeWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import { WidgetInput, WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const PosSizeWidget: React.FC<WidgetProps<PosSizeWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const props = config.props ?? {
    showX: true,
    showY: true,
    showW: true,
    showH: true,
  }

  return (
    <div className="w-full grid grid-cols-2 gap-1">
      {props.showX && (
        <div className="w-full">
          <WidgetLabel>{resolveText('properties_x', 'X')}</WidgetLabel>
          <div className="flex items-center gap-1">
            <WidgetInput
              type="number"
              value={Math.round(node.x ?? 0)}
              onChange={(e) => onChange({ x: Number(e.target.value) })}
              className="w-20"
            />
            <span className="text-[12px] text-muted-foreground">mm</span>
          </div>
        </div>
      )}
      {props.showY && (
        <div className="w-full">
          <WidgetLabel>{resolveText('properties_y', 'Y')}</WidgetLabel>
          <div className="flex items-center gap-1">
            <WidgetInput
              type="number"
              value={Math.round(node.y ?? 0)}
              onChange={(e) => onChange({ y: Number(e.target.value) })}
              className="w-20"
            />
            <span className="text-[12px] text-muted-foreground">mm</span>
          </div>
        </div>
      )}
      {props.showW && (
        <div className="w-full">
          <WidgetLabel>{resolveText('properties_width', 'W')}</WidgetLabel>
          <div className="flex items-center gap-1">
            <WidgetInput
              type="number"
              min={0}
              value={Math.round(node.w ?? 0)}
              onChange={(e) => onChange({ w: Math.max(0, Number(e.target.value)) })}
              className="w-20"
            />
            <span className="text-[12px] text-muted-foreground">mm</span>
          </div>
        </div>
      )}
      {props.showH && (
        <div className="w-full">
          <WidgetLabel>{resolveText('properties_height', 'H')}</WidgetLabel>
          <div className="flex items-center gap-1">
            <WidgetInput
              type="number"
              min={0}
              value={Math.round(node.h ?? 0)}
              onChange={(e) => onChange({ h: Math.max(0, Number(e.target.value)) })}
              className="w-20"
            />
            <span className="text-[12px] text-muted-foreground">mm</span>
          </div>
        </div>
      )}
    </div>
  )
}
