import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../../components/ui/Select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../../../components/ui/Tooltip'
import type { IDataSchema } from '../../../../../../types/schema'
import { cn } from '../../../../../../utils/utils'
import { createContextLogger } from '../../../../../../utils/logger'
import type {
  Element,
  IBinding,
  IImageElement,
  ILineElement,
  IShapeElement,
  ISignatureElement,
  ITableElement,
  ITemplateDoc,
  ITextElement,
} from '../../types/wysiwyg'
import { measureText } from '../../utils/textUtils'
import { findImageWithExtension } from '../WysiwygCanvas/canvasImageUtils'
import { BindingSelector } from './BindingSelector'
import { DataBindingModal } from './DataBindingModal'
import { type ShapeOption, ShapeSelector } from './ShapeSelector'
import { TableProperties } from './TableProperties'

const log = createContextLogger('WysiwygPropertiesPanel')

export interface WysiwygPropertiesPanelProps {
  templateDoc: ITemplateDoc
  selectedElementId: string | null
  selectedCell?: { elementId: string; row: number; col: number } | null
  onTemplateChange: (newDoc: ITemplateDoc) => void
  currentPageId: string
  schema?: IDataSchema
  i18nOverrides?: Record<string, string>
}

// --- Local UI Components matching Root Design System (Dense Variant) ---

const PropertiesLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className,
  ...props
}) => (
  <label
    className={cn(
      'block text-sm font-medium text-theme-text-primary mb-1.5', // text-sm (14px) matches Root Label
      className
    )}
    {...props}
  />
)

const PropertiesInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-md border border-theme-border bg-theme-bg-primary px-3 py-1 text-sm shadow-sm transition-colors',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
))
PropertiesInput.displayName = 'PropertiesInput'

const PropertiesSectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-sm font-semibold text-theme-text-primary mb-3 border-b border-theme-border pb-2">
    {children}
  </h4>
)

const PropertiesSubsectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h5 className="text-xs font-medium text-theme-text-secondary mb-2 uppercase tracking-wide">
    {children}
  </h5>
)

const sectionCardClass = 'mb-6'

const ImagePreview: React.FC<{
  assetId: string
  i18nOverrides?: Record<string, string>
}> = ({ assetId, i18nOverrides }) => {
  const { t } = useTranslation()
  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const [src, setSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    let active = true
    setStatus('loading')

    // Check if it's a data URL
    if (assetId.startsWith('data:')) {
      setSrc(assetId)
      setStatus('loaded')
      return
    }

    findImageWithExtension(assetId)
      .then((res) => {
        if (active) {
          if (res) {
            setSrc(res.url)
            setStatus('loaded')
          } else {
            setStatus('error')
          }
        }
      })
      .catch(() => {
        if (active) setStatus('error')
      })

    return () => {
      active = false
    }
  }, [assetId])

  if (status === 'loading') {
    return (
      <div className="w-full h-20 bg-theme-bg-tertiary border border-theme-border rounded flex items-center justify-center text-xs text-theme-text-secondary">
        {resolveText('loading', 'Loading...')}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="w-full h-20 bg-theme-bg-tertiary border border-theme-border rounded flex items-center justify-center text-xs text-red-500">
        {resolveText('no_image', 'No Image')}
      </div>
    )
  }

  return (
    <img
      src={src!}
      alt="Preview"
      className="max-w-full h-auto border border-theme-border rounded"
    />
  )
}

