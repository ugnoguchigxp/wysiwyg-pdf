import { useCallback } from 'react'
import type { Doc, TextNode, UnifiedNode } from '@/features/konva-editor/types'
import { applyTextLayoutUpdates, calculateVerticalTextHeight } from '@/features/konva-editor/utils/textLayout'
import { ptToMm } from '@/utils/units'

interface UseNodeOperationsProps {
    templateDoc: Doc
    onTemplateChange: (doc: Doc, options?: { saveToHistory?: boolean; force?: boolean }) => void
    selectedElementId?: string
    editingElementId: string | null
    setEditingElementId: (id: string | null) => void
}

export const useNodeOperations = ({
    templateDoc,
    onTemplateChange,
    selectedElementId,
    editingElementId,
    setEditingElementId,
}: UseNodeOperationsProps) => {
    const handleElementChange = useCallback(
        (
            updates:
                | (Partial<UnifiedNode> & { id?: string })
                | (Partial<UnifiedNode> & { id?: string })[],
            options?: { saveToHistory?: boolean; force?: boolean }
        ) => {
            const updateList = Array.isArray(updates) ? updates : [updates]

            const updateMap = new Map(
                updateList.map((u) => {
                    const id = u.id || selectedElementId
                    return [id, u]
                })
            )

            const nextNodes = templateDoc.nodes.map((el) => {
                const update = updateMap.get(el.id)
                if (update) {
                    return { ...el, ...update, id: el.id } as UnifiedNode
                }
                return el
            })

            onTemplateChange({ ...templateDoc, nodes: nextNodes }, options)
        },
        [onTemplateChange, selectedElementId, templateDoc]
    )

    const handleTextUpdate = useCallback(
        (text: string) => {
            if (!editingElementId) return

            const element = templateDoc.nodes.find((n) => n.id === editingElementId)
            if (!element || element.t !== 'text') {
                handleElementChange(
                    { id: editingElementId, text } as Partial<UnifiedNode> & { id?: string },
                    { saveToHistory: false }
                )
                return
            }

            const textNode = element as TextNode

            const updatePatch = applyTextLayoutUpdates(textNode, { text })
            handleElementChange(
                { id: editingElementId, ...updatePatch } as Partial<UnifiedNode> & { id?: string },
                { saveToHistory: false }
            )
        },
        [editingElementId, templateDoc.nodes, handleElementChange]
    )

    const handleTextEditFinish = useCallback(() => {
        if (editingElementId) {
            const element = templateDoc.nodes.find((n) => n.id === editingElementId)
            if (element && element.t === 'text') {
                const textNode = element as TextNode

                if (textNode.vertical) {
                    const fontSize = textNode.fontSize ?? ptToMm(12)
                    const padding = textNode.padding ?? 10
                    const newH = calculateVerticalTextHeight(textNode.text ?? '', fontSize, padding)
                    const updatePatch: Partial<UnifiedNode> = { id: editingElementId, h: newH }

                    handleElementChange(
                        updatePatch as Partial<UnifiedNode> & { id?: string },
                        { saveToHistory: true, force: true }
                    )
                } else {
                    handleElementChange({ id: editingElementId }, { saveToHistory: true, force: true })
                }
            }
        }
        setEditingElementId(null)
    }, [editingElementId, templateDoc.nodes, handleElementChange, setEditingElementId])

    return {
        handleElementChange,
        handleTextUpdate,
        handleTextEditFinish,
    }
}
