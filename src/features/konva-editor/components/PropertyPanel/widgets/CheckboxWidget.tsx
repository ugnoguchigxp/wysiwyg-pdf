import type React from 'react'
import type { CheckboxWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { LineNode, TextNode, UnifiedNode } from '@/types/canvas'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'
import { calculateVerticalLayout } from '@/features/vertical-text'

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
          const updates: Partial<LineNode> = { routing: 'straight', pts: newPts }
          onChange(updates)
        } else {
          const updates: Partial<LineNode> = { routing: 'straight' }
          onChange(updates)
        }
      }
    } else if (fieldKey === 'vertical') {
      const textNode = node as TextNode
      if (checked) {
        // Vertical Mode: Calculate Height/Width based on content
        // Import dynamically or assume it's available? I will import it at top.
        // Logic:
        // 1. Calculate layout to find dimensions
        const fontSize = textNode.fontSize ?? 12
        // We use ptToMm logic if needed? Usually canvas uses 'unit' but here `fontSize` is likely in points/pixels relative to canvas.
        // Assuming fontSize is correct unit.
        // We need to import calculateVerticalLayout.
        const metrics = calculateVerticalLayout(textNode.text, 0, 0, {
          fontSize: fontSize,
          letterSpacing: 0, // Default for now
          // lineHeight not supported in options yet, uses default 1.5 internally? No, columnSpacing.
          // let's stick to valid options.
          autoIndent: true, // Default
          indentSize: 1, // Default
        })

        if (metrics.length > 0) {
          // Height is the vertical span.
          // metrics.y is the top of the character slot.
          // char height is fontSize * 1 (roughly)
          // We find the max Y extent.
          const maxY = metrics.reduce((max: number, m: { y: number }) => Math.max(max, m.y + fontSize), 0)

          // Add a bit of buffer? Layout uses top-left logic.
          // If last char is at Y=100 and size=20, max Y is 120.
          const newHeight = maxY

          // Width is horizontal span.
          // metrics.x is the left of the character slot relative to startX.
          // Columns go left: 0, -colWidth...
          // So minX is the leftmost edge.
          const minX = metrics.reduce((min: number, m: { x: number }) => Math.min(min, m.x), 0)

          // column width is roughly fontSize * 1.5
          // If we assume startX=0 is the right edge of first column (which isn't strictly true in the logic, logic says x = startX - currentColumn * columnWidth).
          // Wait, vertical-layout: x = startX - colIndex * colWidth.
          // If colIndex=0, x = startX.
          // So if startX=0, x=0.
          // If colIndex=1, x = -30.
          // So minX = -30. MaxX = 0.
          // Width = Max - Min + colWidth?
          // If x=0 is the LEFT edge of col 0.
          // Then right edge of col 0 is x + colWidth.
          // The total width is (maxx + colWidth) - minX.
          // If startX=0, minX=-30, maxX=0.
          // Width = (0 + 30) - (-30) = 60? No.
          // Leftmost is -30. Rightmost is 0 + 30.
          // Range is [-30, 30]. Length is 60.
          // So: Width = (maxX - minX) + colWidth.

          const colWidth = fontSize * 1.5
          const maxX = metrics.reduce((max: number, m: { x: number }) => Math.max(max, m.x), 0)
          const calculatedWidth = (maxX - minX) + colWidth

          const newWidth = calculatedWidth // Math.abs(minX) + colWidth (if maxX is 0)

          onChange({ vertical: true, h: newHeight, w: newWidth } as Partial<UnifiedNode>)
        } else {
          // Empty text, just toggle
          onChange({ vertical: true } as Partial<UnifiedNode>)
        }
      } else {
        // Vertical OFF
        onChange({ vertical: false } as Partial<UnifiedNode>)
      }
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
