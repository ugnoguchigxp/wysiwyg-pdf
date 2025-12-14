/**
 * BedLayout PropertyPanel - Unified Version Wrapper
 * 
 * 既存APIとの互換性を保ちながらUnifiedPropertyPanelを使用
 * グリッド・スナップ設定もPropertyPanelに統合
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { UnifiedPropertyPanel } from '../../shared/components/PropertyPanel'
import { BED_LAYOUT_PANEL_CONFIG } from '../../constants/propertyPanelConfig'
import type { UnifiedNode } from '../../../../types/canvas'
import type { BedLayoutDocument } from '../../types'
import type { WidgetProps } from '../../shared/components/PropertyPanel/widgets'

const FIBONACCI_GRID_SIZES = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]

// ========================================
// Props Interface
// ========================================

export interface PropertyPanelProps {
  selectedElement: UnifiedNode | null
  onChange: (id: string, newAttrs: Partial<UnifiedNode>) => void
  onDelete: (id: string) => void
  document?: BedLayoutDocument
  onDocumentChange?: (newDoc: BedLayoutDocument) => void
  i18nOverrides?: Record<string, string>
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
  document?: BedLayoutDocument
  onDocumentChange?: (newDoc: BedLayoutDocument) => void
  showGrid?: boolean
  onShowGridChange?: (show: boolean) => void
  gridSize?: number
  onGridSizeChange?: (size: number) => void
  snapStrength?: number
  onSnapStrengthChange?: (strength: number) => void
  resolveText: (key: string, fallback?: string) => string
}> = ({
  document,
  onDocumentChange,
  showGrid,
  onShowGridChange,
  gridSize,
  onGridSizeChange,
  snapStrength,
  onSnapStrengthChange,
  resolveText,
}) => {
    const { t } = useTranslation()

    return (
      <div className="w-64 bg-theme-bg-secondary px-2 py-1 overflow-x-hidden overflow-y-auto text-theme-text-primary">
        {/* Canvas Size (if document provided) */}
        {document && onDocumentChange && (
          <div className="mb-3">
            <h4 className="text-[13px] font-medium text-theme-text-secondary mb-1">
              {resolveText('properties_layout', 'Canvas')}
            </h4>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className={labelClass}>W</label>
                <input
                  type="number"
                  value={document.layout.width}
                  onChange={(e) =>
                    onDocumentChange({
                      ...document,
                      layout: { ...document.layout, width: Number(e.target.value) },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>H</label>
                <input
                  type="number"
                  value={document.layout.height}
                  onChange={(e) =>
                    onDocumentChange({
                      ...document,
                      layout: { ...document.layout, height: Number(e.target.value) },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

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
// Main Component
// ========================================

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedElement,
  onChange,
  onDelete,
  document,
  onDocumentChange,
  i18nOverrides,
  showGrid,
  onShowGridChange,
  gridSize,
  onGridSizeChange,
  snapStrength,
  onSnapStrengthChange,
}) => {
  // resolveText helper for i18n
  const resolveText = (key: string, fallback?: string): string => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return fallback ?? key
  }

  // If no element selected, show canvas settings
  if (!selectedElement) {
    return (
      <CanvasSettingsPanel
        document={document}
        onDocumentChange={onDocumentChange}
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

  // Custom renderers for BedLayout-specific widgets
  const customRenderers: Record<string, React.FC<WidgetProps>> = {
    deleteButton: ({ node }) => (
      <div className="mt-2 pt-2 border-t border-theme-border">
        <button
          onClick={() => onDelete(node.id)}
          className="w-full py-1 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded"
        >
          {resolveText('delete', 'Delete')}
        </button>
      </div>
    ),
  }

  return (
    <UnifiedPropertyPanel
      config={BED_LAYOUT_PANEL_CONFIG}
      selectedNode={selectedElement}
      onChange={onChange}
      onDelete={onDelete}
      i18nOverrides={i18nOverrides}
      customRenderers={customRenderers}
    />
  )
}

export default PropertyPanel
