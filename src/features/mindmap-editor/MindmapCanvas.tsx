import React, { useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import { Doc } from '@/types/canvas'
import { CanvasElementRenderer } from '@/components/canvas/CanvasElementRenderer'
import { MindmapGraph } from './types'

interface MindmapCanvasProps {
    doc: Doc
    graph: MindmapGraph
    collapsedNodes: Set<string>
    selectedNodeId: string | null
    onSelectNode: (id: string | null) => void
    onChangeNodes: (changes: { id: string;[key: string]: any }[]) => void
}

export const MindmapCanvas: React.FC<MindmapCanvasProps> = ({
    doc,
    graph,
    collapsedNodes, // Used to filter visibility
    selectedNodeId,
    onSelectNode,
    onChangeNodes,
}) => {
    const stageRef = useRef<any>(null)

    // Initial position: Center the (0,0) world origin on screen
    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    })

    const handleWheel = (e: any) => {
        e.evt.preventDefault()
        const stage = stageRef.current
        if (!stage) return

        const oldScale = stage.scaleX()
        const pointer = stage.getPointerPosition()

        const scaleBy = 1.1
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        }

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        }

        setScale(newScale)
        setPosition(newPos)
    }

    const handleStageClick = (e: any) => {
        if (e.target === e.target.getStage()) {
            onSelectNode(null)
        }
    }

    // Text Editing State
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
    const [editingText, setEditingText] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleNodeDblClick = (nodeId: string, text: string) => {
        setEditingNodeId(nodeId)
        setEditingText(text)
    }

    const commitText = () => {
        if (editingNodeId) {
            onChangeNodes([{ id: editingNodeId, text: editingText }])
            setEditingNodeId(null)
        }
    }

    // Effect to focus textarea when editing starts
    React.useEffect(() => {
        if (editingNodeId && textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.select()
        }
    }, [editingNodeId])

    // Effect to adjust textarea position (this assumes we can get the node's position from doc or stage)
    // Actually we need the absolute position on screen.
    const getEditingStyle = (): React.CSSProperties | undefined => {
        if (!editingNodeId || !stageRef.current) return undefined

        const node = doc.nodes.find(n => n.id === editingNodeId)
        if (!node || node.t !== 'text') return undefined

        // Calculate position relative to stage container
        const stage = stageRef.current

        // Node's position in stage coords
        const nodeX = node.x
        const nodeY = node.y

        // Convert to absolute DOM position
        // The stage has a transform (x, y, scale)
        const stageX = stage.x()
        const stageY = stage.y()
        const stageScale = stage.scaleX()

        const absX = stageX + nodeX * stageScale
        const absY = stageY + nodeY * stageScale
        const absW = node.w * stageScale
        const absH = node.h * stageScale

        return {
            position: 'absolute',
            top: absY,
            left: absX,
            width: absW,
            height: absH,
            // Match styling roughly
            padding: (node.padding || 0) * stageScale,
            fontSize: (node.fontSize || 12) * stageScale,
            lineHeight: (node as any).lineHeight || 1.2,
            fontFamily: 'sans-serif',
            border: '2px solid #2563eb',
            background: 'white',
            zIndex: 100,
            overflow: 'hidden',
            resize: 'none',
            outline: 'none',
            textAlign: node.align as any || 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }
    }

    return (
        <div className="w-full h-full bg-slate-50 overflow-hidden relative">
            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable
                onWheel={handleWheel}
                onMouseDown={handleStageClick}
                onTouchStart={handleStageClick}
            >
                <Layer>
                    {doc.nodes.map((node) => {
                        // Check visibility
                        const parentId = graph.parentIdMap.get(node.id)
                        // Ancestor visibility check
                        let isVisible = true
                        let curr = parentId
                        while (curr) {
                            if (collapsedNodes.has(curr)) {
                                isVisible = false
                                break
                            }
                            curr = graph.parentIdMap.get(curr)
                        }

                        if (!isVisible) return null

                        return (
                            <CanvasElementRenderer
                                key={node.id}
                                element={{ ...node, locked: true }} // Force locked to prevent dragging
                                isSelected={selectedNodeId === node.id}
                                onSelect={() => onSelectNode(node.id)}
                                onChange={(attrs) => onChangeNodes([{ id: node.id, ...attrs }])}
                                onDblClick={() => node.t === 'text' && handleNodeDblClick(node.id, node.text)}
                                readOnly={false} // ReadOnly might disable selection hooks in some implementations, relying on locked instead
                                allElements={doc.nodes}
                            />
                        )
                    })}
                </Layer>
            </Stage>

            {editingNodeId && (
                <textarea
                    ref={textareaRef}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={commitText}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            commitText()
                        }
                        if (e.key === 'Escape') {
                            setEditingNodeId(null)
                        }
                    }}
                    style={getEditingStyle()}
                />
            )}
        </div>
    )
}
