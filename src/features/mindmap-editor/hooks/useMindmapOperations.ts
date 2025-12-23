import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { Doc, TextNode, LineNode } from '@/types/canvas'
import { MindmapGraph } from '../types'
import { getSubtreeIds } from '../utils/treeUtils'

interface UseMindmapOperationsParams {
    setDoc: React.Dispatch<React.SetStateAction<Doc>>
    graph: MindmapGraph
    selectedNodeId: string | null
    onSelect?: (id: string) => void
}

export const useMindmapOperations = ({
    setDoc,
    graph,
    selectedNodeId,
    onSelect
}: UseMindmapOperationsParams) => {

    const addChildNode = useCallback(() => {
        if (!selectedNodeId) return

        setDoc(prev => {
            const parent = prev.nodes.find(n => n.id === selectedNodeId)
            if (!parent) return prev

            // Balancing logic for Root children
            let layoutDir: 'left' | 'right' | undefined = undefined
            if (selectedNodeId === graph.rootId) {
                const children = graph.childrenMap.get(selectedNodeId) || []
                let leftCount = 0
                let rightCount = 0
                children.forEach(childId => {
                    const child = prev.nodes.find(n => n.id === childId)
                    if (child) {
                        const dir = child.data?.layoutDir || ((child.x || 0) < (parent.x || 0) ? 'left' : 'right')
                        if (dir === 'left') leftCount++
                        else rightCount++
                    }
                })
                layoutDir = rightCount <= leftCount ? 'right' : 'left'
            }

            const newId = nanoid()
            const linkId = nanoid()

            const newNode: TextNode = {
                id: newId,
                t: 'text',
                s: parent.s,
                x: (parent.x || 0) + 40, // Initial placement
                y: (parent.y || 0),
                w: 30, h: 10,
                text: 'New Topic',
                align: 'c',
                backgroundColor: '#ffffff',
                borderColor: '#64748b',
                borderWidth: 0.5,
                padding: 2,
                fontSize: 4.23,
                locked: true,
                data: layoutDir ? { layoutDir } : undefined
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
                locked: true
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
                nodes: [...prev.nodes, newNode, newLink]
            }
        })
    }, [selectedNodeId, graph, onSelect])

    const addSiblingNode = useCallback(() => {
        if (!selectedNodeId || !graph.rootId || selectedNodeId === graph.rootId) return

        const parentId = graph.parentIdMap.get(selectedNodeId)
        if (!parentId) return

        setDoc(prev => {
            const parent = prev.nodes.find(n => n.id === parentId)
            if (!parent) return prev

            // Determine Layout Dir (Inherit from sibling)
            let layoutDir: 'left' | 'right' | undefined = undefined
            if (parentId === graph.rootId) {
                const sibling = prev.nodes.find(n => n.id === selectedNodeId)
                if (sibling) {
                    if (sibling.data?.layoutDir) {
                        layoutDir = sibling.data.layoutDir as 'left' | 'right'
                    } else {
                        // Fallback to current visual side
                        layoutDir = (sibling.x || 0) < (parent.x || 0) ? 'left' : 'right'
                    }
                }
            }

            const newId = nanoid()
            const linkId = nanoid()

            const newNode: TextNode = {
                id: newId,
                t: 'text',
                s: parent.s,
                x: (parent.x || 0) + 40,
                y: (parent.y || 0) + 20,
                w: 30, h: 10,
                text: 'New Topic',
                align: 'c',
                backgroundColor: '#ffffff',
                borderColor: '#334155',
                borderWidth: 0.5,
                padding: 2,
                fontSize: 4.23,
                locked: true,
                data: layoutDir ? { layoutDir } : undefined
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
                locked: true
            }

            // Insert after current selected node to maintain visual order logic
            const nodes = [...prev.nodes]
            const insertIndex = nodes.findIndex(n => n.id === selectedNodeId)

            if (insertIndex !== -1) {
                nodes.splice(insertIndex + 1, 0, newNode, newLink)
            } else {
                nodes.push(newNode, newLink)
            }

            if (onSelect) {
                requestAnimationFrame(() => onSelect(newId))
            }

            return {
                ...prev,
                nodes
            }
        })

    }, [selectedNodeId, graph, onSelect])

    const updateNodes = useCallback((updates: { id: string;[key: string]: any }[]) => {
        setDoc(prev => {
            if (updates.length === 0) return prev
            const updateMap = new Map(updates.map(u => [u.id, u]))

            const newNodes = prev.nodes.map(node => {
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
                nodes: newNodes
            }
        })
    }, [setDoc])

    const deleteNode = useCallback(() => {
        if (!selectedNodeId) return
        // Don't delete root for now
        if (selectedNodeId === graph.rootId) return

        setDoc(prev => {
            const node = prev.nodes.find(n => n.id === selectedNodeId)
            if (!node) return prev

            // Get all descendants to delete
            const idsToDelete = new Set(getSubtreeIds(selectedNodeId, graph.childrenMap))

            // Filter out deleted nodes and their connected lines
            const remainingNodes = prev.nodes.filter(n => {
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
                nodes: remainingNodes
            }
        })
    }, [selectedNodeId, graph])


    return {
        addChildNode,
        addSiblingNode,
        deleteNode,
        updateNodes
    }
}
