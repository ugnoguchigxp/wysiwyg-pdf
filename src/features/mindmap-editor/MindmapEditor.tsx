import React, { useState, useCallback, useMemo } from 'react'
import { Doc, UnifiedNode } from '@/types/canvas'
import { KonvaCanvasEditor } from '@/components/canvas/KonvaCanvasEditor'
import { useMindmapGraph } from './hooks/useMindmapGraph'
import { useMindmapLayout } from './hooks/useMindmapLayout'
import { useMindmapOperations } from './hooks/useMindmapOperations'

// Initial Doc with standard TextNode
const INITIAL_DOC: Doc = {
    v: 1,
    id: 'mindmap-1',
    title: 'New Mindmap',
    unit: 'mm',
    surfaces: [{ id: 's1', type: 'canvas', w: 4000, h: 4000, bg: '#f8fafc' }],
    nodes: [
        // Root Node - Standard TextObject definition
        {
            id: 'root',
            t: 'text',
            s: 's1',
            x: 280, y: 192.5, w: 40, h: 15, // Centered on 600x400 paper (rootX=300, rootY=200)
            text: 'Central Topic',
            align: 'c',
            vAlign: 'm',
            backgroundColor: '#ffffff',
            borderColor: '#0000FF',
            borderWidth: 0.5,
            cornerRadius: 1, // Pill shape
            hasFrame: true,
            padding: 2, // Reduced padding for smaller size
            fontWeight: 700,
            fill: '#1e3a8a',
            fontSize: 4.23, // 12pt
            locked: true,
        }
    ],
}

export const MindmapEditor: React.FC = () => {
    const [doc, setDoc] = useState<Doc>(INITIAL_DOC)
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [collapsedNodes] = useState<Set<string>>(new Set())

    // Core Graph Logic (pure data)
    const graph = useMindmapGraph(doc)

    // Layout Logic (pure data)
    const handleLayoutChange = useCallback((updates: { id: string;[key: string]: any }[]) => {
        setDoc(prev => {
            const nextNodes = prev.nodes.map(n => {
                const update = updates.find(u => u.id === n.id)
                if (update) {
                    return { ...n, ...update }
                }
                return n
            })
            return { ...prev, nodes: nextNodes }
        })
    }, [])

    useMindmapLayout({
        graph,
        collapsedNodes,
        onChange: handleLayoutChange,
        isLayoutActive: true,
        rootX: 300, // Center of 600mm canvas
        rootY: 200  // Center of 400mm canvas
    })

    // Operations (pure data)
    const operations = useMindmapOperations({
        setDoc,
        graph,
        selectedNodeId
    })

    // Standard Change Handler
    const handleChangeNodes = useCallback((changes: (Partial<UnifiedNode> & { id?: string }) | (Partial<UnifiedNode> & { id?: string })[]) => {
        const changesArray = Array.isArray(changes) ? changes : [changes]
        setDoc(prev => {
            const nextNodes = prev.nodes.map(n => {
                const change = changesArray.find(c => c.id === n.id)
                if (change) {
                    return { ...n, ...change } as UnifiedNode
                }
                return n
            })
            return { ...prev, nodes: nextNodes }
        })
    }, [])

    // Filter visible nodes based on collapsed state
    const visibleNodes = useMemo(() => {
        return doc.nodes.filter(node => {
            const parentId = graph.parentIdMap.get(node.id)
            let isVisible = true
            let curr = parentId
            while (curr) {
                if (collapsedNodes.has(curr)) {
                    isVisible = false
                    break
                }
                curr = graph.parentIdMap.get(curr)
            }
            return isVisible
        })
    }, [doc.nodes, graph.parentIdMap, collapsedNodes])

    const handleSelect = useCallback((ids: string[]) => {
        setSelectedNodeId(ids.length > 0 ? ids[0] : null)
    }, [])

    const selectedNode = useMemo(() =>
        selectedNodeId ? doc.nodes.find(n => n.id === selectedNodeId) || null : null
        , [doc.nodes, selectedNodeId])

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if editing text
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return
            }

            if (e.key === 'Tab') {
                e.preventDefault()
                operations.addChildNode()
            } else if (e.key === 'Enter') {
                e.preventDefault()
                operations.addSiblingNode()
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                // Optional: Delete node
                operations.deleteNode()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [operations])

    return (
        <div className="flex flex-col w-full h-full">
            <div className="h-12 border-b bg-white flex items-center px-4 shadow-sm z-10">
                <h1 className="font-bold text-slate-700">Mindmap Editor</h1>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="w-full h-full content-container">
                    <KonvaCanvasEditor
                        elements={visibleNodes}
                        selectedIds={selectedNodeId ? [selectedNodeId] : []}
                        onSelect={handleSelect}
                        onChange={handleChangeNodes}
                        zoom={1}
                        paperWidth={600}
                        paperHeight={400}
                        readOnly={false}
                        initialScrollCenter={{ x: 300, y: 200 }}
                    />
                </div>
            </div>
        </div>
    )
}
