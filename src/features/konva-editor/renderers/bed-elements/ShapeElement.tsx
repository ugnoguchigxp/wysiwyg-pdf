import type Konva from 'konva'
import type React from 'react'
import { Ellipse, Group, Rect } from 'react-konva'
import type { ShapeNode } from '@/types/canvas'

interface ShapeElementProps {
  element: ShapeNode
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<ShapeNode>) => void
  shapeRef?: React.Ref<Konva.Group>
}

export const ShapeElement: React.FC<ShapeElementProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  shapeRef,
}) => {
  const commonProps = {
    width: element.w,
    height: element.h,
    fill: element.fill || '#e0e0e0',
    stroke: isSelected ? '#3b82f6' : element.stroke || '#9ca3af',
    strokeWidth: isSelected ? 2 : element.strokeW || 1,
  }

  return (
    <Group
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.r}
      draggable={!element.locked}
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragStart={(e) => {
        e.cancelBubble = true
      }}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        })
      }}
    >
      {element.shape === 'rect' && <Rect {...commonProps} cornerRadius={element.radius || 4} />}
      {element.shape !== 'rect' && (
        <Ellipse
          {...commonProps}
          radiusX={element.w / 2}
          radiusY={element.h / 2}
          offsetX={-element.w / 2}
          offsetY={-element.h / 2}
        />
      )}
    </Group>
  )
}
