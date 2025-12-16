import type Konva from 'konva'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { Circle, Group, Line } from 'react-konva'
import type { LineNode } from '@/types/canvas'

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
  const lineRef = useRef<Konva.Line | null>(null)
  const startHandleRef = useRef<Konva.Circle | null>(null)
  const endHandleRef = useRef<Konva.Circle | null>(null)

  const draftPtsRef = useRef<number[]>([...element.pts])
  const draggingHandleRef = useRef<'start' | 'end' | null>(null)

  useEffect(() => {
    if (draggingHandleRef.current) return
    draftPtsRef.current = [...element.pts]
  }, [element.pts])

  const applyDraftToVisuals = (pts: number[]) => {
    lineRef.current?.points(pts)
    startHandleRef.current?.position({ x: pts[0], y: pts[1] })
    endHandleRef.current?.position({ x: pts[2], y: pts[3] })
    lineRef.current?.getLayer()?.batchDraw()
  }

  const snap45 = (moving: { x: number; y: number }, fixed: { x: number; y: number }) => {
    const dx = moving.x - fixed.x
    const dy = moving.y - fixed.y
    const angle = Math.atan2(dy, dx)
    const dist = Math.sqrt(dx * dx + dy * dy)
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
    return {
      x: fixed.x + Math.cos(snapAngle) * dist,
      y: fixed.y + Math.sin(snapAngle) * dist,
    }
  }

  const handlePointDragMove = (point: 'start' | 'end', e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x()
    const newY = e.target.y()
    let newPos = { x: newX, y: newY }

    const basePts = draftPtsRef.current
    const otherPoint =
      point === 'start' ? { x: basePts[2], y: basePts[3] } : { x: basePts[0], y: basePts[1] }

    if (e.evt.shiftKey) {
      newPos = snap45(newPos, otherPoint)
      e.target.position(newPos)
    }

    const nextPts = [...basePts]
    if (point === 'start') {
      nextPts[0] = newPos.x
      nextPts[1] = newPos.y
    } else {
      nextPts[2] = newPos.x
      nextPts[3] = newPos.y
    }

    draftPtsRef.current = nextPts
    applyDraftToVisuals(nextPts)

    e.cancelBubble = true
  }

  const handlePointDragStart = (point: 'start' | 'end') => {
    draggingHandleRef.current = point
    draftPtsRef.current = [...element.pts]

    // Prevent the line body from also being dragged while resizing endpoints.
    if (lineRef.current) {
      lineRef.current.draggable(false)
    }
  }

  const handlePointDragEnd = () => {
    const nextPts = draftPtsRef.current
    draggingHandleRef.current = null

    if (lineRef.current) {
      lineRef.current.draggable(true)
    }

    onChange({ pts: nextPts })
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
        ref={lineRef}
        points={element.pts}
        stroke={element.stroke || '#000'}
        strokeWidth={element.strokeW ?? 0.2}
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
            ref={startHandleRef}
            x={element.pts[0]}
            y={element.pts[1]}
            radius={6}
            fill="#fff"
            stroke="#3b82f6"
            strokeWidth={2}
            draggable
            onMouseDown={(e) => {
              e.cancelBubble = true
            }}
            onDragStart={(e) => {
              e.cancelBubble = true
              handlePointDragStart('start')
            }}
            onDragMove={(e) => handlePointDragMove('start', e)}
            onDragEnd={(e) => {
              e.cancelBubble = true
              handlePointDragEnd()
            }}
          />
          {/* End Point Handle */}
          <Circle
            ref={endHandleRef}
            x={element.pts[2]}
            y={element.pts[3]}
            radius={6}
            fill="#fff"
            stroke="#3b82f6"
            strokeWidth={2}
            draggable
            onMouseDown={(e) => {
              e.cancelBubble = true
            }}
            onDragStart={(e) => {
              e.cancelBubble = true
              handlePointDragStart('end')
            }}
            onDragMove={(e) => handlePointDragMove('end', e)}
            onDragEnd={(e) => {
              e.cancelBubble = true
              handlePointDragEnd()
            }}
          />
        </>
      )}
    </Group>
  )
}
