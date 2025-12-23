import React, { useState, useCallback, useMemo } from 'react'
import { Doc, UnifiedNode } from '@/types/canvas'
import { KonvaCanvasEditor } from '@/components/canvas/KonvaCanvasEditor'
import { Button } from '@/components/ui/Button'
import { ChevronsDown, ChevronsUp, Keyboard } from 'lucide-react'
import { useI18n } from '@/i18n/I18nContext'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useMindmapGraph } from './hooks/useMindmapGraph'
import { useMindmapLayout } from './hooks/useMindmapLayout'
import { useMindmapOperations } from './hooks/useMindmapOperations'

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

export const MindmapEditor: React.FC = () => {
  const [doc, setDoc] = useState<Doc>(INITIAL_DOC)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { t } = useI18n()

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

  // Filter visible nodes based on collapsed state
  const visibleNodes = useMemo(() => {
    // 1. Identify visible node IDs
    const visibleNodeIds = new Set<string>()
    doc.nodes.forEach((node) => {
      if (node.t === 'line') return

      // Check visibility
      let isVisible = true
      let curr = graph.parentIdMap.get(node.id)
      while (curr) {
        if (collapsedNodes.has(curr)) {
          isVisible = false
          break
        }
        curr = graph.parentIdMap.get(curr)
      }

      if (isVisible) {
        visibleNodeIds.add(node.id)
      }
    })

    // 2. Filter nodes and lines
    const filtered = doc.nodes.filter((node) => {
      if (node.t === 'line') {
        // Line is visible if BOTH ends are visible (or at least the child/target is visible)
        // In our graph, lines map Parent -> Child via startConn -> endConn
        // If Child is hidden, line should be hidden.
        // If Parent is hidden, Child is hidden too (handled by logic above).
        const childId = (node as any).endConn?.nodeId
        const parentId = (node as any).startConn?.nodeId
        return childId && visibleNodeIds.has(childId) && parentId && visibleNodeIds.has(parentId)
      }
      return visibleNodeIds.has(node.id)
    })

    // 3. Inject metadata
    return filtered.map((node) => {
      // ... same metadata injection
      if (graph.childrenMap.has(node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            hasChildren: true,
            isCollapsed: collapsedNodes.has(node.id),
          },
        }
      }
      return node
    })
  }, [doc.nodes, graph, collapsedNodes])

  const handleLayoutChange = useCallback(
    (updates: { id: string; [key: string]: any }[]) => {
      if (updates.length > 0) {
        operations.updateNodes(updates)
      }
    },
    [operations]
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

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if editing text
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        operations.addChildNode()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        operations.addSiblingNode()
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // Optional: Delete node
        operations.deleteNode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [operations])

  return (
    <div className="flex flex-col w-full h-full">
      <div className="h-12 border-b bg-white flex items-center justify-between px-4 shadow-sm z-10">
        <h1 className="font-bold text-slate-700">Mindmap Editor</h1>
        <div className="flex gap-2">
          <Button
            variant="circle-help"
            size="circle"
            onClick={() => setShowShortcuts(true)}
            title="ショートカット"
          >
            ?
          </Button>
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            <ChevronsDown className="h-4 w-4 mr-1" />
            全て展開
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            <ChevronsUp className="h-4 w-4 mr-1" />
            全て折りたたみ
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full content-container">
          <KonvaCanvasEditor
            elements={visibleNodes}
            selectedIds={selectedNodeId ? [selectedNodeId] : []}
            onSelect={handleSelect}
            onChange={handleChangeNodes}
            zoom={1}
            paperWidth={600}
            paperHeight={400}
            readOnly={false}
            initialScrollCenter={{ x: 300, y: 200 }}
            onToggleCollapse={handleToggleCollapse}
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
              { key: t('shortcut_edit_text', 'テキスト編集'), cmd: 'ダブルクリック' },
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
    </div>
  )
}
