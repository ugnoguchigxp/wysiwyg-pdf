import { UnifiedNode, LineNode } from '@/types/canvas'

export interface MindmapGraph {
  rootId: string | null
  parentIdMap: Map<string, string> // node ID -> parent ID
  childrenMap: Map<string, string[]> // node ID -> children IDs
  nodeMap: Map<string, UnifiedNode> // node ID -> Node object
  linesMap: Map<string, LineNode> // child ID -> LineNode connecting to parent
  linesById: Map<string, LineNode> // Line ID -> LineNode
  depthMap: Map<string, number> // node ID -> depth level (0 = root)
}

export interface MindmapLayoutConfig {
  horizontalSpacing: number
  verticalSpacing: number
  rootX: number
  rootY: number
}

// Runtime-only state for UI (folding, etc.) - managed separately or in similar maps
export interface MindmapUIState {
  collapsedNodes: Set<string> // IDs of nodes that are collapsed
}
