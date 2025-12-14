import type React from 'react'
import { Circle, Line, Rect, RegularPolygon } from 'react-konva'
import type { ArrowType } from '../../types/canvas'

interface LineMarkerProps {
  x: number
  y: number
  angle: number
  type: ArrowType
  color: string
  size?: number
  id?: string // For referencing in direct manipulation
}

export const LineMarker: React.FC<LineMarkerProps> = ({
  x,
  y,
  angle,
  type,
  color,
  size = 10,
  id,
}) => {
  if (type === 'none') return null

  const commonProps = {
    id,
    x,
    y,
    rotation: (angle * 180) / Math.PI,
    fill: color,
    stroke: color,
    strokeWidth: 1,
  }

  switch (type) {
    case 'arrow':
    case 'standard':
    case 'open':
      return (
        <Line
          {...commonProps}
          points={[-size, -size / 2, 0, 0, -size, size / 2]}
          closed={false}
          fillEnabled={false}
          strokeWidth={2}
        />
      )
    case 'triangle':
    case 'filled':
      return (
        <Line
          {...commonProps}
          points={[-size, -size / 2, 0, 0, -size, size / 2]}
          closed
          strokeWidth={1}
        />
      )
    case 'circle':
      return <Circle {...commonProps} radius={size / 3} offsetX={size / 3} />
    case 'diamond':
      return <RegularPolygon {...commonProps} sides={4} radius={size / 2} offsetX={size / 2} />
    case 'square':
      return (
        <Rect
          {...commonProps}
          width={size * 0.6}
          height={size * 0.6}
          offsetX={size * 0.6}
          offsetY={(size * 0.6) / 2}
          strokeWidth={1}
        />
      )
    default:
      return null
  }
}
