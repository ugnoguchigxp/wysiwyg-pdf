import React, { useState, useRef } from 'react'
import { WysiwygEditorToolbar } from './pdf-editor/components/Toolbar/WysiwygEditorToolbar'
import { ReportKonvaEditor } from './ReportKonvaEditor'
import { WysiwygPropertiesPanel } from './pdf-editor/components/PropertiesPanel/WysiwygPropertiesPanel'
import type { Element, ITemplateDoc } from './pdf-editor/types/wysiwyg'
import type { IDataSchema } from '../../../types/schema'

export interface ReportEditorProps {
  templateDoc: ITemplateDoc
  onTemplateChange: (doc: ITemplateDoc) => void
  schema?: IDataSchema
  initialZoom?: number
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  templateDoc,
  onTemplateChange,
  schema,
  initialZoom = 1.0,
}) => {
  const [zoom, setZoom] = useState<number>(initialZoom * 100)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<{
    elementId: string
    row: number
    col: number
  } | null>(null)

  // Focus ref for canvas
  const editorRef = useRef<React.ElementRef<typeof ReportKonvaEditor> | null>(null)

  // Manage current page (for now, default to first page or 'page1')
  // In a multi-page setup, we might need page navigation state.
  // Assuming single page editor or prop control for now, but to be "drop-in" we should default.
  const currentPageId = templateDoc.pages[0]?.id || ''

  const handleElementSelect = (element: Element | null) => {
    setSelectedElementId(element?.id ?? null)
    if (!element) {
      setSelectedCell(null)
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden border border-theme-border bg-theme-bg-primary text-theme-text-primary">
      {/* Left Toolbar */}
      <div className="w-16 border-r border-theme-border bg-theme-bg-secondary shrink-0 flex flex-col">
        <WysiwygEditorToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          templateDoc={templateDoc}
          onTemplateChange={onTemplateChange}
          onSelectElement={(id) => setSelectedElementId(id)}
          currentPageId={currentPageId}
        />
      </div>

      {/* Center Canvas */}
      <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
        <ReportKonvaEditor
          ref={editorRef}
          templateDoc={templateDoc}
          zoom={zoom / 100}
          selectedElementId={selectedElementId || undefined}
          onElementSelect={handleElementSelect}
          onTemplateChange={onTemplateChange}
          currentPageId={currentPageId}
          onSelectedCellChange={setSelectedCell}
        />
      </div>

      {/* Right Properties Panel */}
      <div className="w-64 border-l border-theme-border bg-theme-bg-secondary shrink-0 overflow-hidden flex flex-col">
        <WysiwygPropertiesPanel
          templateDoc={templateDoc}
          selectedElementId={selectedElementId}
          onTemplateChange={onTemplateChange}
          currentPageId={currentPageId}
          selectedCell={selectedCell}
          schema={schema}
        />
      </div>
    </div>
  )
}
