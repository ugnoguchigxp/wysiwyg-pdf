import { useMemo } from 'react'
import type { SignatureNode } from '@/types/canvas'
import { simplifyPoints } from '@/utils/geometry'
import { mmToPt } from '@/utils/units'
import { mmToPtValue } from '../utils'

export const RenderSignature = ({ element }: { element: SignatureNode }) => {
  const { strokes, stroke, strokeW, tolerance } = element

  const pathDataList = useMemo(
    () =>
      strokes.map((strokePoints) => {
        const points =
          tolerance && tolerance > 0 ? simplifyPoints(strokePoints, tolerance) : strokePoints
        if (points.length < 4) return ''

        let path = `M ${mmToPt(points[0]).toFixed(2)} ${mmToPt(points[1]).toFixed(2)}`
        for (let i = 2; i < points.length; i += 2) {
          path += ` L ${mmToPt(points[i]).toFixed(2)} ${mmToPt(points[i + 1]).toFixed(2)}`
        }
        return path
      }),
    [strokes, tolerance]
  )

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${mmToPtValue(element.w)} ${mmToPtValue(element.h)}`}
      style={{ overflow: 'visible' }}
    >
      {pathDataList.map((pathData, i) =>
        pathData ? (
          <path
            key={i}
            d={pathData}
            fill="none"
            stroke={stroke || '#000'}
            strokeWidth={mmToPtValue(strokeW)}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null
      )}
    </svg>
  )
}
