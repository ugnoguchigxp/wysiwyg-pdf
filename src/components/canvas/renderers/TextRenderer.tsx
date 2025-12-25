import type React from 'react'
import { Circle, Group, Line, Path, Rect, Text } from 'react-konva'
import type { TextNode } from '@/types/canvas'
import type { CanvasElementCommonProps, CanvasElementRendererProps } from '../types'

interface TextRendererProps {
  element: TextNode
  commonProps: CanvasElementCommonProps
  isEditing?: boolean
  dragState?: CanvasElementRendererProps['dragState']
  invScale: number
  onToggleCollapse?: (id: string) => void
}

export const TextRenderer: React.FC<TextRendererProps> = ({
  element,
  commonProps,
  isEditing,
  dragState,
  invScale,
  onToggleCollapse,
}) => {
  const {
    text,
    font,
    fontSize,
    fontWeight,
    italic,
    underline,
    lineThrough,
    fill,
    align,
    vAlign,
    stroke,
    strokeW,
    borderColor,
    borderWidth = 0,
    backgroundColor,
    padding = 0,
    cornerRadius = 0,
    hasFrame,
  } = element

  // Determine if we should show the box
  const shouldShowBox =
    hasFrame !== undefined
      ? hasFrame
      : borderColor || (borderWidth && borderWidth > 0) || backgroundColor

  if (shouldShowBox) {
    // Calculate Text dimensions inside the box
    const textX = padding
    const textY = padding
    const textW = Math.max(0, element.w - padding * 2)
    const textH = Math.max(0, element.h - padding * 2)

    // Calculate dynamic corner radius
    const ratio = Math.max(0, Math.min(1, Number(cornerRadius)))
    const percent = ratio * 0.5

    const minDim = Math.min(element.w, element.h)
    const actualCornerRadius = minDim * percent

    return (
      <Group {...commonProps}>
        {/* Drop Indicator - Insertion Line */}
        {dragState?.dropTargetId === element.id &&
          dragState.canDrop &&
          dragState.dropPosition !== 'child' && (
            <Line
              points={
                dragState.dropPosition === 'before'
                  ? [0, -4, element.w, -4] // Top
                  : [0, element.h + 4, element.w, element.h + 4] // Bottom
              }
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={4 * invScale}
              strokeCap="round"
              listening={false}
            />
          )}

        <Rect
          width={element.w}
          height={element.h}
          fill={backgroundColor}
          stroke={
            dragState?.dropTargetId === element.id
              ? dragState.canDrop
                ? dragState.dropPosition === 'child'
                  ? 'hsl(142, 70%, 50%)' // Green for child
                  : borderColor // Keep original border if showing insertion line separately
                : 'hsl(0, 70%, 50%)' // Red for invalid
              : borderColor
          }
          strokeWidth={
            dragState?.dropTargetId === element.id && dragState.canDrop
              ? dragState.dropPosition === 'child'
                ? 3 * invScale
                : borderWidth
              : borderWidth
          }
          cornerRadius={actualCornerRadius}
        />
        {/* Overlay for invalid drop (Red X or tint) */}
        {dragState?.dropTargetId === element.id && !dragState.canDrop && (
          <Path
            x={element.w / 2 - 6}
            y={element.h / 2 - 6}
            data="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
            fill="hsl(0, 70%, 50%)"
            scaleX={invScale}
            scaleY={invScale}
            opacity={0.8}
            listening={false}
          />
        )}
        <Text
          x={textX}
          y={textY}
          width={textW}
          height={textH}
          text={text}
          fontSize={fontSize}
          fontFamily={font}
          fontStyle={
            `${italic ? 'italic ' : ''}${fontWeight && fontWeight >= 700 ? 'bold' : ''} `.trim() ||
            'normal'
          }
          textDecoration={[underline ? 'underline' : '', lineThrough ? 'line-through' : '']
            .filter(Boolean)
            .join(' ')}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeW}
          align={
            align === 'l' ? 'left' : align === 'r' ? 'right' : align === 'c' ? 'center' : 'justify'
          }
          verticalAlign={vAlign === 'm' ? 'middle' : vAlign === 'b' ? 'bottom' : 'top'}
          lineHeight={1.2}
          listening={false} // Let the group handle events
          visible={!isEditing} // Hide underlying text while editing to prevent visual mismatch
        />
        {/* Collapse Toggle Button - Only if enabled for this node */}
        {element.data?.hasChildren &&
          onToggleCollapse &&
          (() => {
            const isCollapsed = !!element.data.isCollapsed
            const buttonColor = isCollapsed ? '#22c55e' : '#ef4444' // Green for expand (+), Red for collapse (-)

            return (
              <Group
                x={element.w}
                y={0}
                onMouseDown={(e) => {
                  e.cancelBubble = true
                  onToggleCollapse(element.id)
                }}
                onTap={(e) => {
                  e.cancelBubble = true
                  onToggleCollapse(element.id)
                }}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'pointer'
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'default'
                }}
              >
                <Circle
                  radius={8 * invScale}
                  fill="#ffffff"
                  stroke={buttonColor}
                  strokeWidth={1.5 * invScale}
                  shadowColor="#000000"
                  shadowBlur={3 * invScale}
                  shadowOpacity={0.15}
                />
                <Path
                  x={-4 * invScale}
                  y={-4 * invScale}
                  width={8 * invScale}
                  height={8 * invScale}
                  data={isCollapsed ? 'M4 1.5v5M1.5 4h5' : 'M1.5 4h5'}
                  stroke={buttonColor}
                  strokeWidth={1.5}
                  scale={{ x: invScale, y: invScale }}
                  listening={false}
                  lineCap="round"
                />
              </Group>
            )
          })()}
      </Group>
    )
  }

  return (
    <Text
      {...commonProps}
      height={element.h}
      text={text}
      fontSize={fontSize}
      fontFamily={font}
      fontStyle={
        `${italic ? 'italic ' : ''}${fontWeight && fontWeight >= 700 ? 'bold' : ''} `.trim() ||
        'normal'
      }
      textDecoration={[underline ? 'underline' : '', lineThrough ? 'line-through' : '']
        .filter(Boolean)
        .join(' ')}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeW}
      align={
        align === 'l' ? 'left' : align === 'r' ? 'right' : align === 'c' ? 'center' : 'justify'
      }
      verticalAlign={vAlign === 'm' ? 'middle' : vAlign === 'b' ? 'bottom' : 'top'}
      lineHeight={1.2}
      width={element.w}
      visible={!isEditing} // Hide underlying text while editing
    />
  )
}
