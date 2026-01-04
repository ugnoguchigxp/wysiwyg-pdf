import type React from 'react'
import type { CheckboxWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { LineNode, TextNode, UnifiedNode } from '@/types/canvas'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const CheckboxWidget: React.FC<WidgetProps<CheckboxWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const { fieldKey } = config.props

  // Special handling for 'routing' (Line Smart Connection)
  const isRouting = fieldKey === 'routing'
  const value = isRouting
    ? (node as unknown as Record<string, string>)[fieldKey] === 'orthogonal'
    : !!(node as unknown as Record<string, boolean>)[fieldKey]

  const handleChange = (checked: boolean) => {
    if (isRouting) {
      if (checked) {
        // Enable Orthogonal
        const updates: Partial<LineNode> = { routing: 'orthogonal' }
        onChange(updates)
      } else {
        // Disable Orthogonal -> Reset to Straight Line (Start -> End)
        const lineNode = node as LineNode
        const pts = lineNode.pts || []
        if (pts.length >= 4) {
          const newPts = [pts[0], pts[1], pts[pts.length - 2], pts[pts.length - 1]]
          const updates: Partial<LineNode> = {
            routing: 'straight',
            pts: newPts,
          }
          onChange(updates)
        } else {
          const updates: Partial<LineNode> = { routing: 'straight' }
          onChange(updates)
        }
      }
    } else if (fieldKey === 'vertical') {
      onChange({ vertical: checked } as Partial<UnifiedNode>)
    } else if (fieldKey === 'hasFrame' && checked) {
      // Special handling for 'hasFrame' -> Apply defaults if checked
      const textNode = node as TextNode
      const updates: Partial<TextNode> = { hasFrame: true }

      // Apply defaults if not present or cleared
      // User requested: Width 0.2mm, Border #000000, Bg #FFFFFF
      if (!textNode.borderWidth || textNode.borderWidth === 0) {
        updates.borderWidth = 0.2
      }
      if (!textNode.borderColor) {
        updates.borderColor = '#000000'
      }
      if (!textNode.backgroundColor) {
        updates.backgroundColor = '#FFFFFF'
      }
      if (textNode.padding === undefined) {
        updates.padding = 0.5
      }
      onChange(updates)
    } else {
      onChange({ [fieldKey]: checked } as unknown as Partial<UnifiedNode>)
    }
  }

  return (
    <div>
      {/* Spacer to align with labeled widgets in a grid */}
      <WidgetLabel className="opacity-0 select-none">&nbsp;</WidgetLabel>
      <div className="flex items-center gap-2 h-8">
        <input
          type="checkbox"
          id={`checkbox-${fieldKey}`}
          checked={value}
          onChange={(e) => handleChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label
          htmlFor={`checkbox-${fieldKey}`}
          className="text-xs text-muted-foreground cursor-pointer select-none"
        >
          {resolveText(config.labelKey ?? fieldKey, fieldKey)}
        </label>
      </div>
    </div>
  )
}
