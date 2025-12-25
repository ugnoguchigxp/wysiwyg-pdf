import { describe, expect, it } from 'vitest'
import { exportToMermaid, importFromMermaid } from '@/features/mindmap-editor/utils/mermaidUtils'
import { MindmapGraph } from '@/features/mindmap-editor/types'

describe('features/mindmap-editor/utils/mermaidUtils', () => {
  describe('exportToMermaid', () => {
    it('exports empty graph', () => {
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

      const result = exportToMermaid({} as any, graph)
      expect(result).toBe('')
    })

    it('exports single node', () => {
      const graph: MindmapGraph = {
        rootId: 'root',
        parentIdMap: new Map(),
        childrenMap: new Map([['root', []]]),
        nodeMap: new Map([['root', { id: 'root', t: 'text', text: 'Root', x: 0, y: 0, w: 100, h: 50, s: 'surface' }] as any]),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map([['root', 0]]),
        isAncestor: () => false,
      }

      const result = exportToMermaid({} as any, graph)
      expect(result).toBe('mindmap\n  root((Root))')
    })

    it('exports root with one child', () => {
      const graph: MindmapGraph = {
        rootId: 'root',
        parentIdMap: new Map([['child1', 'root']]),
        childrenMap: new Map([
          ['root', ['child1']],
          ['child1', []],
        ]),
        nodeMap: new Map([
          ['root', { id: 'root', t: 'text', text: 'Root', x: 0, y: 0, w: 100, h: 50, s: 'surface' }] as any,
          ['child1', { id: 'child1', t: 'text', text: 'Child 1', x: 100, y: 50, w: 100, h: 50, s: 'surface' }] as any,
        ]),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map([
          ['root', 0],
          ['child1', 1],
        ]),
        isAncestor: () => false,
      }

      const result = exportToMermaid({} as any, graph)
      expect(result).toBe('mindmap\n  root((Root))\n    Child 1')
    })

    it('exports multi-level hierarchy', () => {
      const graph: MindmapGraph = {
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
          ['root', { id: 'root', t: 'text', text: 'Root', x: 0, y: 0, w: 100, h: 50, s: 'surface' }] as any,
          ['child1', { id: 'child1', t: 'text', text: 'Child 1', x: 100, y: 50, w: 100, h: 50, s: 'surface' }] as any,
          ['child2', { id: 'child2', t: 'text', text: 'Child 2', x: 100, y: 150, w: 100, h: 50, s: 'surface' }] as any,
          ['grandchild1', { id: 'grandchild1', t: 'text', text: 'Grandchild', x: 200, y: 100, w: 100, h: 50, s: 'surface' }] as any,
        ]),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map([
          ['root', 0],
          ['child1', 1],
          ['child2', 1],
          ['grandchild1', 2],
        ]),
        isAncestor: () => false,
      }

      const result = exportToMermaid({} as any, graph)
      expect(result).toContain('mindmap')
      expect(result).toContain('root((Root))')
      expect(result).toContain('Child 1')
      expect(result).toContain('Child 2')
      expect(result).toContain('Grandchild')
    })

    it('returns empty string for non-text root node', () => {
      const graph: MindmapGraph = {
        rootId: 'root',
        parentIdMap: new Map(),
        childrenMap: new Map([['root', []]]),
        nodeMap: new Map([['root', { id: 'root', t: 'shape', x: 0, y: 0, w: 100, h: 50, s: 'surface' }] as any]),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map([['root', 0]]),
        isAncestor: () => false,
      }

      const result = exportToMermaid({} as any, graph)
      expect(result).toBe('')
    })
  })

  describe('importFromMermaid', () => {
    it('imports simple mindmap', () => {
      const syntax = `mindmap
  root((Central Topic))
    Child 1`

      const doc = importFromMermaid(syntax)

      expect(doc.id).toBeDefined()
      expect(doc.nodes).toHaveLength(3)
      expect(doc.nodes[0].t).toBe('text')
      expect((doc.nodes[0] as any).text).toBe('Central Topic')
      expect((doc.nodes[0] as any).tags).toContain('root')
      const childNode = doc.nodes.find((n: any) => n.t === 'text' && !n.tags?.includes('root'))
      expect(childNode).toBeDefined()
      expect(childNode.text).toBe('Child 1')
    })

    it('imports multi-level mindmap', () => {
      const syntax = `mindmap
  root((Root))
    Child 1
      Grandchild 1
    Child 2
      Grandchild 2
        Great Grandchild 1`

      const doc = importFromMermaid(syntax)

      expect(doc.nodes.length).toBeGreaterThan(3)
      const root = doc.nodes.find((n: any) => n.tags?.includes('root'))
      expect(root).toBeDefined()
      expect(root.text).toBe('Root')
    })

    it('creates lines between nodes', () => {
      const syntax = `mindmap
  root((Root))
    Child 1`

      const doc = importFromMermaid(syntax)

      const lines = doc.nodes.filter((n) => n.t === 'line')
      expect(lines).toHaveLength(1)
      const line = lines[0] as any
      expect(line.startConn).toBeDefined()
      expect(line.endConn).toBeDefined()
    })

    it('throws error for empty syntax', () => {
      expect(() => importFromMermaid('')).toThrow('No content to import')
    })

    it('throws error for invalid syntax - missing mindmap', () => {
      expect(() => importFromMermaid('root((Root))\n  Child 1')).toThrow(
        'Invalid Mermaid syntax: must start with "mindmap"'
      )
    })

    it('throws error for invalid syntax - missing root', () => {
      expect(() => importFromMermaid('mindmap\n  Child 1')).toThrow(
        'Invalid Mermaid syntax: root node not found'
      )
    })

    it('handles nodes with special characters in text', () => {
      const syntax = `mindmap
  root((Root text))
    Child with quotes`

      const doc = importFromMermaid(syntax)

      const root = doc.nodes.find((n: any) => n.tags?.includes('root'))
      expect(root?.text).toBe('Root text')
    })

    it('creates doc with proper structure', () => {
      const syntax = `mindmap
  root((Root))
    Child 1`

      const doc = importFromMermaid(syntax)

      expect(doc.v).toBe(1)
      expect(doc.title).toBe('Imported Mindmap')
      expect(doc.unit).toBe('mm')
      expect(doc.surfaces).toHaveLength(1)
      expect(doc.surfaces[0].id).toBe('s1')
    })

    it('handles multiple siblings', () => {
      const syntax = `mindmap
  root((Root))
    Child 1
    Child 2
    Child 3
    Child 4`

      const doc = importFromMermaid(syntax)

      const nodes = doc.nodes.filter((n: any) => n.t === 'text' && !n.tags?.includes('root'))
      expect(nodes).toHaveLength(4)
    })

    it('alternates left/right layout for siblings', () => {
      const syntax = `mindmap
  root((Root))
    Child 1
    Child 2
    Child 3
    Child 4`

      const doc = importFromMermaid(syntax)
      const childNodes = doc.nodes.filter((n: any) => n.t === 'text' && !n.tags?.includes('root'))

      expect(childNodes[0].data.layoutDir).toBe('right')
      expect(childNodes[1].data.layoutDir).toBe('left')
      expect(childNodes[2].data.layoutDir).toBe('right')
      expect(childNodes[3].data.layoutDir).toBe('left')
    })

    it('sets proper styling on nodes', () => {
      const syntax = `mindmap
  root((Root))
    Child 1`

      const doc = importFromMermaid(syntax)

      const root = doc.nodes.find((n: any) => n.tags?.includes('root'))
      expect(root.backgroundColor).toBe('#dbeafe')
      expect(root.borderColor).toBe('#3b82f6')
      expect(root.fontWeight).toBe(700)
      expect(root.locked).toBe(true)

      const child = doc.nodes.find((n: any) => n.t === 'text' && !n.tags?.includes('root'))
      expect(child.backgroundColor).toBe('#ffffff')
      expect(child.borderColor).toBe('#64748b')
      expect(child.fontWeight).toBe(400)
    })

    it('allows custom surfaceId', () => {
      const syntax = `mindmap
  root((Root))
    Child 1`

      const doc = importFromMermaid(syntax, 'custom-surface')

      expect(doc.surfaces[0].id).toBe('custom-surface')
      expect(doc.nodes.every((n: any) => n.s === 'custom-surface')).toBe(true)
    })

    it('handles blank lines', () => {
      const syntax = `mindmap
  root((Root))

    Child 1

    Child 2`

      const doc = importFromMermaid(syntax)

      const nodes = doc.nodes.filter((n: any) => n.t === 'text' && !n.tags?.includes('root'))
      expect(nodes).toHaveLength(2)
    })

    it('handles nested hierarchy correctly', () => {
      const syntax = `mindmap
  root((Root))
    Child 1
      Grandchild 1.1
      Grandchild 1.2
    Child 2
      Grandchild 2.1`

      const doc = importFromMermaid(syntax)

      const lines = doc.nodes.filter((n) => n.t === 'line')
      expect(lines.length).toBeGreaterThan(2)
    })
  })

  describe('round-trip', () => {
    it('can import and export similar structure', () => {
      const originalSyntax = `mindmap
  root((Root))
    Child 1
      Grandchild 1
    Child 2`

      const doc = importFromMermaid(originalSyntax)

      const lines = doc.nodes.filter((n) => n.t === 'line') as any[]
      const childrenMap = new Map<string, string[]>()
      const parentIdMap = new Map<string, string>()

      lines.forEach((line) => {
        const parentId = line.startConn.nodeId
        const childId = line.endConn.nodeId
        parentIdMap.set(childId, parentId)

        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, [])
        }
        childrenMap.get(parentId)!.push(childId)
      })

      const textNodes = doc.nodes.filter((n) => n.t === 'text')
      textNodes.forEach((node: any) => {
        if (!childrenMap.has(node.id)) {
          childrenMap.set(node.id, [])
        }
      })

      const graph: MindmapGraph = {
        rootId: (doc.nodes[0] as any).id,
        parentIdMap,
        childrenMap,
        nodeMap: new Map(textNodes.map((n: any) => [n.id, n])),
        linesMap: new Map(),
        linesById: new Map(lines.map((n) => [n.id, n])),
        depthMap: new Map(),
        isAncestor: () => false,
      }

      const exportedSyntax = exportToMermaid(doc, graph)

      expect(exportedSyntax).toContain('mindmap')
      expect(exportedSyntax).toContain('root((Root))')
      expect(exportedSyntax).toContain('Child 1')
      expect(exportedSyntax).toContain('Child 2')
      expect(exportedSyntax).toContain('Grandchild 1')
    })
  })
})
