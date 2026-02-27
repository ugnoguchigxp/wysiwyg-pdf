/**
 * Wysiwyg Properties Panel - Unified Version Wrapper
 *
 * 既存APIとの互換性を保ちながらUnifiedPropertyPanelを使用
 * グリッド・スナップ設定もPropertyPanelに統合
 */

import React from 'react'
import { UnifiedPropertyPanel } from '@/features/konva-editor/components/PropertyPanel/UnifiedPropertyPanel'
import type { WidgetProps } from '@/features/konva-editor/components/PropertyPanel/widgets'
import {
  MANGA_DUBBING_PANEL_CONFIG,
  REPORT_PANEL_CONFIG,
} from '@/features/konva-editor/constants/propertyPanel/layouts'
import { applyTextLayoutUpdates } from '@/features/konva-editor/utils/textLayout'
import { useI18n } from '@/i18n/I18nContext'
import type {
  Doc,
  LineNode,
  SpeechBubbleNode,
  Surface,
  TableNode,
  UnifiedNode,
} from '@/types/canvas'
import type { IDataSchema } from '@/types/schema'
import { BulkImageImport } from '../Import/BulkImageImport'
import { BindingSelector } from './BindingSelector'
import { DataBindingModal } from './DataBindingModal'
import { TableProperties } from './TableProperties'

const FIBONACCI_GRID_SIZES = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]

// ========================================
// Context for stable prop sharing
// ========================================

interface WysiwygPanelContextType {
  templateDoc: Doc
  onUpdate: (id: string, updates: Partial<UnifiedNode>) => void
  selectedCell?: { elementId: string; row: number; col: number } | null
  i18nOverrides?: Record<string, string>
}

const WysiwygPanelContext = React.createContext<WysiwygPanelContextType | null>(null)

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
  onBulkImport?: (newSurfaces: Surface[]) => void
  editorType?: 'report' | 'manga'
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
  onBulkImport?: (newSurfaces: Surface[]) => void
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
  onBulkImport,
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

      {/* Bulk Image Import */}
      {onBulkImport && (
        <div className="mt-4 pt-4 border-t border-border">
          <BulkImageImport onImport={onBulkImport} />
        </div>
      )}
    </div>
  )
}

// ========================================
// Signature Drawing Panel (署名描画モード時)
// ========================================

