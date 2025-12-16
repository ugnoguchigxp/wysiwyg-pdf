/**
 * Coordinate utilities
 */

import type { UnitOptions } from './units'
import { mmToPt, mmToPx, ptToMm, pxToMm } from './units'

export function ptToPx(pt: number, options: UnitOptions = {}): number {
  return mmToPx(ptToMm(pt), options)
}

export function pxToPt(px: number, options: UnitOptions = {}): number {
  return mmToPt(pxToMm(px, options))
}
