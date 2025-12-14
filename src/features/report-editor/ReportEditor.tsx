import React, { useState, useRef, useCallback } from 'react'
import { WysiwygEditorToolbar } from './components/Toolbar/WysiwygEditorToolbar'
import { ReportKonvaEditor } from './ReportKonvaEditor'
import { WysiwygPropertiesPanel } from './components/PropertyPanel/WysiwygPropertiesPanel'
import type { UnifiedNode, Doc } from '@/features/konva-editor/types'
import type { IDataSchema } from '@/types/schema'

export interface ReportEditorProps {
  templateDoc: Doc
  onTemplateChange: (doc: Doc) => void
  schema?: IDataSchema
  initialZoom?: number
  showGrid?: boolean
  snapStrength?: number
  gridSize?: number
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  templateDoc,
  onTemplateChange,
  schema,
  initialZoom = 1.0,
  showGrid = false,
  snapStrength = 5,
  gridSize = 15,
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

  // Tool state
  const [activeTool, setActiveTool] = useState<string>('select')

  // Manage current page (for now, default to first content page)
  const currentPageId = templateDoc.surfaces[0]?.id || ''

  const handleElementSelect = (element: UnifiedNode | null) => {
    setSelectedElementId(element?.id ?? null)
    if (!element) {
      setSelectedCell(null)
    }
  }

  const handleToolSelect = useCallback((tool: string) => {
    setActiveTool(tool)
    // Clear selection when switching to a tool (optional but good UX)
    if (tool !== 'select') {
      setSelectedElementId(null)
      setSelectedCell(null)
    }
  }, [])

  return (
    <div className="flex h-full w-full overflow-hidden border border-theme-border bg-theme-bg-primary text-theme-text-primary">
      {/* Left Toolbar */}
      <div className="w-16 border-r border-theme-border bg-theme-bg-secondary shrink-0 flex flex-col z-10 relative">
        <WysiwygEditorToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          templateDoc={templateDoc}
          onTemplateChange={onTemplateChange}
          onSelectElement={(id) => setSelectedElementId(id)}
          currentPageId={currentPageId}
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
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
          activeTool={activeTool}
          showGrid={showGrid}
          snapStrength={snapStrength}
          gridSize={gridSize}
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
