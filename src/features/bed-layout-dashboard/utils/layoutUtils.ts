import type { Doc, LineNode, UnifiedNode } from '../../konva-editor/types' // Ensure types exported or imported from canvas

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Calculates the bounding box of all visible elements in the document.
 * Returns null if no visible elements are found.
 */
export const getLayoutBoundingBox = (document: Doc): BoundingBox | null => {
  if (!document.nodes) return null

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let hasVisibleElements = false

  document.nodes.forEach((element: UnifiedNode) => {
    if (element.hidden) return

    let elMinX = 0
    let elMinY = 0
    let elMaxX = 0
    let elMaxY = 0

    if (element.t === 'line') {
      const line = element as LineNode
      // Calculate min/max from pts array
      let lineMinX = Number.POSITIVE_INFINITY
      let lineMinY = Number.POSITIVE_INFINITY
      let lineMaxX = Number.NEGATIVE_INFINITY
      let lineMaxY = Number.NEGATIVE_INFINITY

      for (let i = 0; i < line.pts.length; i += 2) {
        const x = line.pts[i]
        const y = line.pts[i + 1]
        if (x < lineMinX) lineMinX = x
        if (y < lineMinY) lineMinY = y
        if (x > lineMaxX) lineMaxX = x
        if (y > lineMaxY) lineMaxY = y
      }

      elMinX = lineMinX
      elMinY = lineMinY
      elMaxX = lineMaxX
      elMaxY = lineMaxY

      // Account for stroke width roughly
      const padding = (line.strokeW ?? 0.4) / 2
      elMinX -= padding
      elMinY -= padding
      elMaxX += padding
      elMaxY += padding
    } else if ('x' in element && 'w' in element) {
      // Bed, Text, Rect, Image, Group, etc. (Shape, Widget, Table, Signature too)
      // Note: This ignores rotation for simplicity.
      elMinX = element.x
      elMinY = element.y
      elMaxX = element.x + element.w
      elMaxY = element.y + element.h
    } else {
      return
    }

    minX = Math.min(minX, elMinX)
    minY = Math.min(minY, elMinY)
    maxX = Math.max(maxX, elMaxX)
    maxY = Math.max(maxY, elMaxY)
    hasVisibleElements = true
  })

  if (!hasVisibleElements) return null

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Extracts a list of all bed elements from the document.
 * Useful for generating a list of beds for the dashboard.
 */
export const extractBedList = (document: Doc): { id: string; name: string }[] => {
  if (!document.nodes) return []

  const beds: { id: string; name: string }[] = []

  // Iterate through elements to find Beds
  document.nodes.forEach((element: UnifiedNode) => {
    if (element.t === 'widget' && element.widget === 'bed') {
      beds.push({
        id: element.id,
        name: element.name || `Bed ${element.id}`,
      })
    }
  })

  // Sort by name for display consistency
  return beds.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}
