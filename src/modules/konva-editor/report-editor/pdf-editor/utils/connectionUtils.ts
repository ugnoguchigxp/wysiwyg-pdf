/**
 * Connection Utilities
 * Helper functions for shape-to-line connections (Phase 3)
 */

import type {
  ConnectionPoint,
  IEditorEllipse,
  IEditorItem,
  IEditorRect,
  IPosition,
} from '../types/editorTypes'

/**
 * Get the absolute position of a connection point on a shape
 */
export function getConnectionPoint(
  element: IEditorRect | IEditorEllipse,
  connectionPoint: ConnectionPoint
): IPosition {
  const { x, y, width, height } = element

  switch (connectionPoint) {
    case 'top-left':
      return { x, y }
    case 'left':
      return { x, y: y + height / 2 }
    case 'bottom-left':
      return { x, y: y + height }
    case 'bottom':
      return { x: x + width / 2, y: y + height }
    case 'bottom-right':
      return { x: x + width, y: y + height }
    case 'right':
      return { x: x + width, y: y + height / 2 }
    case 'top-right':
      return { x: x + width, y }
    case 'top':
      return { x: x + width / 2, y }
    default:
      return { x: x + width / 2, y: y + height / 2 }
  }
}

/**
 * Find the nearest connection point within a certain radius
 */
export function findNearbyConnectionPoint(
  x: number,
  y: number,
  elements: IEditorItem[],
  excludeElementId?: string,
  connectionRadius = 20
): {
  element: IEditorRect | IEditorEllipse
  connectionPoint: ConnectionPoint
  distance: number
} | null {
  let nearest: {
    element: IEditorRect | IEditorEllipse
    connectionPoint: ConnectionPoint
    distance: number
  } | null = null

  for (const element of elements) {
    // Skip line elements and excluded element
    if (element.type === 'line' || element.id === excludeElementId) continue

    // Only support rect and ellipse for now
    if (element.type !== 'rect' && element.type !== 'ellipse') continue

    const shapeElement = element as IEditorRect | IEditorEllipse
    const connectionPoints: ConnectionPoint[] = [
      'top-left',
      'left',
      'bottom-left',
      'bottom',
      'bottom-right',
      'right',
      'top-right',
      'top',
    ]

    for (const cp of connectionPoints) {
      const point = getConnectionPoint(shapeElement, cp)
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)

      if (distance <= connectionRadius && (!nearest || distance < nearest.distance)) {
        nearest = { element: shapeElement, connectionPoint: cp, distance }
      }
    }
  }

  return nearest
}

/**
 * Draw connection points on a shape
 */
export function drawConnectionPoints(
  ctx: CanvasRenderingContext2D,
  element: IEditorRect | IEditorEllipse,
  ptToPx: (pt: number) => number
): void {
  const connectionPoints: ConnectionPoint[] = [
    'top-left',
    'left',
    'bottom-left',
    'bottom',
    'bottom-right',
    'right',
    'top-right',
    'top',
  ]

  ctx.save()
  ctx.fillStyle = '#4F46E5'
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2

  for (const cp of connectionPoints) {
    const point = getConnectionPoint(element, cp)
    const px = ptToPx(point.x)
    const py = ptToPx(point.y)

    ctx.beginPath()
    ctx.arc(px, py, 4, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * Draw connection guide (highlight when dragging line near shape)
 */
export function drawConnectionGuide(
  ctx: CanvasRenderingContext2D,
  element: IEditorRect | IEditorEllipse,
  connectionPoint: ConnectionPoint,
  ptToPx: (pt: number) => number
): void {
  const point = getConnectionPoint(element, connectionPoint)
  const { x, y, width, height } = element

  ctx.save()

  // Highlight the shape
  const px = ptToPx(x)
  const py = ptToPx(y)
  const pw = ptToPx(width)
  const ph = ptToPx(height)

  ctx.strokeStyle = '#10B981'
  ctx.lineWidth = 3
  ctx.setLineDash([8, 4])
  ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4)

  // Highlight the connection point
  ctx.setLineDash([])
  ctx.fillStyle = '#10B981'
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3

  const cpx = ptToPx(point.x)
  const cpy = ptToPx(point.y)

  ctx.beginPath()
  ctx.arc(cpx, cpy, 8, 0, 2 * Math.PI)
  ctx.fill()
  ctx.stroke()

  // Draw connection indicator
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('●', cpx, cpy)

  ctx.restore()
}

/**
 * Update line endpoints based on connections
 * Call this when a connected shape moves
 */
export function updateLineConnectionPositions(
  line: IEditorItem,
  elements: IEditorItem[]
): { x1?: number; y1?: number; x2?: number; y2?: number } | null {
  if (line.type !== 'line') return null

  const updates: { x1?: number; y1?: number; x2?: number; y2?: number } = {}
  let hasUpdates = false

  // Update start point if connected
  if (line.startConnection) {
    const { elementId, connectionPoint } = line.startConnection
    const connectedElement = elements.find((el) => el.id === elementId)
    if (
      connectedElement &&
      (connectedElement.type === 'rect' || connectedElement.type === 'ellipse')
    ) {
      const point = getConnectionPoint(
        connectedElement as IEditorRect | IEditorEllipse,
        connectionPoint
      )
      updates.x1 = point.x
      updates.y1 = point.y
      hasUpdates = true
    }
  }

  // Update end point if connected
  if (line.endConnection) {
    const { elementId, connectionPoint } = line.endConnection
    const connectedElement = elements.find((el) => el.id === elementId)
    if (
      connectedElement &&
      (connectedElement.type === 'rect' || connectedElement.type === 'ellipse')
    ) {
      const point = getConnectionPoint(
        connectedElement as IEditorRect | IEditorEllipse,
        connectionPoint
      )
      updates.x2 = point.x
      updates.y2 = point.y
      hasUpdates = true
    }
  }

  return hasUpdates ? updates : null
}
