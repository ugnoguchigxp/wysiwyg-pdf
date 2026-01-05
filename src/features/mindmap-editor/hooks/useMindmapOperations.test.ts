import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useMindmapOperations } from '@/features/mindmap-editor/hooks/useMindmapOperations'
import type { Doc } from '@/types/canvas'
import type { MindmapGraph } from '@/features/mindmap-editor/types'
import * as idUtils from '@/utils/id'

vi.mock('@/features/mindmap-editor/utils/treeUtils', () => ({
  getSubtreeIds: vi.fn(() => ['child1', 'child2']),
}))

vi.mock('@/utils/id', () => ({
  generateNodeId: vi.fn(),
  generateSurfaceId: vi.fn(),
}))

describe('features/mindmap-editor/hooks/useMindmapOperations', () => {
  const createMockDoc = (): Doc => ({
    v: 1,
    id: 'doc1',
    title: 'Test Doc',
    unit: 'mm',
    surfaces: [{ id: 's1', type: 'canvas', w: 100, h: 100, margin: { t: 0, r: 0, b: 0, l: 0 } }],
    nodes: [
      { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 's1', tags: ['root'], text: 'Root' },
      { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 's1', text: 'Child 1' },
    ],
  })

  const createMockGraph = (): MindmapGraph => ({
    rootId: 'root',
    parentIdMap: new Map([['child1', 'root']]),
    childrenMap: new Map([['root', ['child1']]]),
    nodeMap: new Map([
      ['root', { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 's1', text: 'Root' } as any],
      ['child1', { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 's1', text: 'Child 1' } as any],
    ]),
    linesMap: new Map(),
    linesById: new Map(),
    depthMap: new Map([['root', 0], ['child1', 1]]),
    isAncestor: () => false,
  })

  beforeEach(() => {
    vi.mocked(idUtils.generateNodeId).mockReset()
  })

  it('returns operations object', () => {
    const mockDoc = createMockDoc()
    const setDoc = vi.fn()

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc,
        selectedNodeId: null,
        onSelect: vi.fn(),
      })
    )

    expect(result.current).toBeDefined()
    expect(result.current.addChildNode).toBeDefined()
    expect(result.current.addSiblingNode).toBeDefined()
    expect(result.current.deleteNode).toBeDefined()
    expect(result.current.updateNodes).toBeDefined()
  })

  it('adds child node when selectedNodeId is root', () => {
    const mockDoc = createMockDoc()
    const setDoc = vi.fn()
    vi.mocked(idUtils.generateNodeId).mockImplementation(() => 'new-id')

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc,
        selectedNodeId: 'root',
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.addChildNode()
    })

    expect(setDoc).toHaveBeenCalled()
  })

  it('does not add child node when selectedNodeId is null', () => {
    const mockDoc = createMockDoc()
    const setDoc = vi.fn()

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc,
        selectedNodeId: null,
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.addChildNode()
    })

    expect(setDoc).not.toHaveBeenCalled()
  })

  it('adds sibling node when selectedNodeId is child', () => {
    const mockDoc = createMockDoc()
    const setDoc = vi.fn()
    vi.mocked(idUtils.generateNodeId).mockImplementation(() => 'new-id')

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc,
        selectedNodeId: 'child1',
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.addSiblingNode()
    })

    expect(setDoc).toHaveBeenCalled()
  })

  it('deletes node when selectedNodeId is child', () => {
    const mockDoc = createMockDoc()
    const setDoc = vi.fn()

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc,
        selectedNodeId: 'child1',
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.deleteNode()
    })

    expect(setDoc).toHaveBeenCalled()
  })

  it('does not delete root node', () => {
    const mockDoc = createMockDoc()
    const setDoc = vi.fn()

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc,
        selectedNodeId: 'root',
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.deleteNode()
    })

    expect(setDoc).not.toHaveBeenCalled()
  })

  it('updates node properties', () => {
    const mockDoc = createMockDoc()
    const setDoc = vi.fn()

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc,
        selectedNodeId: null,
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.updateNodes([
        { id: 'root', text: 'Updated' },
      ])
    })

    expect(setDoc).toHaveBeenCalled()
  })

  it('balances child layout direction and auto-selects', () => {
    const mockDoc: Doc = {
      ...createMockDoc(),
      nodes: [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 's1', tags: ['root'], text: 'Root' },
        { id: 'left', t: 'text', x: -10, y: 0, w: 50, h: 20, s: 's1', text: 'Left', data: { layoutDir: 'left' } },
      ],
    }
    const graph: MindmapGraph = {
      ...createMockGraph(),
      childrenMap: new Map([['root', ['left']]]),
    }
    const onSelect = vi.fn()
    const setDoc = vi.fn()
    const docUpdates: Doc[] = []

    vi.mocked(idUtils.generateNodeId).mockImplementationOnce(() => 'new-node').mockImplementationOnce(() => 'new-link')
    const originalRaf = global.requestAnimationFrame
    global.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0)
      return 0
    }) as typeof requestAnimationFrame

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph,
        setDoc: (updater) => {
          if (typeof updater === 'function') docUpdates.push(updater(mockDoc))
        },
        selectedNodeId: 'root',
        onSelect,
      })
    )

    act(() => {
      result.current.addChildNode()
    })

    const updated = docUpdates[0]
    const newNode = updated.nodes.find((node) => node.id === 'new-node') as any
    const newLink = updated.nodes.find((node) => node.id === 'new-link') as any
    expect(newNode.data.layoutDir).toBe('right')
    expect(newLink.startConn.nodeId).toBe('root')
    expect(newLink.endConn.nodeId).toBe('new-node')
    expect(onSelect).toHaveBeenCalledWith('new-node')

    if (originalRaf) global.requestAnimationFrame = originalRaf
    else delete (global as any).requestAnimationFrame
  })

  it('inserts sibling line after selected line when possible', () => {
    const mockDoc: Doc = {
      ...createMockDoc(),
      nodes: [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 's1', tags: ['root'], text: 'Root' },
        { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 's1', text: 'Child 1' },
        {
          id: 'line-child1',
          t: 'line',
          s: 's1',
          pts: [0, 0, 0, 0],
          startConn: { nodeId: 'root', anchor: 'auto' },
          endConn: { nodeId: 'child1', anchor: 'auto' },
        } as any,
      ],
    }
    const graph = createMockGraph()
    const updatedDocs: Doc[] = []

    vi.mocked(idUtils.generateNodeId).mockImplementationOnce(() => 'new-node').mockImplementationOnce(() => 'new-link')

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph,
        setDoc: (updater) => {
          if (typeof updater === 'function') updatedDocs.push(updater(mockDoc))
        },
        selectedNodeId: 'child1',
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.addSiblingNode()
    })

    const updated = updatedDocs[0]
    const lineIndex = updated.nodes.findIndex((node) => node.id === 'new-link')
    const selectedLineIndex = updated.nodes.findIndex((node) => node.id === 'line-child1')
    expect(lineIndex).toBe(selectedLineIndex + 1)
    expect(updated.nodes.some((node) => node.id === 'new-node')).toBe(true)
  })

  it('returns previous doc for empty updates', () => {
    const mockDoc = createMockDoc()
    let resultDoc: Doc | undefined
    const setDoc = (updater: any) => {
      resultDoc = updater(mockDoc)
    }

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc,
        selectedNodeId: null,
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.updateNodes([])
    })

    expect(resultDoc).toBe(mockDoc)
  })

  it('removes subtree nodes and connected lines', () => {
    const mockDoc: Doc = {
      ...createMockDoc(),
      nodes: [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 's1', text: 'Root' },
        { id: 'child1', t: 'text', x: 10, y: 10, w: 50, h: 20, s: 's1', text: 'Child 1' },
        { id: 'child2', t: 'text', x: 20, y: 20, w: 50, h: 20, s: 's1', text: 'Child 2' },
        {
          id: 'line-child1',
          t: 'line',
          s: 's1',
          pts: [0, 0, 0, 0],
          startConn: { nodeId: 'root', anchor: 'auto' },
          endConn: { nodeId: 'child1', anchor: 'auto' },
        } as any,
      ],
    }
    const updatedDocs: Doc[] = []

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc: (updater) => {
          if (typeof updater === 'function') updatedDocs.push(updater(mockDoc))
        },
        selectedNodeId: 'child1',
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.deleteNode()
    })

    const updated = updatedDocs[0]
    expect(updated.nodes.some((node) => node.id === 'child1')).toBe(false)
    expect(updated.nodes.some((node) => node.id === 'child2')).toBe(false)
    expect(updated.nodes.some((node) => node.id === 'line-child1')).toBe(false)
  })

  it('removes child link and adds new links', () => {
    const mockDoc: Doc = {
      ...createMockDoc(),
      nodes: [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 's1', text: 'Root' },
        { id: 'child1', t: 'text', x: 10, y: 10, w: 50, h: 20, s: 's1', text: 'Child 1' },
        {
          id: 'line-child1',
          t: 'line',
          s: 's1',
          pts: [0, 0, 0, 0],
          startConn: { nodeId: 'root', anchor: 'auto' },
          endConn: { nodeId: 'child1', anchor: 'auto' },
        } as any,
      ],
    }
    const updatedDocs: Doc[] = []
    vi.mocked(idUtils.generateNodeId).mockImplementationOnce(() => 'link-1').mockImplementationOnce(() => 'link-2')

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc: (updater) => {
          if (typeof updater === 'function') updatedDocs.push(updater(mockDoc))
        },
        selectedNodeId: null,
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.removeChildNode('root', 'child1')
    })

    act(() => {
      result.current.addChildNodeTo('root', 'child1')
    })

    act(() => {
      result.current.insertChildNodeAt('root', 'child1', 0)
    })

    expect(updatedDocs[0].nodes.some((node) => node.id === 'line-child1')).toBe(false)
    expect(updatedDocs[1].nodes.some((node) => node.id === 'link-1')).toBe(true)
    expect(updatedDocs[2].nodes.some((node) => node.id === 'link-2')).toBe(true)
  })

  it('moves node to new parent and handles sibling move fallback', () => {
    const mockDoc: Doc = {
      ...createMockDoc(),
      nodes: [
        { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 's1', text: 'Root' },
        { id: 'child1', t: 'text', x: 10, y: 10, w: 50, h: 20, s: 's1', text: 'Child 1' },
        { id: 'child2', t: 'text', x: 20, y: 20, w: 50, h: 20, s: 's1', text: 'Child 2' },
        {
          id: 'line-child1',
          t: 'line',
          s: 's1',
          pts: [0, 0, 0, 0],
          startConn: { nodeId: 'root', anchor: 'auto' },
          endConn: { nodeId: 'child1', anchor: 'auto' },
        } as any,
      ],
    }
    const updatedDocs: Doc[] = []
    vi.mocked(idUtils.generateNodeId).mockImplementationOnce(() => 'move-link')

    const { result } = renderHook(() =>
      useMindmapOperations({
        graph: createMockGraph(),
        setDoc: (updater) => {
          if (typeof updater === 'function') updatedDocs.push(updater(mockDoc))
        },
        selectedNodeId: null,
        onSelect: vi.fn(),
      })
    )

    act(() => {
      result.current.moveNode('child1', 'root', 'child')
    })

    const updated = updatedDocs[0]
    expect(updated.nodes.some((node) => node.id === 'line-child1')).toBe(false)
    expect(updated.nodes.some((node) => node.id === 'move-link')).toBe(true)

    act(() => {
      result.current.moveNode('child2', 'root', 'before')
    })

    expect(updatedDocs[1]).toBe(mockDoc)
  })
})
