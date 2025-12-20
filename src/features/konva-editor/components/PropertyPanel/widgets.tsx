/**
 * Unified Property Panel - Widget Components
 *
 * 設定駆動型のプロパティパネル用ウィジェットコンポーネント群
 */

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpToLine,
  Bold,
  Circle,
  Diamond,
  Italic,
  Minus,
  Strikethrough,
  Underline,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import type {
  AlignmentWidgetConfig,
  ArrowheadWidgetConfig,
  BorderWidgetConfig,
  ColorPickerWidgetConfig,
  DataBindingWidgetConfig,
  FillWidgetConfig,
  FontWidgetConfig,
  ImageWidgetConfig,
  LabelFieldWidgetConfig,
  LineStyleWidgetConfig,
  NumberInputWidgetConfig,
  PolygonWidgetConfig,
  PosSizeWidgetConfig,
  SelectWidgetConfig,
  SliderWidgetConfig,
  StrokeWidgetConfig,
  TextContentWidgetConfig,
  VAlignmentWidgetConfig,
  WidgetConfig,
} from '@/features/konva-editor/constants/propertyPanelConfig'
import {
  DEFAULT_FONT_FAMILIES,
  DEFAULT_FONT_SIZES,
} from '@/features/konva-editor/constants/propertyPanelConfig'
import type {
  ArrowType,
  ImageNode,
  LineNode,
  ShapeNode,
  TextNode,
  UnifiedNode,
} from '@/types/canvas'

import { ColorInput } from './ColorInput'

import { mmToPt, ptToMm, pxToMm } from '@/utils/units'
import { cn } from '@/utils/utils'

// ========================================
// Shared Types & Context
// ========================================

export interface WidgetProps<T extends WidgetConfig = WidgetConfig> {
  config: T
  node: UnifiedNode
  onChange: (updates: Partial<UnifiedNode>) => void
  resolveText: (key: string, fallback?: string) => string
}

// ========================================
// Shared UI Components
// ========================================

import { GridContainer, WidgetInput, WidgetLabel, WidgetSelect } from './shared'

// ========================================
// Position & Size Widget
// ========================================

