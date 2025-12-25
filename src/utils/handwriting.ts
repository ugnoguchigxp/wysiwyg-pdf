import { getStroke, type StrokeOptions } from 'perfect-freehand'

export interface HandwritingOptions {
  width: number
  usePressureSim: boolean
}

export function buildStrokeConfig(width: number, usePressureSim: boolean): StrokeOptions {
  return {
    size: width * 4.25,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => Math.sin((t * Math.PI) / 2),
    simulatePressure: usePressureSim,
    last: true,
  }
}

export function buildPathData(points: number[][]): string {
  if (!points.length) return ''

  const max = points.length - 1
  const midPoint = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

  let path = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} Q`

  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    if (i === max) {
      const mid = midPoint(point, points[0])
      path += ` ${point[0].toFixed(2)} ${point[1].toFixed(2)}`
      path += ` ${mid[0].toFixed(2)} ${mid[1].toFixed(2)}`
      path += ` L ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} Z`
    } else {
      const mid = midPoint(point, points[i + 1])
      path += ` ${point[0].toFixed(2)} ${point[1].toFixed(2)}`
      path += ` ${mid[0].toFixed(2)} ${mid[1].toFixed(2)}`
    }
  }

  return path
}

export function toPointPairs(flat: number[]): [number, number][] {
  const points: [number, number][] = []
  for (let i = 0; i < flat.length; i += 2) {
    points.push([flat[i], flat[i + 1]])
  }
  return points
}

export function createHandwritingPath(
  flatPoints: number[],
  width: number,
  pressure?: number[],
  usePressureSim: boolean = true
): string {
  if (flatPoints.length < 4) return ''

  const points = toPointPairs(flatPoints)

  const inputPoints =
    usePressureSim || !pressure ? points : points.map((p, i) => [...p, pressure[i] ?? 0.5])

  const config = buildStrokeConfig(width, usePressureSim)
  const outlinePoints = getStroke(inputPoints, config)

  if (outlinePoints.length === 0) return ''

  return buildPathData(outlinePoints)
}
