import { useEffect } from 'react'
import type { MindmapGraph } from '../types'

interface UseMindmapInteractionParams {
    selectedNodeId: string | null
    setSelectedNodeId: (id: string | null) => void
    graph: MindmapGraph
    ops: {
        addChildNode: () => void
        addSiblingNode: () => void
        deleteNode: () => void
    }
    isEditing: boolean
}

export const useMindmapInteraction = ({
    selectedNodeId,
    setSelectedNodeId,
    graph,
    ops,
    isEditing
}: UseMindmapInteractionParams) => {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isEditing) return
            // Ignore if typing in an input
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
                return
            }

            if (!selectedNodeId) return

            switch (e.key) {
                case 'Tab':
                case 'Insert':
                    e.preventDefault()
                    ops.addChildNode()
                    break
                case 'Enter':
                    e.preventDefault()
                    ops.addSiblingNode()
                    break
                case 'Backspace':
                case 'Delete':
                    // Careful not to delete while editing text (handled by input check above typically)
                    ops.deleteNode()
                    break

                // Navigation
                case 'ArrowRight':
                    e.preventDefault()
                    navigate('right')
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    navigate('left')
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    navigate('up')
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    navigate('down')
                    break
            }
        }

        const navigate = (direction: 'left' | 'right' | 'up' | 'down') => {
            if (!selectedNodeId) return

            const children = graph.childrenMap.get(selectedNodeId) || []
            const parentId = graph.parentIdMap.get(selectedNodeId)

            if (direction === 'right') {
                if (children.length > 0) {
                    // Go to middle child roughly? Or first?
                    setSelectedNodeId(children[0])
                }
            } else if (direction === 'left') {
                if (parentId) {
                    setSelectedNodeId(parentId)
                }
            } else if (direction === 'down' || direction === 'up') {
                // Find siblings
                if (parentId) {
                    const siblings = graph.childrenMap.get(parentId) || []
                    const idx = siblings.indexOf(selectedNodeId)
                    if (idx === -1) return

                    if (direction === 'down') {
                        if (idx < siblings.length - 1) setSelectedNodeId(siblings[idx + 1])
                    } else {
                        if (idx > 0) setSelectedNodeId(siblings[idx - 1])
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedNodeId, graph, ops, isEditing])
}
