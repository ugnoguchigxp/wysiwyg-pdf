/**
 * Unified Property Panel
 *
 * 設定駆動型の共通プロパティパネルコンポーネント
 * ReportエディタとBedLayoutエディタで共通使用
 */

import { ChevronDown } from 'lucide-react'
import React from 'react'
import { useI18n } from '@/i18n/I18nContext'
import type {
  PresetRef,
  PropertyPanelConfig,
  SectionConfig,
  WidgetConfig,
} from '@/features/konva-editor/constants/propertyPanelConfig'
import {
  getObjectConfig,
  SECTION_PRESETS,
  WIDGET_PRESETS,
} from '@/features/konva-editor/constants/propertyPanelConfig'
import type { UnifiedNode } from '@/types/canvas'
import { cn } from '@/utils/utils'
import { applyTextLayoutUpdates } from '@/features/konva-editor/utils/textLayout'
import type { WidgetProps } from './widgets'
import { renderWidget } from './widgets'

// ========================================
// Types
// ========================================

export interface UnifiedPropertyPanelProps {
  config: PropertyPanelConfig
  selectedNode: UnifiedNode | null
  onChange: (id: string, updates: Partial<UnifiedNode>, options?: { saveToHistory?: boolean }) => void
  onDelete?: (id: string) => void
  i18nOverrides?: Record<string, string>
  /** カスタムウィジェットレンダラー */
  customRenderers?: Record<string, React.FC<WidgetProps>>
  /** 空状態時のコンテンツ (デフォルト: null) */
  emptyStateContent?: React.ReactNode
  className?: string
}

// ========================================
// Sub Components
// ========================================

/** セクションヘッダー */
const SectionHeader: React.FC<{
  labelKey?: string
  resolveText: (key: string, fallback?: string) => string
  collapsible?: boolean
  collapsed?: boolean
  onToggle?: () => void
}> = ({ labelKey, resolveText, collapsible, collapsed, onToggle }) => {
  if (!labelKey) return null

  return (
    <h4
      className={cn(
        'text-[11px] font-medium text-muted-foreground mb-1',
        collapsible && 'cursor-pointer flex items-center justify-between'
      )}
      onClick={collapsible ? onToggle : undefined}
    >
      {resolveText(labelKey, labelKey)}
      {collapsible && (
        <ChevronDown size={14} className={cn('transition-transform', collapsed && '-rotate-90')} />
      )}
    </h4>
  )
}

