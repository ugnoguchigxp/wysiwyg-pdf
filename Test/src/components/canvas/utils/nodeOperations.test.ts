import { describe, expect, it } from 'vitest'
import { calculateNodeMoveUpdates } from '@/components/canvas/utils/nodeOperations'

describe('components/canvas/utils/nodeOperations', () => {
  describe('calculateNodeMoveUpdates', () => {
    it('returns update for node position change', () => {
      const node = { id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50 } as any
      const result = calculateNodeMoveUpdates(node, { x: 10, y: 20 }, [])

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('node1')
      expect(result[0].x).toBe(10)
      expect(result[0].y).toBe(20)
    })

    it('includes updates for connected lines', () => {
      const node = { id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50 } as any
      const line = {
        id: 'line1',
        t: 'line' as const,
        startConn: { nodeId: 'node1', anchor: 'r' },
        endConn: { nodeId: 'node2', anchor: 'l' },
        pts: [100, 25, 200, 25],
      } as any
      const otherNode = { id: 'node2', t: 'text', x: 200, y: 0, w: 100, h: 50 } as any

      const result = calculateNodeMoveUpdates(node, { x: 10, y: 20 }, [otherNode, line])

      expect(result.length).toBeGreaterThan(0)
      const nodeUpdate = result.find((u) => u.id === 'node1')
      expect(nodeUpdate).toBeDefined()
      expect(nodeUpdate?.x).toBe(10)
      expect(nodeUpdate?.y).toBe(20)

      const lineUpdate = result.find((u) => u.id === 'line1')
      expect(lineUpdate).toBeDefined()
      expect(lineUpdate?.pts).toBeDefined()
    })

    it('handles line nodes correctly', () => {
      const line = { id: 'line1', t: 'line' as const, pts: [0, 0, 100, 100] } as any
      const result = calculateNodeMoveUpdates(line, { x: 10, y: 20 }, [])

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('line1')
      expect(result[0].x).toBe(10)
      expect(result[0].y).toBe(20)
    })

    it('handles node with no connections', () => {
      const node = { id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50 } as any
      const otherNode = { id: 'node2', t: 'text', x: 200, y: 0, w: 100, h: 50 } as any

      const result = calculateNodeMoveUpdates(node, { x: 10, y: 20 }, [otherNode])

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('node1')
      expect(result[0].x).toBe(10)
      expect(result[0].y).toBe(20)
    })
  })
})
