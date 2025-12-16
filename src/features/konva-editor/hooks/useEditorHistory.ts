import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  BedLayoutDocument,
  Doc,
  FormDocument,
  Operation,
  UnifiedNode,
} from '@/features/konva-editor/types'
import { normalizeDocToMm } from '@/utils/normalizeDocToMm'

const MAX_HISTORY_SIZE = 50

interface UseEditorHistoryReturn {
  execute: (operation: Operation) => void
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

    const normalized = normalizeDocToMm(document, { dpi: 96, assumeUnitIfMissing: 'mm' })
    didNormalizeRef.current = true
    setDocument(normalized)
  }, [document, setDocument])

  const execute = useCallback(
    (operation: Operation) => {
      const newDoc = applyOperationAny(document, operation) as Doc
      setDocument(newDoc)

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

    const newDoc = revertOperationAny(document, operation) as Doc
    setDocument(newDoc)

    setPast(newPast)
    setFuture((prev) => [operation, ...prev])
  }, [document, past, setDocument])

  const redo = useCallback(() => {
    if (future.length === 0) return

    const operation = future[0]
    const newFuture = future.slice(1)

    const newDoc = applyOperationAny(document, operation) as Doc
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

export function useEditorHistory<T extends FormDocument | BedLayoutDocument>(
  document: T,
  setDocument: (doc: T) => void
): UseEditorHistoryReturn {
  const [past, setPast] = useState<Operation[]>([])
  const [future, setFuture] = useState<Operation[]>([])

  const execute = useCallback(
    (operation: Operation) => {
      // Apply operation to document
      const newDoc = applyOperationAny(document, operation) as T
      setDocument(newDoc)

      // Add to past, clear future
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

    // Revert operation on document
    const newDoc = revertOperationAny(document, operation) as T
    setDocument(newDoc)

    setPast(newPast)
    setFuture((prev) => [operation, ...prev])
  }, [document, past, setDocument])

  const redo = useCallback(() => {
    if (future.length === 0) return

    const operation = future[0]
    const newFuture = future.slice(1)

    // Re-apply operation on document
    const newDoc = applyOperationAny(document, operation) as T
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

function applyOperationAny(
  doc: Doc | FormDocument | BedLayoutDocument,
  op: Operation
): Doc | FormDocument | BedLayoutDocument {
  if (isUnifiedDoc(doc)) return applyOperationDoc(doc, op)
  if (doc.type === 'form') return applyOperationForm(doc, op)
  return applyOperationBedLayout(doc, op)
}

function applyOperationForm(doc: FormDocument, op: Operation): FormDocument {
  const newDoc: FormDocument = { ...doc }

  switch (op.kind) {
    case 'create-element':
      return {
        ...newDoc,
        elementsById: {
          ...newDoc.elementsById,
          [op.element.id]: op.element as unknown as FormDocument['elementsById'][string],
        },
        elementOrder: [...newDoc.elementOrder, op.element.id],
      }

    case 'update-element':
      if (!newDoc.elementsById[op.id]) return newDoc
      {
        const nextElement = {
          ...newDoc.elementsById[op.id],
          ...(op.next as unknown as Partial<FormDocument['elementsById'][string]>),
        } as FormDocument['elementsById'][string]

        return {
          ...newDoc,
          elementsById: {
            ...newDoc.elementsById,
            [op.id]: nextElement,
          },
        }
      }

    case 'delete-element': {
      const { [op.id]: _, ...rest } = newDoc.elementsById
      return {
        ...newDoc,
        elementsById: rest,
        elementOrder: newDoc.elementOrder.filter((id: string) => id !== op.id),
      }
    }

    case 'reorder-elements':
      return {
        ...newDoc,
        elementOrder: op.nextOrder,
      }

    default:
      return newDoc
  }
}

function revertOperationAny(
  doc: Doc | FormDocument | BedLayoutDocument,
  op: Operation
): Doc | FormDocument | BedLayoutDocument {
  if (isUnifiedDoc(doc)) return revertOperationDoc(doc, op)
  if (doc.type === 'form') return revertOperationForm(doc, op)
  return revertOperationBedLayout(doc, op)
}

function isUnifiedDoc(doc: unknown): doc is Doc {
  return Boolean(
    doc &&
      typeof doc === 'object' &&
      'v' in doc &&
      (doc as { v?: unknown }).v === 1 &&
      'surfaces' in doc &&
      'nodes' in doc
  )
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

function revertOperationForm(doc: FormDocument, op: Operation): FormDocument {
  const newDoc: FormDocument = { ...doc }

  switch (op.kind) {
    case 'create-element': {
      // 作成を取り消す = 削除
      const { [op.element.id]: _, ...rest } = newDoc.elementsById
      return {
        ...newDoc,
        elementsById: rest,
        elementOrder: newDoc.elementOrder.filter((id: string) => id !== op.element.id),
      }
    }

    case 'update-element':
      // 更新を取り消す = 前の状態に戻す
      if (!newDoc.elementsById[op.id]) return newDoc
      {
        const prevElement = {
          ...newDoc.elementsById[op.id],
          ...(op.prev as unknown as Partial<FormDocument['elementsById'][string]>),
        } as FormDocument['elementsById'][string]

        return {
          ...newDoc,
          elementsById: {
            ...newDoc.elementsById,
            [op.id]: prevElement,
          },
        }
      }

    case 'delete-element':
      // 削除を取り消す = 復元
      return {
        ...newDoc,
        elementsById: {
          ...newDoc.elementsById,
          [op.id]: op.prevElement as unknown as FormDocument['elementsById'][string],
        },
        elementOrder: [...newDoc.elementOrder, op.id],
      }

    case 'reorder-elements':
      // 順序変更を取り消す = 前の順序に戻す
      return {
        ...newDoc,
        elementOrder: op.prevOrder,
      }

    default:
      return newDoc
  }
}

function applyOperationBedLayout(doc: BedLayoutDocument, op: Operation): BedLayoutDocument {
  const newDoc: BedLayoutDocument = { ...doc }

  switch (op.kind) {
    case 'create-element':
      return {
        ...newDoc,
        elementsById: {
          ...newDoc.elementsById,
          [op.element.id]: op.element as unknown as BedLayoutDocument['elementsById'][string],
        },
        elementOrder: [...newDoc.elementOrder, op.element.id],
      }

    case 'update-element':
      if (!newDoc.elementsById[op.id]) return newDoc
      {
        const nextElement = {
          ...newDoc.elementsById[op.id],
          ...(op.next as unknown as Partial<BedLayoutDocument['elementsById'][string]>),
        } as BedLayoutDocument['elementsById'][string]

        return {
          ...newDoc,
          elementsById: {
            ...newDoc.elementsById,
            [op.id]: nextElement,
          },
        }
      }

    case 'delete-element': {
      const { [op.id]: _, ...rest } = newDoc.elementsById
      return {
        ...newDoc,
        elementsById: rest,
        elementOrder: newDoc.elementOrder.filter((id: string) => id !== op.id),
      }
    }

    case 'reorder-elements':
      return {
        ...newDoc,
        elementOrder: op.nextOrder,
      }

    default:
      return newDoc
  }
}

function revertOperationBedLayout(doc: BedLayoutDocument, op: Operation): BedLayoutDocument {
  const newDoc: BedLayoutDocument = { ...doc }

  switch (op.kind) {
    case 'create-element': {
      const { [op.element.id]: _, ...rest } = newDoc.elementsById
      return {
        ...newDoc,
        elementsById: rest,
        elementOrder: newDoc.elementOrder.filter((id: string) => id !== op.element.id),
      }
    }

    case 'update-element':
      if (!newDoc.elementsById[op.id]) return newDoc
      {
        const prevElement = {
          ...newDoc.elementsById[op.id],
          ...(op.prev as unknown as Partial<BedLayoutDocument['elementsById'][string]>),
        } as BedLayoutDocument['elementsById'][string]

        return {
          ...newDoc,
          elementsById: {
            ...newDoc.elementsById,
            [op.id]: prevElement,
          },
        }
      }

    case 'delete-element':
      return {
        ...newDoc,
        elementsById: {
          ...newDoc.elementsById,
          [op.id]: op.prevElement as unknown as BedLayoutDocument['elementsById'][string],
        },
        elementOrder: [...newDoc.elementOrder, op.id],
      }

    case 'reorder-elements':
      return {
        ...newDoc,
        elementOrder: op.prevOrder,
      }

    default:
      return newDoc
  }
}
