import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useMindmapLayout } from '@/features/mindmap-editor/hooks/useMindmapLayout'
import type { MindmapGraph } from '@/features/mindmap-editor/types'

vi.mock('@/features/mindmap-editor/utils/layoutEngine', () => ({
  calculateMindmapLayout: vi.fn(() => ({
    updates: new Map([['root', { x: 100, y: 200 }]]),
    lineUpdates: new Map([['line1', { startAnchor: 'r', endAnchor: 'l', pts: [0, 0, 100, 100] }]]),
  })),
}))

describe('features/mindmap-editor/hooks/useMindmapLayout', () => {
  const mockGraph: MindmapGraph = {
    rootId: 'root',
    parentIdMap: new Map(),
    childrenMap: new Map([['root', []]]),
    nodeMap: new Map([['root', { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' } as any]]),
    linesMap: new Map(),
    linesById: new Map(),
    depthMap: new Map([['root', 0]]),
    isAncestor: () => false,
  }

  it('does not call onChange when isLayoutActive is false', () => {
    const onChange = vi.fn()

    renderHook(() =>
      useMindmapLayout({
        graph: mockGraph,
        collapsedNodes: new Set(),
        onChange,
        isLayoutActive: false,
      })
    )

    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call onChange when rootId is null', () => {
    const onChange = vi.fn()
    const graphWithoutRoot: MindmapGraph = { ...mockGraph, rootId: null }

    renderHook(() =>
      useMindmapLayout({
        graph: graphWithoutRoot,
        collapsedNodes: new Set(),
        onChange,
        isLayoutActive: true,
      })
    )

    expect(onChange).not.toHaveBeenCalled()
  })

  it('calls onChange with position updates', () => {
    const onChange = vi.fn()

    renderHook(() =>
      useMindmapLayout({
        graph: mockGraph,
        collapsedNodes: new Set(),
        onChange,
        isLayoutActive: true,
      })
    )

    expect(onChange).toHaveBeenCalled()
  })

  it.skip('calls calculateMindmapLayout when isLayoutActive is true', () => {
    const { calculateMindmapLayout } = require('@/features/mindmap-editor/utils/layoutEngine')
    const onChange = vi.fn()

    renderHook(() =>
      useMindmapLayout({
        graph: mockGraph,
        collapsedNodes: new Set(),
        onChange,
        isLayoutActive: true,
      })
    )

    expect(calculateMindmapLayout).toHaveBeenCalled()
  })
})
