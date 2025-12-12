import type { BedLayoutDocument, BedLayoutElement } from '../../konva-editor/types'

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
export const getLayoutBoundingBox = (document: BedLayoutDocument): BoundingBox | null => {
  if (!document.elementsById) return null

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let hasVisibleElements = false

  Object.values(document.elementsById).forEach((element: BedLayoutElement) => {
    if (!element.visible) return

    let elMinX = 0
    let elMinY = 0
    let elMaxX = 0
    let elMaxY = 0

    if (element.type === 'Line') {
      elMinX = Math.min(element.startPoint.x, element.endPoint.x)
      elMinY = Math.min(element.startPoint.y, element.endPoint.y)
      elMaxX = Math.max(element.startPoint.x, element.endPoint.x)
      elMaxY = Math.max(element.startPoint.y, element.endPoint.y)
      // Account for stroke width roughly
      const padding = (element.stroke?.width || 1) / 2
      elMinX -= padding
      elMinY -= padding
      elMaxX += padding
      elMaxY += padding
    } else if ('box' in element) {
      // Bed, Text, Rect, Image, Group, etc.
      // Note: This ignores rotation for simplicity.
      // If rotation is significant, we should calculate rotated corners.
      // For now, most layouts are axis-aligned.
      elMinX = element.box.x
      elMinY = element.box.y
      elMaxX = element.box.x + element.box.width
      elMaxY = element.box.y + element.box.height
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
export const extractBedList = (document: BedLayoutDocument): { id: string; name: string }[] => {
  if (!document.elementsById) return []

  const beds: { id: string; name: string }[] = []

  // Iterate through elements to find Beds
  Object.values(document.elementsById).forEach((element: BedLayoutElement) => {
    if (element.type === 'Bed') {
      beds.push({
        id: element.id,
        name: element.name || `Bed ${element.id}`,
      })
    }
  })

  // Sort by name for display consistency
  return beds.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}
