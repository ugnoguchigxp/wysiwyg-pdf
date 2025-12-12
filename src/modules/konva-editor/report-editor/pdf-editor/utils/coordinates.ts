/**
 * Coordinate Conversion Utilities
 * Converts between Canvas pixels (px) and PDF points (pt)
 *
 * Standard: 96px = 72pt
 * Ratio: 1pt = 1.333...px, 1px = 0.75pt
 */

import { createContextLogger } from '../../../../../utils/logger'

const log = createContextLogger('CoordinateUtils')

// ========================================
// Constants
// ========================================

export const PX_PER_PT = 96 / 72 // 1.333...
export const PT_PER_PX = 72 / 96 // 0.75

// ========================================
// Paper Size Constants (Portrait)
// ========================================

// A4 Size in PT (Portrait)
export const A4_WIDTH_PT = 595.28
export const A4_HEIGHT_PT = 841.89

// A5 Size in PT (Portrait)
export const A5_WIDTH_PT = 419.53
export const A5_HEIGHT_PT = 595.28

// B5 Size in PT (Portrait)
export const B5_WIDTH_PT = 498.9
export const B5_HEIGHT_PT = 708.66

// Letter Size in PT (Portrait)
export const LETTER_WIDTH_PT = 612
export const LETTER_HEIGHT_PT = 792

// Legal Size in PT (Portrait)
export const LEGAL_WIDTH_PT = 612
export const LEGAL_HEIGHT_PT = 1008

// A4 Size in PX (Portrait)
export const A4_WIDTH_PX = A4_WIDTH_PT * PX_PER_PT // ~793.71px
export const A4_HEIGHT_PX = A4_HEIGHT_PT * PX_PER_PT // ~1122.52px

// A5 Size in PX (Portrait)
export const A5_WIDTH_PX = A5_WIDTH_PT * PX_PER_PT // ~559.37px
export const A5_HEIGHT_PX = A5_HEIGHT_PT * PX_PER_PT // ~793.71px

// B5 Size in PX (Portrait)
export const B5_WIDTH_PX = B5_WIDTH_PT * PX_PER_PT // ~665.2px
export const B5_HEIGHT_PX = B5_HEIGHT_PT * PX_PER_PT // ~944.88px

// Letter Size in PX (Portrait)
export const LETTER_WIDTH_PX = LETTER_WIDTH_PT * PX_PER_PT // ~816px
export const LETTER_HEIGHT_PX = LETTER_HEIGHT_PT * PX_PER_PT // ~1056px

// Legal Size in PX (Portrait)
export const LEGAL_WIDTH_PX = LEGAL_WIDTH_PT * PX_PER_PT // ~816px
export const LEGAL_HEIGHT_PX = LEGAL_HEIGHT_PT * PX_PER_PT // ~1344px

// ========================================
// Paper Size Type and Helpers
// ========================================

export type PaperSize = 'A4' | 'A5' | 'B5' | 'Letter' | 'Legal'
export type PaperOrientation = 'portrait' | 'landscape'

export interface IPaperDimensions {
  widthPt: number
  heightPt: number
  widthPx: number
  heightPx: number
}

/**
 * Get paper size dimensions with orientation support
 */
export function getPaperSize(
  size: PaperSize,
  orientation: PaperOrientation = 'portrait'
): IPaperDimensions {
  let widthPt: number
  let heightPt: number

  // Get base dimensions (always portrait)
  switch (size) {
    case 'A4':
      widthPt = A4_WIDTH_PT
      heightPt = A4_HEIGHT_PT
      break
    case 'A5':
      widthPt = A5_WIDTH_PT
      heightPt = A5_HEIGHT_PT
      break
    case 'B5':
      widthPt = B5_WIDTH_PT
      heightPt = B5_HEIGHT_PT
      break
    case 'Letter':
      widthPt = LETTER_WIDTH_PT
      heightPt = LETTER_HEIGHT_PT
      break
    case 'Legal':
      widthPt = LEGAL_WIDTH_PT
      heightPt = LEGAL_HEIGHT_PT
      break
  }

  // Swap dimensions for landscape
  if (orientation === 'landscape') {
    ;[widthPt, heightPt] = [heightPt, widthPt]
  }

  return {
    widthPt,
    heightPt,
    widthPx: widthPt * PX_PER_PT,
    heightPx: heightPt * PX_PER_PT,
  }
}

// ========================================
// Conversion Functions
// ========================================

/**
 * Convert PDF points to Canvas pixels
 */
export function ptToPx(pt: number): number {
  return pt * PX_PER_PT
}

/**
 * Convert Canvas pixels to PDF points
 */
export function pxToPt(px: number): number {
  return px * PT_PER_PX
}

/**
 * Round to 2 decimal places for PDF coordinates
 */
export function roundPt(pt: number): number {
  return Math.round(pt * 100) / 100
}

/**
 * Round to integer for Canvas coordinates
 */
export function roundPx(px: number): number {
  return Math.round(px)
}

// ========================================
// Grid Snapping
// ========================================

/**
 * Snap coordinate to grid (in PT)
 */
export function snapToGrid(pt: number, gridSize: number): number {
  return Math.round(pt / gridSize) * gridSize
}

/**
 * Snap coordinate to grid (in PX)
 */
export function snapToGridPx(px: number, gridSizePt: number): number {
  const pt = pxToPt(px)
  const snappedPt = snapToGrid(pt, gridSizePt)
  return ptToPx(snappedPt)
}

// ========================================
// Boundary Checking
// ========================================

/**
 * Constrain value to boundaries
 */
export function constrain(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Check if point is within canvas bounds (in PX)
 */
export function isWithinCanvasBounds(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  return x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight
}

// ========================================
// Distance Calculation
// ========================================

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

// ========================================
// Hit Testing
// ========================================

/**
 * Check if point is inside rectangle (in PX)
 */
export function isPointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
}

/**
 * Check if point is near line (in PX)
 */
export function isPointNearLine(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold = 5
): boolean {
  // Calculate distance from point to line segment
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx: number
  let yy: number

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = px - xx
  const dy = py - yy
  const dist = Math.sqrt(dx * dx + dy * dy)

  return dist <= threshold
}

// ========================================
// Resize Handle Detection
// ========================================

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null

const HANDLE_SIZE = 8 // pixels

/**
 * Get resize handle at point (in PX)
 */
export function getResizeHandleAtPoint(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): ResizeHandle {
  const handles = {
    nw: { x: rx, y: ry },
    ne: { x: rx + rw, y: ry },
    sw: { x: rx, y: ry + rh },
    se: { x: rx + rw, y: ry + rh },
    n: { x: rx + rw / 2, y: ry },
    s: { x: rx + rw / 2, y: ry + rh },
    e: { x: rx + rw, y: ry + rh / 2 },
    w: { x: rx, y: ry + rh / 2 },
  }

  for (const [handle, pos] of Object.entries(handles)) {
    if (
      px >= pos.x - HANDLE_SIZE / 2 &&
      px <= pos.x + HANDLE_SIZE / 2 &&
      py >= pos.y - HANDLE_SIZE / 2 &&
      py <= pos.y + HANDLE_SIZE / 2
    ) {
      return handle as ResizeHandle
    }
  }

  return null
}

// ========================================
// Logging Utilities
// ========================================

export function logCoordinateConversion(label: string, pxValue: number, ptValue: number): void {
  log.debug(`${label}:`, {
    px: roundPx(pxValue),
    pt: roundPt(ptValue),
  })
}
