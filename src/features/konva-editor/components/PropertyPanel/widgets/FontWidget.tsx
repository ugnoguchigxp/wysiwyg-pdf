import { Bold, Italic, Strikethrough, Underline } from 'lucide-react'
import type React from 'react'
import type { FontWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import {
  DEFAULT_FONT_FAMILIES,
  DEFAULT_FONT_SIZES,
} from '@/features/konva-editor/constants/propertyPanelConfig'
import type { TextNode } from '@/types/canvas'
import { mmToPt, ptToMm, roundTo } from '@/utils/units'
import { cn } from '@/utils/utils'
import { ColorInput } from '../ColorInput'
import { GridContainer, WidgetLabel, WidgetSelect } from '../shared'
import type { WidgetProps } from './types'

export const FontWidget: React.FC<WidgetProps<FontWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'text') return null
  const textNode = node as TextNode
  const props = config.props ?? {}
  const families = props.fontFamilies ?? DEFAULT_FONT_FAMILIES
  const sizes = props.fontSizes ?? DEFAULT_FONT_SIZES

  const toggleStyle = (
    key: string,
    currentValue: boolean | number | undefined,
    onValue: boolean | number,
    offValue: boolean | number
  ) => {
    onChange({
      [key]: currentValue === onValue ? offValue : onValue,
    } as Partial<TextNode>)
  }

  return (
    <div className="space-y-2">
      {/* Font Family & Size */}
      <GridContainer grid={config.grid}>
        {props.showFamily !== false && (
          <div>
            <WidgetLabel>{resolveText('properties_font', 'Font')}</WidgetLabel>
            <WidgetSelect
              value={textNode.font ?? 'Meiryo'}
              onChange={(e) => onChange({ font: e.target.value } as Partial<TextNode>)}
            >
              {families.map((f: string) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </WidgetSelect>
          </div>
        )}
        {props.showSize !== false && (
          <div>
            <WidgetLabel>{resolveText('properties_font_size', 'Size')}(pt)</WidgetLabel>
            <WidgetSelect
              value={String(roundTo(mmToPt(textNode.fontSize ?? ptToMm(12)), 1))}
              onChange={(e) =>
                onChange({
                  fontSize: ptToMm(Number(e.target.value)),
                } as Partial<TextNode>)
              }
            >
              {sizes.map((s: number) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </WidgetSelect>
          </div>
        )}
      </GridContainer>

      {/* Font Styles & Color Row */}
      <div className="flex gap-2 items-end">
        {/* Style Buttons */}
        <div className="flex gap-1">
          {props.showBold !== false && (
            <button
              type="button"
              onClick={() => toggleStyle('fontWeight', textNode.fontWeight, 700, 400)}
              className={cn(
                'p-1.5 rounded border h-8 w-8 flex items-center justify-center',
                textNode.fontWeight === 700
                  ? 'bg-accent text-accent-foreground border-border'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              <Bold size={14} />
            </button>
          )}
          {props.showItalic !== false && (
            <button
              type="button"
              onClick={() => toggleStyle('italic', textNode.italic, true, false)}
              className={cn(
                'p-1.5 rounded border h-8 w-8 flex items-center justify-center',
                textNode.italic
                  ? 'bg-accent text-accent-foreground border-border'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              <Italic size={14} />
            </button>
          )}
          {props.showUnderline !== false && (
            <button
              type="button"
              onClick={() => toggleStyle('underline', textNode.underline, true, false)}
              className={cn(
                'p-1.5 rounded border h-8 w-8 flex items-center justify-center',
                textNode.underline
                  ? 'bg-accent text-accent-foreground border-border'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              <Underline size={14} />
            </button>
          )}
          {props.showStrikethrough && (
            <button
              type="button"
              onClick={() => toggleStyle('lineThrough', textNode.lineThrough, true, false)}
              className={cn(
                'p-1.5 rounded border h-8 w-8 flex items-center justify-center',
                textNode.lineThrough
                  ? 'bg-accent text-accent-foreground border-border'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              <Strikethrough size={14} />
            </button>
          )}
        </div>

        {/* Color Picker */}
        {props.showColor !== false && (
          <div className="flex-1">
            <ColorInput
              value={textNode.fill ?? '#000000'}
              onChange={(e, options) => onChange({ fill: e } as Partial<TextNode>, options)}
              className="h-8 w-full p-0.5 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  )
}
