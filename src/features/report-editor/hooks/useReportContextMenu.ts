import { useCallback, useState } from 'react'
import type Konva from 'konva'
import type { Doc, TableNode, UnifiedNode } from '@/features/konva-editor/types'
import { reorderNodes } from '@/utils/reorderUtils'
import {
    deleteCol,
    deleteRow,
    insertCol,
    insertRow,
    mergeCells,
    unmergeCells,
} from '@/features/report-editor/utils/tableOperations'

interface UseReportContextMenuProps {
    templateDoc: Doc
    onTemplateChange: (doc: Doc) => void
    stageRef: React.RefObject<Konva.Stage | null>
    activeTool?: string
    setSelectedCell: (cell: { elementId: string; row: number; col: number } | null) => void
    setEditingCell: (cell: { elementId: string; row: number; col: number } | null) => void
    onElementSelect: (element: UnifiedNode | null) => void
    selectedElementId?: string
}

export const useReportContextMenu = ({
    templateDoc,
    onTemplateChange,
    stageRef,
    activeTool,
    setSelectedCell,
    setEditingCell,
    onElementSelect,
    selectedElementId,
}: UseReportContextMenuProps) => {
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean
        x: number
        y: number
        elementId: string
        type: 'table' | 'line' | 'object'
        row?: number
        col?: number
    } | null>(null)

    const handleContextMenu = useCallback(
        (e: Konva.KonvaEventObject<PointerEvent>, element: UnifiedNode) => {
            e.evt.preventDefault()

            // Prevent context menu while drawing
            if (activeTool !== 'select') return

            const stage = stageRef.current
            if (!stage) return

            // Helper to parse table cell ID
            // Format: tableId_cell_row_col
            const parseFromId = (id: string) => {
                const parts = id.split('_cell_')
                if (parts.length !== 2) return null
                const elementId = parts[0]
                const rc = parts[1].split('_')
                if (rc.length < 2) return null
                const row = Number.parseInt(rc[0]!, 10)
                const col = Number.parseInt(rc[1]!, 10)
                if (Number.isNaN(row) || Number.isNaN(col)) return null
                return { elementId, row, col }
            }

            let menuType: 'table' | 'line' | 'object' = 'object'
            let cellInfo: { elementId: string; row: number; col: number } | null = null

            if (element.t === 'table') {
                const target = e.target
                const idsToTry = [
                    target.id(),
                    target.getParent()?.id(),
                    target.getParent()?.getParent()?.id(),
                ].filter(Boolean) as string[]

                for (const id of idsToTry) {
                    const parsed = parseFromId(id)
                    if (parsed) {
                        cellInfo = parsed
                        break
                    }
                }

                if (cellInfo) {
                    menuType = 'table'
                    // Sync selection
                    setSelectedCell(cellInfo)
                    setEditingCell(null)
                }
            } else if (element.t === 'line') {
                menuType = 'line'
            }

            // Auto-select on right click for Object Context Menu if not already selected
            if (element.id !== selectedElementId) {
                onElementSelect(element)
            }

            setContextMenu({
                visible: true,
                x: e.evt.clientX,
                y: e.evt.clientY,
                elementId: element.id,
                type: menuType,
                row: cellInfo?.row,
                col: cellInfo?.col,
            })
        },
        [activeTool, stageRef, selectedElementId, onElementSelect, setSelectedCell, setEditingCell]
    )

    const handleReorder = useCallback(
        (action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
            if (!contextMenu || !contextMenu.elementId) return

            const nextNodes = reorderNodes(templateDoc.nodes, contextMenu.elementId, action)
            onTemplateChange({ ...templateDoc, nodes: nextNodes })
            setContextMenu(null)
        },
        [contextMenu, onTemplateChange, templateDoc]
    )

    const applyTableUpdate = useCallback(
        (elementId: string, updater: (t: TableNode) => TableNode) => {
            const nextNodes = templateDoc.nodes.map((n) => {
                if (n.id !== elementId || n.t !== 'table') return n
                return updater(n as TableNode)
            })
            onTemplateChange({ ...templateDoc, nodes: nextNodes })
        },
        [onTemplateChange, templateDoc]
    )

    const handleContextMenuAction = useCallback(
        (
            action:
                | 'insertRowAbove'
                | 'insertRowBelow'
                | 'insertColLeft'
                | 'insertColRight'
                | 'deleteRow'
                | 'deleteCol'
                | 'mergeRight'
                | 'mergeDown'
                | 'unmerge'
        ) => {
            if (!contextMenu || contextMenu.type !== 'table' || !contextMenu.elementId) return

            const { elementId, row, col } = contextMenu
            if (typeof row !== 'number' || typeof col !== 'number') return

            applyTableUpdate(elementId, (table) => {
                switch (action) {
                    case 'insertRowAbove':
                        return insertRow(table, row, 'above')
                    case 'insertRowBelow':
                        return insertRow(table, row, 'below')
                    case 'insertColLeft':
                        return insertCol(table, col, row, 'left')
                    case 'insertColRight':
                        return insertCol(table, col, row, 'right')
                    case 'deleteRow':
                        return deleteRow(table, row)
                    case 'deleteCol':
                        return deleteCol(table, col)
                    case 'mergeRight':
                        return mergeCells(table, row, col, 'right')
                    case 'mergeDown':
                        return mergeCells(table, row, col, 'down')
                    case 'unmerge':
                        return unmergeCells(table, row, col)
                    default:
                        return table
                }
            })

            setContextMenu(null)
        },
        [contextMenu, applyTableUpdate]
    )

    return {
        contextMenu,
        setContextMenu,
        handleContextMenu,
        handleReorder,
        handleContextMenuAction,
    }
}
