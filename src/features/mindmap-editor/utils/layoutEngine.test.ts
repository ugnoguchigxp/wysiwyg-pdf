import { describe, expect, it } from 'vitest'
import { calculateMindmapLayout } from '@/features/mindmap-editor/utils/layoutEngine'
import type { MindmapGraph } from '@/features/mindmap-editor/types'

describe('features/mindmap-editor/utils/layoutEngine', () => {
  const createMockGraph = (): MindmapGraph => ({
    rootId: 'root',
    parentIdMap: new Map([
      ['child1', 'root'],
      ['child2', 'root'],
      ['grandchild1', 'child1'],
    ]),
    childrenMap: new Map([
      ['root', ['child1', 'child2']],
      ['child1', ['grandchild1']],
      ['child2', []],
      ['grandchild1', []],
    ]),
    nodeMap: new Map([
      ['root', { id: 'root', t: 'text', x: 300, y: 200, w: 120, h: 40, s: 'surface' } as any],
      ['child1', { id: 'child1', t: 'text', x: 400, y: 200, w: 100, h: 40, s: 'surface', data: { layoutDir: 'right' } } as any],
      ['child2', { id: 'child2', t: 'text', x: 200, y: 250, w: 100, h: 40, s: 'surface', data: { layoutDir: 'left' } } as any],
      ['grandchild1', { id: 'grandchild1', t: 'text', x: 400, y: 250, w: 100, h: 40, s: 'surface' } as any],
    ]),
    linesMap: new Map([
      ['child1', { id: 'line1', t: 'line', startConn: { nodeId: 'root', anchor: 'auto' }, endConn: { nodeId: 'child1', anchor: 'auto' } } as any],
      ['child2', { id: 'line2', t: 'line', startConn: { nodeId: 'root', anchor: 'auto' }, endConn: { nodeId: 'child2', anchor: 'auto' } } as any],
      ['grandchild1', { id: 'line3', t: 'line', startConn: { nodeId: 'child1', anchor: 'auto' }, endConn: { nodeId: 'grandchild1', anchor: 'auto' } } as any],
    ]),
    linesById: new Map([
      ['line1', { id: 'line1', t: 'line', startConn: { nodeId: 'root', anchor: 'auto' }, endConn: { nodeId: 'child1', anchor: 'auto' } } as any],
      ['line2', { id: 'line2', t: 'line', startConn: { nodeId: 'root', anchor: 'auto' }, endConn: { nodeId: 'child2', anchor: 'auto' } } as any],
      ['line3', { id: 'line3', t: 'line', startConn: { nodeId: 'child1', anchor: 'auto' }, endConn: { nodeId: 'grandchild1', anchor: 'auto' } } as any],
    ]),
    depthMap: new Map([
      ['root', 0],
      ['child1', 1],
      ['child2', 1],
      ['grandchild1', 2],
    ]),
    isAncestor: () => false,
  })

  describe('calculateMindmapLayout', () => {
    it('returns empty result when rootId is null', () => {
      const graph: MindmapGraph = {
        rootId: null,
        parentIdMap: new Map(),
        childrenMap: new Map(),
        nodeMap: new Map(),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map(),
        isAncestor: () => false,
      }

      const result = calculateMindmapLayout(graph, new Set())

      expect(result.updates.size).toBe(0)
      expect(result.lineUpdates.size).toBe(0)
    })

    it('returns empty result when rootNode not found', () => {
      const graph: MindmapGraph = {
        rootId: 'nonexistent',
        parentIdMap: new Map(),
        childrenMap: new Map(),
        nodeMap: new Map(),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map(),
        isAncestor: () => false,
      }

      const result = calculateMindmapLayout(graph, new Set())

      expect(result.updates.size).toBe(0)
      expect(result.lineUpdates.size).toBe(0)
    })

    it('calculates positions for simple mindmap', () => {
      const graph = createMockGraph()
      const result = calculateMindmapLayout(graph, new Set())

      expect(result.updates.has('root')).toBe(true)
      expect(result.updates.has('child1')).toBe(true)
      expect(result.updates.has('child2')).toBe(true)
    })

    it('places root at node position (rootX/Y ignored)', () => {
      const graph = createMockGraph()
      const config = { horizontalSpacing: 30, verticalSpacing: 10, rootX: 100, rootY: 50 }

      const result = calculateMindmapLayout(graph, new Set(), config)

      const rootPos = result.updates.get('root')
      expect(rootPos).toBeDefined()
      expect(rootPos?.x).toBe(300)
      expect(rootPos?.y).toBe(200)
    })

    it('places children on right side when layoutDir is right', () => {
      const graph = createMockGraph()
      const result = calculateMindmapLayout(graph, new Set())

      const child1Pos = result.updates.get('child1')
      expect(child1Pos).toBeDefined()
      expect(child1Pos?.x).toBeGreaterThan(300)
    })

    it('places children on left side when layoutDir is left', () => {
      const graph = createMockGraph()
      const result = calculateMindmapLayout(graph, new Set())

      const child2Pos = result.updates.get('child2')
      expect(child2Pos).toBeDefined()
      expect(child2Pos?.x).toBeLessThan(300)
    })

    it('uses default config when not provided', () => {
      const graph = createMockGraph()
      const result = calculateMindmapLayout(graph, new Set())

      const rootPos = result.updates.get('root')
      expect(rootPos?.x).toBe(300)
      expect(rootPos?.y).toBe(200)
    })

    it('applies horizontal spacing between nodes', () => {
      const graph = createMockGraph()
      const result = calculateMindmapLayout(graph, new Set(), {
        horizontalSpacing: 50,
        verticalSpacing: 10,
        rootX: 0,
        rootY: 0,
      })

      const rootPos = result.updates.get('root')
      const child1Pos = result.updates.get('child1')

      expect(child1Pos?.x).toBeGreaterThan((rootPos?.x || 0) + 50)
    })

    it('applies vertical spacing between siblings', () => {
      const graph: MindmapGraph = {
        rootId: 'root',
        parentIdMap: new Map([
          ['child1', 'root'],
          ['child2', 'root'],
        ]),
        childrenMap: new Map([
          ['root', ['child1', 'child2']],
          ['child1', []],
          ['child2', []],
        ]),
        nodeMap: new Map([
          ['root', { id: 'root', t: 'text', x: 0, y: 0, w: 120, h: 40, s: 'surface' } as any],
          ['child1', { id: 'child1', t: 'text', x: 0, y: 0, w: 100, h: 40, s: 'surface', data: { layoutDir: 'right' } } as any],
          ['child2', { id: 'child2', t: 'text', x: 0, y: 0, w: 100, h: 40, s: 'surface', data: { layoutDir: 'right' } } as any],
        ]),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map([
          ['root', 0],
          ['child1', 1],
          ['child2', 1],
        ]),
        isAncestor: () => false,
      }

      const result = calculateMindmapLayout(graph, new Set(), {
        horizontalSpacing: 30,
        verticalSpacing: 20,
        rootX: 0,
        rootY: 0,
      })

      const child1Pos = result.updates.get('child1')
      const child2Pos = result.updates.get('child2')

      expect(Math.abs((child1Pos?.y || 0) - (child2Pos?.y || 0))).toBeGreaterThanOrEqual(40 + 20)
    })

    it('calculates line updates with correct anchors', () => {
      const graph = createMockGraph()
      const result = calculateMindmapLayout(graph, new Set())

      expect(result.lineUpdates.has('line1')).toBe(true)
      expect(result.lineUpdates.has('line2')).toBe(true)

      const line1Update = result.lineUpdates.get('line1')
      expect(line1Update).toBeDefined()
      expect(line1Update?.startAnchor).toBe('r')
      expect(line1Update?.endAnchor).toBe('l')

      const line2Update = result.lineUpdates.get('line2')
      expect(line2Update).toBeDefined()
      expect(line2Update?.startAnchor).toBe('l')
      expect(line2Update?.endAnchor).toBe('r')
    })

    it('calculates orthogonal line points', () => {
      const graph = createMockGraph()
      const result = calculateMindmapLayout(graph, new Set())

      const line1Update = result.lineUpdates.get('line1')
      expect(line1Update?.pts).toBeDefined()
      expect(line1Update?.pts?.length).toBe(8)
    })

    it('handles collapsed nodes by not positioning their children', () => {
      const graph = createMockGraph()
      const result = calculateMindmapLayout(graph, new Set(['child1']))

      const grandchildPos = result.updates.get('grandchild1')
      expect(grandchildPos).toBeUndefined()
    })

    it('positions children using alternating layout when no layoutDir', () => {
      const graph: MindmapGraph = {
        rootId: 'root',
        parentIdMap: new Map([
          ['child1', 'root'],
          ['child2', 'root'],
          ['child3', 'root'],
        ]),
        childrenMap: new Map([
          ['root', ['child1', 'child2', 'child3']],
          ['child1', []],
          ['child2', []],
          ['child3', []],
        ]),
        nodeMap: new Map([
          ['root', { id: 'root', t: 'text', x: 0, y: 0, w: 120, h: 40, s: 'surface' } as any],
          ['child1', { id: 'child1', t: 'text', x: 0, y: 0, w: 100, h: 40, s: 'surface' } as any],
          ['child2', { id: 'child2', t: 'text', x: 0, y: 0, w: 100, h: 40, s: 'surface' } as any],
          ['child3', { id: 'child3', t: 'text', x: 0, y: 0, w: 100, h: 40, s: 'surface' } as any],
        ]),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map([
          ['root', 0],
          ['child1', 1],
          ['child2', 1],
          ['child3', 1],
        ]),
        isAncestor: () => false,
      }

      const result = calculateMindmapLayout(graph, new Set())

      const child1Pos = result.updates.get('child1')
      const child2Pos = result.updates.get('child2')
      const child3Pos = result.updates.get('child3')

      expect(child1Pos?.x).toBeGreaterThan(0)
      expect(child2Pos?.x).toBeGreaterThan(0)
      expect(child3Pos?.x).toBeGreaterThan(0)
    })

    it('uses visual position as fallback when no layoutDir', () => {
      const graph: MindmapGraph = {
        rootId: 'root',
        parentIdMap: new Map([['child1', 'root']]),
        childrenMap: new Map([['root', ['child1']], ['child1', []]]),
        nodeMap: new Map([
          ['root', { id: 'root', t: 'text', x: 100, y: 0, w: 120, h: 40, s: 'surface' } as any],
          ['child1', { id: 'child1', t: 'text', x: 200, y: 0, w: 100, h: 40, s: 'surface' } as any],
        ]),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map([['root', 0], ['child1', 1]]),
        isAncestor: () => false,
      }

      const result = calculateMindmapLayout(graph, new Set())

      const child1Pos = result.updates.get('child1')
      expect(child1Pos?.x).toBeGreaterThan(100)
    })

    it('positions nested children correctly', () => {
      const graph = createMockGraph()
      const result = calculateMindmapLayout(graph, new Set())

      const child1Pos = result.updates.get('child1')
      const grandchildPos = result.updates.get('grandchild1')

      expect(grandchildPos?.x).toBeGreaterThan((child1Pos?.x || 0))
    })
  })
})
