import React, { useState, useCallback } from 'react'
import { Doc } from '@/types/canvas'
import { MindmapCanvas } from './MindmapCanvas'
import { useMindmapGraph } from './hooks/useMindmapGraph'
import { useMindmapLayout } from './hooks/useMindmapLayout'
import { useMindmapOperations } from './hooks/useMindmapOperations'
import { useMindmapInteraction } from './hooks/useMindmapInteraction'

// Initial Empty Doc for testing if none provided
const INITIAL_DOC: Doc = {
    v: 1,
    id: 'mindmap-1',
    title: 'New Mindmap',
    unit: 'mm',
    surfaces: [{ id: 's1', type: 'canvas', w: 4000, h: 4000, bg: '#f8fafc' }],
    nodes: [
        // Root Node
        {
            id: 'root',
            t: 'text',
            s: 's1',
            x: 0, y: 0, w: 160, h: 50,
            text: 'Central Topic',
            align: 'c',
            vAlign: 'm',
            backgroundColor: '#ffffff',
            borderColor: '#2563eb', // Blue-600
            borderWidth: 3,
            padding: 12,
            fontWeight: 700,
            fill: '#1e3a8a', // Blue-900 text
        }
    ],
}

export const MindmapEditor: React.FC = () => {
    const [doc, setDoc] = useState<Doc>(INITIAL_DOC)
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [collapsedNodes] = useState<Set<string>>(new Set())

    // Core Graph Logic
    const graph = useMindmapGraph(doc)

    // Layout Logic
    const handleLayoutChange = useCallback((updates: { id: string;[key: string]: any }[]) => {
        setDoc(prev => {
            const nextNodes = prev.nodes.map(n => {
                const update = updates.find(u => u.id === n.id)
                if (update) {
                    return { ...n, ...update }
                }
                return n
            })
            // Also update lines if present in updates
            // The updates array contains both nodes and lines updates mixed?
            // Yes, rely on ID. Line IDs are distinct from Node IDs.
            const nextNodesAndLines = nextNodes.map(n => {
                const update = updates.find(u => u.id === n.id)
                if (update) {
                    return { ...n, ...update }
                }
                return n
            })

            return { ...prev, nodes: nextNodesAndLines }
        })
    }, [])

    useMindmapLayout({
        graph,
        collapsedNodes,
        onChange: handleLayoutChange,
        isLayoutActive: true
    })

    // Operations Logic
    const operations = useMindmapOperations({
        setDoc,
        graph,
        selectedNodeId
    })

    // Interaction Logic (Keyboard)
    useMindmapInteraction({
        selectedNodeId,
        setSelectedNodeId,
        graph,
        ops: operations
    })

    // General Change Handler
    const handleChangeNodes = useCallback((changes: { id: string;[key: string]: any }[]) => {
        setDoc(prev => {
            const nextNodes = prev.nodes.map(n => {
                const change = changes.find(c => c.id === n.id)
                if (change) {
                    return { ...n, ...change }
                }
                return n
            })
            return { ...prev, nodes: nextNodes }
        })
    }, [])

    return (
        <div className="flex flex-col w-full h-screen">
            <div className="h-12 border-b bg-white flex items-center px-4 shadow-sm z-10">
                <h1 className="font-bold text-slate-700">Mindmap Editor</h1>
                {/* Toolbar placeholders */}
            </div>
            <div className="flex-1 relative">
                <MindmapCanvas
                    doc={doc}
                    graph={graph}
                    collapsedNodes={collapsedNodes}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                    onChangeNodes={handleChangeNodes}
                />
            </div>
        </div>
    )
}
