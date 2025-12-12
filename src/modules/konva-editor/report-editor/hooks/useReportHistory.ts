import { useCallback, useState } from 'react'
import type { ITemplateDoc } from '../pdf-editor/types/wysiwyg'

interface UseHistoryReturn {
  document: ITemplateDoc
  setDocument: (doc: ITemplateDoc | ((prev: ITemplateDoc) => ITemplateDoc)) => void
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  reset: (doc: ITemplateDoc) => void
}

export function useReportHistory(initialDocument: ITemplateDoc): UseHistoryReturn {
  const [history, setHistory] = useState<{
    past: ITemplateDoc[]
    present: ITemplateDoc
    future: ITemplateDoc[]
  }>({
    past: [],
    present: initialDocument,
    future: [],
  })

  const setDocument = useCallback(
    (docOrUpdater: ITemplateDoc | ((prev: ITemplateDoc) => ITemplateDoc)) => {
      setHistory((prev) => {
        const newPresent =
          typeof docOrUpdater === 'function' ? docOrUpdater(prev.present) : docOrUpdater

        // Don't add to history if document hasn't changed
        if (JSON.stringify(newPresent) === JSON.stringify(prev.present)) {
          return prev
        }

        return {
          past: [...prev.past, prev.present],
          present: newPresent,
          future: [], // Clear future on new change
        }
      })
    },
    []
  )

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev

      const newPast = prev.past.slice(0, prev.past.length - 1)
      const newPresent = prev.past[prev.past.length - 1]

      if (!newPresent) return prev

      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev

      const newFuture = prev.future.slice(1)
      const newPresent = prev.future[0]

      if (!newPresent) return prev

      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      }
    })
  }, [])

  const reset = useCallback((doc: ITemplateDoc) => {
    setHistory({
      past: [],
      present: doc,
      future: [],
    })
  }, [])

  return {
    document: history.present,
    setDocument,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    reset,
  }
}
