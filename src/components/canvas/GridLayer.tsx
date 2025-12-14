import type React from 'react'
import { Layer, Line } from 'react-konva'

interface GridLayerProps {
  width: number
  height: number
  scale: number
  gridSize?: number
  visible?: boolean
}

export const GridLayer: React.FC<GridLayerProps> = ({
  width,
  height,
  scale,
  gridSize = 50,
  visible = false,
}) => {
  if (!visible) return null

  const lines = []

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#3b82f6"
        strokeWidth={1 / scale}
        listening={false}
      />
    )
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#000000"
        strokeWidth={1 / scale}
        listening={false}
      />
    )
  }

  return (
    <Layer name="grid-layer" listening={false} opacity={0.6}>
      {lines}
    </Layer>
  )
}
