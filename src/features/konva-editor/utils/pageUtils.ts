import type { PageSize } from '@/features/konva-editor/types'
import { toMm } from '@/utils/units'

export function getPageDimensions(size: PageSize): { width: number; height: number } {
  if (typeof size === 'object') {
    const { width, height, unit } = size
    const wMm = toMm(width, unit, { dpi: 96 })
    const hMm = toMm(height, unit, { dpi: 96 })
    return wMm > hMm ? { width: hMm, height: wMm } : { width: wMm, height: hMm }
  }

  switch (size) {
    case 'A4':
      return { width: 210, height: 297 }
    case 'A5':
      return { width: 148, height: 210 }
    case 'B5':
      return { width: 182, height: 257 }
    case 'Letter':
      return { width: 216, height: 279 }
    default:
      return { width: 210, height: 297 }
  }
}

export function getPresentationPageDimensions(size: PageSize): { width: number; height: number } {
  const DISPLAY_SCALE = 0.7

  if (typeof size === 'object') {
    const { width, height, unit } = size
    const wMm = toMm(width, unit, { dpi: 96 })
    const hMm = toMm(height, unit, { dpi: 96 })
    return { width: wMm * DISPLAY_SCALE, height: hMm * DISPLAY_SCALE }
  }

  switch (size) {
    case 'A4':
      return { width: 297 * DISPLAY_SCALE, height: 210 * DISPLAY_SCALE }
    case 'A5':
      return { width: 210 * DISPLAY_SCALE, height: 148 * DISPLAY_SCALE }
    case 'B5':
      return { width: 257 * DISPLAY_SCALE, height: 182 * DISPLAY_SCALE }
    case 'Letter':
      return { width: 279 * DISPLAY_SCALE, height: 216 * DISPLAY_SCALE }
    default:
      return { width: 297 * DISPLAY_SCALE, height: 210 * DISPLAY_SCALE }
  }
}
