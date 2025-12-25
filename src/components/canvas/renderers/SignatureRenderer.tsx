import type React from 'react'
import { useMemo } from 'react'
import { Group, Path, Rect } from 'react-konva'
import { createHandwritingPath } from '@/utils/handwriting'
import type { SignatureNode } from '@/types/canvas'
import type { CanvasElementCommonProps } from '../types'

const SignatureShape = ({ element }: { element: SignatureNode }) => {
  const sig = element
  const pathDataList = useMemo(
    () =>
      sig.strokes
        .map((stroke, i) =>
          createHandwritingPath(
            stroke,
            sig.strokeW,
            sig.pressureData?.[i],
            (sig.usePressureSim ?? true) || !(sig.pressureData?.[i]?.length ?? 0)
          )
        )
        .filter(Boolean),
    [sig.strokes, sig.strokeW, sig.pressureData, sig.usePressureSim]
  )

  return (
    <>
      {pathDataList.map((pathData, index) => (
        <Path
          key={index}
          data={pathData}
          fill={sig.stroke}
          listening={false}
        />
      ))}
    </>
  )
}

interface SignatureRendererProps {
  element: SignatureNode
  commonProps: CanvasElementCommonProps
  stageScale: number
}

export const SignatureRenderer: React.FC<SignatureRendererProps> = ({
  element,
  commonProps,
  stageScale,
}) => {
  const signature = element
  const hitStrokeWidth = Math.max(10, ((signature.strokeW ?? 0.2) * stageScale) / 0.2)
  return (
    <Group {...commonProps}>
      <SignatureShape element={signature} />
      <Rect
        x={0}
        y={0}
        width={signature.w}
        height={signature.h}
        fill="transparent"
        listening={true}
        hitStrokeWidth={hitStrokeWidth}
      />
    </Group>
  )
}
