import { useMemo } from 'react'
import type { SignatureNode } from '@/types/canvas'
import { mmToPt } from '@/utils/units'
import { createHandwritingPath } from '@/utils/handwriting'
import { mmToPtValue } from '../utils'

export const RenderSignature = ({ element }: { element: SignatureNode }) => {
    const { strokes, stroke, strokeW } = element

    const pathDataList = useMemo(() => {
        return strokes.map((strokePoints, i) =>
            createHandwritingPath(
                strokePoints.map((value) => mmToPt(value)),
                mmToPtValue(strokeW),
                element.pressureData?.[i],
                (element.usePressureSim ?? true) || !(element.pressureData?.[i]?.length ?? 0)
            )
        )
    }, [strokes, strokeW, element.pressureData, element.usePressureSim])

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${mmToPtValue(element.w)} ${mmToPtValue(element.h)}`}
            style={{ overflow: 'visible' }}
        >
            {pathDataList.map(
                (pathData, i) => pathData && <path key={i} d={pathData} fill={stroke || '#000'} />
            )}
        </svg>
    )
}
