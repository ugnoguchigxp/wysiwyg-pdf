import type { BedDashboardRoom, BedStatus } from '../../bedlayout-dashboard/types'
import type {
  BedLayoutDocument,
  BedLayoutElement,
  IBedElement,
  ILineElement,
  ITextElement,
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

  const elementsById: Record<string, BedLayoutElement> = {}
  const elementOrder: string[] = []

  // Convert Beds
  room.beds.forEach((bed) => {
    const status = statusMap.get(bed.id)
    const isVertical = bed.height > bed.width

    const bedElement: IBedElement = {
      id: bed.id,
      type: 'Bed',
      box: {
        x: bed.x,
        y: bed.y,
        width: bed.width,
        height: bed.height,
      },
      rotation: 0,
      label: bed.label,
      orientation: isVertical ? 'vertical' : 'horizontal',
      status: status ? status.status : 'idle',
      visible: true,
      locked: false,
      name: 'Bed',
      z: 0,
      // Extended properties for dashboard display
      // Note: These need to be added to IBedElement type if not present
      patientName: status?.patientName,
      statusMessage: undefined,
      bloodPressure: status?.vitals?.bp
        ? `${status.vitals.bp.systolic}/${status.vitals.bp.diastolic}`
        : undefined,
    } as IBedElement // Cast to IBedElement to allow extra props if type definition is lagging

    elementsById[bed.id] = bedElement
    elementOrder.push(bed.id)
  })

  // Convert Walls (to Lines)
  if (room.walls) {
    room.walls.forEach((wall) => {
      const wallElement: ILineElement = {
        id: wall.id,
        type: 'Line',
        startPoint: { x: wall.start.x, y: wall.start.y },
        endPoint: { x: wall.end.x, y: wall.end.y },
        stroke: {
          color: wall.stroke || '#000000',
          width: wall.strokeWidth || 6,
        },
        rotation: 0,
        visible: true,
        locked: false,
        name: 'Wall',
        z: 0,
        startArrow: 'none',
        endArrow: 'none',
      }
      elementsById[wall.id] = wallElement
      elementOrder.push(wall.id)
    })
  }

  // Convert Texts
  if (room.texts) {
    room.texts.forEach((text) => {
      const textElement: ITextElement = {
        id: text.id,
        type: 'Text',
        box: {
          x: text.x,
          y: text.y,
          width: 200, // Default width
          height: 30, // Default height
        },
        text: text.text,
        font: {
          family: 'Meiryo',
          size: text.fontSize || 16,
          weight: 400,
        },
        color: text.color || '#000000',
        align: (() => {
          const textAlign = 'align' in text ? text.align : undefined
          if (textAlign === 'middle') return 'center'
          if (textAlign === 'end') return 'right'
          return 'left'
        })(),
        verticalAlign: 'middle',
        rotation: 0,
        visible: true,
        locked: false,
        name: 'Text',
        z: 0,
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
