import { useCallback, useState } from 'react'
import type { MindmapGraph } from '../types'

export interface DragState {
  isDragging: boolean
  draggedNodeId: string | null
  dragStartPosition: { x: number; y: number } | null
  dragPosition: { x: number; y: number } | null
  dropTargetId: string | null
  dropPosition: 'child' | 'before' | 'after' | null
  canDrop: boolean
}

const initialDragState: DragState = {
  isDragging: false,
  draggedNodeId: null,
  dragStartPosition: null,
  dragPosition: null,
  dropTargetId: null,
  dropPosition: null,
  canDrop: false,
}

interface UseMindmapDragProps {
  graph: MindmapGraph
  onNodeDrop: (sourceId: string, targetId: string, position: 'child' | 'before' | 'after') => void
}

export const useMindmapDrag = ({ graph, onNodeDrop }: UseMindmapDragProps) => {
  const [dragState, setDragState] = useState<DragState>(initialDragState)

  const handleDragStart = useCallback(
    (nodeId: string, startPosition: { x: number; y: number }) => {
      if (nodeId === graph.rootId) return

      setDragState({
        isDragging: false, // Will become true after moving threshold
        draggedNodeId: nodeId,
        dragStartPosition: startPosition,
        dragPosition: startPosition,
        dropTargetId: null,
        dropPosition: null,
        canDrop: false,
      })
    },
    [graph.rootId]
  )

  const handleDragMove = useCallback(
    (position: { x: number; y: number }) => {
      if (!dragState.draggedNodeId || !dragState.dragStartPosition) return

      const currentPos = position
      const distance = Math.hypot(
        currentPos.x - dragState.dragStartPosition.x,
        currentPos.y - dragState.dragStartPosition.y
      )

      if (distance > 5 && !dragState.isDragging) {
        setDragState((prev) => ({ ...prev, isDragging: true }))
      }

      if (dragState.isDragging) {
        setDragState((prev) => ({ ...prev, dragPosition: currentPos }))
      }
    },
    [dragState.draggedNodeId, dragState.dragStartPosition, dragState.isDragging]
  )

  const handleDragEnter = useCallback(
    (targetNodeId: string, relativeY: number) => {
      if (!dragState.isDragging) return

      const isAncestor = graph.isAncestor(dragState.draggedNodeId!, targetNodeId)
      const isSelf = targetNodeId === dragState.draggedNodeId
      const canDrop = !isAncestor && !isSelf

      let dropPosition: 'child' | 'before' | 'after' = 'child'
      if (relativeY < 0.2) {
        dropPosition = 'before'
      } else if (relativeY > 0.8) {
        dropPosition = 'after'
      }

      setDragState((prev) => ({
        ...prev,
        dropTargetId: targetNodeId,
        dropPosition,
        canDrop,
      }))
    },
    [dragState.isDragging, dragState.draggedNodeId, graph]
  )

  const handleDragLeave = useCallback(() => {
    if (!dragState.isDragging) return

    setDragState((prev) => ({
      ...prev,
      dropTargetId: null,
      dropPosition: null,
      canDrop: false,
    }))
  }, [dragState.isDragging])

  const handleDragEnd = useCallback(() => {
    if (
      dragState.canDrop &&
      dragState.dropTargetId &&
      dragState.draggedNodeId &&
      dragState.dropPosition
    ) {
      onNodeDrop(dragState.draggedNodeId, dragState.dropTargetId, dragState.dropPosition)
    }
    setDragState(initialDragState)
  }, [dragState, onNodeDrop])

  return {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnter,
    handleDragLeave,
    handleDragEnd,
  }
}
