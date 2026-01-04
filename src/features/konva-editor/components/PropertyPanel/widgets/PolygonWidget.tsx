import type React from 'react'
import type { PolygonWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { ShapeNode } from '@/types/canvas'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const PolygonWidget: React.FC<WidgetProps<PolygonWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'shape') return null
  const shapeNode = node as ShapeNode
  const points = shapeNode.sides ?? 5
  const { min = 3, max = 12, step = 1 } = config.props || {}

  return (
    <div>
      <WidgetLabel>
        {resolveText(config.labelKey ?? 'properties_sides', 'Sides')}: {points}
      </WidgetLabel>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={points}
        onChange={(e) =>
          onChange({
            sides: parseInt(e.target.value, 10),
          } as Partial<ShapeNode>)
        }
        className="w-full accent-accent"
      />
    </div>
  )
}
