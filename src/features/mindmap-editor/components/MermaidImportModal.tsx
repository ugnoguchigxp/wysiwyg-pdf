import React, { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Doc } from '@/types/canvas'
import { importFromMermaid } from '../utils/mermaidUtils'

interface MermaidImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (doc: Doc) => void
}

const PLACEHOLDER = `mindmap
  root((Central Topic))
    Topic 1
      Subtopic 1-1
    Topic 2
      Subtopic 2-1`

export const MermaidImportModal: React.FC<MermaidImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [syntax, setSyntax] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    setError(null)
    try {
      const doc = importFromMermaid(syntax)
      onImport(doc)
      onClose()
      setSyntax('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import Mermaid syntax')
    }
  }

  const handleCancel = () => {
    setError(null)
    setSyntax('')
    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Import from Mermaid"
      description="Paste Mermaid mindmap syntax below to import."
      className="max-w-md"
    >
      <div className="space-y-4">
        <textarea
          value={syntax}
          onChange={(e) => setSyntax(e.target.value)}
          placeholder={PLACEHOLDER}
          className="w-full h-[350px] font-mono text-sm bg-background p-3 rounded-md border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      <ModalFooter>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors mr-2"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
        >
          Import
        </button>
      </ModalFooter>
    </Modal>
  )
}
