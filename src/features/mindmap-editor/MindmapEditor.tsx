import type Konva from 'konva'
import {
  ChevronsDown,
  ChevronsUp,
  Download,
  FileDown,
  ImageIcon,
  Keyboard,
  Upload,
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  KonvaCanvasEditor,
  type KonvaCanvasEditorHandle,
} from '@/components/canvas/KonvaCanvasEditor'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useI18n } from '@/i18n/I18nContext'
import type { Doc, UnifiedNode } from '@/types/canvas'
import { MermaidExportModal } from './components/MermaidExportModal'
import { MermaidImportModal } from './components/MermaidImportModal'
import { useMindmapDrag } from './hooks/useMindmapDrag'
import { useMindmapGraph } from './hooks/useMindmapGraph'
import { useMindmapHistory } from './hooks/useMindmapHistory'
import { useMindmapInteraction } from './hooks/useMindmapInteraction'
import { useMindmapLayout } from './hooks/useMindmapLayout'
import { useMindmapOperations } from './hooks/useMindmapOperations'
import { useMindmapVisibility } from './hooks/useMindmapVisibility'
import './mindmap-print.css'

// Initial Doc with standard TextNode
const INITIAL_DOC: Doc = {
  v: 1,
  id: 'mindmap-1',
  title: 'New Mindmap',
  unit: 'mm',
  surfaces: [{ id: 's1', type: 'canvas', w: 4000, h: 4000, bg: '#f8fafc' }],
  nodes: [
    // Root Node - Standard TextObject definition
    {
      id: 'root',
      t: 'text',
      s: 's1',
      x: 280,
      y: 192.5,
      w: 40,
      h: 15, // Centered on 600x400 paper (rootX=300, rootY=200)
      text: 'Central Topic',
      align: 'c',
      vAlign: 'm',
      backgroundColor: '#ffffff',
      borderColor: '#0000FF',
      borderWidth: 0.5,
      cornerRadius: 1, // Pill shape
      hasFrame: true,
      padding: 2, // Reduced padding for smaller size
      fontWeight: 700,
      fill: '#1e3a8a',
      fontSize: 4.23, // 12pt
      locked: true,
    },
  ],
}

interface MindmapEditorProps {
  readOnly?: boolean
  loadDoc?: Doc
  loadNonce?: number
  onDocChange?: (doc: Doc) => void
  showHeader?: boolean
}

