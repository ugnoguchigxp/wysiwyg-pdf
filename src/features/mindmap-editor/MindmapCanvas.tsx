import React, { useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import { Doc } from '@/types/canvas'
import { CanvasElementRenderer } from '@/components/canvas/CanvasElementRenderer'
import { MindmapGraph } from './types'
import { TextEditOverlay } from '@/components/canvas/TextEditOverlay'
import { useTextDimensions } from '@/features/konva-editor/hooks/useTextDimensions'

interface MindmapCanvasProps {
    doc: Doc
    graph: MindmapGraph
    collapsedNodes: Set<string>
    selectedNodeId: string | null
    onSelectNode: (id: string | null) => void
    onChangeNodes: (changes: { id: string;[key: string]: any }[]) => void
    editingNodeId: string | null
    onSetEditingNodeId: (id: string | null) => void
}

export const MindmapCanvas: React.FC<MindmapCanvasProps> = ({
    doc,
    graph,
    collapsedNodes, // Used to filter visibility
    selectedNodeId,
    onSelectNode,
    onChangeNodes,
    editingNodeId,
    onSetEditingNodeId,
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
    const handleNodeDblClick = (nodeId: string, text: string) => {
        onSetEditingNodeId(nodeId)
        // setEditingText(text) // TextEditOverlay handles its own initial value via element prop
    }

    const { calculateDimensions } = useTextDimensions()

    // Text Editing Handlers using TextEditOverlay
    const handleTextUpdate = (text: string) => {
        if (!editingNodeId) return

        const node = doc.nodes.find(n => n.id === editingNodeId)
        if (!node || node.t !== 'text') return

        const dimensions = calculateDimensions(text, {
            family: node.font,
            size: node.fontSize,
            weight: node.fontWeight,
            padding: node.padding
        })

        onChangeNodes([{
            id: editingNodeId,
            text,
            w: dimensions.w,
            h: dimensions.h
        }])
    }

    const handleTextEditFinish = () => {
        onSetEditingNodeId(null)
    }

    // Effect to adjust textarea position is replaced by TextEditOverlay logic
    const editingNode = editingNodeId ? doc.nodes.find(n => n.id === editingNodeId) : null
    const editingTextElement = editingNode && editingNode.t === 'text' ? (editingNode as any) : null

    // Helper to get scale for overlay
    // MindmapCanvas manages scale via state.
    // TextEditOverlay requires 'scale' prop which often refers to display scale (zoom).
    // Here we pass the current stage scale.
    const displayScale = scale

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
                                element={{ ...node, locked: true }}
                                isSelected={selectedNodeId === node.id}
                                onSelect={() => onSelectNode(node.id)}
                                onChange={(attrs) => onChangeNodes([{ id: node.id, ...attrs }])}
                                onDblClick={() => node.t === 'text' && handleNodeDblClick(node.id, node.text)}
                                readOnly={false}
                                allElements={doc.nodes}
                            />
                        )
                    })}
                </Layer>
            </Stage>

            {editingTextElement && (
                <TextEditOverlay
                    element={editingTextElement}
                    scale={displayScale}
                    stageNode={stageRef.current}
                    onUpdate={handleTextUpdate}
                    onFinish={handleTextEditFinish}
                />
            )}
        </div>
    )
}
