import type Konva from 'konva'
import type React from 'react'
import type { UnifiedNode } from '../../types/canvas'

export type CanvasShapeRefCallback = (node: Konva.Node | null) => void

export type CanvasElementCommonProps = Konva.NodeConfig & {
    ref: CanvasShapeRefCallback
}

export interface CanvasElementRendererProps {
    element: UnifiedNode
    isSelected: boolean
    onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
    onChange: (
        newAttrs:
            | (Partial<UnifiedNode> & { id?: string })
            | (Partial<UnifiedNode> & { id?: string })[]
    ) => void
    onDblClick?: () => void
    onCellDblClick?: (elementId: string, row: number, col: number) => void
    onCellClick?: (elementId: string, row: number, col: number) => void
    onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void
    editingCell?: { elementId: string; row: number; col: number } | null
    selectedCell?: { row: number; col: number } | null
    isEditing?: boolean
    snapStrength?: number
    gridSize?: number
    showGrid?: boolean
    readOnly?: boolean
    allElements?: UnifiedNode[]
    stageScale?: number
    renderCustom?: (
        element: UnifiedNode,
        commonProps: CanvasElementCommonProps,
        shapeRef: CanvasShapeRefCallback
    ) => React.ReactNode
}
