import type Konva from 'konva'
import type React from 'react'
import { Group, Rect, Text } from 'react-konva'
import type { CanvasElementCommonProps } from '../../../../components/canvas/CanvasElementRenderer'
import type { BedStatusData } from '../../../bedlayout-dashboard/types'
import type { IBedElement } from '../../types'

type BedElementProps = Omit<CanvasElementCommonProps, 'ref'> & {
  element: IBedElement
  isSelected: boolean
  shapeRef?: React.Ref<Konva.Rect>
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onTap?: (e: Konva.KonvaEventObject<TouchEvent>) => void
  onMouseEnter?: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onMouseLeave?: (e: Konva.KonvaEventObject<MouseEvent>) => void
  bedStatus?: BedStatusData
}

// Helper component for text with white outline (halo)
const OutlinedText: React.FC<React.ComponentProps<typeof Text>> = (props) => {
  return (
    <Group>
      {/* Outline (Background) */}
      <Text
        {...props}
        fill="white"
        stroke="white"
        strokeWidth={4}
        shadowBlur={0}
        shadowOffset={{ x: 0, y: 0 }}
        shadowOpacity={0}
      />
      {/* Main Text (Foreground) */}
      <Text {...props} />
    </Group>
  )
}

export const BedElement: React.FC<BedElementProps> = ({
  element,
  isSelected,
  shapeRef,
  onClick,
  onTap,
  onMouseEnter,
  onMouseLeave,
  bedStatus,
  ...otherProps
}) => {
  // Determine status and data from prop OR internal element state (fallback)
  // Prop (bedStatus) takes precedence for dashboard mode
  const status = bedStatus?.status || element.status || 'idle'
  const label = element.label || 'Bed'
  const patientName = bedStatus?.patientName || element.patientName || '-'
  const bloodPressure = bedStatus?.vitals?.bp
    ? `${bedStatus.vitals.bp.systolic}/${bedStatus.vitals.bp.diastolic}`
    : element.bloodPressure || '-'
  const alertCount = bedStatus?.alerts?.length || 0

  // Status colors
  let strokeColor = '#3b82f6' // Default Blue (Idle)
  let strokeWidth = 2
  let bgColor = '#ffffff'

  if (status === 'active') {
    strokeColor = '#22c55e' // Green (Active)
    strokeWidth = 3
  } else if (status === 'warning') {
    strokeColor = '#eab308' // Yellow (Warning)
    strokeWidth = 4
    bgColor = '#fefce8' // Light yellow background
  } else if (status === 'alarm' || alertCount > 0) {
    strokeColor = '#ef4444' // Red (Alarm)
    strokeWidth = 4
    bgColor = '#fef2f2' // Light red background
  } else {
    // Idle or undefined
    strokeColor = '#3b82f6'
    strokeWidth = 2
  }

  return (
    <Group
      id={element.id}
      {...otherProps}
      ref={shapeRef as React.Ref<Konva.Group>}
      onClick={onClick}
      onTap={onTap}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Bed Frame */}
      <Rect
        width={element.box.width}
        height={element.box.height}
        fill={bgColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        cornerRadius={4}
        shadowColor={isSelected ? '#000' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.3}
      />

      {/* Text Content Group - Centered Vertically */}
      <Group>
        {(() => {
          const fontSize = 16
          const lineHeight = 1.2

          // If occupied (active/warning/alarm) show details
          // If idle, show just Label
          const isOccupied = status !== 'idle' && bedStatus?.isOccupied !== false // Check explicitly if false

          const alertMessage = bedStatus?.customData?.statusMessage || ''

          const renderLines = isOccupied
            ? [label, patientName, bloodPressure, alertMessage].filter(
              (l): l is string => typeof l === 'string' && l !== ''
            )
            : [label]

          // Debug rendering
          // console.log(`[BedElement] ID=${element.id} Status=${status} Occupied=${isOccupied} Name=${patientName} BP=${bloodPressure} Lines=${renderLines.length}`);

          const totalHeight = renderLines.length * fontSize * lineHeight
          const startY = (element.box.height - totalHeight) / 2

          return renderLines.map((text, index) => (
            <OutlinedText
              key={index}
              x={0}
              y={startY + index * fontSize * lineHeight}
              width={element.box.width}
              text={text}
              fontSize={fontSize}
              fontFamily="Meiryo"
              fontStyle="bold"
              align="center"
              fill="#000000"
              wrap="none"
              lineHeight={lineHeight}
            />
          ))
        })()}
      </Group>
    </Group>
  )
}