export const PosSizeWidget: React.FC<WidgetProps<PosSizeWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const props = config.props ?? { showX: true, showY: true, showW: true, showH: true }

  return (
    <div className="w-full grid grid-cols-2 gap-1">
      {props.showX && (
        <div className="w-full">
          <WidgetLabel>{resolveText('properties_x', 'X')}</WidgetLabel>
          <div className="flex items-center gap-1">
            <WidgetInput
              type="number"
              value={Math.round(node.x ?? 0)}
              onChange={(e) => onChange({ x: Number(e.target.value) })}
              className="w-20"
            />
            <span className="text-[12px] text-muted-foreground">mm</span>
          </div>
        </div>
      )}
      {props.showY && (
        <div className="w-full">
          <WidgetLabel>{resolveText('properties_y', 'Y')}</WidgetLabel>
          <div className="flex items-center gap-1">
            <WidgetInput
              type="number"
              value={Math.round(node.y ?? 0)}
              onChange={(e) => onChange({ y: Number(e.target.value) })}
              className="w-20"
            />
            <span className="text-[12px] text-muted-foreground">mm</span>
          </div>
        </div>
      )}
      {props.showW && (
        <div className="w-full">
          <WidgetLabel>{resolveText('properties_width', 'W')}</WidgetLabel>
          <div className="flex items-center gap-1">
            <WidgetInput
              type="number"
              min={0}
              value={Math.round(node.w ?? 0)}
              onChange={(e) => onChange({ w: Math.max(0, Number(e.target.value)) })}
              className="w-20"
            />
            <span className="text-[12px] text-muted-foreground">mm</span>
          </div>
        </div>
      )}
      {props.showH && (
        <div className="w-full">
          <WidgetLabel>{resolveText('properties_height', 'H')}</WidgetLabel>
          <div className="flex items-center gap-1">
            <WidgetInput
              type="number"
              min={0}
              value={Math.round(node.h ?? 0)}
              onChange={(e) => onChange({ h: Math.max(0, Number(e.target.value)) })}
              className="w-20"
            />
            <span className="text-[12px] text-muted-foreground">mm</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================================
// Font Widget
// ========================================

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
    onChange({ [key]: currentValue === onValue ? offValue : onValue } as Partial<TextNode>)
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
              value={String(mmToPt(textNode.fontSize ?? ptToMm(12)))}
              onChange={(e) =>
                onChange({ fontSize: ptToMm(Number(e.target.value)) } as Partial<TextNode>)
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

      {/* Color */}
      {props.showColor !== false && (
        <div>
          <WidgetLabel>{resolveText('properties_font_color', 'FontColor')}</WidgetLabel>
          <WidgetInput
            type="color"
            value={textNode.fill ?? '#000000'}
            onChange={(e) => onChange({ fill: e.target.value } as Partial<TextNode>)}
            className="h-8 p-0.5 cursor-pointer"
          />
        </div>
      )}

      {/* Font Styles (B/I/U/S) */}
      <div className="flex gap-1">
        {props.showBold !== false && (
          <button
            type="button"
            onClick={() => toggleStyle('fontWeight', textNode.fontWeight, 700, 400)}
            className={cn(
              'p-1.5 rounded border',
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
              'p-1.5 rounded border',
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
              'p-1.5 rounded border',
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
              'p-1.5 rounded border',
              textNode.lineThrough
                ? 'bg-accent text-accent-foreground border-border'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            <Strikethrough size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ========================================
// Alignment Widget
// ========================================

type AlignOption = 'l' | 'c' | 'r' | 'j'

const alignIcons: Record<AlignOption, React.FC<{ size?: number }>> = {
  l: AlignLeft,
  c: AlignCenter,
  r: AlignRight,
  j: AlignJustify,
}

export const AlignmentWidget: React.FC<WidgetProps<AlignmentWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'text') return null
  const textNode = node as TextNode
  const options = config.props?.options ?? (['l', 'c', 'r'] as AlignOption[])

  return (
    <div>
      {config.labelKey && <WidgetLabel>{resolveText(config.labelKey, 'Align')}</WidgetLabel>}
      <div className="flex bg-background rounded border border-border p-0.5">
        {options.map((opt: AlignOption) => {
          const Icon = alignIcons[opt]
          const isActive = textNode.align === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ align: opt } as Partial<TextNode>)}
              className={cn(
                'flex-1 py-1 flex justify-center rounded transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground'
              )}
            >
              <Icon size={14} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ========================================
// Vertical Alignment Widget
// ========================================

type VAlignOption = 't' | 'm' | 'b'

const vAlignIcons: Record<VAlignOption, React.FC<{ size?: number }>> = {
  t: ArrowUpToLine,
  m: AlignVerticalJustifyCenter,
  b: ArrowDownToLine,
}

export const VAlignmentWidget: React.FC<WidgetProps<VAlignmentWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'text') return null
  const textNode = node as TextNode
  const options = config.props?.options ?? (['t', 'm', 'b'] as VAlignOption[])

  return (
    <div>
      {config.labelKey && <WidgetLabel>{resolveText(config.labelKey, 'V-Align')}</WidgetLabel>}
      <div className="flex bg-background rounded border border-border p-0.5">
        {options.map((opt: VAlignOption) => {
          const Icon = vAlignIcons[opt]
          const isActive = (textNode.vAlign || 't') === opt // Default to 't' (top)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ vAlign: opt } as Partial<TextNode>)}
              className={cn(
                'flex-1 py-1 flex justify-center rounded transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground'
              )}
            >
              <Icon size={14} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ========================================
// Stroke Widget
// ========================================

export const StrokeWidget: React.FC<WidgetProps<StrokeWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const props = config.props ?? { showColor: true, showWidth: true }
  const strokeNode = node as ShapeNode | LineNode

  return (
    <div className="space-y-2">
      {props.showColor && (
        <div>
          <WidgetLabel>{resolveText('properties_stroke_color', 'Stroke Color')}</WidgetLabel>
          <ColorInput
            value={strokeNode.stroke ?? '#000000'}
            onChange={(color) => onChange({ stroke: color })}
          />
        </div>
      )}
      {props.showWidth && (
        <div>
          <WidgetLabel>
            {resolveText(config.labelKey ?? 'properties_line_width', 'Line Width')}
          </WidgetLabel>
          <WidgetInput
            type="number"
            min={0}
            max={props.maxWidth ?? 20}
            step={0.2}
            value={strokeNode.strokeW ?? 0.2}
            onChange={(e) => onChange({ strokeW: Math.max(0, Number(e.target.value)) })}
          />
        </div>
      )}
    </div>
  )
}

// ========================================
// Fill Widget
// ========================================

export const FillWidget: React.FC<WidgetProps<FillWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const fillNode = node as ShapeNode

  return (
    <div>
      <WidgetLabel>{resolveText(config.labelKey ?? 'properties_fill_color', 'Fill')}</WidgetLabel>
      <ColorInput
        value={fillNode.fill ?? '#000000'}
        onChange={(color) => onChange({ fill: color })}
      />
    </div>
  )
}

// ========================================
// Border Widget
// ========================================

export const BorderWidget: React.FC<WidgetProps<BorderWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const props = config.props ?? { showColor: true, showWidth: false }
  const shapeNode = node as ShapeNode

  return (
    <div className="space-y-2">
      {props.showColor && (
        <div>
          <WidgetLabel>
            {resolveText(config.labelKey ?? 'properties_border_color', 'BorderColor')}
          </WidgetLabel>
          <ColorInput
            value={shapeNode.stroke ?? '#000000'}
            onChange={(color) => onChange({ stroke: color })}
          />
        </div>
      )}
      {props.showWidth && (
        <div>
          <WidgetLabel>{resolveText('properties_border_width', 'Border Width')}</WidgetLabel>
          <WidgetInput
            type="number"
            min={0}
            step={0.2}
            value={shapeNode.strokeW ?? 0.2}
            onChange={(e) => onChange({ strokeW: Math.max(0, Number(e.target.value)) })}
          />
        </div>
      )}
    </div>
  )
}

// ========================================
// Color Picker Widget
// ========================================

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
          const updates: Partial<UnifiedNode> = { [fieldKey]: newColor } as unknown as Partial<UnifiedNode>
          if (fieldKey === 'borderColor') {
            const currentWidth = (node as unknown as Record<string, number>)['borderWidth']
            if (!currentWidth || currentWidth === 0) {
              (updates as unknown as Record<string, number>)['borderWidth'] = 0.1
            }
          }
          onChange(updates)
        }}
      />
    </div>
  )
}

// ========================================
// Slider Widget
// ========================================

export const SliderWidget: React.FC<WidgetProps<SliderWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const { fieldKey, min, max, step = 1, showValue } = config.props
  const value = (node as unknown as Record<string, number>)[fieldKey] ?? min

  return (
    <div>
      <WidgetLabel>
        {resolveText(config.labelKey ?? fieldKey, fieldKey)}
        {showValue && `: ${value}`}
      </WidgetLabel>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          onChange({ [fieldKey]: parseFloat(e.target.value) } as unknown as Partial<UnifiedNode>)
        }
        className="w-full accent-accent"
      />
    </div>
  )
}

// ========================================
// Text Content Widget
// ========================================

export const TextContentWidget: React.FC<WidgetProps<TextContentWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'text') return null
  const textNode = node as TextNode
  const rows = config.props?.rows ?? 3

  return (
    <div>
      <WidgetLabel>
        {resolveText(config.labelKey ?? 'properties_text_content', 'Content')}
      </WidgetLabel>
      <textarea
        value={textNode.text ?? ''}
        onChange={(e) => onChange({ text: e.target.value } as Partial<TextNode>)}
        rows={rows}
        className={cn(
          'w-full px-1.5 py-1 border border-border rounded text-[11px]',
          'bg-background text-foreground resize-y',
          'focus:outline-none focus:ring-1 focus:ring-ring'
        )}
      />
    </div>
  )
}

