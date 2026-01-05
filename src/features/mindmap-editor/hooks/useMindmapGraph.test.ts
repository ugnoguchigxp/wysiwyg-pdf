import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMindmapGraph } from '@/features/mindmap-editor/hooks/useMindmapGraph'
import { buildMindmapGraph } from '@/features/mindmap-editor/utils/treeUtils'

vi.mock('@/features/mindmap-editor/utils/treeUtils', () => ({
  buildMindmapGraph: vi.fn(() => ({
    rootId: 'root',
    parentIdMap: new Map(),
    childrenMap: new Map(),
    nodeMap: new Map(),
    linesMap: new Map(),
    linesById: new Map(),
    depthMap: new Map(),
    isAncestor: () => false,
  })),
}))

describe('features/mindmap-editor/hooks/useMindmapGraph', () => {
  it('returns graph from buildMindmapGraph', () => {
    const mockDoc = {
      nodes: [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface', tags: ['root'] },
        { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 'surface' },
      ],
    } as any

    const { result } = renderHook(() => useMindmapGraph(mockDoc))

    expect(result.current).toBeDefined()
    expect(result.current.rootId).toBe('root')
  })

  it('calls buildMindmapGraph with nodes', () => {
    const mockDoc = {
      nodes: [{ id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' }],
    } as any

    renderHook(() => useMindmapGraph(mockDoc))

    expect(buildMindmapGraph).toHaveBeenCalledWith(mockDoc.nodes)
  })

  it('handles empty nodes array', () => {
    const mockDoc = { nodes: [] } as any

    const { result } = renderHook(() => useMindmapGraph(mockDoc))

    expect(result.current).toBeDefined()
  })

  it('memoizes graph result', () => {
    const mockDoc = {
      nodes: [{ id: 'node1', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' }],
    } as any

    const { result, rerender } = renderHook(() => useMindmapGraph(mockDoc))

    const firstGraph = result.current
    rerender(mockDoc)
    const secondGraph = result.current

    expect(firstGraph).toBe(secondGraph)
  })
})
