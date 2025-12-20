import { UnifiedNode, LineNode } from '../../../types/canvas'
import { isWHElement } from './elementUtils'
import { getAnchorPointAndDirection, getOrthogonalConnectionPath } from './connectionRouting'

export const getUpdateForConnectedLines = (
    currentElementId: string,
    currentElementGeo: UnifiedNode,
    others: UnifiedNode[]
): (Partial<UnifiedNode> & { id: string })[] => {
    const connected = others.filter(
        (n): n is LineNode =>
            n.t === 'line' &&
            (n.startConn?.nodeId === currentElementId || n.endConn?.nodeId === currentElementId)
    )

    if (connected.length === 0) return []

    const updates: (Partial<UnifiedNode> & { id: string })[] = []

    connected.forEach((ln) => {
        const sId = ln.startConn?.nodeId
        const eId = ln.endConn?.nodeId

        if (!sId || !eId) return

        const sNode = sId === currentElementId ? currentElementGeo : others.find((n) => n.id === sId)
        const eNode = eId === currentElementId ? currentElementGeo : others.find((n) => n.id === eId)

        if (!sNode || !eNode || !isWHElement(sNode) || !isWHElement(eNode)) return

        let nextPts: number[] = []

        if (ln.routing === 'orthogonal') {
            nextPts = getOrthogonalConnectionPath(
                sNode as any,
                ln.startConn?.anchor || 'auto',
                eNode as any,
                ln.endConn?.anchor || 'auto'
            )
        } else {
            const sP = getAnchorPointAndDirection(
                sNode as any,
                ln.startConn?.anchor || 'auto'
            )
            const eP = getAnchorPointAndDirection(
                eNode as any,
                ln.endConn?.anchor || 'auto'
            )
            nextPts = [sP.x, sP.y, eP.x, eP.y]
        }

        const currentPts = ln.pts || []
        if (JSON.stringify(currentPts) !== JSON.stringify(nextPts)) {
            updates.push({
                id: ln.id,
                pts: nextPts,
            })
        }
    })

    return updates
}
