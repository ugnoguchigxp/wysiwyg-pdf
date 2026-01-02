import type { UnifiedNode, WidgetNode } from '@/types/canvas'
import { SECTION_PRESETS, WIDGET_PRESETS } from './presets'
import type {
  ObjectPanelConfig,
  PresetRef,
  PropertyPanelConfig,
  SectionConfig,
  WidgetConfig,
} from './types'

// ========================================
// Helper Functions
// ========================================

/**
 * Resolve preset reference to actual configuration
 */
export function resolvePreset<T>(ref: PresetRef<T>, presets: Record<string, T>): T {
  if (typeof ref === 'string') {
    const preset = presets[ref]
    if (!preset) {
      throw new Error(`Unknown preset: ${ref}`)
    }
    return preset
  }
  return ref
}

/** Get Object Configuration for a specific node */
export function getObjectConfig(
  config: PropertyPanelConfig,
  node: UnifiedNode
): ObjectPanelConfig | undefined {
  if (node.t === 'widget') {
    const widgetNode = node as WidgetNode
    return config.objects.find((obj) => obj.objectType === `widget:${widgetNode.widget}`)
  }
  return config.objects.find((obj) => obj.objectType === node.t)
}

/** Resolve Section Configuration from preset name */
export function resolveSection(ref: PresetRef<SectionConfig>): SectionConfig {
  return resolvePreset(ref, SECTION_PRESETS)
}

/** Resolve Widget Configuration from preset name */
export function resolveWidget(ref: PresetRef<WidgetConfig>): WidgetConfig {
  return resolvePreset(ref, WIDGET_PRESETS)
}

/** Filter visible sections based on condition */
export function getVisibleSections(
  sectionRefs: PresetRef<SectionConfig>[],
  node: UnifiedNode
): SectionConfig[] {
  return sectionRefs
    .map(resolveSection)
    .filter((section) => !section.condition || section.condition(node))
}

/** Filter visible widgets based on condition */
export function getVisibleWidgets(
  widgetRefs: PresetRef<WidgetConfig>[],
  node: UnifiedNode
): WidgetConfig[] {
  return widgetRefs
    .map(resolveWidget)
    .filter((widget) => !widget.condition || widget.condition(node))
}
