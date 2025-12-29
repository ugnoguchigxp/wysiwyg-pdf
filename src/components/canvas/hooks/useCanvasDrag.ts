import type Konva from 'konva'
import { useCallback } from 'react'
import type { LineNode, ShapeNode, UnifiedNode } from '../../../types/canvas'
import { isWHElement } from '../utils/elementUtils'
import { getAnchorPointAndDirection, getOrthogonalConnectionPath } from '../utils/connectionRouting'
import { calculateNodeMoveUpdates } from '../utils/nodeOperations'

interface UseCanvasDragProps {
    element: UnifiedNode
    allElements?: UnifiedNode[]
    onChange: (
        newAttrs:
            | (Partial<UnifiedNode> & { id?: string })
            | (Partial<UnifiedNode> & { id?: string })[]
    ) => void
}

export const useCanvasDrag = ({ element, allElements, onChange }: UseCanvasDragProps) => {

    const handleDragEnd = useCallback(
        (e: Konva.KonvaEventObject<DragEvent>) => {
            if (isWHElement(element)) {
                // Ensure we are dragging the node itself, not some internal part that might have 0,0 relative x/y
                // currentTarget is the node the listener is attached to (the draggable group/shape)
                const node = e.currentTarget
                let newX = node.x()
                let newY = node.y()

                console.log(`[useCanvasDrag] handleDragEnd for ${element.t}:${element.id}`, { x: newX, y: newY })

                if (element.t === 'shape') {
                    if (['circle', 'star', 'pentagon', 'hexagon'].includes((element as ShapeNode).shape as string)) {
                        newX -= element.w / 2
                        newY -= element.h / 2
                    }
                }

                const updates = calculateNodeMoveUpdates(
                    element,
                    { x: newX, y: newY },
                    allElements || []
                )

                // Batch commit
                onChange(updates)
            } else if (element.t === 'line') {
                // Line Dragging (Translate whole line)
                // Note: Automatic routing usually disables manual drag of points if constrained?
                // But if user drags the WHOLE line, we shift it. 
                // If it's connected, it might re-route on next node move? 
                // Actually, if connected, dragging the line object itself might need to detach?
                // For now preventing detachment logic, just standard move.
                const node = e.currentTarget
                const dx = node.x()
                const dy = node.y()
                const line = element as LineNode

                const newPts = line.pts.map((p, i) => (i % 2 === 0 ? p + dx : p + dy))

                onChange({
                    id: element.id,
                    pts: newPts,
                })

                node.x(0)
                node.y(0)
            }
        },
        [element, onChange, allElements]
    )

    const handleDragMove = useCallback(
        (e: Konva.KonvaEventObject<DragEvent>) => {
            if (!isWHElement(element)) return
            if (!allElements || allElements.length === 0) return

            const stage = e.currentTarget.getStage()
            if (!stage) return

            const w = element.w ?? 0
            const h = element.h ?? 0
            let topLeftX = e.currentTarget.x()
            let topLeftY = e.currentTarget.y()

            if (element.t === 'shape') {
                const shape = element as ShapeNode
                if (['circle', 'star', 'pentagon', 'hexagon'].includes(shape.shape as string)) {
                    topLeftX = topLeftX - w / 2
                    topLeftY = topLeftY - h / 2
                }
            }

            // Identify connected lines
            const connected = allElements.filter(
                (n): n is LineNode =>
                    n.t === 'line' &&
                    (n.startConn?.nodeId === element.id || n.endConn?.nodeId === element.id)
            )

            if (connected.length === 0) return

            // Temporary Geo
            const currentGeo = { ...element, x: topLeftX, y: topLeftY } as UnifiedNode

            // We re-use logic but instead of returning updates, we apply them to Konva Nodes
            connected.forEach((ln) => {
                const lineGroup = stage.findOne(`#${ln.id}`) as Konva.Group | null
                if (!lineGroup) return
                const lineBody = lineGroup.findOne('.line-body') as Konva.Line | null
                if (!lineBody) return

                const sId = ln.startConn?.nodeId
                const eId = ln.endConn?.nodeId
                if (!sId || !eId) return

                const sNode = sId === element.id ? currentGeo : allElements.find((n) => n.id === sId)
                const eNode = eId === element.id ? currentGeo : allElements.find((n) => n.id === eId)

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

                // Update View
                if (!nextPts || nextPts.length < 4) return
                const endIdx = nextPts.length - 2
                lineBody.points(nextPts)

                // Update markers/handles
                let dxStart = nextPts[2] - nextPts[0]
                let dyStart = nextPts[3] - nextPts[1]
                if (nextPts.length <= 2) {
                    dxStart = nextPts[endIdx] - nextPts[0]
                    dyStart = nextPts[endIdx + 1] - nextPts[1]
                }

                let dxEnd = nextPts[endIdx] - nextPts[endIdx - 2]
                let dyEnd = nextPts[endIdx + 1] - nextPts[endIdx - 1]
                if (nextPts.length <= 2) {
                    dxEnd = dxStart
                    dyEnd = dyStart
                }

                const angleStart = Math.atan2(dyStart, dxStart) + Math.PI
                const angleEnd = Math.atan2(dyEnd, dxEnd)

                const startHandle = lineGroup.findOne('.line-handle-start') as Konva.Circle | null
                if (startHandle) startHandle.position({ x: nextPts[0], y: nextPts[1] })
                const endHandle = lineGroup.findOne('.line-handle-end') as Konva.Circle | null
                if (endHandle) endHandle.position({ x: nextPts[endIdx], y: nextPts[endIdx + 1] })

                const startMarker = lineGroup.findOne('.line-marker-start') as Konva.Group | null
                if (startMarker) {
                    startMarker.position({ x: nextPts[0], y: nextPts[1] })
                    startMarker.rotation((angleStart * 180) / Math.PI)
                }
                const endMarker = lineGroup.findOne('.line-marker-end') as Konva.Group | null
                if (endMarker) {
                    endMarker.position({ x: nextPts[endIdx], y: nextPts[endIdx + 1] })
                    endMarker.rotation((angleEnd * 180) / Math.PI)
                }

            })

            stage.batchDraw()
        },
        [element, allElements]
    )

    return { handleDragEnd, handleDragMove }
}
