/**
 * Calculates the perpendicular distance from a point to a line segment.
 */
function getPerpendicularDistance(
  pointX: number,
  pointY: number,
  lineStartX: number,
  lineStartY: number,
  lineEndX: number,
  lineEndY: number
): number {
  let dx = lineEndX - lineStartX
  let dy = lineEndY - lineStartY

  // Normalize
  const mag = Math.sqrt(dx * dx + dy * dy)
  if (mag > 0) {
    dx /= mag
    dy /= mag
  }

  const pvx = pointX - lineStartX
  const pvy = pointY - lineStartY

  // Get dot product (project pv onto line)
  const pvdot = pvx * dx + pvy * dy

  // Scale line vector
  const dsx = pvdot * dx
  const dsy = pvdot * dy

  // Subtract to get perpendicular vector
  const ax = pvx - dsx
  const ay = pvy - dsy

  return Math.sqrt(ax * ax + ay * ay)
}

/**
 * Simplifies a set of points using the Ramer-Douglas-Peucker algorithm.
 * @param points Array of points in [x, y, x, y, ...] format.
 * @param tolerance The tolerance (epsilon) for simplification.
 * @returns Simplified array of points in [x, y, x, y, ...] format.
 */
export function simplifyPoints(points: number[], tolerance: number): number[] {
  if (points.length <= 4) {
    // Less than 3 points (each point is 2 numbers)
    return points
  }

  const pointCount = points.length / 2
  const firstPointX = points[0]
  const firstPointY = points[1]
  const lastPointX = points[points.length - 2]
  const lastPointY = points[points.length - 1]

  let maxDistance = 0
  let indexFarthest = 0

  for (let i = 1; i < pointCount - 1; i++) {
    const pointX = points[i * 2]
    const pointY = points[i * 2 + 1]
    const distance = getPerpendicularDistance(
      pointX,
      pointY,
      firstPointX,
      firstPointY,
      lastPointX,
      lastPointY
    )

    if (distance > maxDistance) {
      maxDistance = distance
      indexFarthest = i
    }
  }

  if (maxDistance > tolerance) {
    // Recursive call
    const leftPath = points.slice(0, (indexFarthest + 1) * 2)
    const rightPath = points.slice(indexFarthest * 2)

    const simplifiedLeft = simplifyPoints(leftPath, tolerance)
    const simplifiedRight = simplifyPoints(rightPath, tolerance)

    // Merge results, removing duplicate point
    return [...simplifiedLeft.slice(0, simplifiedLeft.length - 2), ...simplifiedRight]
  } else {
    return [firstPointX, firstPointY, lastPointX, lastPointY]
  }
}
