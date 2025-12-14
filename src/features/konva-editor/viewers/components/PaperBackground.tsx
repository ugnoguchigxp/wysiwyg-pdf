import type React from 'react'
import { Group, Rect } from 'react-konva'
import type { BedLayoutDocument, FormDocument } from '@/types/canvas'

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
    // BedLayoutDocument
    width = document.layout.width
    height = document.layout.height
  }

  return (
    <Group>
      {/* Paper */}
      <Rect
        name="paper-background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill="white"
      />
    </Group>
  )
}
