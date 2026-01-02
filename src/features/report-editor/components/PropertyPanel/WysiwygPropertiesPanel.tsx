/**
 * Wysiwyg Properties Panel - Unified Version Wrapper
 *
 * 既存APIとの互換性を保ちながらUnifiedPropertyPanelを使用
 * グリッド・スナップ設定もPropertyPanelに統合
 */

import React from 'react'
import { UnifiedPropertyPanel } from '@/features/konva-editor/components/PropertyPanel/UnifiedPropertyPanel'
import type { WidgetProps } from '@/features/konva-editor/components/PropertyPanel/widgets'
import { REPORT_PANEL_CONFIG } from '@/features/konva-editor/constants/propertyPanelConfig'
import { applyTextLayoutUpdates } from '@/features/konva-editor/utils/textLayout'
import { useI18n } from '@/i18n/I18nContext'
import type { Doc, LineNode, TableNode, UnifiedNode } from '@/types/canvas'
import type { IDataSchema } from '@/types/schema'
import { BindingSelector } from './BindingSelector'
import { DataBindingModal } from './DataBindingModal'
import { TableProperties } from './TableProperties'

const FIBONACCI_GRID_SIZES = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]

// ========================================
// Props Interface
// ========================================

export interface WysiwygPropertiesPanelProps {
  templateDoc: Doc
  selectedElementId: string | null
  selectedCell?: { elementId: string; row: number; col: number } | null
  onTemplateChange: (newDoc: Doc, options?: { saveToHistory?: boolean }) => void
  currentPageId: string
  schema?: IDataSchema
  i18nOverrides?: Record<string, string>
  activeTool?: string
  onToolSelect?: (tool: string) => void
  drawingSettings?: {
    stroke: string
    strokeWidth: number
    useOffset?: boolean
    simplification?: number
  }
  onDrawingSettingsChange?: (settings: {
    stroke: string
    strokeWidth: number
    useOffset?: boolean
    simplification?: number
  }) => void
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

const labelClass = 'block text-[13px] text-muted-foreground mb-0.5'
const inputClass =
  'w-full px-1.5 py-1 border border-border rounded text-[13px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

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
  const { t } = useI18n()
  const currentSurface =
    templateDoc.surfaces.find((s) => s.id === currentPageId) || templateDoc.surfaces[0]
  const bg = currentSurface?.bg || '#ffffff'
  const isColor = bg.startsWith('#') || bg.startsWith('rgb')

  const updateSurface = (updates: Partial<typeof currentSurface>) => {
    const nextDoc = {
      ...templateDoc,
      surfaces: templateDoc.surfaces.map((s) =>
        s.id === currentSurface.id ? { ...s, ...updates } : s
      ),
    }
    onTemplateChange(nextDoc)
  }

  return (
    <div className="w-64 bg-secondary px-2 py-1 overflow-x-hidden overflow-y-auto text-foreground">
      {/* Page Background */}
      <div className="mb-3">
        <h4 className="text-[13px] font-medium text-muted-foreground mb-1">
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
          <label className={labelClass}>{resolveText('properties_image_url', 'Image URL')}</label>
          <div className="flex gap-1 mb-1">
            <input
              value={!isColor ? bg : ''}
              onChange={(e) => updateSurface({ bg: e.target.value })}
              placeholder={resolveText('properties_image_url_placeholder', 'http://...')}
              className={`${inputClass} flex-1`}
            />
            {!isColor && (
              <button
                onClick={() => updateSurface({ bg: '#ffffff' })}
                className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                title={resolveText('remove', 'Remove')}
              >
                ×
              </button>
            )}
          </div>
          <label className="flex flex-col items-center justify-center w-full h-8 border border-border border-dashed rounded cursor-pointer hover:bg-muted transition-colors">
            <span className="text-xs text-muted-foreground">
              {resolveText('browse', 'Browse...')}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const result = ev.target?.result as string
                    if (result) {
                      updateSurface({ bg: result })
                    }
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Grid Settings */}
      {onShowGridChange && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[13px] text-muted-foreground">
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
                  <option key={size} value={size}>
                    {size}pt
                  </option>
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
            <label className="text-[13px] text-muted-foreground">
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
  drawingSettings: { stroke: string; strokeWidth: number; simplification?: number }
  onDrawingSettingsChange: (settings: {
    stroke: string
    strokeWidth: number
    simplification?: number
  }) => void
  onToolSelect: (tool: string) => void
  resolveText: (key: string, fallback?: string) => string
}> = ({ drawingSettings, onDrawingSettingsChange, onToolSelect, resolveText }) => (
  <div className="mb-4 space-y-3">
    <h4 className="text-[13px] font-medium text-muted-foreground mb-1">
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
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0.2"
          step="0.2"
          value={drawingSettings.strokeWidth}
          onChange={(e) => {
            const val = Number(e.target.value)
            if (val >= 0.2) onDrawingSettingsChange({ ...drawingSettings, strokeWidth: val })
          }}
          className={inputClass}
        />
        <span className="text-[11px] text-muted-foreground">mm</span>
      </div>
    </div>

    <div className="mb-3">
      <label className={labelClass}>
        {resolveText('properties_data_simplification', 'Data Simplification')}:{' '}
        {drawingSettings.simplification ?? 0}
      </label>
      <input
        type="range"
        min="0"
        max="3.0"
        step="0.1"
        value={drawingSettings.simplification ?? 0}
        onChange={(e) =>
          onDrawingSettingsChange({
            ...drawingSettings,
            simplification: parseFloat(e.target.value),
          })
        }
        className="w-full accent-accent"
      />
    </div>
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground mb-3">
        {resolveText('signature_instruction', 'Drag on canvas to draw.')}
      </p>
      <button
        type="button"
        onClick={() => onToolSelect('select')}
        className="w-full flex items-center justify-center py-2 px-4 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
  const { t } = useI18n()
  const [activeBindingMode, setActiveBindingMode] = React.useState<'field' | 'repeater' | null>(
    null
  )

  const resolveText = (key: string, fallback?: string): string => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return t(key, fallback ?? key)
  }