const SignatureDrawingPanel: React.FC<{
  drawingSettings: {
    stroke: string
    strokeWidth: number
    simplification?: number
  }
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
        onChange={(e) =>
          onDrawingSettingsChange({
            ...drawingSettings,
            stroke: e.target.value,
          })
        }
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

const SpeechBubbleDrawingPanel: React.FC<{
  onFinish: () => void
  resolveText: (key: string, fallback?: string) => string
}> = ({ onFinish, resolveText }) => (
  <div className="mb-4 space-y-3">
    <h4 className="text-[13px] font-medium text-muted-foreground mb-1">
      {resolveText('toolbar_speech_bubble', 'Speech Bubble')}
    </h4>
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground mb-3">
        {resolveText(
          'speech_bubble_instruction',
          'Click on canvas to add points. Click near first point to close.'
        )}
      </p>
      <button
        type="button"
        onClick={onFinish}
        className="w-full flex items-center justify-center py-2 px-4 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {resolveText('properties_finish_drawing', 'Finish Drawing')}
      </button>
    </div>
  </div>
)

// ========================================
// Custom Widget Components
// ========================================

const TablePropertiesWidget: React.FC<WidgetProps> = (props) => {
  const context = React.useContext(WysiwygPanelContext)
  if (!context) return null
  return (
    <TableProperties
      element={props.node as TableNode}
      onUpdate={(newAttrs) => context.onUpdate(props.node.id, newAttrs)}
      selectedCell={context.selectedCell}
      i18nOverrides={context.i18nOverrides}
    />
  )
}

const BindingSelectorWidget: React.FC<
  WidgetProps & {
    onOpenModal: (mode: 'field' | 'repeater') => void
    mode: 'field' | 'repeater'
  }
> = (props) => {
  const context = React.useContext(WysiwygPanelContext)
  if (!context) return null
  return (
    <div>
      <BindingSelector
        binding={props.node.bind ? { field: props.node.bind } : undefined}
        onUpdate={(binding) => context.onUpdate(props.node.id, { bind: binding?.field })}
        onOpenModal={() => props.onOpenModal(props.mode)}
        i18nOverrides={context.i18nOverrides}
      />
    </div>
  )
}

const LineRoutingWidget: React.FC<WidgetProps> = ({ node }) => {
  const context = React.useContext(WysiwygPanelContext)
  if (!context) return null
  const line = node as LineNode
  return (
    <div className="mb-3">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={line.routing === 'orthogonal'}
          onChange={(e) =>
            context.onUpdate(node.id, {
              routing: e.target.checked ? 'orthogonal' : 'straight',
            })
          }
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-[13px] text-muted-foreground">Orthogonal Routing (90°)</span>
      </label>
    </div>
  )
}

const LineWaypointsWidget: React.FC<WidgetProps> = ({ node }) => {
  const context = React.useContext(WysiwygPanelContext)
  if (!context) return null
  const line = node as LineNode
  const intermediateCount = Math.max(0, (line.pts.length - 4) / 2)

  const updateCount = (newCount: number) => {
    if (Number.isNaN(newCount) || newCount < 0) return
    const currentCount = (line.pts.length - 4) / 2
    if (newCount === currentCount) return

    const newPts = [...line.pts]

    if (newCount > currentCount) {
      const addCount = newCount - currentCount
      for (let i = 0; i < addCount; i++) {
        const len = newPts.length
        const p1x = newPts[len - 4],
          p1y = newPts[len - 3]
        const p2x = newPts[len - 2],
          p2y = newPts[len - 1]
        const mx = (p1x + p2x) / 2
        const my = (p1y + p2y) / 2
        newPts.splice(len - 2, 0, mx, my)
      }
    } else {
      const removeCount = currentCount - newCount
      newPts.splice(newPts.length - 2 - removeCount * 2, removeCount * 2)
    }
    context.onUpdate(node.id, { pts: newPts })
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
}

const MangaDubbingWidget: React.FC<WidgetProps> = ({ node }) => {
  const context = React.useContext(WysiwygPanelContext)
  if (!context) return null
  const { templateDoc, onUpdate } = context
  const bubble = node as SpeechBubbleNode
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'ko', label: '한국어' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'it', label: 'Italiano' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'th', label: 'ไทย' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'ms', label: 'Bahasa Melayu' },
    { code: 'hi', label: 'हिन्दी' },
  ]

  const handleTranslate = async (targetLang: string) => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: [{ id: bubble.id, text: bubble.originalText }],
          targetLang,
        }),
      })
      const data = (await response.json()) as {
        translations: { id: string; translatedText: string }[]
      }
      if (data.translations && data.translations.length > 0) {
        const newTranslations = {
          ...bubble.translations,
          [targetLang]: data.translations[0].translatedText,
        }
        onUpdate(bubble.id, { translations: newTranslations })
      }
    } catch (e) {
      console.error('Translation failed', e)
    }
  }

  const handleBatchTranslate = async (targetLang: string) => {
    const speechNodes = templateDoc.nodes.filter(
      (n) => n.t === 'speech-bubble'
    ) as SpeechBubbleNode[]
    if (speechNodes.length === 0) return

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: speechNodes.map((n) => ({ id: n.id, text: n.originalText })),
          targetLang,
        }),
      })
      const data = (await response.json()) as {
        translations: { id: string; translatedText: string }[]
      }

      if (data.translations) {
        data.translations.forEach((t) => {
          const node = speechNodes.find((sn) => sn.id === t.id)
          if (node) {
            const newTranslations = { ...node.translations, [targetLang]: t.translatedText }
            onUpdate(node.id, { translations: newTranslations })
          }
        })
      }
    } catch (e) {
      console.error('Batch translation failed', e)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Original Text (Japanese/Any)</label>
        <textarea
          value={bubble.originalText}
          onChange={(e) => onUpdate(node.id, { originalText: e.target.value })}
          className={`${inputClass} min-h-[60px] resize-none`}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleTranslate('en')}
          className="flex-1 py-1 px-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Auto EN (Select)
        </button>
        <button
          onClick={() => handleBatchTranslate('en')}
          className="flex-1 py-1 px-2 text-xs bg-accent text-accent-foreground rounded hover:bg-accent/90"
        >
          Auto EN (All)
        </button>
      </div>

      <div className="border-t border-border pt-2">
        <h5 className="text-[11px] font-semibold text-muted-foreground uppercase mb-2">
          Translations
        </h5>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          {languages.map((lang) => (
            <div key={lang.code}>
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[10px] text-muted-foreground">
                  {lang.label} ({lang.code})
                </label>
                <div className="flex gap-1">
                  <button
                    className="text-[9px] hover:underline text-blue-500"
                    onClick={() => handleTranslate(lang.code)}
                  >
                    Auto
                  </button>
                  <button
                    className="text-[9px] hover:underline"
                    onClick={() =>
                      onUpdate(node.id, { originalText: bubble.translations[lang.code] || '' })
                    }
                  >
                    Apply
                  </button>
                </div>
              </div>
              <input
                value={bubble.translations[lang.code] || ''}
                onChange={(e) => {
                  const newTranslations = { ...bubble.translations, [lang.code]: e.target.value }
                  onUpdate(node.id, { translations: newTranslations })
                }}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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
  onBulkImport,
  editorType = 'report',
}) => {
  const { t } = useI18n()
  const [activeBindingMode, setActiveBindingMode] = React.useState<'field' | 'repeater' | null>(
    null
  )

  const resolveText = React.useCallback(
    (key: string, fallback?: string): string => {
      if (i18nOverrides?.[key]) return i18nOverrides[key]
      return t(key, fallback ?? key)
    },
    [i18nOverrides, t]
  )

  const selectedElement = React.useMemo(() => {
    return templateDoc.nodes.find((el) => el.id === selectedElementId)
  }, [templateDoc.nodes, selectedElementId])

  const isDrawing = activeTool === 'signature'
  const isSpeechBubbleDrawing = activeTool === 'speech-bubble'

  // Ref for stable templateDoc access in handleChange
  const templateDocRef = React.useRef(templateDoc)
  templateDocRef.current = templateDoc

  // Handle element change through templateDoc
  const handleChange = React.useCallback(
    (id: string, updates: Partial<UnifiedNode>, options?: { saveToHistory?: boolean }) => {
      const currentDoc = templateDocRef.current
      const currentNode = currentDoc.nodes.find((n) => n.id === id)
      const finalUpdates =
        currentNode && currentNode.t === 'text'
          ? applyTextLayoutUpdates(currentNode, updates)
          : updates

      const nextDoc: Doc = {
        ...currentDoc,
        nodes: currentDoc.nodes.map((el) =>
          el.id === id ? ({ ...el, ...finalUpdates } as UnifiedNode) : el
        ),
      }
      onTemplateChange(nextDoc, options)
    },
    [onTemplateChange]
  )

  // Custom renderers for Report-specific widgets
  // These are now stable because the widgets use context to get templateDoc
  const customRenderers: Record<string, React.FC<WidgetProps>> = React.useMemo(
    () => ({
      tableProperties: TablePropertiesWidget,
      dataBindingField: (props) => (
        <BindingSelectorWidget {...props} onOpenModal={setActiveBindingMode} mode="field" />
      ),
      dataBindingRepeater: (props) => (
        <BindingSelectorWidget {...props} onOpenModal={setActiveBindingMode} mode="repeater" />
      ),
      lineRouting: LineRoutingWidget,
      lineWaypoints: LineWaypointsWidget,
      mangaDubbing: MangaDubbingWidget,
    }),
    []
  )

  const handleBindingSelect = (binding: { field?: string }) => {
    if (selectedElement) {
      handleChange(selectedElement.id, { bind: binding.field })
    }
    setActiveBindingMode(null)
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

  // Speech bubble tool panel
  if (isSpeechBubbleDrawing && onToolSelect) {
    return (
      <div className="w-full h-full bg-secondary px-2 py-1 overflow-x-hidden overflow-y-auto">
        <SpeechBubbleDrawingPanel
          onFinish={() => onToolSelect('select')}
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
        onBulkImport={onBulkImport}
        resolveText={resolveText}
      />
    )
  }

  return (
    <WysiwygPanelContext.Provider
      value={{
        templateDoc,
        onUpdate: handleChange,
        selectedCell,
        i18nOverrides,
      }}
    >
      <div className="w-full h-full bg-secondary px-2 py-1 overflow-x-hidden overflow-y-auto">
        <UnifiedPropertyPanel
          config={editorType === 'manga' ? MANGA_DUBBING_PANEL_CONFIG : REPORT_PANEL_CONFIG}
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
    </WysiwygPanelContext.Provider>
  )
}

export default WysiwygPropertiesPanel