// ========================================
// Line Style Widget
// ========================================

type LineStyleOption = 'solid' | 'dashed' | 'dotted'

export const LineStyleWidget: React.FC<WidgetProps<LineStyleWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const lineNode = node as LineNode
  const options = config.props?.options ?? (['solid', 'dashed', 'dotted'] as LineStyleOption[])

  const getStyleFromDash = (dash?: number[]): string => {
    if (!dash || dash.length === 0) return 'solid'
    if (dash[0] !== undefined && dash[0] < 1) return 'dotted'
    return 'dashed'
  }

  const getDashFromStyle = (style: string): number[] | undefined => {
    if (style === 'dashed') return [3, 3]
    if (style === 'dotted') return [0.001, 2]
    return undefined
  }

  const currentStyle = getStyleFromDash(lineNode.dash)

  return (
    <div>
      <WidgetLabel>{resolveText(config.labelKey ?? 'properties_line_style', 'Style')}</WidgetLabel>
      <div className="flex gap-1">
        {options.map((style: LineStyleOption) => (
          <button
            key={style}
            type="button"
            onClick={() => onChange({ dash: getDashFromStyle(style) })}
            className={cn(
              'flex-1 py-1.5 px-2 rounded border text-[10px]',
              currentStyle === style
                ? 'bg-accent text-accent-foreground border-border'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {style === 'solid' && <div className="w-full h-0.5 bg-current" />}
            {style === 'dashed' && (
              <div className="w-full h-0.5 border-b-2 border-dashed border-current" />
            )}
            {style === 'dotted' && (
              <div className="w-full h-0.5 border-b-2 border-dotted border-current" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ========================================
// Label Field Widget
// ========================================

export const LabelFieldWidget: React.FC<WidgetProps<LabelFieldWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const fieldKey = config.props?.fieldKey ?? 'name'

  return (
    <div>
      <WidgetLabel>{resolveText(config.labelKey ?? 'label', 'Label')}</WidgetLabel>
      <WidgetInput
        type="text"
        value={(node as unknown as Record<string, string>)[fieldKey] ?? ''}
        onChange={(e) =>
          onChange({ [fieldKey]: e.target.value } as unknown as Partial<UnifiedNode>)
        }
        placeholder={config.props?.placeholder}
      />
    </div>
  )
}

// ========================================
// Image Widget
// ========================================

export const ImageWidget: React.FC<WidgetProps<ImageWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    if (node.t !== 'image') return
    const imageNode = node as ImageNode
    const src = imageNode.src

    if (!src) {
      setStatus('error')
      return
    }
    if (src.startsWith('data:') || src.startsWith('http')) {
      setImageSrc(src)
      setStatus('loaded')
    } else {
      // Asset lookup would go here
      setImageSrc(src)
      setStatus('loaded')
    }
  }, [node])

  if (node.t !== 'image') return null

  const maxHeight = config.props?.maxPreviewHeight ?? 120

  return (
    <div>
      {config.props?.showPreview !== false && (
        <div className="mb-2">
          {status === 'loading' && (
            <div className="w-full h-20 bg-muted border border-border rounded flex items-center justify-center text-xs text-muted-foreground">
              {resolveText('loading', 'Loading...')}
            </div>
          )}
          {status === 'error' && (
            <div className="w-full h-20 bg-muted border border-border rounded flex items-center justify-center text-xs text-red-500">
              {resolveText('no_image', 'No Image')}
            </div>
          )}
          {status === 'loaded' && imageSrc && (
            <div
              className="w-full bg-muted border border-border rounded flex items-center justify-center p-2 mb-2"
              style={{ maxHeight }}
            >
              <img
                src={imageSrc}
                alt={resolveText('properties_preview', 'Preview')}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: maxHeight - 16 }}
              />
            </div>
          )}
        </div>
      )}

      {config.props?.showUploader && (
        <div>
          <WidgetLabel>{resolveText('source', 'Source')}</WidgetLabel>
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
                      const img = new Image()
                      img.onload = () => {
                        const dpi = 96
                        const naturalW = pxToMm(img.width, { dpi })
                        const naturalH = pxToMm(img.height, { dpi })

                        onChange({
                          src: result,
                          w: naturalW,
                          h: naturalH,
                        } as Partial<ImageNode>)
                      }
                      img.src = result
                    }
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
          </label>
        </div>
      )}
    </div>
  )
}

// ========================================
// Select Widget
// ========================================

export const SelectWidget: React.FC<WidgetProps<SelectWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const { fieldKey, options } = config.props

  const labelKey =
    config.labelKey ?? (fieldKey === 'strokeW' ? 'properties_stroke_width' : fieldKey)
  const fallbackLabel = fieldKey === 'strokeW' ? 'StrokeWidth' : fieldKey

  // Handle nested field keys like 'data.orientation'
  const getValue = (): string => {
    const keys = fieldKey.split('.')
    let value: unknown = node
    for (const key of keys) {
      value = (value as Record<string, unknown>)?.[key]
    }
    return (value as string) ?? options[0]?.value ?? ''
  }

  const setValue = (newValue: string) => {
    const keys = fieldKey.split('.')
    if (keys.length === 1) {
      onChange({ [fieldKey]: newValue } as unknown as Partial<UnifiedNode>)
    } else {
      // Handle nested updates
      const rootKey = keys[0]
      const existingData = (node as unknown as Record<string, unknown>)[rootKey] ?? {}
      const nestedKey = keys.slice(1).join('.')
      onChange({
        [rootKey]: { ...(existingData as object), [nestedKey]: newValue },
      } as unknown as Partial<UnifiedNode>)
    }
  }

  return (
    <div>
      <WidgetLabel>{resolveText(labelKey, fallbackLabel)}</WidgetLabel>
      <WidgetSelect value={getValue()} onChange={(e) => setValue(e.target.value)}>
        {options.map((opt: { value: string; labelKey: string }) => (
          <option key={opt.value} value={opt.value}>
            {resolveText(opt.labelKey, opt.value)}
          </option>
        ))}
      </WidgetSelect>
    </div>
  )
}

