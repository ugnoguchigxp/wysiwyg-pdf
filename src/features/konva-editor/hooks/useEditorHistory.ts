import { useCallback, useEffect, useRef, useState } from 'react'
import type { Doc, Operation, UnifiedNode } from '@/features/konva-editor/types'

const MAX_HISTORY_SIZE = 50

interface UseEditorHistoryReturn {
  execute: (operation: Operation, options?: { saveToHistory?: boolean }) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clear: () => void
}

export function useEditorHistoryDoc(
  document: Doc,
  setDocument: (doc: Doc) => void
): UseEditorHistoryReturn {
  const [past, setPast] = useState<Operation[]>([])
  const [future, setFuture] = useState<Operation[]>([])

  const didNormalizeRef = useRef(false)

  useEffect(() => {
    if (didNormalizeRef.current) return
    if (!document || document.unit === 'mm') {
      didNormalizeRef.current = true
      return
    }

    // Doc is expected to be mm-based everywhere. Convert legacy docs at the import boundary.
    console.warn(
      '[useEditorHistoryDoc] Doc.unit is not mm. Please convert the document before passing it in.'
    )
    didNormalizeRef.current = true
  }, [document, setDocument])

  const execute = useCallback(
    (operation: Operation, options?: { saveToHistory?: boolean }) => {
      const newDoc = applyOperationDoc(document, operation)
      setDocument(newDoc)

      if (options?.saveToHistory === false) {
        // Don't modify history stack
        return
      }

      setPast((prev) => {
        const newPast = [...prev, operation]
        if (newPast.length > MAX_HISTORY_SIZE) {
          return newPast.slice(newPast.length - MAX_HISTORY_SIZE)
        }
        return newPast
      })
      setFuture([])
    },
    [document, setDocument]
  )

  const undo = useCallback(() => {
    if (past.length === 0) return

    const operation = past[past.length - 1]
    const newPast = past.slice(0, past.length - 1)

    const newDoc = revertOperationDoc(document, operation)
    setDocument(newDoc)

    setPast(newPast)
    setFuture((prev) => [operation, ...prev])
  }, [document, past, setDocument])

  const redo = useCallback(() => {
    if (future.length === 0) return

    const operation = future[0]
    const newFuture = future.slice(1)

    const newDoc = applyOperationDoc(document, operation)
    setDocument(newDoc)

    setPast((prev) => [...prev, operation])
    setFuture(newFuture)
  }, [document, future, setDocument])

  const clear = useCallback(() => {
    setPast([])
    setFuture([])
  }, [])

  return {
    execute,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clear,
  }
}

export function useEditorHistory(
  document: Doc,
  setDocument: (doc: Doc) => void
): UseEditorHistoryReturn {
  return useEditorHistoryDoc(document, setDocument)
}

function applyOperationDoc(doc: Doc, op: Operation): Doc {
  switch (op.kind) {
    case 'create-element':
      return {
        ...doc,
        nodes: [...doc.nodes, op.element],
      }

    case 'update-element': {
      return {
        ...doc,
        nodes: doc.nodes.map((n) =>
          n.id === op.id
            ? ({ ...n, ...(op.next as Partial<UnifiedNode>), id: op.id } as UnifiedNode)
            : n
        ),
      }
    }

    case 'delete-element':
      return {
        ...doc,
        nodes: doc.nodes.filter((n) => n.id !== op.id),
      }

    case 'reorder-elements': {
      const byId = new Map(doc.nodes.map((n) => [n.id, n] as const))
      const nextNodes: UnifiedNode[] = []
      for (const id of op.nextOrder) {
        const n = byId.get(id)
        if (n) nextNodes.push(n)
      }
      for (const n of doc.nodes) {
        if (!op.nextOrder.includes(n.id)) nextNodes.push(n)
      }
      return {
        ...doc,
        nodes: nextNodes,
      }
    }

    default:
      return doc
  }
}

function revertOperationDoc(doc: Doc, op: Operation): Doc {
  switch (op.kind) {
    case 'create-element':
      return {
        ...doc,
        nodes: doc.nodes.filter((n) => n.id !== op.element.id),
      }

    case 'update-element': {
      return {
        ...doc,
        nodes: doc.nodes.map((n) =>
          n.id === op.id
            ? ({ ...n, ...(op.prev as Partial<UnifiedNode>), id: op.id } as UnifiedNode)
            : n
        ),
      }
    }

    case 'delete-element':
      return {
        ...doc,
        nodes: [...doc.nodes, op.prevElement],
      }

    case 'reorder-elements': {
      const byId = new Map(doc.nodes.map((n) => [n.id, n] as const))
      const prevNodes: UnifiedNode[] = []
      for (const id of op.prevOrder) {
        const n = byId.get(id)
        if (n) prevNodes.push(n)
      }
      for (const n of doc.nodes) {
        if (!op.prevOrder.includes(n.id)) prevNodes.push(n)
      }
      return {
        ...doc,
        nodes: prevNodes,
      }
    }

    default:
      return doc
  }
}
