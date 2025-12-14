import type { BedDashboardRoom, BedStatus } from '@/features/bed-layout-dashboard/types'
import type {
  Doc,
  UnifiedNode,
  WidgetNode,
  LineNode,
  TextNode,
} from '@/types/canvas'

export const convertDashboardRoomToDocument = (
  dashboardRoom: BedDashboardRoom
): Doc => {
  const { room, statuses } = dashboardRoom

  // Create a map of bed statuses for quick lookup
  const statusMap = new Map<string, BedStatus>()
  statuses.forEach((status: BedStatus) => {
    statusMap.set(status.bedId, status)
  })

  const surfaceId = 'layout'
  const nodes: UnifiedNode[] = []

  // Convert Beds
  room.beds.forEach((bed: any) => {
    const status = statusMap.get(bed.id)
    const isVertical = bed.height > bed.width

    const bedElement: WidgetNode = {
      id: bed.id,
      t: 'widget',
      widget: 'bed',
      s: surfaceId,
      x: bed.x,
      y: bed.y,
      w: bed.width,
      h: bed.height,
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
    room.walls.forEach((wall: any) => {
      const wallElement: LineNode = {
        id: wall.id,
        t: 'line',
        s: surfaceId,
        pts: [wall.start.x, wall.start.y, wall.end.x, wall.end.y],
        stroke: wall.stroke || '#000000',
        strokeW: wall.strokeWidth || 6,
        r: 0,
        locked: false,
        name: 'Wall',
      }
      nodes.push(wallElement)
    })
  }

  // Convert Texts
  if (room.texts) {
    room.texts.forEach((text: any) => {
      const textElement: TextNode = {
        id: text.id,
        t: 'text',
        s: surfaceId,
        x: text.x,
        y: text.y,
        w: 200,
        h: 30, // defaults
        text: text.text,
        font: 'Meiryo',
        fontSize: text.fontSize || 16,
        fontWeight: 400,
        fill: text.color || '#000000',
        align: (() => {
          const textAlign = 'align' in text ? text.align : undefined
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
    unit: 'px',
    surfaces: [
      { id: surfaceId, type: 'canvas', w: room.width, h: room.height },
    ],
    nodes,
  }
}
