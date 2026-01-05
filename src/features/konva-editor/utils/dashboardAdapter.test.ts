import { describe, expect, it } from 'vitest'

import { convertDashboardRoomToDocument } from '@/features/konva-editor/utils/dashboardAdapter'
import type { WidgetNode, LineNode, TextNode } from '@/types/canvas'
import { pxToMm } from '@/utils/units'

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

    expect(doc.surfaces[0]).toEqual(
      expect.objectContaining({
        id: 'layout',
        type: 'canvas',
        w: pxToMm(1000, { dpi: 96 }),
        h: pxToMm(800, { dpi: 96 }),
      })
    )

    const byId = (id: string) => doc.nodes.find((n: { id: string }) => n.id === id)

    const bed = byId('b1') as WidgetNode
    expect(bed.t).toBe('widget')
    expect(bed.data?.label).toBe('B1')
    expect(bed.data?.orientation).toBe('vertical')
    expect(bed.data?.status).toBe('occupied')
    expect(bed.data?.patientName).toBe('Alice')
    expect(bed.data?.bloodPressure).toBe('120/80')

    const wall = byId('w1') as LineNode
    expect(wall.t).toBe('line')
    expect(wall.strokeW).toBeCloseTo(pxToMm(8, { dpi: 96 }), 10)

    const text = byId('t1') as TextNode
    expect(text.t).toBe('text')
    expect(text.align).toBe('l')

    expect((byId('t2') as TextNode).align).toBe('c')
    expect((byId('t3') as TextNode).align).toBe('r')
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

    const bed = doc.nodes.find((n: { id: string }) => n.id === 'b2') as WidgetNode
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

    const wall = doc.nodes.find((n: { id: string }) => n.id === 'w') as LineNode
    expect(wall.stroke).toBe('#000000')
    expect(wall.strokeW).toBe(0.4)

    const text = doc.nodes.find((n: { id: string }) => n.id === 't') as TextNode
    expect(text.fontSize).toBeCloseTo(pxToMm(16, { dpi: 96 }), 10)
    expect(text.fill).toBe('#000000')
  })
})
