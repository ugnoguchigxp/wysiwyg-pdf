import type { BedDashboardRoom, BedStatus } from '@/features/bed-layout-dashboard/types'
import type { Doc, LineNode, TextNode, UnifiedNode, WidgetNode } from '@/types/canvas'
import { pxToMm } from '@/utils/units'

export const convertDashboardRoomToDocument = (dashboardRoom: BedDashboardRoom): Doc => {
  const { room, statuses } = dashboardRoom

  const dpi = 96

  // Create a map of bed statuses for quick lookup
  const statusMap = new Map<string, BedStatus>()
  statuses.forEach((status: BedStatus) => {
    statusMap.set(status.bedId, status)
  })

  const surfaceId = 'layout'
  const nodes: UnifiedNode[] = []

  // Convert Beds
  room.beds.forEach((bed) => {
    const status = statusMap.get(bed.id)
    const isVertical = bed.height > bed.width

    const bedElement: WidgetNode = {
      id: bed.id,
      t: 'widget',
      widget: 'bed',
      s: surfaceId,
      x: pxToMm(bed.x, { dpi }),
      y: pxToMm(bed.y, { dpi }),
      w: pxToMm(bed.width, { dpi }),
      h: pxToMm(bed.height, { dpi }),
      r: 0,
      name: 'Bed',
      data: {
        label: bed.label,
        orientation: isVertical ? 'vertical' : 'horizontal',
        status: status ? status.status : 'idle',
        patientName: status?.patientName,
        bloodPressure: status?.vitals?.bp
          ? `${status.vitals.bp.systolic}/${status.vitals.bp.diastolic}`
          : undefined,
      },
      locked: false,
    }

    nodes.push(bedElement)
  })

  // Convert Walls (to Lines)
  if (room.walls) {
    room.walls.forEach((wall) => {
      const wallElement: LineNode = {
        id: wall.id,
        t: 'line',
        s: surfaceId,
        pts: [
          pxToMm(wall.start.x, { dpi }),
          pxToMm(wall.start.y, { dpi }),
          pxToMm(wall.end.x, { dpi }),
          pxToMm(wall.end.y, { dpi }),
        ],
        stroke: wall.stroke || '#000000',
        strokeW: typeof wall.strokeWidth === 'number' ? pxToMm(wall.strokeWidth, { dpi }) : 0.4,
        r: 0,
        locked: false,
        name: 'Wall',
      }
      nodes.push(wallElement)
    })
  }

  // Convert Texts
  if (room.texts) {
    room.texts.forEach((text) => {
      const textElement: TextNode = {
        id: text.id,
        t: 'text',
        s: surfaceId,
        x: pxToMm(text.x, { dpi }),
        y: pxToMm(text.y, { dpi }),
        w: pxToMm(200, { dpi }),
        h: pxToMm(30, { dpi }), // defaults
        text: text.text,
        font: 'Meiryo',
        fontSize: typeof text.fontSize === 'number' ? pxToMm(text.fontSize, { dpi }) : pxToMm(16, { dpi }),
        fontWeight: 400,
        fill: text.color || '#000000',
        align: (() => {
          const textAlign = text.align
          if (textAlign === 'middle') return 'c'
          if (textAlign === 'end') return 'r'
          return 'l'
        })(),
        vAlign: 'm',
        r: 0,
        locked: false,
        name: 'Text',
      }
      nodes.push(textElement)
    })
  }

  return {
    v: 1,
    id: room.id,
    title: room.name,
    unit: 'mm',
    surfaces: [
      {
        id: surfaceId,
        type: 'canvas',
        w: pxToMm(room.width, { dpi }),
        h: pxToMm(room.height, { dpi }),
      },
    ],
    nodes,
  }
}
