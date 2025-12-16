import type Konva from 'konva'
import type React from 'react'
import { Group, Rect, Text } from 'react-konva'
import type { CanvasElementCommonProps } from '@/components/canvas/CanvasElementRenderer'
import type { BedStatusData } from '@/features/bed-layout-dashboard/types'
import type { WidgetNode } from '@/types/canvas'
import { ptToMm } from '@/utils/units'

type BedElementProps = Omit<CanvasElementCommonProps, 'ref'> & {
  element: WidgetNode
  isSelected: boolean
  shapeRef?: React.Ref<Konva.Group>
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
        strokeWidth={ptToMm(1)}
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
  const localLabel = (element.name as string) || (data.label as string) || 'Bed'
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

  // In editor mode, use mm-based default border width from element data.
  if (!bedStatus) {
    const bw = (data as { borderW?: unknown }).borderW
    if (typeof bw === 'number' && Number.isFinite(bw)) {
      strokeWidth = Math.max(0, bw)
    } else {
      strokeWidth = 0.4
    }
  }

  // Access w/h directly from UnifiedNode
  const width = element.w || 100
  const height = element.h || 60

  const rotation = element.r || 0

  const cornerR = 1
  const pillowR = 0.5

  const pillowW = Math.min(3, width * 0.25)
  const pillowH = height * 0.8
  const pillowX = 1
  const pillowY = (height - pillowH) / 2

  return (
    <Group
      id={element.id}
      {...otherProps}
      rotation={rotation}
      ref={shapeRef}
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
        cornerRadius={cornerR}
        shadowColor="transparent"
        shadowBlur={0}
        shadowOpacity={0}
      />

      <Rect
        x={pillowX}
        y={pillowY}
        width={pillowW}
        height={pillowH}
        fill="#e5e7eb"
        opacity={0.5}
        cornerRadius={pillowR}
        listening={false}
      />

      {/* Text Content Group - Centered Vertically */}
      <Group x={width / 2} y={height / 2} rotation={-rotation}>
        {(() => {
          const fontSize = Math.min(ptToMm(10), height * 0.3)
          const lineHeight = 1.2
          const isEditorMode = !bedStatus

          const textAreaWidth = Math.min(width, 200)
          const textAreaX = (width - textAreaWidth) / 2

          let renderLines: string[] = []

          if (isEditorMode) {
            renderLines = [element.name ?? 'Bed']
          } else {
            // Dashboard Mode: Always show 3 lines (Bed Name, Patient Name, BP)
            // Even if data is missing, keep the slot to maintain position/layout standard
            renderLines = [
              label || '',
              patientName !== '-' ? patientName : '',
              bloodPressure !== '-' ? bloodPressure : '',
            ]
          }

          const totalHeight = renderLines.length * fontSize * lineHeight
          const startY = (height - totalHeight) / 2

          return renderLines.map((text, index) => (
            <OutlinedText
              key={index}
              x={textAreaX - width / 2}
              y={startY + index * fontSize * lineHeight - height / 2}
              width={textAreaWidth}
              text={text}
              fontSize={fontSize}
              fontFamily="Meiryo"
              fontStyle="bold"
              align="center"
              fill="#000000"
              wrap="none"
              lineHeight={lineHeight}
              listening={false} // Click-through to bed
            />
          ))
        })()}
      </Group>
    </Group>
  )
}
