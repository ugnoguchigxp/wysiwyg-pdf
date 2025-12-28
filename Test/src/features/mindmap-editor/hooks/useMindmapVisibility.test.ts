import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMindmapVisibility } from '@/features/mindmap-editor/hooks/useMindmapVisibility'
import type { Doc, TextNode, LineNode } from '@/types/canvas'
import type { MindmapGraph } from '../types'

describe('useMindmapVisibility', () => {
    const rootNode: TextNode = { id: 'root', t: 'text', s: 's1', text: 'Root', x: 0, y: 0, w: 0, h: 0, align: 'c', vAlign: 'm', fill: '', fontSize: 12, locked: false }
    const child1: TextNode = { id: 'c1', t: 'text', s: 's1', text: 'C1', x: 0, y: 0, w: 0, h: 0, align: 'c', vAlign: 'm', fill: '', fontSize: 12, locked: false }
    const child2: TextNode = { id: 'c2', t: 'text', s: 's1', text: 'C2', x: 0, y: 0, w: 0, h: 0, align: 'c', vAlign: 'm', fill: '', fontSize: 12, locked: false }
    const line1: LineNode = { id: 'l1', t: 'line', s: 's1', startConn: { nodeId: 'root', anchor: 'auto' }, endConn: { nodeId: 'c1', anchor: 'auto' }, pts: [], stroke: '', strokeW: 1, routing: 'straight', locked: false }

    const doc: Doc = {
        v: 1, id: 'd1', title: 'test', unit: 'mm', surfaces: [],
        nodes: [rootNode, child1, child2, line1]
    }

    const graph: MindmapGraph = {
        rootId: 'root',
        parentIdMap: new Map([['c1', 'root'], ['c2', 'c1']]), // root -> c1 -> c2
        childrenMap: new Map([['root', ['c1']], ['c1', ['c2']]]),
        nodeMap: new Map(),
        linesMap: new Map(),
        linesById: new Map(),
        depthMap: new Map(),
        isAncestor: () => false
    }

    it('should show all nodes when nothing is collapsed', () => {
        const collapsedNodes = new Set<string>()
        const { result } = renderHook(() => useMindmapVisibility(doc, graph, collapsedNodes))

        expect(result.current).toHaveLength(4)
    })

    it('should hide children of collapsed node', () => {
        const collapsedNodes = new Set<string>(['root'])
        const { result } = renderHook(() => useMindmapVisibility(doc, graph, collapsedNodes))

        // Root should be visible, children hidden
        // Line connects root -> c1. If c1 is hidden, line is hidden.
        const visibleIds = result.current.map(n => n.id)
        expect(visibleIds).toContain('root')
        expect(visibleIds).not.toContain('c1')
        expect(visibleIds).not.toContain('c2')
        expect(visibleIds).not.toContain('l1')
    })

    it('should hide grandchildren when middle node is collapsed', () => {
        const collapsedNodes = new Set<string>(['c1'])
        const { result } = renderHook(() => useMindmapVisibility(doc, graph, collapsedNodes))

        // Root visible, C1 visible (it's the one collapsed, but it itself is visible), C2 hidden
        // Line l1 connects Root -> C1. Both visible -> Line visible.
        const visibleIds = result.current.map(n => n.id)
        expect(visibleIds).toContain('root')
        expect(visibleIds).toContain('c1')
        expect(visibleIds).toContain('l1')
        expect(visibleIds).not.toContain('c2')
    })
})