/** セクションカード */
const SectionCard: React.FC<{
  section: SectionConfig
  node: UnifiedNode
  onChange: (updates: Partial<UnifiedNode>, options?: { saveToHistory?: boolean }) => void
  resolveText: (key: string, fallback?: string) => string
  customRenderers?: Record<string, React.FC<WidgetProps>>
}> = ({ section, node, onChange, resolveText, customRenderers }) => {
  const [collapsed, setCollapsed] = React.useState(section.defaultCollapsed ?? false)

  // Resolve widgets from presets
  const widgets = section.widgets
    .map((ref: PresetRef<WidgetConfig>) => {
      if (typeof ref === 'string') {
        return WIDGET_PRESETS[ref]
      }
      return ref
    })
    .filter(Boolean) as WidgetConfig[]

  // Filter widgets by condition
  const visibleWidgets = widgets.filter((w) => !w.condition || w.condition(node))

  if (visibleWidgets.length === 0) return null

  return (
    <div className="mb-2">
      <SectionHeader
        labelKey={section.labelKey}
        resolveText={resolveText}
        collapsible={section.collapsible}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      {!collapsed && (
        <div
          className={cn(
            'w-full',
            section.grid && 'grid',
            section.grid && `gap-${section.grid.gap ?? 2}`
          )}
          style={
            section.grid ? { gridTemplateColumns: `repeat(${section.grid.cols}, 1fr)` } : undefined
          }
        >
          {visibleWidgets.map((widget, i) => (
            <div
              key={`${section.id}-widget-${i}`}
              className="w-full"
              style={widget.colSpan ? { gridColumn: `span ${widget.colSpan}` } : undefined}
            >
              {renderWidget(widget, node, onChange, resolveText, customRenderers)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** パネルヘッダー（右上タグ表示） */
const PanelHeader: React.FC<{
  iconName?: string
  labelKey: string
  resolveText: (key: string, fallback?: string) => string
}> = ({ labelKey, resolveText }) => {
  return (
    <div className="flex justify-end mb-1">
      <span className="px-2 py-0.5 text-xs bg-accent text-accent-foreground rounded-full">
        {resolveText(labelKey, labelKey)}
      </span>
    </div>
  )
}

/** 削除ボタン */
const DeleteButton: React.FC<{
  onClick: () => void
  resolveText: (key: string, fallback?: string) => string
}> = ({ onClick, resolveText }) => (
  <div className="mt-4 pt-4 border-t border-border">
    <button
      onClick={onClick}
      className="w-full py-1 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded"
    >
      {resolveText('delete', 'Delete')}
    </button>
  </div>
)

// ========================================
// Main Component
// ========================================

export const UnifiedPropertyPanel: React.FC<UnifiedPropertyPanelProps> = ({
  config,
  selectedNode,
  onChange,
  onDelete,
  i18nOverrides,
  customRenderers: externalCustomRenderers,
  emptyStateContent,
  className,
}) => {
  const { t } = useI18n()

  const resolveText = (key: string, fallback?: string): string => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return t(key, fallback ?? key)
  }

  // Built-in custom renderers
  const builtInCustomRenderers: Record<string, React.FC<WidgetProps>> = {
    deleteButton: ({ node }) =>
      onDelete ? (
        <DeleteButton onClick={() => onDelete(node.id)} resolveText={resolveText} />
      ) : null,
  }

  const customRenderers = { ...builtInCustomRenderers, ...externalCustomRenderers }

  // Handle element updates
  const handleChange = (updates: Partial<UnifiedNode>, options?: { saveToHistory?: boolean }) => {
    if (selectedNode) {
      const finalUpdates =
        selectedNode.t === 'text' ? applyTextLayoutUpdates(selectedNode, updates) : updates

      onChange(selectedNode.id, finalUpdates, options)
    }
  }

  // Empty state
  if (!selectedNode) {
    return emptyStateContent ? (
      <div
        className={cn('bg-secondary border-l border-border p-4 overflow-y-auto', className)}
        style={{ width: config.layout.width }}
      >
        {emptyStateContent}
      </div>
    ) : null
  }

  // Get object-specific config
  const objectConfig = getObjectConfig(config, selectedNode)

  // Resolve all sections
  const objectSections = (objectConfig?.sections ?? [])
    .map((ref: PresetRef<SectionConfig>) => {
      if (typeof ref === 'string') {
        return SECTION_PRESETS[ref]
      }
      return ref
    })
    .filter(Boolean) as SectionConfig[]

  const defaultSections = config.defaultSections
    .map((ref: PresetRef<SectionConfig>) => {
      if (typeof ref === 'string') {
        return SECTION_PRESETS[ref]
      }
      return ref
    })
    .filter(Boolean) as SectionConfig[]

  // Filter sections by condition
  const visibleObjectSections = objectSections.filter(
    (s) => !s.condition || s.condition(selectedNode)
  )
  const visibleDefaultSections = defaultSections.filter(
    (s) => !s.condition || s.condition(selectedNode)
  )

  // Separate delete section from default sections
  const deleteSections = visibleDefaultSections.filter((s) => s.id === 'common-delete')
  const nonDeleteDefaultSections = visibleDefaultSections.filter((s) => s.id !== 'common-delete')

  return (
    <div
      className={cn(
        'w-full bg-secondary overflow-x-hidden overflow-y-auto text-foreground px-2 py-1',
        className
      )}
    >
      {/* Object Header */}
      {objectConfig?.header && (
        <PanelHeader
          iconName={objectConfig.header.iconName}
          labelKey={objectConfig.header.labelKey}
          resolveText={resolveText}
        />
      )}

      {/* Object-specific Sections */}
      {visibleObjectSections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          node={selectedNode}
          onChange={handleChange}
          resolveText={resolveText}
          customRenderers={customRenderers}
        />
      ))}

      {/* Default Sections (except delete) */}
      {nonDeleteDefaultSections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          node={selectedNode}
          onChange={handleChange}
          resolveText={resolveText}
          customRenderers={customRenderers}
        />
      ))}

      {/* Delete Section (always at bottom) */}
      {deleteSections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          node={selectedNode}
          onChange={handleChange}
          resolveText={resolveText}
          customRenderers={customRenderers}
        />
      ))}
    </div>
  )
}

export default UnifiedPropertyPanel
