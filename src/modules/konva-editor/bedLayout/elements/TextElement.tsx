import type Konva from 'konva'
import type React from 'react'
import { Text } from 'react-konva'
import type { ITextElement } from '../../types'

interface TextElementProps {
  element: ITextElement
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<ITextElement>) => void
  shapeRef?: React.Ref<Konva.Text>
}

export const TextElement: React.FC<TextElementProps> = ({
  element,

  onSelect,
  onChange,
  shapeRef,
}) => {
  return (
    <Text
      ref={shapeRef}
      id={element.id}
      x={element.box.x}
      y={element.box.y}
      text={element.text || 'Text'}
      fontSize={element.font.size}
      fontFamily={element.font.family}
      fontStyle={`${element.font.weight || 'normal'} ${element.font.italic ? 'italic' : ''}`}
      textDecoration={
        element.font.underline ? 'underline' : element.font.strikethrough ? 'line-through' : ''
      }
      fill={element.color}
      align={element.align}
      verticalAlign={element.verticalAlign || 'top'}
      width={element.box.width}
      height={element.box.height}
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
    />
  )
}
