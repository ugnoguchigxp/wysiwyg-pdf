import type Konva from 'konva'
import type React from 'react'
import { Circle, Group, Line } from 'react-konva'
import type { LineNode } from '../../types'

interface LineElementProps {
  element: LineNode
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<LineNode>) => void
  shapeRef?: React.Ref<Konva.Group>
}

export const LineElement: React.FC<LineElementProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  shapeRef,
}) => {
  const handlePointDrag = (point: 'start' | 'end', e: Konva.KonvaEventObject<DragEvent>) => {
    const group = e.target.getParent()
    if (!group) return

    // Get position relative to the group
    // For LineElement, group is at (0,0) so relative is absolute if we assume that.
    // Use stage pointer for accurate positioning?
    // e.target.x()/y() are relative to parent (group).

    const newX = e.target.x()
    const newY = e.target.y()
    let newPos = { x: newX, y: newY }

    // Snap to 45 degrees if Shift is pressed
    if (e.evt.shiftKey) {
      const startX = element.pts[0]
      const startY = element.pts[1]
      const endX = element.pts[2]
      const endY = element.pts[3]

      const otherPoint = point === 'start' ? { x: endX, y: endY } : { x: startX, y: startY }
      const dx = newPos.x - otherPoint.x
      const dy = newPos.y - otherPoint.y
      const angle = Math.atan2(dy, dx)
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Snap angle to nearest 45 degrees (PI/4)
      const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)

      newPos = {
        x: otherPoint.x + Math.cos(snapAngle) * dist,
        y: otherPoint.y + Math.sin(snapAngle) * dist,
      }

      // Update handle position visually to match snapped point
      e.target.position(newPos)
    }

    const currentPts = [...element.pts]
    if (point === 'start') {
      currentPts[0] = newPos.x
      currentPts[1] = newPos.y
    } else {
      currentPts[2] = newPos.x
      currentPts[3] = newPos.y
    }

    onChange({ pts: currentPts })

    // Prevent event bubbling to avoid dragging the group
    e.cancelBubble = true
  }

  return (
    <Group
      ref={shapeRef}
      id={element.id}
      x={0}
      y={0}
      draggable={false}
      onMouseDown={onSelect}
      onTap={onSelect}
    >
      <Line
        points={element.pts}
        stroke={element.stroke || '#000'}
        strokeWidth={element.strokeW || 2}
        hitStrokeWidth={20} // Make it easier to select
        shadowColor={isSelected ? '#3b82f6' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.5 : 0}
        draggable
        onDragEnd={(e) => {
          const dx = e.target.x()
          const dy = e.target.y()
          // Reset line position and update points
          e.target.x(0)
          e.target.y(0)

          const newPts = []
          for (let i = 0; i < element.pts.length; i += 2) {
            newPts.push(element.pts[i] + dx)
            newPts.push(element.pts[i + 1] + dy)
          }
          onChange({ pts: newPts })
        }}
      />

      {isSelected && (
        <>
          {/* Start Point Handle */}
          <Circle
            x={element.pts[0]}
            y={element.pts[1]}
            radius={6}
            fill="#fff"
            stroke="#3b82f6"
            strokeWidth={2}
            draggable
            onDragMove={(e) => handlePointDrag('start', e)}
            onDragEnd={(e) => handlePointDrag('start', e)}
          />
          {/* End Point Handle */}
          <Circle
            x={element.pts[2]}
            y={element.pts[3]}
            radius={6}
            fill="#fff"
            stroke="#3b82f6"
            strokeWidth={2}
            draggable
            onDragMove={(e) => handlePointDrag('end', e)}
            onDragEnd={(e) => handlePointDrag('end', e)}
          />
        </>
      )}
    </Group>
  )
}
