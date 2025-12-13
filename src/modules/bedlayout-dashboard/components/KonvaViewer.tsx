import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import { PaperBackground } from '../../konva-editor/bedLayout/components/PaperBackground'
import type { BedLayoutDocument } from '../../konva-editor/types'
import type { BedStatusData } from '../types'
import { getLayoutBoundingBox } from '../utils/layoutUtils'
import { ElementRenderer } from './ElementRenderer'

interface KonvaViewerProps {
  document: BedLayoutDocument
  width: number // Container width for responsive scaling
  readOnly?: boolean
  onBedClick?: (bedId: string, currentStatus?: BedStatusData) => void
  bedStatusMap?: Record<string, BedStatusData>
}

const PADDING = 20

export const KonvaViewer: React.FC<KonvaViewerProps> = ({
  document,
  width,
  readOnly = false,
  onBedClick,
  bedStatusMap = {},
}) => {
  const [localDocument, setLocalDocument] = useState<BedLayoutDocument>(document)

  // Update local document when the prop changes
  useEffect(() => {
    setLocalDocument(document)
  }, [document])

  // Calculate view parameters based on bounding box
  const viewParams = useMemo(() => {
    if (!localDocument || width <= 0) return null

    // Adapt legacy document to Doc interface for getLayoutBoundingBox
    const docCompat = {
      nodes: localDocument.elementsById ? Object.values(localDocument.elementsById) : []
    } as unknown as import('../../konva-editor/types').Doc
    const bbox = getLayoutBoundingBox(docCompat)

    // Fallback to full layout if no content or error
    if (!bbox) {
      // Check for Unified Doc surface size (if converted)
      // Check for Unified Doc surface size (if converted)
      if ('surfaces' in localDocument && Array.isArray((localDocument as unknown as { surfaces: { w: number, h: number }[] }).surfaces) && (localDocument as unknown as { surfaces: unknown[] }).surfaces.length > 0) {
        const surface = (localDocument as unknown as { surfaces: { w: number, h: number }[] }).surfaces[0]
        const layoutW = surface.w
        const layoutH = surface.h
        const scale = width / layoutW
        return {
          scale,
          stageHeight: layoutH * scale,
          offsetX: 0,
          offsetY: 0,
        }
      }
      // Legacy fallback
      if (localDocument.layout) {
        const layoutW = localDocument.layout.width
        const layoutH = localDocument.layout.height
        const scale = width / layoutW
        return {
          scale,
          stageHeight: layoutH * scale,
          offsetX: 0,
          offsetY: 0,
        }
      }
      return null
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
  }, [localDocument, width])

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
        <PaperBackground document={localDocument} />
        {(localDocument.elementOrder || []).map((id) => {
          const element = localDocument.elementsById?.[id]
          if (!element || element.hidden) return null
          return (
            <ElementRenderer
              key={id}
              element={element}
              isSelected={false}
              onSelect={() => { }} // No-op
              onChange={() => { }} // No-op
              readOnly={readOnly}
              onBedClick={onBedClick}
              bedStatus={bedStatusMap[id]}
            />
          )
        })}
      </Layer>
    </Stage>
  )
}
