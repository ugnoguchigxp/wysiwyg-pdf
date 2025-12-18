import type React from 'react'
import { Group, Rect } from 'react-konva'
import type { Doc } from '@/types/canvas'

interface PaperBackgroundProps {
  document: Doc
  surfaceId?: string
}

export const PaperBackground: React.FC<PaperBackgroundProps> = ({ document, surfaceId }) => {
  let width = 0
  let height = 0

  const surface = surfaceId
    ? document.surfaces.find((s) => s.id === surfaceId)
    : (document.surfaces.find((s) => s.type === 'canvas') ?? document.surfaces[0])
  width = surface?.w ?? 0
  height = surface?.h ?? 0

  return (
    <Group>
      {/* Paper */}
      <Rect name="paper-background" x={0} y={0} width={width} height={height} fill="white" />
    </Group>
  )
}
