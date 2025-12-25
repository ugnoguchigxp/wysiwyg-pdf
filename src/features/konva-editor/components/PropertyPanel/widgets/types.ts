import type { WidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { UnifiedNode } from '@/types/canvas'

export interface WidgetProps<T extends WidgetConfig = WidgetConfig> {
  config: T
  node: UnifiedNode
  // Support options for transient updates (e.g. dragging a slider or color picker)
  onChange: (updates: Partial<UnifiedNode>, options?: { saveToHistory?: boolean }) => void
  resolveText: (key: string, fallback?: string) => string
}
