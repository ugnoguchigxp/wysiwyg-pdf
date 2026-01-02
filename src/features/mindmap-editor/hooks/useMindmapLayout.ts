import { useEffect } from 'react'
import type { UnifiedNode } from '@/types/canvas'
import type { MindmapGraph } from '../types'
import { calculateMindmapLayout } from '../utils/layoutEngine'

type NodeUpdate = Partial<UnifiedNode> & { id: string }

interface UseMindmapLayoutParams {
  graph: MindmapGraph
  collapsedNodes: Set<string>
  onChange: (updates: NodeUpdate[]) => void
  isLayoutActive: boolean
  rootX?: number
  rootY?: number
}

export const useMindmapLayout = ({
  graph,
  collapsedNodes,
  onChange,
  isLayoutActive,
  rootX,
  rootY,
}: UseMindmapLayoutParams) => {
  useEffect(() => {
    if (!isLayoutActive || !graph.rootId) return

    // Run layout calculation
    const result = calculateMindmapLayout(graph, collapsedNodes, {
      horizontalSpacing: 30, // Reduced from 80 (~1/3)
      verticalSpacing: 10,
      rootX: rootX ?? 0,
      rootY: rootY ?? 0,
    })

    // Updates List
    const updatesToApply: NodeUpdate[] = []

    // 1. Check Node Position Diffs
    result.updates.forEach((pos, id) => {
      const node = graph.nodeMap.get(id)
      if (!node) return

      const dx = Math.abs((node.x || 0) - pos.x)
      const dy = Math.abs((node.y || 0) - pos.y)

      if (dx > 1 || dy > 1) {
        // 1px tolerance
        updatesToApply.push({ id, x: pos.x, y: pos.y })
      }
    })

    // 2. Check Line Anchor Diffs
    result.lineUpdates.forEach((anchors, lineId) => {
      const currentLine = graph.linesById.get(lineId)

      if (!currentLine) return

      const currentStart = currentLine.startConn?.anchor
      const currentEnd = currentLine.endConn?.anchor

      if (currentStart !== anchors.startAnchor || currentEnd !== anchors.endAnchor) {
        updatesToApply.push({
          id: lineId,
          startConn: { ...currentLine.startConn!, anchor: anchors.startAnchor },
          endConn: { ...currentLine.endConn!, anchor: anchors.endAnchor },
        })
      }
    })

    if (updatesToApply.length > 0) {
      onChange(updatesToApply)
    }
  }, [graph, collapsedNodes, isLayoutActive, rootX, rootY])
}
