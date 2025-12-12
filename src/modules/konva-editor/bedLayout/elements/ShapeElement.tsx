import type Konva from 'konva'
import type React from 'react'
import { Ellipse, Group, Rect } from 'react-konva'
import type { IShapeElement } from '../../types'

interface ShapeElementProps {
  element: IShapeElement
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<IShapeElement>) => void
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
    width: element.box.width,
    height: element.box.height,
    fill: element.fill.color || '#e0e0e0',
    stroke: isSelected ? '#3b82f6' : element.stroke.color || '#9ca3af',
    strokeWidth: isSelected ? 2 : element.stroke.width || 1,
  }

  return (
    <Group
      ref={shapeRef}
      id={element.id}
      x={element.box.x}
      y={element.box.y}
      rotation={element.rotation}
      draggable
      onMouseDown={onSelect}
      onTap={onSelect}
      onDragStart={(e) => {
        e.cancelBubble = true
      }}
      onDragEnd={(e) => {
        onChange({
          box: {
            ...element.box,
            x: e.target.x(),
            y: e.target.y(),
          },
        })
      }}
    >
      {element.type === 'Rect' && <Rect {...commonProps} cornerRadius={4} />}
      {(element.type === 'Circle' ||
        element.type === 'Trapezoid' ||
        element.type === 'Triangle' ||
        element.type === 'Diamond' ||
        element.type === 'Cylinder') && (
        // For now, mapping other shapes to Ellipse or just handling Circle/Ellipse
        // Report Template uses 'Circle' for Ellipse-like shapes usually, or we need to check how it handles them.
        // Assuming 'Circle' maps to Ellipse logic here for now.
        <Ellipse
          {...commonProps}
          radiusX={element.box.width / 2}
          radiusY={element.box.height / 2}
          offsetX={-element.box.width / 2}
          offsetY={-element.box.height / 2}
        />
      )}
    </Group>
  )
}
