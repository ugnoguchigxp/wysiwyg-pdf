import { describe, it, expect } from 'vitest'
import { exportToMermaid, importFromMermaid } from '@/features/mindmap-editor/utils/mermaidUtils'
import type { UnifiedNode, Doc, TextNode } from '@/types/canvas'
import type { MindmapGraph } from '@/features/mindmap-editor/types'

describe('mermaidUtils', () => {
    const mockGraph: MindmapGraph = {
        rootId: 'root',
        parentIdMap: new Map(),
        childrenMap: new Map(),
        nodeMap: new Map(),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map(),
        isAncestor: () => false,
    }

    it('should export simple mindmap', () => {
        const rootNode: TextNode = {
            id: 'root',
            t: 'text',
            text: 'Root',
            s: 's1',
            x: 0, y: 0, w: 0, h: 0, align: 'c', vAlign: 'm', fill: '', fontSize: 12, locked: false
        }
        mockGraph.nodeMap.set('root', rootNode)

        const result = exportToMermaid({} as Doc, mockGraph)
        expect(result).toContain('mindmap')
        expect(result).toContain('root((Root))')
    })

    it('should sanitize special characters in text', () => {
        const rootNode: TextNode = {
            id: 'root',
            t: 'text',
            text: 'Root(Special)',
            s: 's1',
            x: 0, y: 0, w: 0, h: 0, align: 'c', vAlign: 'm', fill: '', fontSize: 12, locked: false
        }
        const childNode: TextNode = {
            id: 'child1',
            t: 'text',
            text: 'Child[Brackets]',
            s: 's1',
            x: 0, y: 0, w: 0, h: 0, align: 'c', vAlign: 'm', fill: '', fontSize: 12, locked: false
        }

        mockGraph.nodeMap.set('root', rootNode)
        mockGraph.nodeMap.set('child1', childNode)
        mockGraph.childrenMap.set('root', ['child1'])
        // @ts-ignore
        mockGraph.isAncestor = () => false

        const result = exportToMermaid({} as Doc, mockGraph)
        expect(result).toContain('root(("Root(Special)"))')
        expect(result).toContain('  "Child[Brackets]"')
    })

    it('should import mermaid syntax', () => {
        const syntax = `mindmap
  root((Root))
    Child 1
    Child 2`

        const doc = importFromMermaid(syntax)
        expect(doc.nodes).toHaveLength(5) // Root + 2 children + 2 lines
        const root = doc.nodes.find(n => n.t === 'text' && (n as TextNode).text === 'Root')
        expect(root).toBeDefined()
    })
})
