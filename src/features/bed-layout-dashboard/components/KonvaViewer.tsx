import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import type { BedStatusData } from '@/features/bed-layout-dashboard/types'
import { getLayoutBoundingBox } from '@/features/bed-layout-dashboard/utils/layoutUtils'
import { PaperBackground } from '@/features/konva-editor/viewers/components/PaperBackground'
import type { Doc } from '@/types/canvas'
import { ElementRenderer } from './ElementRenderer'

interface KonvaViewerProps {
  document: Doc
  width: number // Container width for responsive scaling
  readOnly?: boolean
  onBedClick?: (bedId: string, currentStatus?: BedStatusData) => void
  bedStatusMap?: Record<string, BedStatusData>
  surfaceId?: string
}

const PADDING = 20

export const KonvaViewer: React.FC<KonvaViewerProps> = ({
  document,
  width,
  readOnly = false,
  onBedClick,
  bedStatusMap = {},
  surfaceId,
}) => {
  const [localDocument, setLocalDocument] = useState<Doc>(document)

  // Update local document when the prop changes
  useEffect(() => {
    setLocalDocument(document)
  }, [document])

  // Calculate view parameters based on bounding box
  const viewParams = useMemo(() => {
    if (!localDocument || width <= 0) return null

    const resolvedSurfaceId =
      surfaceId ||
      localDocument.surfaces.find((s) => s.type === 'canvas')?.id ||
      localDocument.surfaces[0]?.id ||
      'layout'
    const nodes = localDocument.nodes.filter((n) => n.s === resolvedSurfaceId)
    const bbox = getLayoutBoundingBox({
      ...localDocument,
      nodes,
    } as import('../../konva-editor/types').Doc)

    // Fallback to full layout if no content or error
    if (!bbox) {
      const resolvedSurfaceId =
        surfaceId ||
        localDocument.surfaces.find((s) => s.type === 'canvas')?.id ||
        localDocument.surfaces[0]?.id ||
        'layout'
      const surface =
        localDocument.surfaces.find((s) => s.id === resolvedSurfaceId) || localDocument.surfaces[0]
      const layoutW = surface?.w ?? 1
      const layoutH = surface?.h ?? 1
      const scale = width / layoutW
      return {
        scale,
        stageHeight: layoutH * scale,
        offsetX: 0,
        offsetY: 0,
      }
    }

    // Calculate scale to fit width
    const contentWidth = bbox.width + PADDING * 2
    const contentHeight = bbox.height + PADDING * 2
    const scale = width / contentWidth

    return {
      scale,
      stageHeight: contentHeight * scale,
      offsetX: bbox.x - PADDING,
      offsetY: bbox.y - PADDING,
    }
  }, [localDocument, width, surfaceId])

  if (!viewParams) {
    return <div>Invalid Layout Data</div>
  }

  return (
    <Stage
      width={width}
      height={viewParams.stageHeight}
      scaleX={viewParams.scale}
      scaleY={viewParams.scale}
      offsetX={viewParams.offsetX}
      offsetY={viewParams.offsetY}
      style={{ touchAction: 'none' }} // Prevent scrolling on touch devices if needed
    >
      <Layer>
        {(() => {
          const resolvedSurfaceId =
            surfaceId ||
            localDocument.surfaces.find((s) => s.type === 'canvas')?.id ||
            localDocument.surfaces[0]?.id ||
            'layout'
          return <PaperBackground document={localDocument} surfaceId={resolvedSurfaceId} />
        })()}

        {(() => {
          const resolvedSurfaceId =
            surfaceId ||
            localDocument.surfaces.find((s) => s.type === 'canvas')?.id ||
            localDocument.surfaces[0]?.id ||
            'layout'
          return localDocument.nodes
            .filter((n) => n.s === resolvedSurfaceId)
            .map((element) => {
              if (!element || element.hidden) return null
              return (
                <ElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={false}
                  onSelect={() => {}} // No-op
                  onChange={() => {}} // No-op
                  readOnly={readOnly}
                  onBedClick={onBedClick}
                  bedStatus={bedStatusMap[element.id]}
                />
              )
            })
        })()}
      </Layer>
    </Stage>
  )
}