  const selectedElement = React.useMemo(() => {
    return templateDoc.nodes.find((el) => el.id === selectedElementId)
  }, [templateDoc.nodes, selectedElementId])

  const isDrawing = activeTool === 'signature'

  // Handle element change through templateDoc
  const handleChange = (
    id: string,
    updates: Partial<UnifiedNode>,
    options?: { saveToHistory?: boolean }
  ) => {
    const currentNode = templateDoc.nodes.find((n) => n.id === id)
    const finalUpdates =
      currentNode && currentNode.t === 'text'
        ? applyTextLayoutUpdates(currentNode, updates)
        : updates

    const nextDoc: Doc = {
      ...templateDoc,
      nodes: templateDoc.nodes.map((el) =>
        el.id === id ? ({ ...el, ...finalUpdates } as UnifiedNode) : el
      ),
    }
    onTemplateChange(nextDoc, options)
  }

  // Drawing mode panel
  if (isDrawing && drawingSettings && onDrawingSettingsChange && onToolSelect) {
    return (
      <div className="w-full h-full bg-secondary px-2 py-1 overflow-x-hidden overflow-y-auto">
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
          binding={node.bind ? { field: node.bind } : undefined}
          onUpdate={(binding) => handleChange(node.id, { bind: binding?.field })}
          onOpenModal={() => setActiveBindingMode('repeater')}
          i18nOverrides={i18nOverrides}
        />
      </div>
    ),
    lineRouting: ({ node }) => {
      const line = node as LineNode
      return (
        <div className="mb-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={line.routing === 'orthogonal'}
              onChange={(e) =>
                handleChange(node.id, { routing: e.target.checked ? 'orthogonal' : 'straight' })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[13px] text-muted-foreground">Orthogonal Routing (90°)</span>
          </label>
        </div>
      )
    },
    lineWaypoints: ({ node }) => {
      const line = node as LineNode
      const intermediateCount = Math.max(0, (line.pts.length - 4) / 2)

      const updateCount = (newCount: number) => {
        if (Number.isNaN(newCount) || newCount < 0) return
        const currentCount = (line.pts.length - 4) / 2
        if (newCount === currentCount) return

        const newPts = [...line.pts]

        if (newCount > currentCount) {
          // Add points
          const addCount = newCount - currentCount
          for (let i = 0; i < addCount; i++) {
            // Insert at midpoint of last segment (closest to end)
            // Current end is at length-2, length-1
            // Previous point is at length-4, length-3
            const len = newPts.length
            const p1x = newPts[len - 4],
              p1y = newPts[len - 3]
            const p2x = newPts[len - 2],
              p2y = newPts[len - 1]
            const mx = (p1x + p2x) / 2
            const my = (p1y + p2y) / 2
            // Insert before end point (at index len-2)
            newPts.splice(len - 2, 0, mx, my)
          }
        } else {
          // Remove points (from end of intermediate list)
          const removeCount = currentCount - newCount
          // Remove intermediate points before end point.
          // End point is at len-2.
          // Last intermediate is at len-4.
          // Remove range: [len-2 - (removeCount*2), len-2] ?
          // Splice start index: length - 2 - (count * 2)
          newPts.splice(newPts.length - 2 - removeCount * 2, removeCount * 2)
        }
        handleChange(node.id, { pts: newPts })
      }

      return (
        <div className="mb-3">
          <label className={labelClass}>Waypoints Count</label>
          <input
            type="number"
            min="0"
            value={intermediateCount}
            onChange={(e) => updateCount(parseInt(e.target.value, 10))}
            className={inputClass}
          />
        </div>
      )
    },
  }

  const handleBindingSelect = (binding: { field?: string }) => {
    if (selectedElement) {
      handleChange(selectedElement.id, { bind: binding.field })
    }
    setActiveBindingMode(null)
  }

  return (
    <div className="w-full h-full bg-secondary px-2 py-1 overflow-x-hidden overflow-y-auto">
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
