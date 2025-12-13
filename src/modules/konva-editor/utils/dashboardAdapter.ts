import type { BedDashboardRoom, BedStatus } from '../../bedlayout-dashboard/types'
import type {
  BedLayoutDocument,
  UnifiedNode,
  WidgetNode,
  LineNode,
  TextNode,
} from '../types'

export const convertDashboardRoomToDocument = (
  dashboardRoom: BedDashboardRoom
): BedLayoutDocument => {
  const { room, statuses } = dashboardRoom

  // Create a map of bed statuses for quick lookup
  const statusMap = new Map<string, BedStatus>()
  statuses.forEach((status) => {
    statusMap.set(status.bedId, status)
  })

  const elementsById: Record<string, UnifiedNode> = {}
  const elementOrder: string[] = []

  // Convert Beds
  room.beds.forEach((bed) => {
    const status = statusMap.get(bed.id)
    const isVertical = bed.height > bed.width

    const bedElement: WidgetNode = {
      id: bed.id,
      t: 'widget',
      widget: 'bed',
      s: '', // surface ID not set, might need context or assume 'page-1' if used in a Doc
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

    elementsById[bed.id] = bedElement
    elementOrder.push(bed.id)
  })

  // Convert Walls (to Lines)
  if (room.walls) {
    room.walls.forEach((wall) => {
      const wallElement: LineNode = {
        id: wall.id,
        t: 'line',
        s: '',
        pts: [wall.start.x, wall.start.y, wall.end.x, wall.end.y],
        stroke: wall.stroke || '#000000',
        strokeW: wall.strokeWidth || 6,
        r: 0,
        locked: false,
        name: 'Wall',
      }
      elementsById[wall.id] = wallElement
      elementOrder.push(wall.id)
    })
  }

  // Convert Texts
  if (room.texts) {
    room.texts.forEach((text) => {
      const textElement: TextNode = {
        id: text.id,
        t: 'text',
        s: '',
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
      elementsById[text.id] = textElement
      elementOrder.push(text.id)
    })
  }

  return {
    id: room.id,
    type: 'bed_layout',
    name: room.name,
    layout: {
      mode: 'landscape', // Default
      width: room.width,
      height: room.height,
    },
    elementsById,
    elementOrder,
  }
}
