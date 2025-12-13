import { describe, expect, it } from 'vitest'

import { convertDashboardRoomToDocument } from '../../../../../src/modules/konva-editor/utils/dashboardAdapter'
import type { WidgetNode, LineNode, TextNode } from '../../../../../src/types/canvas'

describe('convertDashboardRoomToDocument', () => {
  it('converts beds/walls/texts with status mapping', () => {
    const doc = convertDashboardRoomToDocument({
      room: {
        id: 'r1',
        name: 'Room',
        width: 1000,
        height: 800,
        beds: [{ id: 'b1', label: 'B1', x: 10, y: 20, width: 50, height: 100 }],
        walls: [
          {
            id: 'w1',
            start: { x: 0, y: 0 },
            end: { x: 10, y: 0 },
            stroke: '#111111',
            strokeWidth: 8,
          },
        ],
        texts: [
          { id: 't1', text: 'Hello', x: 1, y: 2, fontSize: 12, color: '#222' },
          { id: 't2', text: 'Mid', x: 1, y: 2, fontSize: 12, color: '#222', align: 'middle' },
          { id: 't3', text: 'End', x: 1, y: 2, fontSize: 12, color: '#222', align: 'end' },
        ],
      },
      statuses: [
        {
          bedId: 'b1',
          isOccupied: true,
          status: 'occupied',
          patientName: 'Alice',
          alerts: [],
          vitals: { bp: { systolic: 120, diastolic: 80 } },
        },
      ],
    } as unknown as Parameters<typeof convertDashboardRoomToDocument>[0])

    expect(doc.type).toBe('bed_layout')
    expect(doc.layout.width).toBe(1000)

    const bed = doc.elementsById.b1 as WidgetNode
    expect(bed.t).toBe('widget')
    expect(bed.data?.label).toBe('B1')
    expect(bed.data?.orientation).toBe('vertical')
    expect(bed.data?.status).toBe('occupied')
    expect(bed.data?.patientName).toBe('Alice')
    expect(bed.data?.bloodPressure).toBe('120/80')

    const wall = doc.elementsById.w1 as LineNode
    expect(wall.t).toBe('line')
    expect(wall.strokeW).toBe(8)

    const text = doc.elementsById.t1 as TextNode
    expect(text.t).toBe('text')
    expect(text.align).toBe('l')

    expect((doc.elementsById.t2 as TextNode).align).toBe('c')
    expect((doc.elementsById.t3 as TextNode).align).toBe('r')
  })

  it('handles missing walls/texts and defaults', () => {
    const doc = convertDashboardRoomToDocument({
      room: {
        id: 'r2',
        name: 'Room2',
        width: 10,
        height: 10,
        beds: [{ id: 'b2', label: 'B2', x: 0, y: 0, width: 100, height: 10 }],
        walls: undefined,
        texts: undefined,
      },
      statuses: [],
    } as any)

    const bed = doc.elementsById.b2 as WidgetNode
    expect(bed.data?.orientation).toBe('horizontal')
    expect(bed.data?.status).toBe('idle')
  })

  it('uses default wall/text styles when fields are missing', () => {
    const doc = convertDashboardRoomToDocument({
      room: {
        id: 'r3',
        name: 'Room3',
        width: 10,
        height: 10,
        beds: [],
        walls: [
          {
            id: 'w',
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
            stroke: undefined,
            strokeWidth: undefined,
          },
        ],
        texts: [{ id: 't', text: 'T', x: 0, y: 0, fontSize: undefined, color: undefined }],
      },
      statuses: [],
    } as unknown as Parameters<typeof convertDashboardRoomToDocument>[0])

    expect((doc.elementsById.w as LineNode).stroke).toBe('#000000')
    expect((doc.elementsById.w as LineNode).strokeW).toBe(6)
    expect((doc.elementsById.t as TextNode).fontSize).toBe(16)
    expect((doc.elementsById.t as TextNode).fill).toBe('#000000')
  })
})
