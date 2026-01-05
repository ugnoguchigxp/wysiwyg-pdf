import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useMindmapInteraction } from '@/features/mindmap-editor/hooks/useMindmapInteraction'
import { MindmapGraph } from '@/features/mindmap-editor/types'

describe('features/mindmap-editor/hooks/useMindmapInteraction', () => {
  const createMockGraph = (): MindmapGraph => ({
    rootId: 'root',
    parentIdMap: new Map([
      ['child1', 'root'],
      ['child2', 'root'],
      ['grandchild1', 'child1'],
      ['grandchild2', 'child1'],
    ]),
    childrenMap: new Map([
      ['root', ['child1', 'child2']],
      ['child1', ['grandchild1', 'grandchild2']],
      ['child2', []],
      ['grandchild1', []],
      ['grandchild2', []],
    ]),
    nodeMap: new Map([
      ['root', { id: 'root', t: 'text', x: 0, y: 0, w: 100, h: 50, s: 'surface' }] as any,
      ['child1', { id: 'child1', t: 'text', x: 100, y: 50, w: 100, h: 50, s: 'surface' }] as any,
      ['child2', { id: 'child2', t: 'text', x: 100, y: 150, w: 100, h: 50, s: 'surface' }] as any,
    ]),
    linesMap: new Map(),
    linesById: new Map(),
    depthMap: new Map([
      ['root', 0],
      ['child1', 1],
      ['child2', 1],
    ]),
    isAncestor: vi.fn(),
  })

  const mockOps = {
    addChildNode: vi.fn(),
    addSiblingNode: vi.fn(),
    deleteNode: vi.fn(),
  }

  let setSelectedNodeId: ReturnType<typeof vi.fn>
  let mockGraph: MindmapGraph
  let mockOpsLocal: { addChildNode: any; addSiblingNode: any; deleteNode: any }

  beforeEach(() => {
    setSelectedNodeId = vi.fn()
    mockGraph = createMockGraph()
    mockOpsLocal = { ...mockOps, addChildNode: vi.fn(), addSiblingNode: vi.fn(), deleteNode: vi.fn() }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('keyboard shortcuts', () => {
    it('calls addChildNode on Tab', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Tab' })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.addChildNode).toHaveBeenCalled()
    })

    it('calls addChildNode on Insert', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Insert' })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.addChildNode).toHaveBeenCalled()
    })

    it('calls addSiblingNode on Enter', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.addSiblingNode).toHaveBeenCalled()
    })

    it('calls deleteNode on Backspace', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'child1',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Backspace' })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.deleteNode).toHaveBeenCalled()
    })

    it('calls deleteNode on Delete', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'child1',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Delete' })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.deleteNode).toHaveBeenCalled()
    })
  })

  describe('navigation', () => {
    it('navigates to first child on ArrowRight', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
        window.dispatchEvent(event)
      })

      expect(setSelectedNodeId).toHaveBeenCalledWith('child1')
    })

    it('navigates to parent on ArrowLeft', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'child1',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
        window.dispatchEvent(event)
      })

      expect(setSelectedNodeId).toHaveBeenCalledWith('root')
    })

    it('navigates to next sibling on ArrowDown', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'child1',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
        window.dispatchEvent(event)
      })

      expect(setSelectedNodeId).toHaveBeenCalledWith('child2')
    })

    it('navigates to previous sibling on ArrowUp', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'child2',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
        window.dispatchEvent(event)
      })

      expect(setSelectedNodeId).toHaveBeenCalledWith('child1')
    })

    it('does not navigate down on last sibling', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'child2',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      setSelectedNodeId.mockClear()

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
        window.dispatchEvent(event)
      })

      expect(setSelectedNodeId).not.toHaveBeenCalled()
    })

    it('does not navigate up on first sibling', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'child1',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      setSelectedNodeId.mockClear()

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
        window.dispatchEvent(event)
      })

      expect(setSelectedNodeId).not.toHaveBeenCalled()
    })

    it('does not navigate right when no children', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'child2',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      setSelectedNodeId.mockClear()

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
        window.dispatchEvent(event)
      })

      expect(setSelectedNodeId).not.toHaveBeenCalled()
    })

    it('does not navigate left when no parent', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      setSelectedNodeId.mockClear()

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
        window.dispatchEvent(event)
      })

      expect(setSelectedNodeId).not.toHaveBeenCalled()
    })
  })

  describe('editing mode', () => {
    it('ignores keyboard shortcuts when editing', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: true,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Tab' })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.addChildNode).not.toHaveBeenCalled()
    })
  })

  describe('input element handling', () => {
    it('ignores keyboard shortcuts when typing in input', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' })
        Object.defineProperty(event, 'target', { writable: false, value: input })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.addSiblingNode).not.toHaveBeenCalled()
      document.body.removeChild(input)
    })

    it('ignores keyboard shortcuts when typing in textarea', () => {
      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.focus()

      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' })
        Object.defineProperty(event, 'target', { writable: false, value: textarea })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.addSiblingNode).not.toHaveBeenCalled()
      document.body.removeChild(textarea)
    })

    it('ignores keyboard shortcuts when typing in content editable element', () => {
      const div = document.createElement('div')
      div.contentEditable = 'true'
      document.body.appendChild(div)

      const mockEventTarget = {
        tagName: 'DIV',
        isContentEditable: true,
      }

      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' })
        Object.defineProperty(event, 'target', {
          writable: false,
          value: mockEventTarget,
        })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.addSiblingNode).not.toHaveBeenCalled()
      document.body.removeChild(div)
    })
  })

  describe('no selected node', () => {
    it('does not handle keyboard events when no node selected', () => {
      renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: null,
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Tab' })
        window.dispatchEvent(event)
      })

      expect(mockOpsLocal.addChildNode).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const { unmount } = renderHook(() =>
        useMindmapInteraction({
          selectedNodeId: 'root',
          setSelectedNodeId,
          graph: mockGraph,
          ops: mockOpsLocal,
          isEditing: false,
        })
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })
})
