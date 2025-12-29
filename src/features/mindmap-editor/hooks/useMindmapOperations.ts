import { useCallback } from 'react'
import type { Doc, LineNode, TextNode, UnifiedNode } from '@/types/canvas'
import type { MindmapGraph } from '../types'
import { getSubtreeIds } from '../utils/treeUtils'
import { generateNodeId } from '@/utils/id'

type NodeUpdate = Partial<UnifiedNode> & { id: string }



interface UseMindmapOperationsParams {
  setDoc: (
    doc: Doc | ((prev: Doc) => Doc),
    options?: { saveToHistory?: boolean; force?: boolean }
  ) => void
  graph: MindmapGraph
  selectedNodeId: string | null
  onSelect?: (id: string) => void
}

export const useMindmapOperations = ({
  setDoc,
  graph,
  selectedNodeId,
  onSelect,
}: UseMindmapOperationsParams) => {
  const addChildNode = useCallback(() => {
    if (!selectedNodeId) return

    setDoc((prev) => {
      const parent = prev.nodes.find((n) => n.id === selectedNodeId)
      if (!parent) return prev

      // Balancing logic for Root children
      let layoutDir: 'left' | 'right' | undefined
      if (selectedNodeId === graph.rootId) {
        const children = graph.childrenMap.get(selectedNodeId) || []
        let leftCount = 0
        let rightCount = 0
        children.forEach((childId) => {
          const child = prev.nodes.find((n) => n.id === childId)
          if (child) {
            const dir =
              child.data?.layoutDir || ((child.x || 0) < (parent.x || 0) ? 'left' : 'right')
            if (dir === 'left') leftCount++
            else rightCount++
          }
        })
        layoutDir = rightCount <= leftCount ? 'right' : 'left'
      }

      const newId = generateNodeId(prev, 'text')
      const linkId = generateNodeId({ ...prev, nodes: [...prev.nodes, { id: newId } as UnifiedNode] }, 'line')

      const newNode: TextNode = {
        id: newId,
        t: 'text',
        s: parent.s,
        x: (parent.x || 0) + 40, // Initial placement
        y: parent.y || 0,
        w: 30,
        h: 10,
        text: 'New Topic',
        align: 'c',
        backgroundColor: '#ffffff',
        borderColor: '#64748b',
        borderWidth: 0.5,
        padding: 2,
        fontSize: 4.23,
        locked: true,
        data: layoutDir ? { layoutDir } : undefined,
      }

      const newLink: LineNode = {
        id: linkId,
        t: 'line',
        s: parent.s,
        pts: [0, 0, 0, 0],
        stroke: '#94a3b8',
        strokeW: 1,
        routing: 'orthogonal',
        startConn: { nodeId: selectedNodeId, anchor: 'auto' },
        endConn: { nodeId: newId, anchor: 'auto' },
        locked: true,
      }

      // AutoSelect new node
      if (onSelect) {
        // We need to defer this slightly to avoid state batching conflicts or race conditions
        // but since we are inside setDoc updater, we should just call it.
        // However, setDoc is async in nature as it is setState.
        // Ideally use useEffect or a layout effect, but a timeout works for interaction.
        requestAnimationFrame(() => onSelect(newId))
      }

      return {
        ...prev,
        nodes: [...prev.nodes, newNode, newLink] as UnifiedNode[],
      }
    })
  }, [selectedNodeId, graph, onSelect])

  const addSiblingNode = useCallback(() => {
    if (!selectedNodeId || !graph.rootId || selectedNodeId === graph.rootId) return

    const parentId = graph.parentIdMap.get(selectedNodeId)
    if (!parentId) return

    setDoc((prev) => {
      const parent = prev.nodes.find((n) => n.id === parentId)
      if (!parent) return prev

      // Determine Layout Dir (Inherit from sibling)
      let layoutDir: 'left' | 'right' | undefined
      if (parentId === graph.rootId) {
        const sibling = prev.nodes.find((n) => n.id === selectedNodeId)
        if (sibling) {
          if (sibling.data?.layoutDir) {
            layoutDir = sibling.data.layoutDir as 'left' | 'right'
          } else {
            // Fallback to current visual side
            layoutDir = (sibling.x || 0) < (parent.x || 0) ? 'left' : 'right'
          }
        }
      }

      const newId = generateNodeId(prev, 'text')
      const linkId = generateNodeId({ ...prev, nodes: [...prev.nodes, { id: newId } as UnifiedNode] }, 'line')

      const newNode: TextNode = {
        id: newId,
        t: 'text',
        s: parent.s,
        x: (parent.x || 0) + 40,
        y: (parent.y || 0) + 20,
        w: 30,
        h: 10,
        text: 'New Topic',
        align: 'c',
        backgroundColor: '#ffffff',
        borderColor: '#334155',
        borderWidth: 0.5,
        padding: 2,
        fontSize: 4.23,
        locked: true,
        data: layoutDir ? { layoutDir } : undefined,
      }

      const newLink: LineNode = {
        id: linkId,
        t: 'line',
        s: parent.s,
        pts: [0, 0, 0, 0],
        stroke: '#94a3b8',
        strokeW: 1,
        routing: 'orthogonal',
        startConn: { nodeId: parentId, anchor: 'auto' },
        endConn: { nodeId: newId, anchor: 'auto' },
        locked: true,
      }

      // Insert new node after current selected node
      // The order of children is determined by the order of LineNodes in the nodes array
      // Find the LineNode that connects to the selected node and insert after it
      const nodes = [...prev.nodes]

      // Find the line that connects parent -> selectedNode
      const selectedLineIndex = nodes.findIndex(
        (n) => n.t === 'line' && (n as LineNode).endConn?.nodeId === selectedNodeId
      )

      if (selectedLineIndex !== -1) {
        // Insert new Line after the selected node's line (this determines sibling order)
        nodes.splice(selectedLineIndex + 1, 0, newLink)
        // Insert new TextNode at the end (position doesn't matter for layout, only Line order)
        nodes.push(newNode)
      } else {
        nodes.push(newNode, newLink)
      }

      if (onSelect) {
        requestAnimationFrame(() => onSelect(newId))
      }

      return {
        ...prev,
        nodes,
      }
    })
  }, [selectedNodeId, graph, onSelect])

  const updateNodes = useCallback(
    (updates: NodeUpdate[]) => {
      setDoc((prev) => {
        if (updates.length === 0) return prev
        const updateMap = new Map(updates.map((u) => [u.id, u]))

        const newNodes = prev.nodes.map((node) => {
          if (updateMap.has(node.id)) {
            const update = updateMap.get(node.id)!
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...rest } = update
            return { ...node, ...rest }
          }
          return node
        })

        return {
          ...prev,
          nodes: newNodes as UnifiedNode[],
        }
      })
    },
    [setDoc]
  )

  const deleteNode = useCallback(() => {
    if (!selectedNodeId) return
    // Don't delete root for now
    if (selectedNodeId === graph.rootId) return

    setDoc((prev) => {
      const node = prev.nodes.find((n) => n.id === selectedNodeId)
      if (!node) return prev

      // Get all descendants to delete
      const idsToDelete = new Set(getSubtreeIds(selectedNodeId, graph.childrenMap))

      // Filter out deleted nodes and their connected lines
      const remainingNodes = prev.nodes.filter((n) => {
        if (idsToDelete.has(n.id)) return false
        if (n.t === 'line') {
          const line = n as LineNode
          // Remove lines connected to deleted nodes
          if (
            (line.startConn?.nodeId && idsToDelete.has(line.startConn.nodeId)) ||
            (line.endConn?.nodeId && idsToDelete.has(line.endConn.nodeId))
          ) {
            return false
          }
        }
        return true
      })

      return {
        ...prev,
        nodes: remainingNodes,
      }
    })
  }, [selectedNodeId, graph])

  const removeChildNode = useCallback(
    (parentId: string, childId: string) => {
      setDoc((prev) => {
        // Find line connecting parent -> child
        // Relying on state (prev.nodes) is safer than graph prop which might be stale
        const newNodes = prev.nodes.filter((n) => {
          if (n.t === 'line') {
            const line = n as LineNode
            if (line.endConn?.nodeId === childId && line.startConn?.nodeId === parentId) {
              return false
            }
          }
          return true
        })

        if (newNodes.length === prev.nodes.length) return prev

        return {
          ...prev,
          nodes: newNodes,
        }
      })
    },
    []
  )

  const addChildNodeTo = useCallback((parentId: string, childId: string) => {
    setDoc((prev) => {
      const parent = prev.nodes.find((n) => n.id === parentId)
      if (!parent) return prev

      const child = prev.nodes.find((n) => n.id === childId)
      if (!child) return prev

      const linkId = generateNodeId(prev, 'line')

      const newLink: LineNode = {
        id: linkId,
        t: 'line',
        s: parent.s,
        pts: [0, 0, 0, 0],
        stroke: '#94a3b8',
        strokeW: 1,
        routing: 'orthogonal',
        startConn: { nodeId: parentId, anchor: 'auto' },
        endConn: { nodeId: childId, anchor: 'auto' },
        locked: true,
      }

      return {
        ...prev,
        nodes: [...prev.nodes, newLink],
      }
    })
  }, [])

  const insertChildNodeAt = useCallback(
    (_parentId: string, childId: string, _insertIndex: number) => {
      setDoc((prev) => {
        // ... (existing logic check)
        // Note: For strict ordering, we might need to manipulate the order of LineNodes or children array?
        // In this data model, 'order' is often implicit by array order of lines?
        // Or layout engine handles it based on childrenMap.
        // For now, we simply add the link. The visual order depends on layout calculation mostly.

        const parent = prev.nodes.find((n) => n.id === _parentId)
        if (!parent) return prev

        const child = prev.nodes.find((n) => n.id === childId)
        if (!child) return prev

        const linkId = generateNodeId(prev, 'line')

        const newLink: LineNode = {
          id: linkId,
          t: 'line',
          s: parent.s,
          pts: [0, 0, 0, 0],
          stroke: '#94a3b8',
          strokeW: 1,
          routing: 'orthogonal',
          startConn: { nodeId: _parentId, anchor: 'auto' },
          endConn: { nodeId: childId, anchor: 'auto' },
          locked: true,
        }

        return {
          ...prev,
          nodes: [...prev.nodes, newLink],
        }
      })
    },
    []
  )

  const moveNode = useCallback(
    (sourceId: string, targetId: string, position: 'child' | 'before' | 'after') => {
      setDoc((prev) => {
        const sourceNode = prev.nodes.find((n) => n.id === sourceId)
        if (!sourceNode) return prev

        // 1. Remove existing parent connection (Line)
        // Find line where endConn is sourceId
        const newNodes = prev.nodes.filter((n) => {
          if (n.t === 'line') {
            const line = n as LineNode
            if (line.endConn?.nodeId === sourceId) return false
          }
          return true
        })

        // 2. Add new connection
        const linkId = generateNodeId({ ...prev, nodes: newNodes }, 'line')
        let parentId = targetId

        if (position !== 'child') {
          // If 'before' or 'after', we attach to target's parent
          const targetLine = prev.nodes.find(n => n.t === 'line' && (n as LineNode).endConn?.nodeId === targetId) as LineNode
          if (targetLine?.startConn?.nodeId) {
            parentId = targetLine.startConn.nodeId
          } else {
            // Fallback: if target is root or detached, can't be sibling. Fallback to child? or Abort?
            // If target is root, we can't be sibling of root.
            return prev
          }
        }

        const parent = prev.nodes.find((n) => n.id === parentId) || prev.nodes.find(n => n.id === targetId)

        if (!parent) return { ...prev, nodes: newNodes }

        const newLink: LineNode = {
          id: linkId,
          t: 'line',
          s: sourceNode.s,
          pts: [0, 0, 0, 0],
          stroke: '#94a3b8',
          strokeW: 1,
          routing: 'orthogonal',
          startConn: { nodeId: parentId, anchor: 'auto' },
          endConn: { nodeId: sourceId, anchor: 'auto' },
          locked: true,
        }

        // Insert at correct position to maintain sort order
        let insertIndex = newNodes.length

        if (position !== 'child') {
          // Find the LineNode that connects to the targetId (sibling we are inserting around)
          const targetLineIndex = newNodes.findIndex(
            (n) => n.t === 'line' && (n as LineNode).endConn?.nodeId === targetId
          )

          if (targetLineIndex !== -1) {
            insertIndex = position === 'before' ? targetLineIndex : targetLineIndex + 1
          }
        }

        newNodes.splice(insertIndex, 0, newLink)

        return { ...prev, nodes: newNodes }
      })
    },
    []
  )

  return {
    addChildNode,
    addSiblingNode,
    deleteNode,
    updateNodes,
    removeChildNode,
    addChildNodeTo,
    insertChildNodeAt,
    moveNode,
  }
}
