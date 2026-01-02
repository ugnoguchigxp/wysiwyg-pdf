import type { Anchor } from '@/types/canvas'
import type { MindmapGraph, MindmapLayoutConfig } from '../types'

interface LayoutResult {
  updates: Map<string, { x: number; y: number }>
  // Updated to include pts
  lineUpdates: Map<string, { startAnchor: Anchor; endAnchor: Anchor; pts: number[] }>
}

export const calculateMindmapLayout = (
  graph: MindmapGraph,
  collapsedNodes: Set<string>,
  config: MindmapLayoutConfig = {
    horizontalSpacing: 80, // Increased spacing
    verticalSpacing: 20,
    rootX: 0,
    rootY: 0,
  }
): LayoutResult => {
  const updates = new Map<string, { x: number; y: number }>()
  const lineUpdates = new Map<string, { startAnchor: Anchor; endAnchor: Anchor; pts: number[] }>()
  const { rootId, childrenMap, nodeMap, linesMap } = graph

  if (!rootId) return { updates, lineUpdates }

  const rootNode = nodeMap.get(rootId)
  if (!rootNode) return { updates, lineUpdates }

  const startX = rootNode.x ?? config.rootX

  // 1. Separate Root's children into Left and Right lists
  // Hierarchy: Explicit Dir > Visual Position > Alternating
  const rootChildren = childrenMap.get(rootId) || []
  const rightChildren: string[] = []
  const leftChildren: string[] = []

  rootChildren.forEach((childId, index) => {
    const node = nodeMap.get(childId)
    let side: 'left' | 'right' = 'right'

    if (node?.data?.layoutDir) {
      side = node.data.layoutDir as 'left' | 'right'
    } else if (node && typeof node.x === 'number') {
      // Fallback: visual position
      if (node.x < startX) side = 'left'
      else side = 'right'
    } else {
      // Fallback: Alternating
      side = index % 2 === 0 ? 'right' : 'left'
    }

    if (side === 'right') rightChildren.push(childId)
    else leftChildren.push(childId)
  })

  // Helper to calculate size of a subtree (recursive)
  // Direction needed so we know how to place grandchildren (always away from root)
  const subtreeHeights = new Map<string, number>()

  const calculateHeight = (nodeId: string): number => {
    const isCollapsed = collapsedNodes.has(nodeId)
    const node = nodeMap.get(nodeId)
    const h = node?.h || 40

    if (isCollapsed) {
      subtreeHeights.set(nodeId, h)
      return h
    }

    const children = childrenMap.get(nodeId) || []
    if (children.length === 0) {
      subtreeHeights.set(nodeId, h)
      return h
    }

    let childrenTotalHeight = 0
    children.forEach((childId) => {
      childrenTotalHeight += calculateHeight(childId)
    })

    // Add vertical spacing
    childrenTotalHeight += (children.length - 1) * config.verticalSpacing

    const totalH = Math.max(h, childrenTotalHeight)
    subtreeHeights.set(nodeId, totalH)
    return totalH
  }

  // Pre-calculate heights for all relevant nodes
  rootChildren.forEach((childId) => {
    calculateHeight(childId)
  })

  // 2. Assign positions recursive
  const layoutBranch = (nodeId: string, x: number, y: number, direction: 'left' | 'right') => {
    // Parent Node Position (Current Node)
    updates.set(nodeId, { x, y })

    // We need Parent Dimensions to calculate anchors
    const node = nodeMap.get(nodeId)
    const w = node?.w || 120
    const h = node?.h || 40

    // Handle Line to Parent (if exists) via my ID
    // The line connects ME to MY Parent.
    // My Parent's position is not explicitly passed here, BUT
    // `calculateMindmapLayout` iterates top-down.
    // We can get Parent via parentIdMap, look up its NEW calculated position in 'updates'.
    // If parent position not yet in updates (should be, due to recursion order), fallback to existing?
    // Recursion is Parent -> Children. So Parent is already placed in `updates`.

    const myLine = linesMap.get(nodeId)
    if (myLine) {
      const parentId = graph.parentIdMap.get(nodeId)
      if (parentId) {
        const parentPos = updates.get(parentId) // Should be set by caller
        const parentNode = nodeMap.get(parentId)

        if (parentPos && parentNode) {
          const pW = parentNode.w || 120
          const pH = parentNode.h || 40

          // Calculate Points
          let startX = 0,
            startY = 0,
            endX = 0,
            endY = 0
          let startAnchor: Anchor = 'r'
          let endAnchor: Anchor = 'l'

          if (direction === 'right') {
            // Parent (Left) -> Child (Right)
            startAnchor = 'r'
            endAnchor = 'l'
            startX = parentPos.x + pW
            startY = parentPos.y + pH / 2
            endX = x
            endY = y + h / 2
          } else {
            // Parent (Right) -> Child (Left)
            startAnchor = 'l'
            endAnchor = 'r'
            startX = parentPos.x
            startY = parentPos.y + pH / 2
            endX = x + w
            endY = y + h / 2
          }

          // S-Shape (bezier-like orthogonal) or Step
          // P -> Mid -> Mid -> C
          const midX = (startX + endX) / 2
          const pts = [startX, startY, midX, startY, midX, endY, endX, endY]

          lineUpdates.set(myLine.id, { startAnchor, endAnchor, pts })
        }
      }
    }

    const isCollapsed = collapsedNodes.has(nodeId)
    if (isCollapsed) return

    const children = childrenMap.get(nodeId) || []
    if (children.length === 0) return

    // Calculate vertical start based on children block height
    let childrenBlockHeight = 0
    for (const c of children) {
      childrenBlockHeight += subtreeHeights.get(c) || 0
    }
    childrenBlockHeight += (children.length - 1) * config.verticalSpacing

    const parentCenterY = y + h / 2
    let currentChildY = parentCenterY - childrenBlockHeight / 2

    children.forEach((childId) => {
      const childH = subtreeHeights.get(childId) || 0
      const childNode = nodeMap.get(childId)
      const childW = childNode?.w || 120
      const childH_Node = childNode?.h || 40

      const childTop = currentChildY + childH / 2 - childH_Node / 2

      // Calculate X
      // If Right: ParentX + ParentW + Spacing
      // If Left: ParentX - Spacing - ChildW
      let childX = 0
      if (direction === 'right') {
        childX = x + w + config.horizontalSpacing
      } else {
        childX = x - config.horizontalSpacing - childW
      }

      layoutBranch(childId, childX, childTop, direction)

      currentChildY += childH + config.verticalSpacing
    })
  }

  // Place Root
  const startY = rootNode.y ?? config.rootY
  // Place Root immediately
  updates.set(rootId, { x: startX, y: startY })

  const rootW = rootNode.w || 120
  const rootH = rootNode.h || 40
  const rootCenterY = startY + rootH / 2

  // Layout Right Subtrees
  // We need to stack them vertically on the right side
  let rightBlockHeight = 0
  for (const c of rightChildren) {
    rightBlockHeight += subtreeHeights.get(c) || 0
  }
  rightBlockHeight += Math.max(0, rightChildren.length - 1) * config.verticalSpacing

  let currentRightY = rootCenterY - rightBlockHeight / 2
  rightChildren.forEach((childId) => {
    const h = subtreeHeights.get(childId) || 0
    const node = nodeMap.get(childId)
    const nodeH = node?.h || 40

    // Position 1st level node
    const nodeTop = currentRightY + h / 2 - nodeH / 2
    const nodeX = startX + rootW + config.horizontalSpacing

    layoutBranch(childId, nodeX, nodeTop, 'right')
    currentRightY += h + config.verticalSpacing
  })

  // Layout Left Subtrees
  let leftBlockHeight = 0
  for (const c of leftChildren) {
    leftBlockHeight += subtreeHeights.get(c) || 0
  }
  leftBlockHeight += Math.max(0, leftChildren.length - 1) * config.verticalSpacing

  let currentLeftY = rootCenterY - leftBlockHeight / 2
  leftChildren.forEach((childId) => {
    const h = subtreeHeights.get(childId) || 0
    const node = nodeMap.get(childId)
    const nodeH = node?.h || 40
    const nodeW = node?.w || 120

    const nodeTop = currentLeftY + h / 2 - nodeH / 2
    // For Left, X is RootX - Spacing - NodeW
    const nodeX = startX - config.horizontalSpacing - nodeW

    layoutBranch(childId, nodeX, nodeTop, 'left')
    currentLeftY += h + config.verticalSpacing
  })

  return { updates, lineUpdates }
}
