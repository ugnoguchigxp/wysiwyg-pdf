import type Konva from 'konva'
import type React from 'react'
import { Group, Rect, Text } from 'react-konva'
import type { CanvasElementCommonProps } from '@/components/canvas/types'
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
  enableStatusStyling?: boolean
  renderText?: boolean
}

export const BedOverlayText: React.FC<{
  element: WidgetNode
  bedStatus?: BedStatusData
  absolute?: boolean
}> = ({ element, bedStatus, absolute = true }) => {
  const data = element.data || {}
  const localLabel = (element.name as string) || (data.label as string) || 'Bed'
  const localPatientName = (data.patientName as string) || '-'
  const localBP = (data.bloodPressure as string) || '-'

  const label = bedStatus ? bedStatus.bedId : localLabel
  const patientName = bedStatus?.patientName || localPatientName
  const bloodPressure = bedStatus?.vitals?.bp
    ? `${bedStatus.vitals.bp.systolic}/${bedStatus.vitals.bp.diastolic}`
    : localBP

  // Keep these vars (and their existing comments) without branching behavior.
  const width = element.w || 100
  const height = element.h || 60
  const rotation = element.r || 0

  return (
    <Group
      id={`${element.id}__overlay_text`}
      x={absolute ? (element.x ?? 0) : 0}
      y={absolute ? (element.y ?? 0) : 0}
      rotation={absolute ? rotation : 0}
      listening={false}
    >
      <Group x={width / 2} y={height / 2} rotation={-rotation} listening={false}>
        {(() => {
          const fontSize = Math.min(ptToMm(10), height * 0.3)
          const lineHeight = 1.2
          const isEditorMode = !bedStatus

          let renderLines: string[] = []

          if (isEditorMode) {
            renderLines = [element.name ?? 'Bed']
          } else {
            renderLines = [
              label || '',
              patientName !== '-' ? patientName : '',
              bloodPressure !== '-' ? bloodPressure : '',
            ]
          }

          // Do not clamp the label area to the bed size.
          // We estimate required width from the rendered text length so that labels can overflow
          // beyond the bed bounds without being clipped.
          const maxLen = renderLines.reduce((m, s) => Math.max(m, s.length), 0)
          const textPadding = ptToMm(6)
          const estimatedCharWidth = fontSize * 0.75
          const textAreaWidth = Math.max(ptToMm(20), maxLen * estimatedCharWidth + textPadding)

          const totalHeight = renderLines.length * fontSize * lineHeight
          const startY = (height - totalHeight) / 2

          return renderLines.map((text, index) => (
            <OutlinedText
              key={index}
              x={-textAreaWidth / 2}
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
              listening={false}
            />
          ))
        })()}
      </Group>
    </Group>
  )
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
  isSelected: _isSelected,
  shapeRef,
  onClick,
  onTap,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  bedStatus,
  enableStatusStyling = false,
  renderText = true,
  ...otherProps
}) => {
  // Data extraction from WidgetNode data
  const data = element.data || {}

  // Status colors
  let strokeColor = '#3b82f6' // Default Blue (Free)
  const bgColor = '#ffffff'

  // Always use mm-based border width from element data (same style in editor/viewer).
  let strokeWidth = 0.4
  const bw = (data as { borderW?: unknown }).borderW
  if (typeof bw === 'number' && Number.isFinite(bw)) {
    strokeWidth = Math.max(0, bw)
  }

  if (enableStatusStyling && bedStatus) {
    const hasAlerts = (bedStatus.alerts?.length ?? 0) > 0

    switch (bedStatus.status) {
      case 'occupied': {
        strokeColor = hasAlerts ? '#ef4444' : '#22c55e'
        break
      }
      case 'cleaning': {
        strokeColor = '#06b6d4'
        break
      }
      case 'maintenance': {
        strokeColor = '#64748b'
        break
      }
      default: {
        strokeColor = '#3b82f6'
        break
      }
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
      onContextMenu={onContextMenu}
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
      {renderText && <BedOverlayText element={element} bedStatus={bedStatus} absolute={false} />}
    </Group>
  )
}
