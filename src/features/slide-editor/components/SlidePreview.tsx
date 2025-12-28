import React from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import { CanvasElementRenderer } from '@/components/canvas/CanvasElementRenderer'
import type { UnifiedNode, Surface } from '@/types/canvas'

interface SlidePreviewProps {
    width: number
    height: number
    surface: Surface
    nodes: UnifiedNode[]
    scale?: number // Optional forced scale, otherwise calculated to fit
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({
    width,
    height,
    surface,
    nodes,
}) => {
    // 1. Calculate Scale to fit container
    // Surface dimensions are in mm. Container is in px.
    // We want to map surface.w (mm) -> width (px)

    // Check for 0 dimensions to avoid Infinity
    if (!surface.w || !surface.h || !width || !height) return null

    const scaleX = width / surface.w
    const scaleY = height / surface.h
    // Uniform scale to fit
    const scale = Math.min(scaleX, scaleY)

    // Center the content
    const contentWidthPx = surface.w * scale
    const contentHeightPx = surface.h * scale

    const x = (width - contentWidthPx) / 2
    const y = (height - contentHeightPx) / 2

    const noOp = () => { }

    return (
        <Stage
            width={width}
            height={height}
            scaleX={scale}
            scaleY={scale}
            x={x}
            y={y}
            style={{ pointerEvents: 'none' }} // Disable all interactions
        >
            <Layer>
                {/* Background */}
                <Rect
                    x={0}
                    y={0}
                    width={surface.w} // in mm, scaled by Stage
                    height={surface.h}
                    fill={surface.bg}
                />

                {/* Nodes */}
                {nodes.map(node => (
                    <CanvasElementRenderer
                        key={node.id}
                        element={node}
                        isSelected={false}
                        readOnly={true}
                        allElements={nodes}
                        stageScale={scale} // Important for text rendering resolution
                        // No-ops for required props
                        onSelect={noOp}
                        onChange={noOp}
                        onDblClick={noOp}
                        onCellClick={noOp}
                        onCellDblClick={noOp}
                        onContextMenu={noOp}
                        isEditing={false}
                        onToggleCollapse={noOp}
                    />
                ))}
            </Layer>
        </Stage>
    )
}
