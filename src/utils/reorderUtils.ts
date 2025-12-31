import type { UnifiedNode } from '@/types/canvas'

export const reorderNodes = (
    nodes: UnifiedNode[],
    targetId: string,
    action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward'
): UnifiedNode[] => {
    const currentIndex = nodes.findIndex((n) => n.id === targetId)
    if (currentIndex === -1) return nodes

    const newNodes = [...nodes]
    const [target] = newNodes.splice(currentIndex, 1)

    switch (action) {
        case 'bringToFront':
            newNodes.push(target)
            break
        case 'sendToBack':
            newNodes.unshift(target)
            break
        case 'bringForward':
            if (currentIndex < nodes.length - 1) {
                newNodes.splice(currentIndex + 1, 0, target)
            } else {
                newNodes.push(target)
            }
            break
        case 'sendBackward':
            if (currentIndex > 0) {
                newNodes.splice(currentIndex - 1, 0, target)
            } else {
                newNodes.unshift(target)
            }
            break
    }
    return newNodes
}
