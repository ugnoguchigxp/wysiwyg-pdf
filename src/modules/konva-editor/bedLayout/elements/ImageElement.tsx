import type Konva from 'konva'
import type React from 'react'
import { Image } from 'react-konva'
import useImage from 'use-image'
import type { ImageNode } from '../../types'

interface ImageElementProps {
  element: ImageNode
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<ImageNode>) => void
  shapeRef?: React.Ref<Konva.Image>
}

export const ImageElement: React.FC<ImageElementProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  shapeRef,
}) => {
  const [image] = useImage(element.src || '')

  return (
    <Image
      ref={shapeRef}
      id={element.id}
      image={image}
      x={element.x}
      y={element.y}
      width={element.w}
      height={element.h}
      rotation={element.r}
      opacity={element.opacity}
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
      stroke={isSelected ? '#3b82f6' : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  )
}
