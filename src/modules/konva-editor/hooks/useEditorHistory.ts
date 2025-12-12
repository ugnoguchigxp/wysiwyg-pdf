import { useCallback, useState } from 'react'
import type { BedLayoutDocument, FormDocument, Operation } from '../types'

const MAX_HISTORY_SIZE = 50

interface UseEditorHistoryReturn {
  execute: (operation: Operation) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clear: () => void
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
      const newDoc = applyOperation(document, operation) as T
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
    if (!operation) return // Should not happen given length check

    const newPast = past.slice(0, past.length - 1)

    // Revert operation on document
    const newDoc = revertOperation(document, operation) as T
    setDocument(newDoc)

    setPast(newPast)
    setFuture((prev) => [operation, ...prev])
  }, [document, past, setDocument])

  const redo = useCallback(() => {
    if (future.length === 0) return

    const operation = future[0]
    if (!operation) return

    const newFuture = future.slice(1)

    // Re-apply operation on document
    const newDoc = applyOperation(document, operation) as T
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

function applyOperation(
  doc: FormDocument | BedLayoutDocument,
  op: Operation
): FormDocument | BedLayoutDocument {
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

function revertOperation(
  doc: FormDocument | BedLayoutDocument,
  op: Operation
): FormDocument | BedLayoutDocument {
  if (doc.type === 'form') return revertOperationForm(doc, op)
  return revertOperationBedLayout(doc, op)
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
