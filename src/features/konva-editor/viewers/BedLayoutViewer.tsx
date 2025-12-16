import type React from 'react'
import { KonvaViewer } from '@/components/canvas/KonvaViewer'
import type { BedStatusData } from '@/features/bed-layout-dashboard/types'
import {
  BedElement,
  BedOverlayText,
} from '@/features/konva-editor/renderers/bed-elements/BedElement'
import type { Doc, WidgetNode } from '@/types/canvas'
import { PaperBackground } from './components/PaperBackground'

interface BedLayoutViewerProps {
  document: Doc
  dashboardData?: Record<string, BedStatusData>
  zoom: number
  surfaceId?: string
}

export const BedLayoutViewer: React.FC<BedLayoutViewerProps> = ({
  document,
  dashboardData,
  zoom,
  surfaceId,
}) => {
  const resolvedSurfaceId =
    surfaceId ||
    document.surfaces.find((s) => s.type === 'canvas')?.id ||
    document.surfaces[0]?.id ||
    'layout'
  const surface = document.surfaces.find((s) => s.id === resolvedSurfaceId) || document.surfaces[0]
  const paperWidth = surface?.w ?? 0
  const paperHeight = surface?.h ?? 0

  const elements = document.nodes.filter((n) => n.s === resolvedSurfaceId)

  return (
    <KonvaViewer
      elements={elements}
      zoom={zoom}
      paperWidth={paperWidth}
      paperHeight={paperHeight}
      background={<PaperBackground document={document} surfaceId={resolvedSurfaceId} />}
      overlay={elements
        .filter((n) => n.t === 'widget' && (n as WidgetNode).widget === 'bed')
        .map((n) => {
          const bed = n as WidgetNode
          const bedStatus = dashboardData ? dashboardData[bed.id] : undefined
          return <BedOverlayText key={`${bed.id}__overlay`} element={bed} bedStatus={bedStatus} />
        })}
      renderCustom={(el, commonProps, handleShapeRef) => {
        if (el.t === 'widget' && el.widget === 'bed') {
          const { ref: _ignoredRef, ...propsWithoutRef } = commonProps
          const bedStatus = dashboardData ? dashboardData[el.id] : undefined
          return (
            <BedElement
              {...propsWithoutRef}
              element={el as WidgetNode}
              isSelected={false}
              shapeRef={handleShapeRef}
              bedStatus={bedStatus}
              enableStatusStyling={Boolean(dashboardData)}
              renderText={false}
            />
          )
        }
        return null
      }}
    />
  )
}
