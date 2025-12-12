import type Konva from 'konva'
import type React from 'react'
import { Circle, Group, Line } from 'react-konva'
import type { ILineElement } from '../../types'

interface LineElementProps {
  element: ILineElement
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<ILineElement>) => void
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
    const pos = group.getRelativePointerPosition()

    if (!pos) return

    let newPos = { x: pos.x, y: pos.y }

    // Snap to 45 degrees if Shift is pressed
    if (e.evt.shiftKey) {
      const otherPoint = point === 'start' ? element.endPoint : element.startPoint
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

    if (point === 'start') {
      onChange({
        startPoint: newPos,
      })
    } else {
      onChange({
        endPoint: newPos,
      })
    }

    // Prevent event bubbling to avoid dragging the group
    e.cancelBubble = true
  }

  return (
    <Group
      ref={shapeRef}
      id={element.id}
      // LineElement in Report Template usually has x/y as 0 or position of group?
      // Assuming ILineElement uses startPoint/endPoint relative to (0,0) or group position.
      // But IElementBase has x/y (z, visible etc).
      // Let's assume the Group is at (0,0) of the page for now, or we treat startPoint/endPoint as absolute coordinates on canvas if x/y are not used for position offset.
      // However, typical Konva usage puts group at x/y.
      // If we follow Report Template, let's check if it uses x/y for group position.
      // IElementBase has x/y (implied by extending it? No, IElementBase in shared types has z, visible... wait.
      // IElementBase in shared types does NOT have x/y directly. IBox has x/y.
      // But ILineElement extends IElementBase. It does NOT have IBox.
      // So LineElement relies on startPoint/endPoint.
      // We should render the Group at (0,0) or handle it differently.
      // For now, let's assume absolute coordinates for points and Group at (0,0).
      x={0}
      y={0}
      draggable={false} // Lines might be draggable by points or whole body?
      // If we want to drag the whole line, we need to update both points.
      // Let's keep it simple: Group is static (0,0), we drag points.
      // OR we can make Group draggable and update points on drag end?
      // Report Template usually handles this by updating x/y of the group and keeping points relative?
      // But ILineElement has startPoint/endPoint.
      // Let's assume points are absolute for now as per previous WallElement logic (which used points array).
      onMouseDown={onSelect}
      onTap={onSelect}
    >
      <Line
        points={[
          element.startPoint.x,
          element.startPoint.y,
          element.endPoint.x,
          element.endPoint.y,
        ]}
        stroke={element.stroke.color || '#000'}
        strokeWidth={element.stroke.width || 2}
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
          onChange({
            startPoint: { x: element.startPoint.x + dx, y: element.startPoint.y + dy },
            endPoint: { x: element.endPoint.x + dx, y: element.endPoint.y + dy },
          })
        }}
      />

      {isSelected && (
        <>
          {/* Start Point Handle */}
          <Circle
            x={element.startPoint.x}
            y={element.startPoint.y}
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
            x={element.endPoint.x}
            y={element.endPoint.y}
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
