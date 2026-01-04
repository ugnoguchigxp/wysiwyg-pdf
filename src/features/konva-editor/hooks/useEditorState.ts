import { useCallback, useState } from 'react'

interface UseEditorStateReturn {
  selection: string[]
  setSelection: (ids: string[]) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void

  zoom: number
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void

  scroll: { x: number; y: number }
  setScroll: (scroll: { x: number; y: number }) => void
}

export function useEditorState(): UseEditorStateReturn {
  // Selection
  const [selection, setSelection] = useState<string[]>([])

  const toggleSelection = useCallback((id: string) => {
    setSelection((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelection([])
  }, [])

  // Zoom
  const [zoom, setZoom] = useState<number>(1.0)

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 5.0)) // Max 500%
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25)) // Min 25%
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1.0)
  }, [])

  // Scroll
  const [scroll, setScroll] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })

  return {
    selection,
    setSelection,
    toggleSelection,
    clearSelection,

    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,

    scroll,
    setScroll,
  }
}
