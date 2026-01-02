import type { CellHorizontalAlign, CellVerticalAlign, RichTextFragment } from '@/types/canvas'
import type React from 'react'
import { useMemo } from 'react'
import { Group, Text } from 'react-konva'
import { calculateRichTextLayout } from './richTextLayout'

interface RichTextRendererProps {
    fragments: RichTextFragment[]
    x: number
    y: number
    width: number
    height: number
    align: CellHorizontalAlign
    vAlign: CellVerticalAlign
    defaultFontSize: number
    defaultFontFamily: string
    defaultColor: string
    keyPrefix: string
    wrap?: boolean
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
    fragments,
    x,
    y,
    width,
    height,
    align,
    vAlign,
    defaultFontSize,
    defaultFontFamily,
    defaultColor,
    keyPrefix,
    wrap = false,
}) => {
    // Memoize layout calculation to avoid re-calculation on every render cycle
    // Only re-calculate if layout properties change
    const nodes = useMemo(() => {
        return calculateRichTextLayout(
            fragments,
            width,
            height,
            align,
            vAlign,
            defaultFontSize,
            defaultFontFamily,
            defaultColor,
            wrap
        )
    }, [
        fragments,
        width,
        height,
        align,
        vAlign,
        defaultFontSize,
        defaultFontFamily,
        defaultColor,
        wrap,
    ])

    return (
        <Group>
            {nodes.map((node, i) => (
                <Text
                    key={`${keyPrefix}_rf_${i}`}
                    x={x + node.x}
                    y={y + node.y}
                    width={node.width + 1}
                    height={node.height}
                    text={node.text}
                    fontFamily={node.fam}
                    fontSize={node.fs}
                    fill={node.color}
                    fontStyle={`${node.bold ? 'bold ' : ''}${node.italic ? 'italic' : ''}`.trim()}
                    textDecoration={node.strike ? 'line-through' : node.underline ? 'underline' : undefined}
                    verticalAlign="bottom"
                    listening={false}
                />
            ))}
        </Group>
    )
}
