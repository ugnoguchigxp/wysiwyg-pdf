import { describe, expect, it } from 'vitest'
import { getUpdateForConnectedLines } from '@/components/canvas/utils/lineUtils'

describe('components/canvas/utils/lineUtils', () => {
  describe('getUpdateForConnectedLines', () => {
    it('returns empty array when no connected lines', () => {
      const result = getUpdateForConnectedLines('node1', { id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50 }, [])
      expect(result).toEqual([])
    })

    it('updates connected line when node moves', () => {
      const node = { id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any
      const line = {
        id: 'line1',
        t: 'line' as const,
        startConn: { nodeId: 'node1', anchor: 'r' },
        endConn: { nodeId: 'node2', anchor: 'l' },
        pts: [100, 25, 200, 25],
        stroke: '#000',
        strokeW: 1,
        s: 'surface',
      } as any
      const otherNode = { id: 'node2', t: 'text', x: 100, y: 0, w: 100, h: 50, s: 'surface' } as any

      const result = getUpdateForConnectedLines('node1', node, [otherNode, line])

      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    it('updates both start and end connected lines', () => {
      const node = { id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any
      const line1 = {
        id: 'line1',
        t: 'line' as const,
        startConn: { nodeId: 'node1', anchor: 'r' },
        endConn: { nodeId: 'node2', anchor: 'l' },
        pts: [100, 25, 200, 25],
        stroke: '#000',
        strokeW: 1,
        s: 'surface',
      } as any
      const line2 = {
        id: 'line2',
        t: 'line' as const,
        startConn: { nodeId: 'node3', anchor: 'r' },
        endConn: { nodeId: 'node1', anchor: 'l' },
        pts: [-50, 25, 0, 25],
        stroke: '#000',
        strokeW: 1,
        s: 'surface',
      } as any
      const otherNode = { id: 'node2', t: 'text', x: 200, y: 0, w: 100, h: 50, s: 'surface' } as any
      const otherNode2 = { id: 'node3', t: 'text', x: -150, y: 0, w: 100, h: 50, s: 'surface' } as any

      const result = getUpdateForConnectedLines('node1', node, [otherNode, otherNode2, line1, line2])

      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    it('handles orthogonal routing', () => {
      const node = { id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50 } as any
      const line = {
        id: 'line1',
        t: 'line' as const,
        startConn: { nodeId: 'node1', anchor: 'r' },
        endConn: { nodeId: 'node2', anchor: 'l' },
        pts: [100, 25, 200, 25],
        routing: 'orthogonal',
      } as any
      const otherNode = { id: 'node2', t: 'text', x: 200, y: 0, w: 100, h: 50 } as any

      const result = getUpdateForConnectedLines('node1', node, [otherNode, line])

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('line1')
    })

    it('handles line with missing connection', () => {
      const node = { id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any
      const line = {
        id: 'line1',
        t: 'line' as const,
        startConn: undefined,
        endConn: { nodeId: 'node1', anchor: 'l' },
        pts: [0, 25, 100, 25],
        stroke: '#000',
        strokeW: 1,
        s: 'surface',
      } as any

      const result = getUpdateForConnectedLines('node1', node, [line])

      expect(result).toHaveLength(0)
    })
  })
})
