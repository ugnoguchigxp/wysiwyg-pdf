import { describe, expect, it } from 'vitest'
import { buildMindmapGraph, getSubtreeIds, isAncestor } from '@/features/mindmap-editor/utils/treeUtils'

describe('features/mindmap-editor/utils/treeUtils', () => {
  describe('buildMindmapGraph', () => {
    it('builds graph with root and children', () => {
      const nodes = [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface', tags: ['root'] },
        { id: 'line1', t: 'line', s: 'surface', pts: [0, 0, 100, 50], startConn: { nodeId: 'root', anchor: 'right' }, endConn: { nodeId: 'child1', anchor: 'left' }, stroke: '#000', strokeW: 1 },
        { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 'surface' },
      ] as any[]

      const graph = buildMindmapGraph(nodes)

      expect(graph.rootId).toBe('root')
      expect(graph.parentIdMap.get('child1')).toBe('root')
      expect(graph.childrenMap.get('root')).toEqual(['child1'])
      expect(graph.nodeMap.get('root')?.id).toBe('root')
      expect(graph.nodeMap.get('child1')?.id).toBe('child1')
      expect(graph.linesMap.get('child1')?.id).toBe('line1')
      expect(graph.depthMap.get('root')).toBe(0)
      expect(graph.depthMap.get('child1')).toBe(1)
    })

    it('builds multi-level hierarchy', () => {
      const nodes = [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface', tags: ['root'] },
        { id: 'line1', t: 'line', s: 'surface', pts: [0, 0, 100, 50], startConn: { nodeId: 'root', anchor: 'right' }, endConn: { nodeId: 'child1', anchor: 'left' }, stroke: '#000', strokeW: 1 },
        { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 'surface' },
        { id: 'line2', t: 'line', s: 'surface', pts: [100, 50, 200, 100], startConn: { nodeId: 'child1', anchor: 'right' }, endConn: { nodeId: 'child2', anchor: 'left' }, stroke: '#000', strokeW: 1 },
        { id: 'child2', t: 'text', x: 200, y: 100, w: 100, h: 50, s: 'surface' },
      ] as any[]

      const graph = buildMindmapGraph(nodes)

      expect(graph.rootId).toBe('root')
      expect(graph.depthMap.get('root')).toBe(0)
      expect(graph.depthMap.get('child1')).toBe(1)
      expect(graph.depthMap.get('child2')).toBe(2)
      expect(graph.childrenMap.get('root')).toEqual(['child1'])
      expect(graph.childrenMap.get('child1')).toEqual(['child2'])
    })

    it('handles nodes with multiple children', () => {
      const nodes = [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface', tags: ['root'] },
        { id: 'line1', t: 'line', s: 'surface', pts: [0, 0, 100, 50], startConn: { nodeId: 'root', anchor: 'right' }, endConn: { nodeId: 'child1', anchor: 'left' }, stroke: '#000', strokeW: 1 },
        { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 'surface' },
        { id: 'line2', t: 'line', s: 'surface', pts: [0, 0, 100, 150], startConn: { nodeId: 'root', anchor: 'right' }, endConn: { nodeId: 'child2', anchor: 'left' }, stroke: '#000', strokeW: 1 },
        { id: 'child2', t: 'text', x: 100, y: 150, w: 100, h: 50, s: 'surface' },
      ] as any[]

      const graph = buildMindmapGraph(nodes)

      expect(graph.childrenMap.get('root')).toHaveLength(2)
      expect(graph.childrenMap.get('root')).toContain('child1')
      expect(graph.childrenMap.get('root')).toContain('child2')
    })

    it('finds root without explicit tag', () => {
      const nodes = [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' },
        { id: 'line1', t: 'line', s: 'surface', pts: [0, 0, 100, 50], startConn: { nodeId: 'root', anchor: 'right' }, endConn: { nodeId: 'child1', anchor: 'left' }, stroke: '#000', strokeW: 1 },
        { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 'surface' },
      ] as any[]

      const graph = buildMindmapGraph(nodes)

      expect(graph.rootId).toBe('root')
    })

    it('handles empty nodes array', () => {
      const graph = buildMindmapGraph([])

      expect(graph.rootId).toBeNull()
      expect(graph.nodeMap.size).toBe(0)
      expect(graph.childrenMap.size).toBe(0)
      expect(graph.linesMap.size).toBe(0)
    })

    it('ignores lines without connections', () => {
      const nodes = [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface', tags: ['root'] },
        { id: 'line1', t: 'line', s: 'surface', pts: [0, 0, 100, 50], stroke: '#000', strokeW: 1 },
        { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 'surface' },
      ] as any[]

      const graph = buildMindmapGraph(nodes)

      expect(graph.rootId).toBe('root')
      expect(graph.parentIdMap.has('child1')).toBe(false)
      expect(graph.linesMap.size).toBe(0)
    })

    it('creates linesById map', () => {
      const nodes = [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface', tags: ['root'] },
        { id: 'line1', t: 'line', s: 'surface', pts: [0, 0, 100, 50], startConn: { nodeId: 'root', anchor: 'right' }, endConn: { nodeId: 'child1', anchor: 'left' }, stroke: '#000', strokeW: 1 },
        { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 'surface' },
      ] as any[]

      const graph = buildMindmapGraph(nodes)

      expect(graph.linesById.has('line1')).toBe(true)
      expect(graph.linesById.get('line1')?.id).toBe('line1')
    })
  })

  describe('getSubtreeIds', () => {
    const childrenMap = new Map([
      ['root', ['child1', 'child2']],
      ['child1', ['grandchild1', 'grandchild2']],
      ['child2', []],
      ['grandchild1', []],
      ['grandchild2', []],
    ])

    it('returns root id for leaf node', () => {
      const result = getSubtreeIds('grandchild1', childrenMap)
      expect(result).toEqual(['grandchild1'])
    })

    it('returns all descendant ids', () => {
      const result = getSubtreeIds('root', childrenMap)
      expect(result).toContain('root')
      expect(result).toContain('child1')
      expect(result).toContain('child2')
      expect(result).toContain('grandchild1')
      expect(result).toContain('grandchild2')
      expect(result).toHaveLength(5)
    })

    it('returns subtree starting from middle node', () => {
      const result = getSubtreeIds('child1', childrenMap)
      expect(result).toContain('child1')
      expect(result).toContain('grandchild1')
      expect(result).toContain('grandchild2')
      expect(result).not.toContain('root')
      expect(result).not.toContain('child2')
    })
  })

  describe('isAncestor', () => {
    const parentIdMap = new Map([
      ['child1', 'root'],
      ['child2', 'root'],
      ['grandchild1', 'child1'],
      ['grandchild2', 'child1'],
    ])

    it('returns true for direct parent', () => {
      expect(isAncestor('root', 'child1', parentIdMap)).toBe(true)
      expect(isAncestor('child1', 'grandchild1', parentIdMap)).toBe(true)
    })

    it('returns true for indirect ancestor', () => {
      expect(isAncestor('root', 'grandchild1', parentIdMap)).toBe(true)
    })

    it('returns false for unrelated nodes', () => {
      expect(isAncestor('child1', 'child2', parentIdMap)).toBe(false)
      expect(isAncestor('child2', 'child1', parentIdMap)).toBe(false)
    })

    it('returns false when descendant is ancestor', () => {
      expect(isAncestor('child1', 'root', parentIdMap)).toBe(false)
    })

    it('returns false for node that does not exist in map', () => {
      expect(isAncestor('root', 'nonexistent', parentIdMap)).toBe(false)
    })

    it('returns true for self comparison when node has itself as ancestor (should not happen normally)', () => {
      expect(isAncestor('root', 'root', parentIdMap)).toBe(false)
    })
  })

  describe('MindmapGraph.isAncestor', () => {
    it('works via graph method', () => {
      const nodes = [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface', tags: ['root'] },
        { id: 'line1', t: 'line', s: 'surface', pts: [0, 0, 100, 50], startConn: { nodeId: 'root', anchor: 'right' }, endConn: { nodeId: 'child1', anchor: 'left' }, stroke: '#000', strokeW: 1 },
        { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 'surface' },
        { id: 'line2', t: 'line', s: 'surface', pts: [100, 50, 200, 100], startConn: { nodeId: 'child1', anchor: 'right' }, endConn: { nodeId: 'grandchild1', anchor: 'left' }, stroke: '#000', strokeW: 1 },
        { id: 'grandchild1', t: 'text', x: 200, y: 100, w: 100, h: 50, s: 'surface' },
      ] as any[]

      const graph = buildMindmapGraph(nodes)

      expect(graph.isAncestor('root', 'grandchild1')).toBe(true)
      expect(graph.isAncestor('root', 'child1')).toBe(true)
      expect(graph.isAncestor('child1', 'grandchild1')).toBe(true)
      expect(graph.isAncestor('child1', 'root')).toBe(false)
    })
  })
})
