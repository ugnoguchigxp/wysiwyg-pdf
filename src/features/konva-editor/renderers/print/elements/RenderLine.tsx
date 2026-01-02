
import type { LineNode } from '@/types/canvas'
import { mmToPt } from '@/utils/units'
import { mmToPtValue } from '../utils'

export const RenderLine = ({ element }: { element: LineNode }) => {
    const { pts, stroke, strokeW } = element
    if (!pts) return null

    const ptsPt: number[] = []
    for (let i = 0; i < pts.length; i++) {
        ptsPt.push(mmToPt(pts[i]))
    }

    // Calculate bounding box for SVG viewbox/positioning
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity
    for (let i = 0; i < ptsPt.length; i += 2) {
        if (ptsPt[i] < minX) minX = ptsPt[i]
        if (ptsPt[i] > maxX) maxX = ptsPt[i]
        if (ptsPt[i + 1] < minY) minY = ptsPt[i + 1]
        if (ptsPt[i + 1] > maxY) maxY = ptsPt[i + 1]
    }

    const width = Math.abs(maxX - minX)
    const height = Math.abs(maxY - minY)

    // Points relative to SVG
    const relativePts = []
    for (let i = 0; i < ptsPt.length; i += 2) {
        relativePts.push(`${ptsPt[i] - minX},${ptsPt[i + 1] - minY}`)
    }

    return (
        <svg
            width={`${width + 20}pt`}
            height={`${height + 20}pt`}
            viewBox={`0 0 ${width + 20} ${height + 20}`}
            style={{ overflow: 'visible', position: 'absolute', left: `${minX}pt`, top: `${minY}pt` }}
        >
            <polyline
                points={relativePts.join(' ')}
                stroke={stroke}
                strokeWidth={mmToPtValue(strokeW)}
                fill="none"
            />
        </svg>
    )
}
