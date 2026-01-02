import type React from 'react'
import { Ellipse, Group, Line, Path, Rect, Star } from 'react-konva'
import type { ShapeNode } from '@/types/canvas'
import type { CanvasElementCommonProps } from '../types'

interface ShapeRendererProps {
  element: ShapeNode
  commonProps: CanvasElementCommonProps
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ element, commonProps }) => {
  const shape = element
  switch (shape.shape) {
    case 'rect':
      return (
        <Rect
          {...commonProps}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
          cornerRadius={shape.radius}
        />
      )
    case 'circle':
      // Ellipse centered
      return (
        <Ellipse
          {...commonProps}
          x={(shape.x || 0) + (shape.w || 0) / 2}
          y={(shape.y || 0) + (shape.h || 0) / 2}
          radiusX={(shape.w || 0) / 2}
          radiusY={(shape.h || 0) / 2}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
        />
      )
    case 'triangle':
      return (
        <Line
          {...commonProps}
          points={[shape.w / 2, 0, shape.w, shape.h, 0, shape.h]}
          closed
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
        />
      )
    case 'diamond':
      return (
        <Line
          {...commonProps}
          points={[shape.w / 2, 0, shape.w, shape.h / 2, shape.w / 2, shape.h, 0, shape.h / 2]}
          closed
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
        />
      )
    case 'star':
      return (
        <Star
          {...commonProps}
          x={(shape.x || 0) + shape.w / 2}
          y={(shape.y || 0) + shape.h / 2}
          numPoints={5}
          innerRadius={Math.min(shape.w, shape.h) / 4}
          outerRadius={Math.min(shape.w, shape.h) / 2}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
        />
      )
    case 'trapezoid': {
      const w = shape.w
      const h = shape.h
      return (
        <Line
          {...commonProps}
          points={[w * 0.2, 0, w * 0.8, 0, w, h, 0, h]}
          closed
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
        />
      )
    }
    case 'cylinder': {
      const w = shape.w
      const h = shape.h
      const topH = Math.min(h * 0.2, 20)
      const rX = w / 2
      const rY = topH / 2

      return (
        <Group {...commonProps}>
          {/* Body: Left side, Bottom arc, Right side */}
          {/* We use Path to draw the sides and bottom curve without a horizontal line at the bottom junction */}
          <Path
            data={`M 0,${rY} L 0,${h - rY} A ${rX},${rY} 0 0 0 ${w},${h - rY} L ${w},${rY}`}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeW}
          />
          {/* Top Ellipse - Full stroke and fill to cover the top junction */}
          <Ellipse
            x={rX}
            y={rY}
            radiusX={rX}
            radiusY={rY}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeW}
          />
        </Group>
      )
    }
    case 'cone': {
      const baseH = Math.min(shape.h * 0.2, 20)
      return (
        <Group {...commonProps}>
          <Line
            points={[shape.w / 2, 0, shape.w, shape.h - baseH / 2, 0, shape.h - baseH / 2]}
            closed
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeW}
          />
          <Ellipse
            x={shape.w / 2}
            y={shape.h - baseH / 2}
            radiusX={shape.w / 2}
            radiusY={baseH / 2}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeW}
          />
        </Group>
      )
    }
    case 'heart':
      return (
        <Path
          {...commonProps}
          data="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
          scaleX={shape.w / 24}
          scaleY={shape.h / 24}
        />
      )
    case 'pentagon':
      return (
        <Line
          {...commonProps}
          x={(shape.x || 0) + shape.w / 2}
          y={(shape.y || 0) + shape.h / 2}
          points={[
            0,
            -shape.h / 2,
            shape.w / 2,
            -shape.h * 0.12,
            shape.w * 0.31,
            shape.h / 2,
            -shape.w * 0.31,
            shape.h / 2,
            -shape.w / 2,
            -shape.h * 0.12,
          ]}
          closed
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
        />
      )
    case 'hexagon':
      return (
        <Line
          {...commonProps}
          x={(shape.x || 0) + shape.w / 2}
          y={(shape.y || 0) + shape.h / 2}
          points={[
            -shape.w * 0.25,
            -shape.h / 2,
            shape.w * 0.25,
            -shape.h / 2,
            shape.w / 2,
            0,
            shape.w * 0.25,
            shape.h / 2,
            -shape.w * 0.25,
            shape.h / 2,
            -shape.w / 2,
            0,
          ]}
          closed
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
        />
      )
    case 'arrow-u':
      return (
        <Path
          {...commonProps}
          data="M12 4l-8 8h6v8h4v-8h6z"
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
          scaleX={shape.w / 24}
          scaleY={shape.h / 24}
        />
      )
    case 'arrow-d':
      return (
        <Path
          {...commonProps}
          data="M12 20l-8-8h6v-8h4v8h6z"
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
          scaleX={shape.w / 24}
          scaleY={shape.h / 24}
        />
      )
    case 'arrow-l':
      return (
        <Path
          {...commonProps}
          data="M4 12l8-8v6h8v4h-8v6z"
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
          scaleX={shape.w / 24}
          scaleY={shape.h / 24}
        />
      )
    case 'arrow-r':
      return (
        <Path
          {...commonProps}
          data="M20 12l-8-8v6h-8v4h8v6z"
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
          scaleX={shape.w / 24}
          scaleY={shape.h / 24}
        />
      )
    case 'house':
      return (
        <Path
          {...commonProps}
          data="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeW}
          scaleX={shape.w / 24}
          scaleY={shape.h / 24}
        />
      )
    default:
      return <Rect {...commonProps} fill={shape.fill} stroke={shape.stroke} />
  }
}
