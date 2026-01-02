import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import type { Doc } from '@/types/canvas'
import type { MindmapGraph } from '../types'
import { exportToMermaid } from '../utils/mermaidUtils'

interface MermaidExportModalProps {
  isOpen: boolean
  onClose: () => void
  doc: Doc
  graph: MindmapGraph
}

export const MermaidExportModal: React.FC<MermaidExportModalProps> = ({
  isOpen,
  onClose,
  doc,
  graph,
}) => {
  const [copied, setCopied] = useState(false)

  // isOpen が true の時だけエクスポート処理を実行（パフォーマンス最適化）
  const mermaidSyntax = useMemo(() => {
    if (!isOpen) return ''
    return exportToMermaid(doc, graph)
  }, [isOpen, doc, graph])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mermaidSyntax)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Export to Mermaid"
      description="Copy the Mermaid mindmap syntax below."
      className="max-w-md"
    >
      <div className="space-y-4">
        <textarea
          readOnly
          value={mermaidSyntax}
          className="w-full h-[350px] font-mono text-sm bg-muted p-3 rounded-md border border-border resize-none"
        />
      </div>

      <ModalFooter>
        <button
          onClick={handleCopy}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors mr-2"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
        >
          Close
        </button>
      </ModalFooter>
    </Modal>
  )
}
