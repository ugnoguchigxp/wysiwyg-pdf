import type { LineNode, UnifiedNode } from '../../../types/canvas'
import { getAnchorPointAndDirection, getOrthogonalConnectionPath } from './connectionRouting'
import { isWHElement } from './elementUtils'

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

    const sGeo = { x: sNode.x, y: sNode.y, w: sNode.w, h: sNode.h, r: sNode.r }
    const eGeo = { x: eNode.x, y: eNode.y, w: eNode.w, h: eNode.h, r: eNode.r }

    let nextPts: number[] = []

    if (ln.routing === 'orthogonal') {
      nextPts = getOrthogonalConnectionPath(
        sGeo,
        ln.startConn?.anchor || 'auto',
        eGeo,
        ln.endConn?.anchor || 'auto'
      )
    } else {
      const sP = getAnchorPointAndDirection(sGeo, ln.startConn?.anchor || 'auto')
      const eP = getAnchorPointAndDirection(eGeo, ln.endConn?.anchor || 'auto')
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
