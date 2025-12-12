import type React from 'react'
import { Group, Rect } from 'react-konva'
import type { BedLayoutDocument, FormDocument } from '../../types'

interface PaperBackgroundProps {
  document: FormDocument | BedLayoutDocument
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({ document }) => {
  let width = 0
  let height = 0

  if (document.type === 'form') {
    width = document.paper.width
    height = document.paper.height
  } else {
    width = document.layout.width
    height = document.layout.height
  }

  return (
    <Group>
      {/* Shadow */}
      <Rect x={5} y={5} width={width} height={height} fill="rgba(0,0,0,0.2)" shadowBlur={10} />
      {/* Paper */}
      <Rect
        name="paper-background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill="white"
        stroke="#9ca3af"
        strokeWidth={1}
      />
    </Group>
  )
}
