import type React from 'react'
import { KonvaViewer } from '@/components/canvas/KonvaViewer'
import type { BedStatusData } from '@/features/bed-layout-dashboard/types'
import {
  BedElement,
  BedOverlayText,
} from '@/features/konva-editor/renderers/bed-elements/BedElement'
import type { Doc, WidgetNode } from '@/types/canvas'
import { PaperBackground } from './components/PaperBackground'

export interface BedGroupConfig {
  id: string
  name: string
  color: string
  bedIds: string[]
}

interface LegacyBedGroupConfig {
  id: string
  name: string
  color: string
}

export interface BedLayoutViewerProps {
  document: Doc
  dashboardData?: Record<string, BedStatusData>
  zoom: number
  surfaceId?: string
  bedGroups?: BedGroupConfig[]
}

export const BedLayoutViewer: React.FC<BedLayoutViewerProps> = ({
  document,
  dashboardData,
  zoom,
  surfaceId,
  bedGroups,
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
  const hasPropBedGroups = bedGroups !== undefined

  const groupColorByBedId = new Map<string, string>()
  if (hasPropBedGroups) {
    for (const group of bedGroups) {
      for (const bedId of group.bedIds) {
        // Keep the first definition when a bed is assigned to multiple groups.
        if (!groupColorByBedId.has(bedId)) {
          groupColorByBedId.set(bedId, group.color)
        }
      }
    }
  }

  const legacyBedGroups: LegacyBedGroupConfig[] = hasPropBedGroups
    ? []
    : ((document.data?.bedGroups as LegacyBedGroupConfig[] | undefined) ?? [])
  const legacyGroupColorById = new Map(legacyBedGroups.map((group) => [group.id, group.color]))

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
          const bedNode = el as WidgetNode
          const bedStatus = dashboardData ? dashboardData[el.id] : undefined
          const myGroupId =
            typeof bedNode.data?.groupId === 'string' ? (bedNode.data.groupId as string) : undefined
          const groupColor = hasPropBedGroups
            ? groupColorByBedId.get(bedNode.id)
            : myGroupId
              ? legacyGroupColorById.get(myGroupId)
              : undefined

          return (
            <BedElement
              {...propsWithoutRef}
              element={bedNode}
              isSelected={false}
              shapeRef={handleShapeRef}
              bedStatus={bedStatus}
              enableStatusStyling={Boolean(dashboardData)}
              groupColor={groupColor}
              renderText={false}
            />
          )
        }
        return null
      }}
    />
  )
}
