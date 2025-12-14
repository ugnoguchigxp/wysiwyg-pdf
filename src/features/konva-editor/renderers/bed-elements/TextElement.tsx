import type Konva from 'konva'
import type React from 'react'
import { Text } from 'react-konva'
import type { TextNode } from '@/types/canvas'

interface TextElementProps {
  element: TextNode
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<TextNode>) => void
  shapeRef?: React.Ref<Konva.Text>
}

export const TextElement: React.FC<TextElementProps> = ({
  element,
  onSelect,
  onChange,
  shapeRef,
}) => {
  const alignMap = { l: 'left', c: 'center', r: 'right', j: 'justify' }

  return (
    <Text
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      text={element.text || 'Text'}
      fontSize={element.fontSize}
      fontFamily={element.font}
      fontStyle={`${element.fontWeight || 'normal'} ${element.italic ? 'italic' : ''}`}
      textDecoration={element.underline ? 'underline' : element.lineThrough ? 'line-through' : ''}
      fill={element.fill}
      align={element.align ? alignMap[element.align] : 'left'}
      verticalAlign={element.vAlign === 'm' ? 'middle' : element.vAlign === 'b' ? 'bottom' : 'top'}
      width={element.w}
      height={element.h}
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
    />
  )
}
