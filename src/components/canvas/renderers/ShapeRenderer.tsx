import React from 'react'
import { Ellipse, Line, Path, Rect, Star } from 'react-konva'
import type { ShapeNode } from '@/types/canvas'
import type { CanvasElementCommonProps } from '../types'

interface ShapeRendererProps {
  element: ShapeNode
  commonProps: CanvasElementCommonProps
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  element,
  commonProps,
}) => {
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
          points={[
            shape.w / 2,
            0,
            shape.w,
            shape.h / 2,
            shape.w / 2,
            shape.h,
            0,
            shape.h / 2,
          ]}
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
    case 'cylinder':
      // Simplified cylinder: rect + ellipses (handling strictly via Path or multiple shapes is complex in single component return. Using Path for visual approximation)
      // Using simple Rect for now as fallback or Path if defined.
      return (
        <Rect
          {...commonProps}
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
    case 'tree':
      return (
        <Path
          {...commonProps}
          data="M12,2L2,12h4v8h12v-8h4L12,2z"
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