// ========================================
// Widget Renderer (Factory)
// ========================================

// ========================================
// Polygon Widget
// ========================================

export const PolygonWidget: React.FC<WidgetProps<PolygonWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'shape') return null
  const shapeNode = node as ShapeNode
  const points = shapeNode.sides ?? 5
  const { min = 3, max = 12, step = 1 } = config.props || {}

  return (
    <div>
      <WidgetLabel>
        {resolveText(config.labelKey ?? 'properties_sides', 'Sides')}: {points}
      </WidgetLabel>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={points}
        onChange={(e) => onChange({ sides: parseInt(e.target.value, 10) } as Partial<ShapeNode>)}
        className="w-full accent-accent"
      />
    </div>
  )
}

// ========================================
// Data Binding Widget (Placeholder)
// ========================================

export const DataBindingWidget: React.FC<WidgetProps<DataBindingWidgetConfig>> = ({
  config,
  resolveText,
}) => {
  // Placeholder implementation
  return (
    <div className="text-xs text-muted-foreground italic">
      {config.props?.mode === 'repeater'
        ? resolveText('data_binding_repeater', 'Repeater Binding')
        : resolveText('data_binding_field', 'Field Binding')}{' '}
      {resolveText('wip', '(WIP)')}
    </div>
  )
}

