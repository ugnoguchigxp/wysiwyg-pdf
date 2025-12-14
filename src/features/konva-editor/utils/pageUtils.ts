import type { PageSize } from '@/features/konva-editor/types'

export function getPageDimensions(size: PageSize): { width: number; height: number } {
  if (typeof size === 'object') {
    const { width, height } = size
    return width > height ? { width: height, height: width } : { width, height }
  }

  const mmToPx = (mm: number) => Math.round((mm * 72) / 25.4)

  switch (size) {
    case 'A4':
      return { width: mmToPx(210), height: mmToPx(297) }
    case 'A5':
      return { width: mmToPx(148), height: mmToPx(210) }
    case 'B5':
      return { width: mmToPx(182), height: mmToPx(257) }
    case 'Letter':
      return { width: mmToPx(216), height: mmToPx(279) }
    default:
      return { width: mmToPx(210), height: mmToPx(297) }
  }
}

export function getPresentationPageDimensions(size: PageSize): { width: number; height: number } {
  const DISPLAY_SCALE = 0.7

  if (typeof size === 'object') {
    return {
      width: Math.round(size.width * DISPLAY_SCALE),
      height: Math.round(size.height * DISPLAY_SCALE),
    }
  }

  const mmToPx = (mm: number) => Math.round(((mm * 72) / 25.4) * DISPLAY_SCALE)

  switch (size) {
    case 'A4':
      return { width: mmToPx(297), height: mmToPx(210) }
    case 'A5':
      return { width: mmToPx(210), height: mmToPx(148) }
    case 'B5':
      return { width: mmToPx(257), height: mmToPx(182) }
    case 'Letter':
      return { width: mmToPx(279), height: mmToPx(216) }
    default:
      return { width: mmToPx(297), height: mmToPx(210) }
  }
}
