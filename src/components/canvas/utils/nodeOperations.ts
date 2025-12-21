import { UnifiedNode } from '../../../types/canvas'
import { isWHElement } from './elementUtils'
import { getUpdateForConnectedLines } from './lineUtils'

/**
 * Calculates updates for a node movement operation, including:
 * 1. The target node's new position.
 * 2. Updates for any lines connected to the target node.
 * 
 * This ensures that moving a node programmatically or via drag always keeps connections in sync.
 * 
 * @param targetNode - The node being moved
 * @param newPos - The new {x, y} coordinates for the node
 * @param allNodes - All nodes in the current context (used to find connected lines)
 * @returns An array of updates to be applied to the state
 */
export const calculateNodeMoveUpdates = (
    targetNode: UnifiedNode,
    newPos: { x: number; y: number },
    allNodes: UnifiedNode[]
): (Partial<UnifiedNode> & { id: string })[] => {
    const updates: (Partial<UnifiedNode> & { id: string })[] = []

    // 1. Update the target node itself
    let finalX = newPos.x
    let finalY = newPos.y

    // Special handling for centered shapes if needed (replicating logic from useCanvasDrag)
    // Note: useCanvasDrag handled offset adjustment based on drag event relative to center.
    // Here we assume newPos is the constant top-left or center depending on the node type's definition.
    // In strict WYSIWYG models, x/y is usually top-left. 
    // However, the previous logic in useCanvasDrag had a specific adjustment:
    // if (['circle', 'star'...].includes(shape)) { newX -= w/2 }
    // This implies Konva drag reported center, but model stores top-left.
    // We will assume 'newPos' passed here is ALREADY the intended model coordinate (top-left).
    // The caller (UI layer) is responsible for converting mouse/drag position to model position.

    updates.push({
        id: targetNode.id,
        x: finalX,
        y: finalY,
    })

    // 2. Calculate updates for connected lines
    if (isWHElement(targetNode)) {
        // Construct the future state of the node to calculate correct line paths
        const futureNode = { ...targetNode, x: finalX, y: finalY } as UnifiedNode

        const lineUpdates = getUpdateForConnectedLines(targetNode.id, futureNode, allNodes)
        updates.push(...lineUpdates)
    }

    return updates
}
