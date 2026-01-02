import type React from 'react'
import { Circle, Group, Line, Path, Rect, Text } from 'react-konva'
import { parseListLine } from '@/features/konva-editor/utils/textList'
import { measureText } from '@/features/konva-editor/utils/textUtils'
import { VerticalCaret, VerticalKonvaText } from '@/features/vertical-text'
import type { TextNode } from '@/types/canvas'
import { mmToPx, ptToMm, pxToMm } from '@/utils/units'
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

  const fontSizeMm = fontSize ?? ptToMm(12)
  const lineHeight = 1.2
  const numberMarkerScale = 0.75

  const measureTextMm = (value: string, sizeMm: number) => {
    const sizePx = mmToPx(sizeMm, { dpi: 96 })
    const metrics = measureText(value || ' ', {
      family: font || 'Arial',
      size: sizePx,
      weight: fontWeight,
    })
    return pxToMm(metrics.width, { dpi: 96 })
  }

  const renderListLines = (options: {
    offsetX: number
    offsetY: number
    textX: number
    textY: number
    textW: number
    textH: number
    visible: boolean
  }) => {
    const lines = (text || '').split('\n')
    const hasList = lines.some((line) => parseListLine(line, { vertical: false }).isList)
    if (!hasList) return null

    return (
      <Group x={options.offsetX} y={options.offsetY} visible={options.visible} listening={false}>
        {lines.map((line, index) => {
          const parsed = parseListLine(line, { vertical: false })
          if (!parsed.isList || !parsed.type || !parsed.markerText) {
            return (
              <Text
                // biome-ignore lint/suspicious/noArrayIndexKey: line order is stable
                key={`line-${index}`}
                x={options.textX}
                y={options.textY + index * fontSizeMm * lineHeight}
                text={line}
                fontSize={fontSizeMm}
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
                  align === 'l'
                    ? 'left'
                    : align === 'r'
                      ? 'right'
                      : align === 'c'
                        ? 'center'
                        : 'justify'
                }
                verticalAlign={vAlign === 'm' ? 'middle' : vAlign === 'b' ? 'bottom' : 'top'}
                lineHeight={lineHeight}
                width={options.textW}
                listening={false}
              />
            )
          }

          const indentSpaces = ' '.repeat(parsed.indentLength)
          const gapSpaces = ' '.repeat(parsed.gapLength)
          const markerSize = parsed.type === 'number' ? fontSizeMm * numberMarkerScale : fontSizeMm
          const markerYOffset = parsed.type === 'number' ? (fontSizeMm - markerSize) / 2 : 0
          const indentWidth = measureTextMm(indentSpaces, fontSizeMm)
          const markerWidth = measureTextMm(parsed.markerText, markerSize)
          const gapWidth = measureTextMm(gapSpaces, fontSizeMm)

          const lineWidth =
            indentWidth + markerWidth + gapWidth + measureTextMm(parsed.content, fontSizeMm)
          let lineX = options.textX
          if (align === 'c') {
            lineX = options.textX + Math.max(0, (options.textW - lineWidth) / 2)
          } else if (align === 'r') {
            lineX = options.textX + Math.max(0, options.textW - lineWidth)
          }

          const baseY = options.textY + index * fontSizeMm * lineHeight

          return (
            <Group
              // biome-ignore lint/suspicious/noArrayIndexKey: line order is stable
              key={`list-line-${index}`}
            >
              <Text
                x={lineX}
                y={baseY}
                text={indentSpaces}
                fontSize={fontSizeMm}
                fontFamily={font}
                fontStyle={
                  `${italic ? 'italic ' : ''}${fontWeight && fontWeight >= 700 ? 'bold' : ''} `.trim() ||
                  'normal'
                }
                fill={fill}
                lineHeight={lineHeight}
                listening={false}
              />
              <Text
                x={lineX + indentWidth}
                y={baseY + markerYOffset}
                text={parsed.markerText}
                fontSize={markerSize}
                fontFamily={font}
                fontStyle={
                  `${italic ? 'italic ' : ''}${fontWeight && fontWeight >= 700 ? 'bold' : ''} `.trim() ||
                  'normal'
                }
                fill={fill}
                lineHeight={lineHeight}
                listening={false}
              />
              <Text
                x={lineX + indentWidth + markerWidth}
                y={baseY}
                text={gapSpaces}
                fontSize={fontSizeMm}
                fontFamily={font}
                fontStyle={
                  `${italic ? 'italic ' : ''}${fontWeight && fontWeight >= 700 ? 'bold' : ''} `.trim() ||
                  'normal'
                }
                fill={fill}
                lineHeight={lineHeight}
                listening={false}
              />
              <Text
                x={lineX + indentWidth + markerWidth + gapWidth}
                y={baseY}
                text={parsed.content}
                fontSize={fontSizeMm}
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
                lineHeight={lineHeight}
                listening={false}
              />
            </Group>
          )
        })}
      </Group>
    )
  }

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

    const listLayer = !element.vertical
      ? renderListLines({
          offsetX: 0,
          offsetY: 0,
          textX,
          textY,
          textW,
          textH,
          visible: !isEditing,
        })
      : null

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
        {element.vertical ? (
          <>
            <VerticalKonvaText
              node={{ ...element, x: textX, y: textY }}
              // 縦書き: 透明なtextareaで入力するため、編集中もKonva表示を継続
              visible={true}
            />
            {/* 編集中は点滅カレットを表示 */}
            {isEditing &&
              (() => {
                // VerticalKonvaText と同じロジックでカレット位置を計算
                const caretFontSize = fontSize || 16
                const caretPadding = padding
                const columnSpacing = 1.5
                const startX = textW - caretFontSize * (columnSpacing / 2 + 0.5)

                const lines = (text || '').split('\n')
                const columnIndex = lines.length - 1
                const currentLineLength =
                  lines.length > 0 ? Array.from(lines[lines.length - 1] || '').length : 0

                const caretX = textX + startX - columnIndex * (caretFontSize * columnSpacing)
                const caretY = textY + caretPadding + currentLineLength * caretFontSize

                return (
                  <VerticalCaret
                    x={caretX - caretFontSize / 2}
                    y={caretY}
                    width={caretFontSize}
                    visible={true}
                  />
                )
              })()}
          </>
        ) : (
          <>
            {listLayer}
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
                align === 'l'
                  ? 'left'
                  : align === 'r'
                    ? 'right'
                    : align === 'c'
                      ? 'center'
                      : 'justify'
              }
              verticalAlign={vAlign === 'm' ? 'middle' : vAlign === 'b' ? 'bottom' : 'top'}
              lineHeight={lineHeight}
              listening={false} // Let the group handle events
              visible={!listLayer && !isEditing} // Hide underlying text while editing to prevent visual mismatch
            />
          </>
        )}
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

  if (element.vertical) {
    // カレット位置の計算
    // テキストの最後の文字の次の位置に表示
    const caretFontSize = fontSize || 16
    const padding = element.padding || 10
    const columnSpacing = 1.5

    // テキストの行数（改行で分割）
    const lines = (text || '').split('\n')
    const currentLineLength =
      lines.length > 0 ? Array.from(lines[lines.length - 1] || '').length : 0

    // カレット位置（右上から開始、下に進む）
    const startX = (element.w || 100) - padding - caretFontSize * (columnSpacing / 2 + 0.5)
    const columnIndex = lines.length - 1 // 現在の列（0始まり）
    const caretX = startX - columnIndex * (caretFontSize * columnSpacing)
    const caretY = padding + currentLineLength * caretFontSize

    return (
      <Group
        {...commonProps}
        // 編集中はマウスカーソルを縦書き用に変更
        onMouseEnter={(e) => {
          if (isEditing) {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'vertical-text'
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container()
          if (container) container.style.cursor = 'default'
        }}
      >
        {/* 縦書き: 透明なtextareaで入力するため、編集中もKonva表示を継続 */}
        <VerticalKonvaText node={{ ...element, x: 0, y: 0 }} visible={true} />
        {/* 編集中は点滅カレットを表示 */}
        {isEditing && (
          <VerticalCaret
            x={caretX - caretFontSize / 2}
            y={caretY}
            width={caretFontSize}
            visible={true}
          />
        )}
      </Group>
    )
  }

  const listLayer = !element.vertical
    ? renderListLines({
        offsetX: 0,
        offsetY: 0,
        textX: 0,
        textY: 0,
        textW: element.w,
        textH: element.h,
        visible: !isEditing,
      })
    : null

  return (
    <Group {...commonProps}>
      {listLayer}
      <Text
        x={0}
        y={0}
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
        lineHeight={lineHeight}
        width={element.w}
        opacity={listLayer ? 0 : 1}
        visible={!isEditing}
      />
    </Group>
  )
}
