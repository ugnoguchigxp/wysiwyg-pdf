import type Konva from 'konva'
import type React from 'react'
import { Image } from 'react-konva'
import useImage from 'use-image'
import type { IImageElement } from '../../types'

interface ImageElementProps {
  element: IImageElement
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<IImageElement>) => void
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
      x={element.box.x}
      y={element.box.y}
      width={element.box.width}
      height={element.box.height}
      rotation={element.rotation}
      opacity={element.opacity}
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
      stroke={isSelected ? '#3b82f6' : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  )
}
