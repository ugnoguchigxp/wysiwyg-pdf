import type React from 'react'
import { Group, Line, Rect } from 'react-konva'
import type { SignatureNode } from '@/types/canvas'
import { simplifyPoints } from '@/utils/geometry'
import type { CanvasElementCommonProps } from '../types'

const SignatureShape = ({ element }: { element: SignatureNode }) => {
  const sig = element
  const tolerance = sig.tolerance ?? 0

  return (
    <>
      {sig.strokes.map((stroke, index) => {
        const points = tolerance > 0 ? simplifyPoints(stroke, tolerance) : stroke
        return (
          <Line
            key={index}
            points={points}
            stroke={sig.stroke}
            strokeWidth={sig.strokeW}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
        )
      })}
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
