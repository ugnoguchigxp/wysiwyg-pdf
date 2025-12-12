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
    case 'standard': // V shape
      return (
        <Line
          {...commonProps}
          points={[-size, -size / 2, 0, 0, -size, size / 2]}
          closed={false}
          fillEnabled={false}
        />
      )
    case 'filled': // Triangle filled
      return (
        <Line
          {...commonProps}
          points={[0, 0, -size, -size / 2, -size * 0.7, 0, -size, size / 2]}
          closed={true}
        />
      )
    case 'triangle': // Triangle filled (simple)
      return (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={size / 1.5}
          rotation={commonProps.rotation + 90} // Adjust rotation for polygon
          offsetY={-size / 3} // Center adjustment
        />
      )
    case 'open': // Concave arrow
      return (
        <Line
          {...commonProps}
          points={[0, 0, -size, -size / 2, -size * 0.5, 0, -size, size / 2]}
          closed={true}
          fillEnabled={false}
        />
      )
    case 'circle':
      return <Circle {...commonProps} radius={size / 3} offsetX={size / 2} />
    case 'diamond':
      return <RegularPolygon {...commonProps} sides={4} radius={size / 2} offsetX={size / 2} />
    case 'square':
      return (
        <Rect
          {...commonProps}
          width={size}
          height={size * 0.7}
          offsetX={size}
          offsetY={(size * 0.7) / 2}
        />
      )
    default:
      return null
  }
}
