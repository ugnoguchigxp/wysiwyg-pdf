import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { Doc, TextNode, LineNode } from '@/types/canvas'
import { MindmapGraph } from '../types'
import { getSubtreeIds } from '../utils/treeUtils'

interface UseMindmapOperationsParams {
    setDoc: React.Dispatch<React.SetStateAction<Doc>>
    graph: MindmapGraph
    selectedNodeId: string | null
}

export const useMindmapOperations = ({
    setDoc,
    graph,
    selectedNodeId
}: UseMindmapOperationsParams) => {

    const addChildNode = useCallback(() => {
        if (!selectedNodeId) return

        setDoc(prev => {
            const parent = prev.nodes.find(n => n.id === selectedNodeId)
            if (!parent) return prev

            const newId = nanoid()
            const linkId = nanoid()

            const newNode: TextNode = {
                id: newId,
                t: 'text',
                s: parent.s,
                x: (parent.x || 0) + 40, // Initial placement (adjusted for smaller size)
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
                endConn: { nodeId: newId, anchor: 'auto' }
            }

            return {
                ...prev,
                nodes: [...prev.nodes, newNode, newLink]
            }
        })
    }, [selectedNodeId])

    const addSiblingNode = useCallback(() => {
        if (!selectedNodeId || !graph.rootId || selectedNodeId === graph.rootId) return

        const parentId = graph.parentIdMap.get(selectedNodeId)
        if (!parentId) return

        // Add child to MY parent
        // Copy logic from addChild but usage parentId

        setDoc(prev => {
            const parent = prev.nodes.find(n => n.id === parentId)
            if (!parent) return prev

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
                endConn: { nodeId: newId, anchor: 'auto' }
            }

            return {
                ...prev,
                nodes: [...prev.nodes, newNode, newLink]
            }
        })

    }, [selectedNodeId, graph])

    const deleteNode = useCallback(() => {
        if (!selectedNodeId) return
        // Don't delete root for now
        if (selectedNodeId === graph.rootId) return

        const idsToDelete = getSubtreeIds(selectedNodeId, graph.childrenMap)

        setDoc(prev => {
            // Find all lines connected to these nodes (as start or end)
            // And the nodes themselves
            const remainingNodes = prev.nodes.filter(n => {
                if (idsToDelete.includes(n.id)) return false

                // Remove lines connected to deleted nodes
                if (n.t === 'line') {
                    const l = n as LineNode
                    if (l.startConn?.nodeId && idsToDelete.includes(l.startConn.nodeId)) return false
                    if (l.endConn?.nodeId && idsToDelete.includes(l.endConn.nodeId)) return false
                }
                return true
            })

            return { ...prev, nodes: remainingNodes }
        })
    }, [selectedNodeId, graph])


    return {
        addChildNode,
        addSiblingNode,
        deleteNode
    }
}
