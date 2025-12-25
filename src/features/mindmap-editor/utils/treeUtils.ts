import type { UnifiedNode, LineNode } from '@/types/canvas'
import type { MindmapGraph } from '../types'

export const buildMindmapGraph = (nodes: UnifiedNode[]): MindmapGraph => {
  const nodeMap = new Map<string, UnifiedNode>()
  const linesMap = new Map<string, LineNode>()
  const childrenMap = new Map<string, string[]>()
  const parentIdMap = new Map<string, string>()
  const potentialRoots = new Set<string>()

  // 1. Index all nodes and lines
  nodes.forEach((node) => {
    if (node.t === 'line') {
      // Index lines based on endConn (child) -> startConn (parent)
      const line = node as LineNode
      if (line.startConn?.nodeId && line.endConn?.nodeId) {
        // We assume endConn points to the CHILD and startConn points to the PARENT
        // This directionality is arbitrary but must be consistent.
        // Let's assume generic Mindmaps flow: Parent -> Child
        // In free layout, standard lines might vary, but for Mindmap logic we enforce this.
        const childId = line.endConn.nodeId
        const parentId = line.startConn.nodeId
        linesMap.set(childId, line)

        parentIdMap.set(childId, parentId)

        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, [])
        }
        childrenMap.get(parentId)!.push(childId)
      }
    } else {
      nodeMap.set(node.id, node)
      potentialRoots.add(node.id)
    }
  })

  // 2. Identify Root(s)
  // A root is a node that has no parent line pointing to it.
  // In a strict single-root MindMap, we might pick the first one or one with a 'root' tag.
  // For now, we take the node that is not a child of anyone as the root.
  let rootId: string | null = null

  for (const nodeId of potentialRoots) {
    if (!parentIdMap.has(nodeId)) {
      rootId = nodeId
      // For now, support single root. If multiple, we might pick the 'main' one or first found.
      // Ideally we check for a specific tag 'mindmap-root'
      const node = nodeMap.get(nodeId)
      if (node?.tags?.includes('root')) {
        break
      }
    }
  }

  // Fallback: if multiple roots exist and none tagged, pick first
  if (!rootId && potentialRoots.size > 0) {
    rootId = Array.from(potentialRoots)[0]
  }

  // 3. Calculate Depth
  const depthMap = new Map<string, number>()
  if (rootId) {
    calculateDepth(rootId, 0, childrenMap, depthMap)
  }

  // 4. Create Line ID Map for quick lookup
  const linesById = new Map<string, LineNode>()
  linesMap.forEach((line) => {
    linesById.set(line.id, line)
  })

  return {
    rootId,
    parentIdMap,
    childrenMap,
    nodeMap,
    linesMap,
    linesById,
    depthMap,
    isAncestor: (ancestorId: string, descendantId: string) =>
      isAncestor(ancestorId, descendantId, parentIdMap),
  }
}

const calculateDepth = (
  nodeId: string,
  depth: number,
  childrenMap: Map<string, string[]>,
  depthMap: Map<string, number>
) => {
  depthMap.set(nodeId, depth)
  const children = childrenMap.get(nodeId) || []
  children.forEach((childId) => {
    calculateDepth(childId, depth + 1, childrenMap, depthMap)
  })
}

export const getSubtreeIds = (rootId: string, childrenMap: Map<string, string[]>): string[] => {
  const result: string[] = [rootId]
  const children = childrenMap.get(rootId) || []
  children.forEach((child) => {
    result.push(...getSubtreeIds(child, childrenMap))
  })
  return result
}

export const isAncestor = (
  ancestorId: string,
  descendantId: string,
  parentIdMap: Map<string, string>
): boolean => {
  let currentId = parentIdMap.get(descendantId)
  while (currentId) {
    if (currentId === ancestorId) return true
    currentId = parentIdMap.get(currentId)
  }
  return false
}
