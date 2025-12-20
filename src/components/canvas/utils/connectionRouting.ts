import { Anchor } from '../../../types/canvas'

interface Point {
    x: number
    y: number
}

interface NodeGeometry {
    x: number
    y: number
    w: number
    h: number
    r?: number
}

interface AnchorInfo {
    x: number
    y: number
    nx: number // Normal X (-1, 0, 1)
    ny: number // Normal Y (-1, 0, 1)
}

const STUB_LENGTH = 20

/**
 * Calculates the absolute position and outward direction (normal) of an anchor.
 */
export const getAnchorPointAndDirection = (
    geo: NodeGeometry,
    anchor: Anchor
): AnchorInfo => {
    // If rotated, we should technically rotate the anchor point.
    // For simplicity MVP, ignoring rotation for routing logic (bounding box logic).
    // Ideally, use rotated bounding box centers.

    let x = geo.x
    let y = geo.y
    const w = geo.w
    const h = geo.h

    // Anchor mapping
    // tl, tr, bl, br treated as corners.
    // t, b, l, r treated as face centers.

    let nx = 0
    let ny = 0

    switch (anchor) {
        case 't':
            x += w / 2
            ny = -1
            break
        case 'b':
            x += w / 2
            y += h
            ny = 1
            break
        case 'l':
            y += h / 2
            nx = -1
            break
        case 'r':
            x += w
            y += h / 2
            nx = 1
            break
        case 'tl':
            // Treat as Top or Left dependent on situation?
            // Default to "Top" characteristic for logic or maybe diagonal?
            // "draw.io" style: tl usually acts as Top-Left.
            // Let's bias: -1, -1
            nx = -1
            ny = -1
            break
        case 'tr':
            x += w
            nx = 1
            ny = -1
            break
        case 'bl':
            y += h
            nx = -1
            ny = 1
            break
        case 'br':
            x += w
            y += h
            nx = 1
            ny = 1
            break
        case 'auto':
        default:
            x += w / 2
            y += h / 2
            break
    }

    // Refinement: For 90-degree lines, diagonal normals are bad.
    // But strictly, we route from x,y.
    // "Stub" calculation needs N.
    // If diagonal, fallback to X dominant?

    return { x, y, nx, ny }
}

/**
 * Main function to calculate Manhattan path.
 */
export const getManhattanPath = (
    startGeo: NodeGeometry,
    startAnchor: Anchor,
    endGeo: NodeGeometry,
    endAnchor: Anchor
): number[] => {
    const s = getAnchorPointAndDirection(startGeo, startAnchor)
    const e = getAnchorPointAndDirection(endGeo, endAnchor)

    // Start Point
    const p0 = { x: s.x, y: s.y }
    // Stub Start
    const p1 = { x: s.x + s.nx * STUB_LENGTH, y: s.y + s.ny * STUB_LENGTH }

    // End Point
    const pE = { x: e.x, y: e.y }
    // Stub End (Coming OUT from End node to meet)
    const pE_stub = { x: e.x + e.nx * STUB_LENGTH, y: e.y + e.ny * STUB_LENGTH }

    // We route from p1 to pE_stub.
    // Then append pE.

    const path = simpleManhattanRoute(p1, pE_stub, s.nx, s.ny, e.nx, e.ny)

    // Flatten
    const points = [p0.x, p0.y]
    path.forEach((p) => points.push(p.x, p.y))
    points.push(pE.x, pE.y)

    return points
}

/**
 * Route from A to B with Manhattan segments.
 * Tries to minimize bends and avoid "backward" movement against start direction.
 */
function simpleManhattanRoute(
    a: Point,
    b: Point,
    startDirX: number,
    startDirY: number,
    endDirX: number,
    endDirY: number
): Point[] {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const midX = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2

    // Heuristic:
    // If Start is Horizontal (nx != 0)
    if (Math.abs(startDirX) > 0) {
        // 1. Can we go straight X then Y?
        // Check if moving in X direction actually gets us closer?
        // Or if End is "behind" us.

        const goingCheck = startDirX * dx >= 0 // True if 'b' is in front of 'a' along X

        // Case: Opposite sides (e.g. Left -> Right)
        // startDirX = -1, endDirX = 1 ??
        // Usually Start->Right, End->Left (face to face).
        // startDirX = 1, endDirX = -1.

        // Basic 1-bend (L-shape)
        // A -> (b.x, a.y) -> B ??
        // A -> (a.x, b.y) -> B ??

        // Let's use "Midpoint" strategy for gaps.

        const points: Point[] = [a]

        // If End is also Horizontal facing (e.g. Left)
        if (Math.abs(endDirX) > 0) {
            if (goingCheck) {
                // A is Left, B is Right. Space in between.
                // A -> MidX -> B
                points.push({ x: midX, y: a.y })
                points.push({ x: midX, y: b.y })
            } else {
                // B is Behind A (Overlap or Wrong side)
                // Need to go up/down to escape.
                // A -> A + Extend -> Up/Down -> B...
                // Simple fallback:
                // A -> (a.x, midY) -> (b.x, midY) -> B
                points.push({ x: a.x, y: midY })
                points.push({ x: b.x, y: midY })
            }
        } else {
            // End is Vertical (Top/Bottom)
            // A (Horz) -> B (Vert)
            // Ideal: A -> Corner -> B
            // Corner = (b.x, a.y)
            points.push({ x: b.x, y: a.y })
        }

        points.push(b)
        return points
    } else {
        // Start is Vertical (ny != 0)
        // Symmetry of above

        const goingCheck = startDirY * dy >= 0
        const points: Point[] = [a]

        if (Math.abs(endDirY) > 0) {
            // End is Vertical
            if (goingCheck) {
                // Face to face or sequence
                // A -> MidY -> B
                points.push({ x: a.x, y: midY })
                points.push({ x: b.x, y: midY })
            } else {
                // Behind
                // A -> Go Side (MidX) -> B
                points.push({ x: midX, y: a.y })
                points.push({ x: midX, y: b.y })
            }
        } else {
            // End is Horizontal
            // A (Vert) -> B (Horz)
            // Ideal: A -> (a.x, b.y) -> B
            points.push({ x: a.x, y: b.y })
        }

        points.push(b)
        return points
    }
}