export const MindmapEditor: React.FC<MindmapEditorProps> = ({
  readOnly = false,
  loadDoc,
  loadNonce,
  onDocChange,
  showHeader = true,
}) => {
  const canvasRef = useRef<KonvaCanvasEditorHandle>(null)
  const { doc, setDoc, undo, redo, reset } = useMindmapHistory(INITIAL_DOC)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showMermaidExport, setShowMermaidExport] = useState(false)
  const [showMermaidImport, setShowMermaidImport] = useState(false)
  const { t } = useI18n()
  const lastLoadNonceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    onDocChange?.(doc)
  }, [doc, onDocChange])

  useEffect(() => {
    if (!loadDoc) return
    if (loadNonce === undefined) return
    if (lastLoadNonceRef.current === loadNonce) return

    reset(loadDoc)
    setCollapsedNodes(new Set())
    setSelectedNodeId(null)
    setShowMermaidExport(false)
    setShowMermaidImport(false)
    setShowShortcuts(false)
    lastLoadNonceRef.current = loadNonce
  }, [loadDoc, loadNonce, reset])

  // Core Graph Logic (pure data)
  const graph = useMindmapGraph(doc)

  // Layout Logic (pure data)

  const handleSelectHelper = useCallback((id: string) => {
    setSelectedNodeId(id)
  }, [])

  // Operations (pure data)
  const operations = useMindmapOperations({
    setDoc,
    graph,
    selectedNodeId,
    onSelect: handleSelectHelper,
  })

  // Standard Change Handler
  const handleChangeNodes = useCallback(
    (
      changes: (Partial<UnifiedNode> & { id?: string }) | (Partial<UnifiedNode> & { id?: string })[]
    ) => {
      const changesArray = Array.isArray(changes) ? changes : [changes]
      setDoc((prev) => {
        const nextNodes = prev.nodes.map((n) => {
          const change = changesArray.find((c) => c.id === n.id)
          if (change) {
            return { ...n, ...change } as UnifiedNode
          }
          return n
        })
        return { ...prev, nodes: nextNodes }
      })
    },
    []
  )

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set())
  }, [])

  const handleCollapseAll = useCallback(() => {
    const collapsibleIds = Array.from(graph.childrenMap.keys())
    setCollapsedNodes(new Set(collapsibleIds))
  }, [graph])

  const handleMermaidImport = useCallback((importedDoc: Doc) => {
    setDoc(importedDoc)
    setCollapsedNodes(new Set())
    setShowMermaidImport(false)
  }, [])

  // Image Download Handler
  const handleDownloadImage = useCallback(() => {
    const stage = canvasRef.current?.getStage()
    if (!stage) return

    // Hide grid layer
    const gridLayer = stage.findOne('.grid-layer')
    const wasGridVisible = gridLayer?.visible()

    // Hide transformer handles (selection UI)
    const transformers = (stage.find('Transformer') as unknown as Konva.Node[]).filter(
      (n): n is Konva.Transformer => n.getClassName?.() === 'Transformer'
    )
    const transformerVisibility = transformers.map((tr) => tr.visible())

    try {
      gridLayer?.hide()
      transformers.forEach((tr) => {
        tr.hide()
      })

      const dataURL = stage.toDataURL({ pixelRatio: 2 })

      const link = document.createElement('a')
      link.download = `mindmap-${Date.now()}.png`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      // Restore grid layer
      if (gridLayer && wasGridVisible) {
        gridLayer.show()
      }
      // Restore transformer handles
      transformers.forEach((tr, idx) => {
        const prev = transformerVisibility[idx]
        if (prev) tr.show()
      })
    }
  }, [])

  // PDF Download Handler (via print dialog)
  const handleDownloadPdf = useCallback(() => {
    window.print()
  }, [])

  const handleNodeReplace = useCallback(
    (sourceId: string, targetId: string, position: 'child' | 'before' | 'after') => {
      const oldParentId = graph.parentIdMap.get(sourceId)

      if (oldParentId) {
        operations.removeChildNode(oldParentId, sourceId)
      }

      if (position === 'child') {
        operations.addChildNodeTo(targetId, sourceId)
      } else {
        const targetParentId = graph.parentIdMap.get(targetId)
        if (targetParentId) {
          const siblings = graph.childrenMap.get(targetParentId) ?? []
          const targetIndex = siblings.indexOf(targetId)
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
          operations.insertChildNodeAt(targetParentId, sourceId, insertIndex)
        }
      }
    },
    [graph, operations]
  )

  // Visibility Logic
  const visibleNodes = useMindmapVisibility(doc, graph, collapsedNodes)

  const handleNodeReplaceWrapper = useCallback(
    (sourceId: string, targetId: string, position: 'child' | 'before' | 'after') => {
      handleNodeReplace(sourceId, targetId, position)
    },
    [handleNodeReplace]
  )

  const {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnter,
    handleDragLeave,
    handleDragEnd,
  } = useMindmapDrag({
    graph,
    onNodeDrop: handleNodeReplaceWrapper,
  })

  type NodeUpdate = Partial<UnifiedNode> & { id: string }

  const handleLayoutChange = useCallback(
    (updates: NodeUpdate[]) => {
      if (updates.length === 0) return

      // Layout updates should NOT be saved to history
      // Otherwise, Undo would be immediately overwritten by layout recalculation
      setDoc(
        (prev) => {
          const updateMap = new Map(updates.map((u) => [u.id, u]))
          const newNodes = prev.nodes.map((node) => {
            if (updateMap.has(node.id)) {
              const update = updateMap.get(node.id)!
              const { id, ...rest } = update
              return { ...node, ...rest } as typeof node
            }
            return node
          })
          return { ...prev, nodes: newNodes }
        },
        { saveToHistory: false }
      )
    },
    [setDoc]
  )

  // Layout
  useMindmapLayout({
    graph,
    collapsedNodes,
    onChange: handleLayoutChange,
    isLayoutActive: true,
    rootX: 300,
    rootY: 200,
  })

  const handleSelect = useCallback((ids: string[]) => {
    setSelectedNodeId(ids.length > 0 ? ids[0] : null)
  }, [])

  // Interaction (Keyboard shortcuts for Node operations)
  useMindmapInteraction({
    selectedNodeId,
    setSelectedNodeId,
    graph,
    ops: operations,
    isEditing: false, // We rely on event target check inside the hook for now
  })

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if editing text
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          redo()
        } else {
          e.preventDefault()
          undo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [operations, undo, redo])

  return (
    <div className="flex flex-col w-full h-full mindmap-root">
      {showHeader && (
        <div className="h-12 border-b bg-white flex items-center justify-between px-4 shadow-sm z-10 mindmap-header">
          <h1 className="font-bold text-slate-700">Mindmap Editor</h1>
          <div className="flex gap-2">
            <Button variant="circle-help" size="circle" title="ショートカット">
              ?
            </Button>
            {!readOnly && (
              <>
                <Button variant="outline" size="sm" onClick={handleExpandAll}>
                  <ChevronsDown className="h-4 w-4 mr-1" />
                  全て展開
                </Button>
                <Button variant="outline" size="sm" onClick={handleCollapseAll}>
                  <ChevronsUp className="h-4 w-4 mr-1" />
                  全て折りたたみ
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowMermaidExport(true)}>
                  <Download className="h-4 w-4 mr-1" />
                  {t('export_mermaid', 'エクスポート')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowMermaidImport(true)}>
                  <Upload className="h-4 w-4 mr-1" />
                  {t('import_mermaid', 'インポート')}
                </Button>
                <div className="h-6 w-px bg-border" />
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleDownloadImage}>
              <ImageIcon className="h-4 w-4 mr-1" />
              {t('download_image', 'Image')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <FileDown className="h-4 w-4 mr-1" />
              {t('download_pdf', 'PDF')}
            </Button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden mindmap-canvas-container">
        <div className="w-full h-full content-container">
          <KonvaCanvasEditor
            ref={canvasRef}
            elements={visibleNodes}
            selectedIds={selectedNodeId ? [selectedNodeId] : []}
            onSelect={handleSelect}
            onChange={handleChangeNodes}
            zoom={1}
            paperWidth={600}
            paperHeight={400}
            readOnly={readOnly}
            initialScrollCenter={{ x: 300, y: 200 }}
            onToggleCollapse={handleToggleCollapse}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            dragState={dragState}
          />
        </div>
      </div>

      <Modal
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        title={t('shortcut_title', 'キーボードショートカット')}
        description={t('shortcut_description', '使用可能なキーボードショートカットの一覧です。')}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Keyboard className="w-5 h-5" />
            <span className="text-sm">{t('shortcut_helper_text', '使用可能なショートカット')}</span>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-3">
            {[
              { key: t('shortcut_add_child', '子ノード追加'), cmd: 'Tab' },
              { key: t('shortcut_add_sibling', '兄弟ノード追加'), cmd: 'Enter' },
              { key: t('shortcut_delete', 'ノード削除'), cmd: 'Delete / Backspace' },
              { key: t('shortcut_delete', 'ノード削除'), cmd: 'Delete / Backspace' },
              { key: t('shortcut_edit_text', 'テキスト編集'), cmd: 'ダブルクリック' },
              { key: t('shortcut_undo', '元に戻す'), cmd: 'Ctrl/Cmd + Z' },
              { key: t('shortcut_redo', 'やり直し'), cmd: 'Ctrl/Cmd + Shift + Z' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                <div className="text-sm font-medium text-foreground">{s.key}</div>
                <div className="text-xs font-mono bg-muted px-2 py-1 rounded border border-border text-muted-foreground self-center">
                  {s.cmd}
                </div>
                <div className="col-span-2 h-px bg-border/50 last:hidden" />
              </React.Fragment>
            ))}
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={() => setShowShortcuts(false)}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
          >
            {t('close', '閉じる')}
          </button>
        </ModalFooter>
      </Modal>

      <MermaidExportModal
        isOpen={showMermaidExport}
        onClose={() => setShowMermaidExport(false)}
        doc={doc}
        graph={graph}
      />

      <MermaidImportModal
        isOpen={showMermaidImport}
        onClose={() => setShowMermaidImport(false)}
        onImport={handleMermaidImport}
      />
    </div>
  )
}
