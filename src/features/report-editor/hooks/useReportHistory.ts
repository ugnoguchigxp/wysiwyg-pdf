import { useCallback, useState } from 'react'
import type { Doc } from '@/features/konva-editor/types'

interface UseHistoryReturn {
  document: Doc
  setDocument: (
    doc: Doc | ((prev: Doc) => Doc),
    options?: { saveToHistory?: boolean; force?: boolean }
  ) => void
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  reset: (doc: Doc) => void
}

export function useReportHistory(initialDocument: Doc): UseHistoryReturn {
  const [history, setHistory] = useState<{
    past: Doc[]
    present: Doc
    future: Doc[]
  }>({
    past: [],
    present: initialDocument,
    future: [],
  })

  // Update to support optional history saving
  const setDocument = useCallback(
    (
      docOrUpdater: Doc | ((prev: Doc) => Doc),
      options: { saveToHistory?: boolean; force?: boolean } = {}
    ) => {
      const { saveToHistory = true, force = false } = options

      setHistory((prev) => {
        const newPresent =
          typeof docOrUpdater === 'function' ? docOrUpdater(prev.present) : docOrUpdater

        // Don't add to history if document hasn't changed (deep comparison), unless forced
        if (!force && JSON.stringify(newPresent) === JSON.stringify(prev.present)) {
          return prev
        }

        if (!saveToHistory) {
          return {
            ...prev,
            present: newPresent,
            future: [],
          }
        }

        return {
          past: [...prev.past, prev.present],
          present: newPresent,
          future: [],
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

      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      }
    })
  }, [])

  const reset = useCallback((doc: Doc) => {
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
