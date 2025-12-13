import type Konva from 'konva'
import type React from 'react'
import { Group, Rect, Text } from 'react-konva'
import type { CanvasElementCommonProps } from '../../../../components/canvas/CanvasElementRenderer'
import type { BedStatusData } from '../../../bedlayout-dashboard/types'
import type { WidgetNode } from '../../../../types/canvas'

type BedElementProps = Omit<CanvasElementCommonProps, 'ref'> & {
  element: WidgetNode
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
  // Data extraction from WidgetNode data
  const data = element.data || {}
  const localStatus = (data.status as string) || 'idle'
  const localLabel = (data.label as string) || 'Bed'
  const localPatientName = (data.patientName as string) || '-'
  const localBP = (data.bloodPressure as string) || '-'

  // Prop (bedStatus) takes precedence for dashboard mode
  const rawStatus = bedStatus?.status || localStatus
  const label = bedStatus ? bedStatus.bedId : localLabel // Preferred label source? Or stick to local text. Keep localLabel for now if name is separate.
  // Actually bedId is ID, label might be name.
  // Let's keep label as localLabel.

  const patientName = bedStatus?.patientName || localPatientName
  const bloodPressure = bedStatus?.vitals?.bp
    ? `${bedStatus.vitals.bp.systolic}/${bedStatus.vitals.bp.diastolic}`
    : localBP
  const alertCount = bedStatus?.alerts?.length || 0

  // Status colors
  let strokeColor = '#3b82f6' // Default Blue (Free)
  let strokeWidth = 2
  let bgColor = '#ffffff'

  // Map new statuses to visual styles
  if (rawStatus === 'occupied') {
    if (alertCount > 0) {
      // Assume alarm if alerts exist
      strokeColor = '#ef4444' // Red (Alarm)
      strokeWidth = 4
      bgColor = '#fef2f2'
    } else {
      strokeColor = '#22c55e' // Green (Active/Occupied)
      strokeWidth = 3
    }
  } else if (rawStatus === 'cleaning') {
    strokeColor = '#06b6d4' // Cyan
    bgColor = '#ecfeff'
  } else if (rawStatus === 'maintenance') {
    strokeColor = '#64748b' // Slate
    bgColor = '#f1f5f9'
  } else {
    // free / idle
    strokeColor = '#3b82f6'
    strokeWidth = 2
  }

  // Access w/h directly from UnifiedNode
  const width = element.w || 100
  const height = element.h || 60

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
        width={width}
        height={height}
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



          // In Editor mode, bedStatus is usually undefined or mock.
          // Real dashboard functionality passes bedStatus.
          // User request: Hide the lower 2 fields (Patient Name, BP) in Editor.
          // We can assume if bedStatus is not provided, we are in Editor mode or "Offline".
          // Or strictly check if we are just displaying layout vs monitoring.
          const isEditorMode = !bedStatus

          const renderLines = isEditorMode
            ? [element.name ?? 'Bed'] // Only show Bed Name in Editor
            : [
              label, // Bed Label
              patientName !== '-' ? patientName : '',
              bloodPressure !== '-' ? bloodPressure : ''
            ].filter(Boolean)

          const totalHeight = renderLines.length * fontSize * lineHeight
          const startY = (height - totalHeight) / 2

          return renderLines.map((text, index) => (
            <OutlinedText
              key={index}
              x={0}
              y={startY + index * fontSize * lineHeight}
              width={width}
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