export const WysiwygPropertiesPanel: React.FC<WysiwygPropertiesPanelProps> = ({
  templateDoc,
  selectedElementId,
  selectedCell,
  onTemplateChange,
  currentPageId,
  schema,
  i18nOverrides,
}) => {
  const { t } = useTranslation()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const [activeBindingMode, setActiveBindingMode] = React.useState<'field' | 'repeater' | null>(
    null
  )

  // Helper to open modal
  const openBindingModal = (mode: 'field' | 'repeater') => {
    setActiveBindingMode(mode)
  }

  const handleBindingSelect = (newBinding: IBinding) => {
    if (!selectedElement) return
    updateElement({ binding: newBinding })
    setActiveBindingMode(null)
  }

  const selectedElement: Element | undefined = React.useMemo(() => {
    return templateDoc.elements.find((el) => el.id === selectedElementId)
  }, [templateDoc.elements, selectedElementId])

  const targetPageIndex = currentPageId
    ? templateDoc.pages.findIndex((p) => p.id === currentPageId)
    : 0

  const renderPageBackgroundSection = () => {
    const page = templateDoc.pages[targetPageIndex] ?? templateDoc.pages[0]
    if (!page) return null
    const bg = page.background ?? {}

    const updatePageBackground = (updates: Partial<NonNullable<typeof page.background>>) => {
      const nextPages = templateDoc.pages.map((p, index) => {
        if (index !== targetPageIndex) return p
        return {
          ...p,
          background: {
            ...(p.background ?? {}),
            ...updates,
          },
        }
      })

      onTemplateChange({
        ...templateDoc,
        pages: nextPages,
      })
    }

    return (
      <div className={sectionCardClass}>
        <PropertiesSectionTitle>
          {resolveText('properties_page_background', 'Page Background')}
        </PropertiesSectionTitle>
        <div className="mb-2">
          <PropertiesLabel htmlFor="page-bg-color">
            {resolveText('properties_background_color', 'Background Color')}
          </PropertiesLabel>
          <div className="flex items-center gap-2">
            <PropertiesInput
              id="page-bg-color"
              type="color"
              value={bg.color ?? '#ffffff'}
              onChange={(e) => updatePageBackground({ color: e.target.value })}
              className="h-9 w-full p-1 cursor-pointer"
            />
          </div>
        </div>
        <div>
          <PropertiesLabel>
            {resolveText('properties_background_image', 'Background Image')}
          </PropertiesLabel>
          <PropertiesInput
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string
                if (dataUrl) {
                  updatePageBackground({ imageId: dataUrl })
                }
              }
              reader.readAsDataURL(file)
            }}
            className="text-theme-text-primary file:text-theme-object-primary file:bg-theme-object-primary/10 hover:file:bg-theme-object-primary/20"
          />
          {bg.imageId && (
            <div className="mt-2">
              <PropertiesLabel>{resolveText('properties_preview', 'Preview')}</PropertiesLabel>
              <ImagePreview assetId={bg.imageId} i18nOverrides={i18nOverrides} />
              <button
                onClick={() => updatePageBackground({ imageId: undefined })}
                className="mt-1 text-xs text-red-500 hover:underline"
              >
                {resolveText('delete', 'Delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 要素未選択時はページ背景プロパティのみ表示
  if (!selectedElement) {
    return (
      <div className="w-72 bg-theme-bg-secondary border-l border-theme-border p-5 overflow-y-auto text-theme-text-primary">
        {renderPageBackgroundSection()}
      </div>
    )
  }

  const updateElement = (updates: Partial<Element>) => {
    if (!selectedElement) return
    log.debug('Updating element', { id: selectedElement.id, updates })

    let finalUpdates = updates
    if (selectedElement.type === 'Text' && 'font' in updates) {
      const textEl = selectedElement as ITextElement
      const newFont = {
        ...textEl.font,
        ...(updates as Partial<ITextElement>).font,
      }
      const { width, height } = measureText(textEl.text, newFont)
      finalUpdates = {
        ...updates,
        box: {
          ...textEl.box,
          width: width + 10,
          height: height + 4,
        },
      }
    }

    const nextDoc: ITemplateDoc = {
      ...templateDoc,
      elements: templateDoc.elements.map((el) =>
        el.id === selectedElement.id ? ({ ...el, ...finalUpdates } as Element) : el
      ),
    }
    onTemplateChange(nextDoc)
  }

  const updateBox = (boxUpdates: Partial<ITextElement['box']>) => {
    if (!('box' in selectedElement)) return
    const current = (selectedElement as ITextElement | IShapeElement | IImageElement).box
    updateElement({
      box: {
        ...current,
        ...boxUpdates,
      },
    } as Partial<ITextElement>)
  }

  const buildId = (suffix: string) => `${selectedElement.id}-${suffix}`

  const typeLabelMap: Record<Element['type'], string> = {
    Group: resolveText('properties_element_group', 'Group'),
    Text: resolveText('properties_element_text', 'Text'),
    Rect: resolveText('properties_element_rect', 'Rectangle'),
    Triangle: resolveText('properties_element_triangle', 'Triangle'),
    Trapezoid: resolveText('properties_element_trapezoid', 'Trapezoid'),
    Circle: resolveText('properties_element_circle', 'Circle'),
    Diamond: resolveText('properties_element_diamond', 'Diamond'),
    Cylinder: resolveText('properties_element_cylinder', 'Cylinder'),
    Heart: resolveText('properties_element_heart', 'Heart'),
    Star: resolveText('properties_element_star', 'Star'),
    Pentagon: resolveText('properties_element_pentagon', 'Pentagon'),
    Hexagon: resolveText('properties_element_hexagon', 'Hexagon'),
    ArrowUp: resolveText('properties_element_arrow_up', 'Arrow Up'),
    ArrowDown: resolveText('properties_element_arrow_down', 'Arrow Down'),
    ArrowLeft: resolveText('properties_element_arrow_left', 'Arrow Left'),
    ArrowRight: resolveText('properties_element_arrow_right', 'Arrow Right'),
    Tree: resolveText('properties_element_tree', 'Tree'),
    House: resolveText('properties_element_house', 'House'),
    Line: resolveText('properties_element_line', 'Line'),
    Image: resolveText('properties_element_image', 'Image'),
    Table: resolveText('properties_element_table', 'Table'),
    Bed: resolveText('toolbar_bed', 'Bed'),
    Chart: 'Chart',
    Signature: resolveText('toolbar_signature', 'Signature'),
  }

  const renderSignatureProps = () => {
    if (selectedElement.type !== 'Signature') return null
    const signature = selectedElement as ISignatureElement

    return (
      <div className="mb-4 space-y-3">
        {/* Stroke Color */}
        <div>
          <PropertiesLabel htmlFor={buildId('stroke-color')}>
            {resolveText('properties_stroke_color', 'Stroke Color')}
          </PropertiesLabel>
          <PropertiesInput
            id={buildId('stroke-color')}
            type="color"
            value={signature.stroke ?? '#000000'}
            onChange={(e) =>
              updateElement({
                stroke: e.target.value,
              } as Partial<ISignatureElement>)
            }
            className="h-9 p-1 cursor-pointer"
          />
        </div>

        {/* Stroke Width */}
        <div>
          <PropertiesLabel htmlFor={buildId('stroke-width')}>
            {resolveText('properties_stroke_width', 'Thickness')} (px)
          </PropertiesLabel>
          <PropertiesInput
            id={buildId('stroke-width')}
            type="number"
            min="1"
            value={signature.strokeWidth ?? 2}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (val > 0) {
                updateElement({
                  strokeWidth: val,
                } as Partial<ISignatureElement>)
              }
            }}
          />
        </div>
      </div>
    )
  }

  const renderBindingProps = () => {
    // Only show for Text, Table(repeater)
    const validTypes = ['Text']
    const element = selectedElement
    const isGlobalTable = element.type === 'Table' && !selectedCell

    if (!validTypes.includes(element.type) && !isGlobalTable) return null

    const label = resolveText('data_binding', 'Data Binding')
    const mode = element.type === 'Table' ? 'repeater' : 'field'

    return (
      <BindingSelector
        label={label}
        binding={element.binding}
        onUpdate={(binding) => updateElement({ binding })}
        onOpenModal={() => openBindingModal(mode)}
        i18nOverrides={i18nOverrides}
      />
    )
  }

  const renderTextProps = () => {
    if (selectedElement.type !== 'Text') return null
    const textEl = selectedElement as ITextElement

    // Standard font sizes like Word
    const fontSizes = [
      8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72,
      80, 88, 96,
    ]

    return (
      <div className="mb-6 space-y-5">
        {/* Font & Color */}
        {/* Font & Color */}
        <div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <PropertiesLabel htmlFor={buildId('font-size')}>
                {resolveText('properties_size', 'Size')}
              </PropertiesLabel>
              <Select
                value={String(textEl.font.size)}
                onValueChange={(val) =>
                  updateElement({
                    font: { ...textEl.font, size: Number(val) },
                  } as Partial<ITextElement>)
                }
              >
                <SelectTrigger className="h-9 w-full rounded-md border border-theme-border bg-theme-bg-primary px-3 py-1 text-sm shadow-sm">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {fontSizes.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <PropertiesLabel htmlFor={buildId('font-color')}>
                {resolveText('color', 'Color')}
              </PropertiesLabel>
              <PropertiesInput
                id={buildId('font-color')}
                type="color"
                value={textEl.color}
                onChange={(e) =>
                  updateElement({
                    color: e.target.value,
                  } as Partial<ITextElement>)
                }
                className="h-9 p-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Font Styles */}
        <div className="flex gap-1 mb-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    updateElement({
                      font: { ...textEl.font, weight: textEl.font.weight === 700 ? 400 : 700 },
                    } as Partial<ITextElement>)
                  }
                  className={`p-1 rounded border ${textEl.font.weight === 700
                    ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                    : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                    }`}
                >
                  <Bold size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{resolveText('properties_font_style_bold', 'Bold')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    updateElement({
                      font: { ...textEl.font, italic: !textEl.font.italic },
                    } as Partial<ITextElement>)
                  }
                  className={`p-1 rounded border ${textEl.font.italic
                    ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                    : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                    }`}
                >
                  <Italic size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{resolveText('properties_font_style_italic', 'Italic')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    updateElement({
                      font: { ...textEl.font, underline: !textEl.font.underline },
                    } as Partial<ITextElement>)
                  }
                  className={`p-1 rounded border ${textEl.font.underline
                    ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                    : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                    }`}
                >
                  <Underline size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{resolveText('properties_font_style_underline', 'Underline')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    updateElement({
                      font: { ...textEl.font, strikethrough: !textEl.font.strikethrough },
                    } as Partial<ITextElement>)
                  }
                  className={`p-1 rounded border ${textEl.font.strikethrough
                    ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                    : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                    }`}
                >
                  <Strikethrough size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{resolveText('properties_font_style_strikethrough', 'Strikethrough')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Alignment */}
        <div>
          <PropertiesLabel>{resolveText('properties_align', 'Alignment')}</PropertiesLabel>
          <div className="flex bg-theme-bg-primary rounded border border-theme-border p-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateElement({ align: 'left' } as Partial<ITextElement>)}
                    className={`flex-1 flex items-center justify-center py-1 rounded ${textEl.align === 'left'
                      ? 'bg-theme-bg-tertiary text-theme-accent'
                      : 'text-theme-text-secondary hover:bg-theme-bg-secondary'
                      }`}
                  >
                    <AlignLeft size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{resolveText('side_left', 'Left')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateElement({ align: 'center' } as Partial<ITextElement>)}
                    className={`flex-1 flex items-center justify-center py-1 rounded ${textEl.align === 'center'
                      ? 'bg-theme-bg-tertiary text-theme-accent'
                      : 'text-theme-text-secondary hover:bg-theme-bg-secondary'
                      }`}
                  >
                    <AlignCenter size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{resolveText('center', 'Center')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateElement({ align: 'right' } as Partial<ITextElement>)}
                    className={`flex-1 flex items-center justify-center py-1 rounded ${textEl.align === 'right'
                      ? 'bg-theme-bg-tertiary text-theme-accent'
                      : 'text-theme-text-secondary hover:bg-theme-bg-secondary'
                      }`}
                  >
                    <AlignRight size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{resolveText('side_right', 'Right')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    )
  }

  const renderShapeProps = () => {
    if (
      ![
        'Rect',
        'Circle',
        'Triangle',
        'Trapezoid',
        'Diamond',
        'Cylinder',
        'Heart',
        'Star',
        'Pentagon',
        'Hexagon',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Tree',
        'House',
      ].includes(selectedElement.type)
    )
      return null
    const shape = selectedElement as IShapeElement

    return (
      <div className="mb-6 space-y-4">
        {/* Colors */}
        <div>
          <PropertiesSubsectionTitle>{resolveText('color', 'Color')}</PropertiesSubsectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PropertiesLabel htmlFor={buildId('fill-color')}>
                {resolveText('properties_fill_color', 'Fill Color')}
              </PropertiesLabel>
              <PropertiesInput
                id={buildId('fill-color')}
                type="color"
                value={shape.fill?.color ?? '#ffffff'}
                onChange={(e) =>
                  updateElement({
                    fill: { ...(shape.fill ?? { color: '#ffffff' }), color: e.target.value },
                  } as Partial<IShapeElement>)
                }
                className="h-9 p-1 cursor-pointer"
              />
            </div>
            <div>
              <PropertiesLabel htmlFor={buildId('stroke-color')}>
                {resolveText('properties_border', 'Border')}
              </PropertiesLabel>
              <PropertiesInput
                id={buildId('stroke-color')}
                type="color"
                value={shape.stroke?.color ?? '#000000'}
                onChange={(e) =>
                  updateElement({
                    stroke: {
                      ...(shape.stroke ?? { color: '#000000', width: 1 }),
                      color: e.target.value,
                    },
                  } as Partial<IShapeElement>)
                }
                className="h-9 p-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Stroke width */}
        <div>
          <PropertiesSubsectionTitle>{resolveText('properties_border', 'Border')}</PropertiesSubsectionTitle>
          <PropertiesLabel htmlFor={buildId('stroke-width')}>
            {resolveText('properties_line_width', 'Line Width')}
          </PropertiesLabel>
          <PropertiesInput
            id={buildId('stroke-width')}
            type="number"
            value={shape.stroke?.width ?? 1}
            onChange={(e) =>
              updateElement({
                stroke: {
                  ...(shape.stroke ?? { color: '#000000', width: 1 }),
                  width: Number(e.target.value),
                },
              } as Partial<IShapeElement>)
            }
          />
        </div>
      </div>
    )
  }

  const renderLineProps = () => {
    if (selectedElement.type !== 'Line') return null
    const line = selectedElement as ILineElement

    const arrowOptions: ShapeOption[] = [
      {
        value: 'none',
        label: resolveText('properties_arrow_none', 'None'),
        icon: <div className="w-4 h-0.5 bg-current" />,
      },
      {
        value: 'standard',
        label: resolveText('properties_arrow_standard', 'Standard'),
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <title>{resolveText('properties_arrow_standard', 'Standard')}</title>
            <path d="M12 8H2m0 0l4-4m-4 4l4 4" />
          </svg>
        ),
      },
      {
        value: 'filled',
        label: resolveText('properties_arrow_filled', 'Filled'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{resolveText('properties_arrow_filled', 'Filled')}</title>
            <path d="M2 8l6-4v8z" />
            <path d="M8 8h6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        value: 'triangle',
        label: resolveText('properties_arrow_triangle', 'Triangle'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{resolveText('properties_arrow_triangle', 'Triangle')}</title>
            <path d="M2 8l6-4v8z" />
            <path d="M8 8h6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        value: 'open',
        label: resolveText('properties_arrow_open', 'Open'),
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <title>{resolveText('properties_arrow_open', 'Open')}</title>
            <path d="M6 4l-4 4 4 4" />
            <path d="M2 8h10" />
          </svg>
        ),
      },
      {
        value: 'circle',
        label: resolveText('properties_arrow_circle', 'Circle'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{resolveText('properties_arrow_circle', 'Circle')}</title>
            <circle cx="4" cy="8" r="3" />
            <path d="M7 8h7" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        value: 'diamond',
        label: resolveText('properties_arrow_diamond', 'Diamond'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{resolveText('properties_arrow_diamond', 'Diamond')}</title>
            <path d="M2 8l3-3 3 3-3 3z" />
            <path d="M8 8h6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        value: 'square',
        label: resolveText('properties_arrow_square', 'Square'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{resolveText('properties_arrow_square', 'Square')}</title>
            <rect x="2" y="5" width="6" height="6" />
            <path d="M8 8h6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
    ]

    const lineStyleOptions: ShapeOption[] = [
      {
        value: 'solid',
        label: resolveText('properties_line_style_solid', 'Solid'),
        icon: (
          <svg
            width="24"
            height="8"
            viewBox="0 0 24 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <title>{resolveText('properties_line_style_solid', 'Solid')}</title>
            <line x1="0" y1="4" x2="24" y2="4" />
          </svg>
        ),
      },
      {
        value: 'dashed',
        label: resolveText('properties_line_style_dashed', 'Dashed'),
        icon: (
          <svg
            width="24"
            height="8"
            viewBox="0 0 24 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <title>{resolveText('properties_line_style_dashed', 'Dashed')}</title>
            <line x1="0" y1="4" x2="24" y2="4" strokeDasharray="6 4" />
          </svg>
        ),
      },
      {
        value: 'dotted',
        label: resolveText('properties_line_style_dotted', 'Dotted'),
        icon: (
          <svg
            width="24"
            height="8"
            viewBox="0 0 24 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <title>{resolveText('properties_line_style_dotted', 'Dotted')}</title>
            <line x1="0" y1="4" x2="24" y2="4" strokeDasharray="2 4" />
          </svg>
        ),
      },
    ]

    const getLineStyleValue = (dash?: number[]) => {
      if (!dash || dash.length === 0) return 'solid'
      if (dash[0] !== undefined && dash[0] < 1) return 'dotted' // Ratio < 1 means dot (usually 0 or 0.001)
      return 'dashed'
    }

    const handleLineStyleChange = (val: string) => {
      let dash: number[] | undefined
      if (val === 'dashed')
        dash = [3, 3] // Ratio: 3x width dash, 3x width gap
      else if (val === 'dotted') dash = [0.001, 2] // Ratio: Dot, 2x width gap

      updateElement({
        stroke: { ...line.stroke, dash },
      } as Partial<ILineElement>)
    }

    return (
      <div className="mb-4 space-y-3">
        {/* Line Color */}
        <div>
          <PropertiesLabel htmlFor={buildId('line-color')}>
            {resolveText('properties_line_color', 'Line Color')}
          </PropertiesLabel>
          <PropertiesInput
            id={buildId('line-color')}
            type="color"
            value={line.stroke.color}
            onChange={(e) =>
              updateElement({
                stroke: { ...line.stroke, color: e.target.value },
              } as Partial<ILineElement>)
            }
            className="h-9 p-1 cursor-pointer"
          />
        </div>

        {/* Line Width */}
        <div>
          <PropertiesLabel htmlFor={buildId('line-width')}>
            {resolveText('properties_line_width', 'Line Width')} (px)
          </PropertiesLabel>
          <PropertiesInput
            id={buildId('line-width')}
            type="number"
            min="1"
            value={line.stroke.width}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (val > 0) {
                updateElement({
                  stroke: { ...line.stroke, width: val },
                } as Partial<ILineElement>)
              }
            }}
          />
        </div>

        {/* Line Style */}
        <div>
          <PropertiesLabel>{resolveText('properties_line_style', 'Line Style')}</PropertiesLabel>
          <ShapeSelector
            value={getLineStyleValue(line.stroke.dash)}
            onChange={handleLineStyleChange}
            options={lineStyleOptions}
          />
        </div>

        {/* Start Arrow */}
        <div>
          <PropertiesLabel htmlFor={buildId('start-arrow')}>
            {resolveText('properties_arrow_start', 'Start Arrow')}
          </PropertiesLabel>
          <ShapeSelector
            value={line.startArrow || 'none'}
            onChange={(val) =>
              updateElement({
                startArrow: val,
              } as Partial<ILineElement>)
            }
            options={arrowOptions}
          />
        </div>

        {/* End Arrow */}
        <div>
          <PropertiesLabel htmlFor={buildId('end-arrow')}>
            {resolveText('properties_arrow_end', 'End Arrow')}
          </PropertiesLabel>
          <ShapeSelector
            value={line.endArrow || 'none'}
            onChange={(val) =>
              updateElement({
                endArrow: val,
              } as Partial<ILineElement>)
            }
            options={arrowOptions.map((opt) => ({
              ...opt,
              icon: <div className="transform rotate-180">{opt.icon}</div>,
            }))}
          />
        </div>
      </div>
    )
  }

  const renderLayoutSection = () => {
    if (!('box' in selectedElement)) return null
    const box = (selectedElement as ITextElement | IShapeElement | IImageElement).box

    return (
      <div className={sectionCardClass}>
        <PropertiesSectionTitle>{resolveText('properties_layout', 'Layout')}</PropertiesSectionTitle>

        {/* Position */}
        <div className="mb-4">
          <PropertiesSubsectionTitle>{resolveText('position', 'Position')}</PropertiesSubsectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PropertiesLabel htmlFor={buildId('position-x')}>X</PropertiesLabel>
              <PropertiesInput
                id={buildId('position-x')}
                type="number"
                step="0.01"
                value={box.x.toFixed(2)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isNaN(v)) return
                  updateBox({ x: Math.floor(v * 100) / 100 })
                }}
              />
            </div>
            <div>
              <PropertiesLabel htmlFor={buildId('position-y')}>Y</PropertiesLabel>
              <PropertiesInput
                id={buildId('position-y')}
                type="number"
                step="0.01"
                value={box.y.toFixed(2)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isNaN(v)) return
                  updateBox({ y: Math.floor(v * 100) / 100 })
                }}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <PropertiesSubsectionTitle>{resolveText('properties_size', 'Size')}</PropertiesSubsectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PropertiesLabel htmlFor={buildId('size-width')}>
                {resolveText('properties_width', 'Width')}
              </PropertiesLabel>
              <PropertiesInput
                id={buildId('size-width')}
                type="number"
                step="0.01"
                value={box.width.toFixed(2)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isNaN(v)) return
                  updateBox({ width: Math.floor(v * 100) / 100 })
                }}
              />
            </div>
            <div>
              <PropertiesLabel htmlFor={buildId('size-height')}>
                {resolveText('properties_height', 'Height')}
              </PropertiesLabel>
              <PropertiesInput
                id={buildId('size-height')}
                type="number"
                step="0.01"
                value={box.height.toFixed(2)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isNaN(v)) return
                  updateBox({ height: Math.floor(v * 100) / 100 })
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderImageProps = () => {
    if (selectedElement.type !== 'Image') return null
    const image = selectedElement as IImageElement

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      log.info('File selected:', { name: file.name, size: file.size })

      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        if (dataUrl) {
          const img = new Image()
          img.onload = () => {
            log.info('Data URL generated', {
              length: dataUrl.length,
              width: img.naturalWidth,
              height: img.naturalHeight,
            })
            updateElement({
              assetId: dataUrl,
              box: {
                ...image.box,
                width: img.naturalWidth,
                height: img.naturalHeight,
              },
            } as Partial<IImageElement>)
          }
          img.src = dataUrl
        } else {
          log.error('Failed to generate Data URL')
        }
      }
      reader.readAsDataURL(file)
    }

    return (
      <div className="mb-6 space-y-4">
        <div>
          <PropertiesLabel>
            {resolveText('properties_select_image', 'Select Image')}
          </PropertiesLabel>
          <PropertiesInput
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-theme-text-primary file:text-theme-object-primary file:bg-theme-object-primary/10 hover:file:bg-theme-object-primary/20"
          />
        </div>
        {image.assetId && (
          <div className="mt-2">
            <PropertiesLabel>{resolveText('properties_preview', 'Preview')}</PropertiesLabel>
            <ImagePreview assetId={image.assetId} i18nOverrides={i18nOverrides} />
          </div>
        )}
      </div>
    )
  }

  const renderTableProps = () => {
    if (selectedElement.type !== 'Table') return null
    return (
      <TableProperties
        element={selectedElement as ITableElement}
        onUpdate={updateElement as (updates: Partial<ITableElement>) => void}
        selectedCell={
          selectedCell && selectedCell.elementId === selectedElement.id ? selectedCell : null
        }
        i18nOverrides={i18nOverrides}
      />
    )
  }

  return (
    <div className="relative w-72 h-full bg-theme-bg-secondary border-l border-theme-border p-5 overflow-y-auto overflow-x-hidden text-theme-text-primary">
      {/* Type badge - floating top-right */}
      <div className="absolute top-1.5 right-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-theme-object-primary/20 text-theme-text-primary shadow-sm">
          {typeLabelMap[selectedElement.type] ?? selectedElement.type}
        </span>
      </div>

      {renderBindingProps()}
      {renderTextProps()}
      {renderShapeProps()}
      {renderLineProps()}
      {renderImageProps()}
      {renderTableProps()}
      {renderSignatureProps()}

      {renderLayoutSection()}
      {/* Modal */}
      {schema && (
        <DataBindingModal
          isOpen={!!activeBindingMode}
          onClose={() => setActiveBindingMode(null)}
          schema={schema}
          onSelect={handleBindingSelect}
          mode={activeBindingMode || 'field'}
        />
      )}
    </div>
  )
}



