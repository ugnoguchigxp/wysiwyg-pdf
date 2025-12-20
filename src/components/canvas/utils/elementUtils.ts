import type { Anchor, UnifiedNode } from '../../../types/canvas'

export const isWHElement = (
    node: UnifiedNode
): node is Extract<UnifiedNode, { w: number; h: number; x: number; y: number }> => {
    return node.t !== 'line'
}

export const getAnchorPoint = (
    anchor: Anchor,
    x: number,
    y: number,
    w: number,
    h: number
): { x: number; y: number } => {
    switch (anchor) {
        case 'tl':
            return { x, y }
        case 't':
            return { x: x + w / 2, y }
        case 'tr':
            return { x: x + w, y }
        case 'l':
            return { x, y: y + h / 2 }
        case 'r':
            return { x: x + w, y: y + h / 2 }
        case 'bl':
            return { x, y: y + h }
        case 'b':
            return { x: x + w / 2, y: y + h }
        case 'br':
            return { x: x + w, y: y + h }
        default:
            return { x: x + w / 2, y: y + h / 2 }
    }
}
