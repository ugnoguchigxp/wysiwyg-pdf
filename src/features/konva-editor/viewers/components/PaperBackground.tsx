import type React from 'react'
import { Group, Rect } from 'react-konva'
import type { BedLayoutDocument, Doc, FormDocument } from '@/types/canvas'

function isDoc(document: Doc | FormDocument | BedLayoutDocument): document is Doc {
  return (
    (document as Doc).v === 1 &&
    Array.isArray((document as Doc).surfaces) &&
    Array.isArray((document as Doc).nodes)
  )
}

interface PaperBackgroundProps {
  document: Doc | FormDocument | BedLayoutDocument
  surfaceId?: string
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({ document, surfaceId }) => {
  let width = 0
  let height = 0

  if (isDoc(document)) {
    const surface = surfaceId
      ? document.surfaces.find((s) => s.id === surfaceId)
      : (document.surfaces.find((s) => s.type === 'canvas') ?? document.surfaces[0])
    width = surface?.w ?? 0
    height = surface?.h ?? 0
  } else if (document.type === 'form') {
    width = document.paper.width
    height = document.paper.height
  } else {
    width = document.layout.width
    height = document.layout.height
  }

  return (
    <Group>
      {/* Paper */}
      <Rect name="paper-background" x={0} y={0} width={width} height={height} fill="white" />
    </Group>
  )
}
