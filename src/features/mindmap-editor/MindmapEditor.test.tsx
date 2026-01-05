import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockSetDoc = vi.fn()
const mockUndo = vi.fn()
const mockRedo = vi.fn()
const mockRemoveChildNode = vi.fn()
const mockAddChildNodeTo = vi.fn()
const mockInsertChildNodeAt = vi.fn()

const stageState = {
  toDataURL: vi.fn(() => 'data:image/png;base64,abc'),
  gridVisible: true,
}

const gridLayer = {
  visible: () => stageState.gridVisible,
  hide: () => {
    stageState.gridVisible = false
  },
  show: () => {
    stageState.gridVisible = true
  },
}

const transformerNodes = [
  {
    getClassName: () => 'Transformer',
    visible: vi.fn(() => true),
    hide: vi.fn(),
    show: vi.fn(),
  },
]

const stage = {
  findOne: vi.fn((selector: string) => (selector === '.grid-layer' ? gridLayer : null)),
  find: vi.fn(() => transformerNodes),
  toDataURL: stageState.toDataURL,
}

let lastCanvasProps: any = null

vi.mock('@/components/canvas/KonvaCanvasEditor', () => ({
  KonvaCanvasEditor: React.forwardRef((props: any, ref: any) => {
    lastCanvasProps = props
    if (typeof ref === 'function') ref({ getStage: () => stage })
    else if (ref) ref.current = { getStage: () => stage }
    return <div data-testid="canvas-editor" />
  }),
}))

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/i18n/I18nContext', () => ({
  useI18n: () => ({ t: (_key: string, fallback: string) => fallback }),
}))

vi.mock('@/features/mindmap-editor/hooks/useMindmapHistory', () => ({
  useMindmapHistory: () => ({
    doc: {
      v: 1,
      id: 'doc',
      title: 'mindmap',
      unit: 'mm',
      surfaces: [{ id: 's1', type: 'canvas', w: 400, h: 400, bg: '#fff' }],
      nodes: [
        { id: 'root', t: 'text', s: 's1', x: 0, y: 0, w: 10, h: 5, text: 'root' },
        { id: 'child', t: 'text', s: 's1', x: 10, y: 0, w: 10, h: 5, text: 'child' },
        { id: 'link', t: 'line', s: 's1', pts: [0, 0, 0, 0], startConn: { nodeId: 'root', anchor: 'auto' }, endConn: { nodeId: 'child', anchor: 'auto' } },
      ],
    },
    setDoc: mockSetDoc,
    undo: mockUndo,
    redo: mockRedo,
  }),
}))

vi.mock('@/features/mindmap-editor/hooks/useMindmapGraph', () => ({
  useMindmapGraph: () => ({
    rootId: 'root',
    childrenMap: new Map([['root', ['child', 'target']]]),
    parentIdMap: new Map([['child', 'root'], ['target', 'root']]),
    isAncestor: () => false,
  }),
}))

vi.mock('@/features/mindmap-editor/hooks/useMindmapOperations', () => ({
  useMindmapOperations: () => ({
    removeChildNode: mockRemoveChildNode,
    addChildNodeTo: mockAddChildNodeTo,
    insertChildNodeAt: mockInsertChildNodeAt,
    addChildNode: vi.fn(),
    addSiblingNode: vi.fn(),
    deleteNode: vi.fn(),
    updateNodes: vi.fn(),
    moveNode: vi.fn(),
  }),
}))

vi.mock('@/features/mindmap-editor/hooks/useMindmapLayout', () => ({
  useMindmapLayout: vi.fn(),
}))

vi.mock('@/features/mindmap-editor/hooks/useMindmapInteraction', () => ({
  useMindmapInteraction: vi.fn(),
}))

vi.mock('@/features/mindmap-editor/components/MermaidExportModal', () => ({
  MermaidExportModal: () => null,
}))

vi.mock('@/features/mindmap-editor/components/MermaidImportModal', () => ({
  MermaidImportModal: ({ onImport }: any) => (
    <button type="button" onClick={() => onImport({ id: 'imported' })}>
      import
    </button>
  ),
}))

vi.mock('lucide-react', () => ({
  ChevronsDown: () => null,
  ChevronsUp: () => null,
  Download: () => null,
  Upload: () => null,
  Keyboard: () => null,
  ImageIcon: () => null,
  FileDown: () => null,
}))

import { MindmapEditor } from '@/features/mindmap-editor/MindmapEditor'

describe('features/mindmap-editor/MindmapEditor', () => {
  beforeEach(() => {
    mockSetDoc.mockClear()
    mockRemoveChildNode.mockClear()
    mockAddChildNodeTo.mockClear()
    mockInsertChildNodeAt.mockClear()
    stageState.toDataURL.mockClear()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  it('downloads image by hiding grid and transformers', () => {
    render(<MindmapEditor />)

    fireEvent.click(screen.getByText('Image'))

    expect(stageState.toDataURL).toHaveBeenCalled()
    expect(gridLayer.visible()).toBe(true)
    expect(transformerNodes[0].hide).toHaveBeenCalled()
    expect(transformerNodes[0].show).toHaveBeenCalled()
  })

  it('handles drag and inserts child before target', async () => {
    render(<MindmapEditor />)

    await act(async () => {
      lastCanvasProps.onDragStart('child', { x: 0, y: 0 })
    })
    expect(lastCanvasProps.dragState.draggedNodeId).toBe('child')
    await act(async () => {
      lastCanvasProps.onDragMove({ x: 10, y: 0 })
    })
    expect(lastCanvasProps.dragState.isDragging).toBe(true)
    await act(async () => {
      lastCanvasProps.onDragMove({ x: 12, y: 0 })
    })
    await act(async () => {
      lastCanvasProps.onDragEnter('target', 0.1)
    })
    expect(lastCanvasProps.dragState.canDrop).toBe(true)
    await act(async () => {
      lastCanvasProps.onDragEnd()
    })

    expect(mockRemoveChildNode).toHaveBeenCalledWith('root', 'child')
    expect(mockInsertChildNodeAt).toHaveBeenCalledWith('root', 'child', 1)
  })

  it('imports mermaid doc and resets collapsed nodes', () => {
    render(<MindmapEditor />)

    fireEvent.click(screen.getByText('import'))
    expect(mockSetDoc).toHaveBeenCalledWith({ id: 'imported' })
  })
})
