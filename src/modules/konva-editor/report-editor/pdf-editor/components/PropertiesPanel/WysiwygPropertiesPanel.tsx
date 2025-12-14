/**
 * Wysiwyg Properties Panel - Unified Version Wrapper
 * 
 * 既存APIとの互換性を保ちながらUnifiedPropertyPanelを使用
 * グリッド・スナップ設定もPropertyPanelに統合
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { UnifiedPropertyPanel } from '../../../../shared/components/PropertyPanel'
import { REPORT_PANEL_CONFIG } from '../../../../constants/propertyPanelConfig'
import type { UnifiedNode, TableNode } from '../../../../../../types/canvas'
import type { Doc } from '../../types/wysiwyg'
import type { IDataSchema } from '../../../../../../types/schema'
import type { WidgetProps } from '../../../../shared/components/PropertyPanel/widgets'
import { TableProperties } from './TableProperties'
import { BindingSelector } from './BindingSelector'
import { DataBindingModal } from './DataBindingModal'

const FIBONACCI_GRID_SIZES = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]

// ========================================
// Props Interface
// ========================================

export interface WysiwygPropertiesPanelProps {
  templateDoc: Doc
  selectedElementId: string | null
  selectedCell?: { elementId: string; row: number; col: number } | null
  onTemplateChange: (newDoc: Doc) => void
  currentPageId: string
  schema?: IDataSchema
  i18nOverrides?: Record<string, string>
  activeTool?: string
  onToolSelect?: (tool: string) => void
  drawingSettings?: { stroke: string; strokeWidth: number; useOffset?: boolean; tolerance?: number }
  onDrawingSettingsChange?: (settings: { stroke: string; strokeWidth: number; useOffset?: boolean; tolerance?: number }) => void
  // Canvas Settings (Grid & Snap)
  showGrid?: boolean
  onShowGridChange?: (show: boolean) => void
  gridSize?: number
  onGridSizeChange?: (size: number) => void
  snapStrength?: number
  onSnapStrengthChange?: (strength: number) => void
}

// ========================================
// Shared UI Components
// ========================================

const labelClass = 'block text-[13px] text-theme-text-secondary mb-0.5'
const inputClass =
  'w-full px-1.5 py-1 border border-theme-border rounded text-[13px] bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent'

// ========================================
// Canvas Settings Panel (選択なし時)
// ========================================

const CanvasSettingsPanel: React.FC<{
  templateDoc: Doc
  currentPageId: string
  onTemplateChange: (newDoc: Doc) => void
  showGrid?: boolean
  onShowGridChange?: (show: boolean) => void
  gridSize?: number
  onGridSizeChange?: (size: number) => void
  snapStrength?: number
  onSnapStrengthChange?: (strength: number) => void
  resolveText: (key: string, fallback?: string) => string
}> = ({
  templateDoc,
  currentPageId,
  onTemplateChange,
  showGrid,
  onShowGridChange,
  gridSize,
  onGridSizeChange,
  snapStrength,
  onSnapStrengthChange,
  resolveText,
}) => {
    const { t } = useTranslation()
    const currentSurface = templateDoc.surfaces.find(s => s.id === currentPageId) || templateDoc.surfaces[0]
    const bg = currentSurface?.bg || '#ffffff'
    const isColor = bg.startsWith('#') || bg.startsWith('rgb')

    const updateSurface = (updates: Partial<typeof currentSurface>) => {
      const nextDoc = {
        ...templateDoc,
        surfaces: templateDoc.surfaces.map(s =>
          s.id === currentSurface.id ? { ...s, ...updates } : s
        )
      }
      onTemplateChange(nextDoc)
    }

    return (
      <div className="w-64 bg-theme-bg-secondary px-2 py-1 overflow-x-hidden overflow-y-auto text-theme-text-primary">
        {/* Page Background */}
        <div className="mb-3">
          <h4 className="text-[13px] font-medium text-theme-text-secondary mb-1">
            {resolveText('properties_page_background', 'Background')}
          </h4>
          <div className="mb-1">
            <label className={labelClass}>{resolveText('color', 'Color')}</label>
            <input
              type="color"
              value={isColor ? bg : '#ffffff'}
              onChange={(e) => updateSurface({ bg: e.target.value })}
              className={`${inputClass} h-8 p-0.5 cursor-pointer`}
            />
          </div>
          <div>
            <label className={labelClass}>Image URL</label>
            <input
              value={!isColor ? bg : ''}
              onChange={(e) => updateSurface({ bg: e.target.value })}
              placeholder="http://..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Grid Settings */}
        {onShowGridChange && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[13px] text-theme-text-secondary">
                {t('settings_show_grid', 'Grid')}
              </label>
              <input
                type="checkbox"
                checked={showGrid ?? false}
                onChange={(e) => onShowGridChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            {showGrid && onGridSizeChange && (
              <div>
                <label className={labelClass}>{t('settings_grid_size', 'Size')}</label>
                <select
                  value={gridSize ?? 13}
                  onChange={(e) => onGridSizeChange(Number(e.target.value))}
                  className={inputClass}
                >
                  {FIBONACCI_GRID_SIZES.map((size) => (
                    <option key={size} value={size}>{size}pt</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Snap to Grid */}
        {onSnapStrengthChange && (
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <label className="text-[13px] text-theme-text-secondary">
                {t('settings_snap_to_grid', 'Snap to Grid')}
              </label>
              <input
                type="checkbox"
                checked={(snapStrength ?? 0) > 0}
                onChange={(e) => onSnapStrengthChange(e.target.checked ? (gridSize ?? 15) : 0)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

// ========================================
// Signature Drawing Panel (署名描画モード時)
// ========================================

const SignatureDrawingPanel: React.FC<{
  drawingSettings: { stroke: string; strokeWidth: number; tolerance?: number }
  onDrawingSettingsChange: (settings: { stroke: string; strokeWidth: number; tolerance?: number }) => void
  onToolSelect: (tool: string) => void
  resolveText: (key: string, fallback?: string) => string
}> = ({ drawingSettings, onDrawingSettingsChange, onToolSelect, resolveText }) => (
  <div className="mb-4 space-y-3">
    <h4 className="text-[13px] font-medium text-theme-text-secondary mb-1">
      {resolveText('toolbar_signature', 'Signature')}
    </h4>

    <div>
      <label className={labelClass}>{resolveText('properties_stroke_color', 'Stroke Color')}</label>
      <input
        type="color"
        value={drawingSettings.stroke}
        onChange={(e) => onDrawingSettingsChange({ ...drawingSettings, stroke: e.target.value })}
        className={`${inputClass} h-8 p-0.5 cursor-pointer`}
      />
    </div>

    <div>
      <label className={labelClass}>{resolveText('properties_stroke_width', 'Thickness')}</label>
      <input
        type="number"
        min="1"
        value={drawingSettings.strokeWidth}
        onChange={(e) => {
          const val = Number(e.target.value)
          if (val > 0) onDrawingSettingsChange({ ...drawingSettings, strokeWidth: val })
        }}
        className={inputClass}
      />
    </div>

    <div>
      <label className={labelClass}>
        {resolveText('properties_signature_optimization', 'Vertex Count')}: {drawingSettings.tolerance ?? 2.0}
      </label>
      <input
        type="range"
        min="1.0"
        max="3.0"
        step="0.1"
        value={drawingSettings.tolerance ?? 2.5}
        onChange={(e) => onDrawingSettingsChange({ ...drawingSettings, tolerance: parseFloat(e.target.value) })}
        className="w-full accent-theme-accent"
      />
    </div>

    <div className="mt-4 pt-4 border-t border-theme-border">
      <p className="text-xs text-theme-text-secondary mb-3">
        {resolveText('signature_instruction', 'Drag on canvas to draw.')}
      </p>
      <button
        type="button"
        onClick={() => onToolSelect('select')}
        className="w-full flex items-center justify-center py-2 px-4 rounded bg-theme-object-primary text-white hover:bg-theme-object-primary/90 transition-colors"
      >
        {resolveText('properties_finish_drawing', 'Finish Drawing')}
      </button>
    </div>
  </div>
)

// ========================================
// Main Component
// ========================================

export const WysiwygPropertiesPanel: React.FC<WysiwygPropertiesPanelProps> = ({
  templateDoc,
  selectedElementId,
  selectedCell,
  onTemplateChange,
  currentPageId,
  schema,
  i18nOverrides,
  activeTool,
  onToolSelect,
  drawingSettings,
  onDrawingSettingsChange,
  showGrid,
  onShowGridChange,
  gridSize,
  onGridSizeChange,
  snapStrength,
  onSnapStrengthChange,
}) => {
  const { t } = useTranslation()
  const [activeBindingMode, setActiveBindingMode] = React.useState<'field' | 'repeater' | null>(null)

  const resolveText = (key: string, fallback?: string): string => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return t(key, fallback ?? key)
  }

  const selectedElement = React.useMemo(() => {
    return templateDoc.nodes.find((el) => el.id === selectedElementId)
  }, [templateDoc.nodes, selectedElementId])

  const isDrawing = activeTool === 'signature'

  // Handle element change through templateDoc
  const handleChange = (id: string, updates: Partial<UnifiedNode>) => {
    const nextDoc: Doc = {
      ...templateDoc,
      nodes: templateDoc.nodes.map((el) =>
        el.id === id ? ({ ...el, ...updates } as UnifiedNode) : el
      ),
    }
    onTemplateChange(nextDoc)
  }

  // Drawing mode panel
  if (isDrawing && drawingSettings && onDrawingSettingsChange && onToolSelect) {
    return (
      <div className="w-full h-full bg-theme-bg-secondary px-2 py-1 overflow-x-hidden overflow-y-auto">
        <SignatureDrawingPanel
          drawingSettings={drawingSettings}
          onDrawingSettingsChange={onDrawingSettingsChange}
          onToolSelect={onToolSelect}
          resolveText={resolveText}
        />
      </div>
    )
  }

  // No selection - show canvas settings
  if (!selectedElement) {
    return (
      <CanvasSettingsPanel
        templateDoc={templateDoc}
        currentPageId={currentPageId}
        onTemplateChange={onTemplateChange}
        showGrid={showGrid}
        onShowGridChange={onShowGridChange}
        gridSize={gridSize}
        onGridSizeChange={onGridSizeChange}
        snapStrength={snapStrength}
        onSnapStrengthChange={onSnapStrengthChange}
        resolveText={resolveText}
      />
    )
  }

  // Custom renderers for Report-specific widgets
  const customRenderers: Record<string, React.FC<WidgetProps>> = {
    // Table properties custom renderer
    tableProperties: ({ node }) => (
      <TableProperties
        element={node as TableNode}
        onUpdate={(newAttrs) => handleChange(node.id, newAttrs)}
        selectedCell={selectedCell}
        i18nOverrides={i18nOverrides}
      />
    ),
    // Data binding custom renderer
    dataBindingField: ({ node }) => (
      <div>
        <BindingSelector
          label={resolveText('data_binding', 'Data Binding')}
          binding={node.bind ? { field: node.bind } : undefined}
          onUpdate={(binding) => handleChange(node.id, { bind: binding?.field })}
          onOpenModal={() => setActiveBindingMode('field')}
          i18nOverrides={i18nOverrides}
        />
      </div>
    ),
    dataBindingRepeater: ({ node }) => (
      <div>
        <BindingSelector
          label={resolveText('data_binding', 'Data Binding')}
          binding={node.bind ? { field: node.bind } : undefined}
          onUpdate={(binding) => handleChange(node.id, { bind: binding?.field })}
          onOpenModal={() => setActiveBindingMode('repeater')}
          i18nOverrides={i18nOverrides}
        />
      </div>
    ),
  }

  const handleBindingSelect = (binding: { field?: string }) => {
    if (selectedElement) {
      handleChange(selectedElement.id, { bind: binding.field })
    }
    setActiveBindingMode(null)
  }

  return (
    <div className="w-full h-full bg-theme-bg-secondary px-2 py-1 overflow-x-hidden overflow-y-auto">
      <UnifiedPropertyPanel
        config={REPORT_PANEL_CONFIG}
        selectedNode={selectedElement}
        onChange={handleChange}
        i18nOverrides={i18nOverrides}
        customRenderers={customRenderers}
      />

      {activeBindingMode && schema && (
        <DataBindingModal
          isOpen={true}
          onClose={() => setActiveBindingMode(null)}
          onSelect={handleBindingSelect}
          mode={activeBindingMode}
          schema={schema}
        />
      )}
    </div>
  )
}

export default WysiwygPropertiesPanel
