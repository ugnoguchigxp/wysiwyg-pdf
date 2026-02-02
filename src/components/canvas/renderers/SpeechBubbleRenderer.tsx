import type React from 'react'
import { useMemo, useRef } from 'react'
import { Ellipse, Group, Path, Rect, Text, Line as KonvaLine } from 'react-konva'
import type Konva from 'konva'
import { VerticalKonvaText } from '@/features/vertical-text'
import type { SpeechBubbleNode, Surface } from '@/types/canvas'
import { ptToMm } from '@/utils/units'
import type { CanvasElementCommonProps } from '../types'

const DEFAULT_FONT_SIZE_MM = ptToMm(12)
const DEFAULT_PADDING_MM = 5

interface SpeechBubbleRendererProps {
    element: SpeechBubbleNode
    commonProps: CanvasElementCommonProps
    isEditing?: boolean
    invScale: number
    displayLanguage?: string // Language code for translations (e.g., 'en', 'ja')
}

export const SpeechBubbleRenderer: React.FC<SpeechBubbleRendererProps> = ({
    element,
    commonProps,
    isEditing,
    invScale,
    displayLanguage,
}) => {
    const {
        w,
        h,
        shapeType,
        originalText,
        translations,
        font,
        fontSize = DEFAULT_FONT_SIZE_MM,
        fontWeight,
        italic,
        underline,
        lineThrough,
        fill,
        align,
        vAlign,
        backgroundColor,
        borderColor = (element as any).borderColor ?? (element as any).stroke,
        borderWidth = (element as any).borderWidth ?? (element as any).strokeW,
        padding = DEFAULT_PADDING_MM,
        vertical,
        autoFit,
    } = element as any

    const textRef = useRef<Konva.Text | null>(null)

    const bubbleShapeProps = useMemo(() => {
        const hasFrame = element.hasFrame ?? true
        return {
            fill: backgroundColor || '#ffffff',
            stroke: borderColor || '#000000',
            strokeWidth: hasFrame ? (borderWidth ?? 0.5) : 0,
            strokeEnabled: hasFrame,
        }
    }, [backgroundColor, borderColor, borderWidth, element.hasFrame])

    const renderBubbleShape = () => {
        switch (shapeType) {
            case 'rectangle':
                return <Rect width={w} height={h} cornerRadius={vertical ? 0 : 10} {...bubbleShapeProps} />
            case 'custom':
                return (
                    <KonvaLine
                        points={element.pathPoints || []}
                        closed={true}
                        {...bubbleShapeProps}
                    />
                )
            default:
                return null
        }
    }

    const textX = padding
    const textY = padding
    const textW = Math.max(0, w - padding * 2)
    const textH = Math.max(0, h - padding * 2)

    const fontStyle = useMemo(() => {
        const styles = []
        if (italic) styles.push('italic')
        if (fontWeight && fontWeight >= 700) styles.push('bold')
        return styles.join(' ') || 'normal'
    }, [italic, fontWeight])

    const textDecoration = useMemo(() => {
        const decorations = []
        if (underline) decorations.push('underline')
        if (lineThrough) decorations.push('line-through')
        return decorations.join(' ')
    }, [underline, lineThrough])

    const textAlign = useMemo(() => {
        switch (align) {
            case 'l': return 'left'
            case 'r': return 'right'
            case 'c': return 'center'
            case 'j': return 'justify'
            default: return 'left'
        }
    }, [align])

    const verticalAlign = useMemo(() => {
        switch (vAlign) {
            case 'm': return 'middle'
            case 'b': return 'bottom'
            case 't': return 'top'
            default: return 'top'
        }
    }, [vAlign])

    // Get display text (translated or original)
    const displayText = useMemo(() => {
        if (displayLanguage && translations[displayLanguage]) {
            return translations[displayLanguage]
        }
        return originalText
    }, [originalText, translations, displayLanguage])

    // Create a partial TextNode-compatible object for VerticalKonvaText
    const verticalTextProps = {
        t: 'text' as const,
        id: element.id,
        s: element.s,
        x: 0,
        y: 0,
        w: w,
        h: h,
        text: displayText,
        fontSize: fontSize,
        font: font || 'Arial',
        fill: fill || '#000000',
        padding,
        align,
        vAlign,
        fontWeight,
        italic,
        underline,
        lineThrough,
    }

    return (
        <Group {...commonProps}>
            {renderBubbleShape()}
            {!isEditing && displayText && (
                <Group
                    clipFunc={(ctx) => {
                        if (shapeType === 'rectangle') {
                            ctx.rect(0, 0, w, h)
                        } else if (shapeType === 'custom' && element.pathPoints) {
                            const pts = element.pathPoints
                            if (pts.length >= 2) {
                                ctx.moveTo(pts[0], pts[1])
                                for (let i = 2; i < pts.length; i += 2) {
                                    ctx.lineTo(pts[i], pts[i + 1])
                                }
                                ctx.closePath()
                            }
                        }
                    }}
                >
                    {vertical ? (
                        <VerticalKonvaText
                            node={verticalTextProps}
                            visible={!element.hidden}
                        />
                    ) : (
                        <Text
                            ref={textRef}
                            x={textX}
                            y={textY}
                            width={textW}
                            height={textH}
                            text={displayText}
                            fontSize={fontSize}
                            fontFamily={font || 'Arial'}
                            fontStyle={fontStyle}
                            textDecoration={textDecoration}
                            fill={fill || '#000000'}
                            align={textAlign}
                            verticalAlign={verticalAlign}
                            lineHeight={1.2}
                            wrap="word"
                            listening={false}
                        />
                    )}
                </Group>
            )}
        </Group>
    )
}