// ========================================
// Arrowhead Widget
// ========================================

export const ArrowheadWidget: React.FC<WidgetProps<ArrowheadWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'line') return null
  const lineNode = node as LineNode

  // arrows = [start, end]
  const position = config.props?.position ?? 'end'
  const index = position === 'start' ? 0 : 1
  const currentArrow = lineNode.arrows?.[index] ?? 'none'

  const options: ArrowType[] = ['none', 'arrow', 'circle', 'diamond']

  const handleSelect = (arrowType: ArrowType) => {
    // Ensure arrows array exists and clone it
    const currentArrows = lineNode.arrows ?? ['none', 'none']
    const newArrows: [ArrowType, ArrowType] = [...currentArrows] as [ArrowType, ArrowType]
    newArrows[index] = arrowType
    onChange({ arrows: newArrows } as Partial<LineNode>)
  }

  return (
    <div>
      <WidgetLabel>
        {resolveText(
          config.labelKey ?? `arrow_${position}`,
          position === 'start' ? 'Start Arrow' : 'End Arrow'
        )}
      </WidgetLabel>
      <div className="flex bg-muted rounded p-0.5 border border-border">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className={cn(
              'flex-1 py-1.5 flex items-center justify-center rounded transition-colors',
              currentArrow === opt
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-accent text-muted-foreground'
            )}
            title={
              opt === 'none'
                ? resolveText('none', 'None')
                : opt === 'arrow'
                  ? resolveText('properties_arrow_standard', 'Standard')
                  : opt === 'circle'
                    ? resolveText('properties_arrow_circle', 'Circle')
                    : resolveText('properties_arrow_diamond', 'Diamond')
            }
          >
            {opt === 'none' && <Minus size={14} />}
            {opt === 'arrow' &&
              (position === 'start' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />)}
            {opt === 'circle' && <Circle size={12} />}
            {opt === 'diamond' && <Diamond size={12} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ========================================
// Number Input Widget
// ========================================

export const NumberInputWidget: React.FC<WidgetProps<NumberInputWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const { fieldKey, min, max, step = 1, unit } = config.props
  const value = (node as unknown as Record<string, number>)[fieldKey] ?? 0

  return (
    <div>
      <WidgetLabel>{resolveText(config.labelKey ?? fieldKey, fieldKey)}</WidgetLabel>
      <div className="flex items-center gap-1">
        <WidgetInput
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) =>
            onChange({ [fieldKey]: parseFloat(e.target.value) } as unknown as Partial<UnifiedNode>)
          }
        />
        {unit && <span className="text-[12px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

// ========================================
// Widget Renderer (Factory)
// ========================================

export const renderWidget = (
  config: WidgetConfig,
  node: UnifiedNode,
  onChange: (updates: Partial<UnifiedNode>) => void,
  resolveText: (key: string, fallback?: string) => string,
  customRenderers?: Record<string, React.FC<WidgetProps>>
) => {
  const commonProps = { node, onChange, resolveText }

  switch (config.type) {
    case 'posSize':
      return <PosSizeWidget {...commonProps} config={config} />
    case 'font':
      return <FontWidget {...commonProps} config={config} />
    case 'alignment':
      return <AlignmentWidget {...commonProps} config={config} />
    case 'vAlignment':
      return <VAlignmentWidget {...commonProps} config={config} />
    case 'stroke':
      return <StrokeWidget {...commonProps} config={config} />
    case 'fill':
      return <FillWidget {...commonProps} config={config} />
    case 'border':
      return <BorderWidget {...commonProps} config={config} />
    case 'polygon':
      return <PolygonWidget {...commonProps} config={config} />
    case 'image':
      return <ImageWidget {...commonProps} config={config} />
    case 'select':
      return <SelectWidget {...commonProps} config={config} />
    case 'colorPicker':
      return <ColorPickerWidget {...commonProps} config={config} />
    case 'slider':
      return <SliderWidget {...commonProps} config={config} />
    case 'textContent':
      return <TextContentWidget {...commonProps} config={config} />
    case 'lineStyle':
      return <LineStyleWidget {...commonProps} config={config} />
    case 'arrowhead':
      return <ArrowheadWidget {...commonProps} config={config} />
    case 'labelField':
      return <LabelFieldWidget {...commonProps} config={config} />
    case 'hiddenField':
      return null
    case 'dataBinding':
      return <DataBindingWidget {...commonProps} config={config} />
    case 'numberInput':
      return <NumberInputWidget {...commonProps} config={config} />
    case 'custom':
      if (customRenderers?.[config.props.renderKey]) {
        const CustomComponent = customRenderers[config.props.renderKey]
        return <CustomComponent {...commonProps} config={config} />
      }
      return null
    default:
      return (
        <div className="text-xs text-red-500">
          Unknown widget type: {(config as { type?: string }).type}
        </div>
      )
  }
}
