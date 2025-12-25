import { simplifyPoints } from '@/utils/geometry'

export interface BoundingBox {
  x: number
  y: number
  w: number
  h: number
}

export const getStrokesBox = (strokes: number[][]): BoundingBox => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  strokes.forEach((stroke) => {
    for (let i = 0; i < stroke.length; i += 2) {
      const x = stroke[i]
      const y = stroke[i + 1]
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  })
  if (minX === Infinity) return { x: 0, y: 0, w: 100, h: 50 }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

export const processStrokes = (
  strokes: number[][],
  options: { simplification?: number } = {}
): number[][] => {
  return strokes.map((s) => {
    const tol = options.simplification ?? 0
    if (s.length > 4 && tol > 0) {
      return simplifyPoints(s, tol)
    }
    if (s.length === 2) return [...s, ...s]
    return s
  })
}

export const normalizeStrokes = (strokes: number[][], box: BoundingBox): number[][] => {
  return strokes.map((stroke) => {
    const newStroke: number[] = []
    for (let i = 0; i < stroke.length; i += 2) {
      const x = stroke[i] - box.x
      const y = stroke[i + 1] - box.y
      newStroke.push(Math.round(x * 100) / 100, Math.round(y * 100) / 100)
    }
    return newStroke
  })
}
