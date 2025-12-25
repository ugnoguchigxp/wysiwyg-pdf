import type React from 'react'
import type { ColorPickerWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { UnifiedNode } from '@/types/canvas'
import { ColorInput } from '../ColorInput'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const ColorPickerWidget: React.FC<WidgetProps<ColorPickerWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const fieldKey = config.props.fieldKey
  const value = (node as unknown as Record<string, string>)[fieldKey] ?? '#000000'

  const labelKey = config.labelKey ?? 'color'
  const fallbackLabel =
    labelKey === 'properties_font_color'
      ? 'FontColor'
      : labelKey === 'properties_border_color' || labelKey === 'properties_border_color_box'
        ? 'BorderColor'
        : labelKey === 'properties_line_color'
          ? 'LineColor'
          : labelKey === 'properties_fill_color'
            ? 'FillColor'
            : 'Color'

  return (
    <div>
      <WidgetLabel>{resolveText(labelKey, fallbackLabel)}</WidgetLabel>
      <ColorInput
        value={value}
        onChange={(newColor) => {
          const updates: Partial<UnifiedNode> = {
            [fieldKey]: newColor,
          } as unknown as Partial<UnifiedNode>
          if (fieldKey === 'borderColor') {
            const currentWidth = (node as unknown as Record<string, number>)['borderWidth']
            if (!currentWidth || currentWidth === 0) {
              ;(updates as unknown as Record<string, number>)['borderWidth'] = 0.1
            }
          }
          onChange(updates, undefined)
        }}
      />
    </div>
  )
}
