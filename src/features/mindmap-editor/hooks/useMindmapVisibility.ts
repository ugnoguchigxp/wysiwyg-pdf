import { useMemo } from 'react'
import type { Doc, LineNode } from '@/types/canvas'
import type { MindmapGraph } from '../types'

export const useMindmapVisibility = (
    doc: Doc,
    graph: MindmapGraph,
    collapsedNodes: Set<string>
) => {
    const visibleNodes = useMemo(() => {
        // 1. Identify visible node IDs
        const visibleNodeIds = new Set<string>()
        doc.nodes.forEach((node) => {
            if (node.t === 'line') return

            // Check visibility
            let isVisible = true
            let curr = graph.parentIdMap.get(node.id)
            while (curr) {
                if (collapsedNodes.has(curr)) {
                    isVisible = false
                    break
                }
                curr = graph.parentIdMap.get(curr)
            }

            if (isVisible) {
                visibleNodeIds.add(node.id)
            }
        })

        // 2. Filter nodes and lines
        const filtered = doc.nodes.filter((node) => {
            if (node.t === 'line') {
                const lineNode = node as LineNode
                const childId = lineNode.endConn?.nodeId
                const parentId = lineNode.startConn?.nodeId
                return childId && visibleNodeIds.has(childId) && parentId && visibleNodeIds.has(parentId)
            }
            return visibleNodeIds.has(node.id)
        })

        // 3. Inject metadata (for UI indicators like +/- buttons)
        return filtered.map((node) => {
            if (graph.childrenMap.has(node.id)) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        hasChildren: true,
                        isCollapsed: collapsedNodes.has(node.id),
                    },
                }
            }
            return node
        })
    }, [doc.nodes, graph, collapsedNodes])

    return visibleNodes
}
