import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EditableSelect } from '../../../../components/ui/EditableSelect'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/Tooltip'
import {
  type ShapeOption,
  ShapeSelector,
} from '../../report-editor/pdf-editor/components/PropertiesPanel/ShapeSelector'
import { findImageWithExtension } from '../../report-editor/pdf-editor/components/WysiwygCanvas/canvasImageUtils'
import { measureText } from '../../report-editor/pdf-editor/utils/textUtils'
import type {
  BedLayoutDocument,
  BedLayoutElement,
  IBedElement,
  IImageElement,
  ILineElement,
  IShapeElement,
  ITextElement,
} from '../../types'

interface PropertyPanelProps {
  selectedElement: BedLayoutElement | null
  onChange: (id: string, newAttrs: Partial<BedLayoutElement>) => void
  onDelete: (id: string) => void
  document?: BedLayoutDocument
  onDocumentChange?: (newDoc: BedLayoutDocument) => void
}

const labelClass = 'block text-[11px] text-theme-text-secondary mb-0.5'
const headingClass = 'text-[11px] font-medium text-theme-text-secondary mb-1.5'
const inputClass =
  'w-full px-1.5 py-1 border border-theme-border rounded text-[11px] bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent'
const sectionCardClass = 'mb-2.5 p-2.5 bg-theme-bg-tertiary rounded border border-theme-border'

const ImagePreview: React.FC<{ assetId: string }> = ({ assetId }) => {
  const { t } = useTranslation()
  const [src, setSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    let active = true
    setStatus('loading')

    if (assetId.startsWith('data:') || assetId.startsWith('http')) {
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
        {t('loading')}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="w-full h-20 bg-theme-bg-tertiary border border-theme-border rounded flex items-center justify-center text-xs text-red-500">
        {t('no_image')}
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

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedElement,
  onChange,
  document,
  onDocumentChange,
}) => {
  const { t } = useTranslation()

  if (!selectedElement) {
    if (!document || !onDocumentChange) return null

    return (
      <div className="w-64 bg-theme-bg-secondary border-l border-theme-border p-4 overflow-y-auto text-theme-text-primary">
        <h3 className="text-sm font-semibold mb-4 text-theme-text-primary">
          {t('properties_layout')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t('properties_width')}</label>
            <input
              type="number"
              value={document.layout.width}
              onChange={(e) =>
                onDocumentChange({
                  ...document,
                  layout: { ...document.layout, width: Number(e.target.value) },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t('properties_height')}</label>
            <input
              type="number"
              value={document.layout.height}
              onChange={(e) =>
                onDocumentChange({
                  ...document,
                  layout: { ...document.layout, height: Number(e.target.value) },
                })
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>
    )
  }

  const updateElement = (newAttrs: Partial<BedLayoutElement>) => {
    let finalAttrs = newAttrs

    // Auto-resize text element if font changes
    if (selectedElement.type === 'Text' && 'font' in newAttrs) {
      const textEl = selectedElement as ITextElement
      const newFont = {
        ...textEl.font,
        ...(newAttrs as Partial<ITextElement>).font,
      }
      const { width, height } = measureText(textEl.text, newFont)
      finalAttrs = {
        ...newAttrs,
        box: {
          ...textEl.box,
          width: width + 10,
          height: height + 4,
        },
      }
    }

    onChange(selectedElement.id, finalAttrs)
  }

  const updateBox = (newBox: Partial<{ x: number; y: number; width: number; height: number }>) => {
    if ('box' in selectedElement) {
      updateElement({
        box: { ...selectedElement.box, ...newBox },
      } as Partial<BedLayoutElement>)
    }
  }

  const buildId = (suffix: string) => `prop-${selectedElement.id}-${suffix}`

  const typeLabelMap: Record<string, string> = {
    Text: t('properties_element_text'),
    Rect: t('properties_element_rect'),
    Triangle: t('properties_element_triangle'),
    Trapezoid: t('properties_element_trapezoid'),
    Circle: t('properties_element_circle'),
    Diamond: t('properties_element_diamond'),
    Cylinder: t('properties_element_cylinder'),
    Heart: t('properties_element_heart'),
    Star: t('properties_element_star'),
    Pentagon: t('properties_element_pentagon'),
    Hexagon: t('properties_element_hexagon'),
    ArrowUp: t('properties_element_arrow_up'),
    ArrowDown: t('properties_element_arrow_down'),
    ArrowLeft: t('properties_element_arrow_left'),
    ArrowRight: t('properties_element_arrow_right'),
    Tree: t('properties_element_tree'),
    House: t('properties_element_house'),
    Line: t('properties_element_line'),
    Image: t('properties_element_image'),
    Bed: t('toolbar_bed'),
  }

  const renderTextProps = () => {
    if (selectedElement.type !== 'Text') return null
    const textEl = selectedElement as ITextElement

    const fontSizes = [
      '8',
      '9',
      '10',
      '11',
      '12',
      '14',
      '16',
      '18',
      '20',
      '24',
      '28',
      '32',
      '36',
      '48',
      '64',
      '72',
      '96',
    ]

    return (
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {t('properties_element_text')}
        </h4>

        {/* Font Family & Size */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className={labelClass}>{t('properties_font')}</label>
            <select
              value={textEl.font.family}
              onChange={(e) =>
                updateElement({
                  font: { ...textEl.font, family: e.target.value },
                } as Partial<ITextElement>)
              }
              className={inputClass}
            >
              <option value="Meiryo">Meiryo</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('properties_font_size')}</label>
            <EditableSelect
              value={textEl.font.size.toString()}
              onChange={(val: string) =>
                updateElement({
                  font: { ...textEl.font, size: Number(val) },
                } as Partial<ITextElement>)
              }
              options={fontSizes}
              className={inputClass}
            />
          </div>
        </div>

        {/* Color */}
        <div className="mb-3">
          <label className={labelClass}>{t('color')}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textEl.color}
              onChange={(e) =>
                updateElement({
                  color: e.target.value,
                } as Partial<ITextElement>)
              }
              className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
            />
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
                  className={`p-1 rounded border ${
                    textEl.font.weight === 700
                      ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                      : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                  }`}
                >
                  <Bold size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('properties_font_style_bold')}</p>
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
                  className={`p-1 rounded border ${
                    textEl.font.italic
                      ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                      : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                  }`}
                >
                  <Italic size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('properties_font_style_italic')}</p>
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
                  className={`p-1 rounded border ${
                    textEl.font.underline
                      ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                      : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                  }`}
                >
                  <Underline size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('properties_font_style_underline')}</p>
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
                  className={`p-1 rounded border ${
                    textEl.font.strikethrough
                      ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                      : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'
                  }`}
                >
                  <Strikethrough size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('properties_font_style_strikethrough')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Text Align */}
        <div>
          <label className={`${labelClass} font-medium`}>{t('properties_text_align')}</label>
          <div className="flex bg-theme-bg-primary rounded border border-theme-border p-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateElement({ align: 'left' } as Partial<ITextElement>)}
                    className={`flex-1 flex items-center justify-center py-1 rounded ${
                      textEl.align === 'left'
                        ? 'bg-theme-bg-tertiary text-theme-accent'
                        : 'text-theme-text-secondary hover:bg-theme-bg-secondary'
                    }`}
                  >
                    <AlignLeft size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('side_left')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateElement({ align: 'center' } as Partial<ITextElement>)}
                    className={`flex-1 flex items-center justify-center py-1 rounded ${
                      textEl.align === 'center'
                        ? 'bg-theme-bg-tertiary text-theme-accent'
                        : 'text-theme-text-secondary hover:bg-theme-bg-secondary'
                    }`}
                  >
                    <AlignCenter size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('center')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateElement({ align: 'right' } as Partial<ITextElement>)}
                    className={`flex-1 flex items-center justify-center py-1 rounded ${
                      textEl.align === 'right'
                        ? 'bg-theme-bg-tertiary text-theme-accent'
                        : 'text-theme-text-secondary hover:bg-theme-bg-secondary'
                    }`}
                  >
                    <AlignRight size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('side_right')}</p>
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
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {t('properties_shape_style')}
        </h4>
        {/* Colors */}
        <div>
          <h5 className={`${headingClass} font-medium`}>{t('color')}</h5>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className={labelClass} htmlFor={buildId('fill-color')}>
                {t('properties_fill_color')}
              </label>
              <input
                id={buildId('fill-color')}
                type="color"
                value={shape.fill?.color ?? '#ffffff'}
                onChange={(e) =>
                  updateElement({
                    fill: { ...(shape.fill ?? { color: '#ffffff' }), color: e.target.value },
                  } as Partial<IShapeElement>)
                }
                className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={buildId('stroke-color')}>
                {t('properties_border')}
              </label>
              <input
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
                className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
              />
            </div>
          </div>
        </div>

        {/* Stroke width */}
        <div className="mt-3">
          <label className={labelClass} htmlFor={buildId('stroke-width')}>
            {t('properties_line_width')}
          </label>
          <input
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
            className={inputClass}
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
        label: t('properties_arrow_none'),
        icon: <div className="w-4 h-0.5 bg-current" />,
      },
      {
        value: 'standard',
        label: t('properties_arrow_standard'),
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <title>{t('properties_arrow_standard')}</title>
            <path d="M12 8H2m0 0l4-4m-4 4l4 4" />
          </svg>
        ),
      },
      {
        value: 'filled',
        label: t('properties_arrow_filled'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{t('properties_arrow_filled')}</title>
            <path d="M2 8l6-4v8z" />
            <path d="M8 8h6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        value: 'triangle',
        label: t('properties_arrow_triangle'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{t('properties_arrow_triangle')}</title>
            <path d="M2 8l6-4v8z" />
            <path d="M8 8h6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        value: 'open',
        label: t('properties_arrow_open'),
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <title>{t('properties_arrow_open')}</title>
            <path d="M6 4l-4 4 4 4" />
            <path d="M2 8h10" />
          </svg>
        ),
      },
      {
        value: 'circle',
        label: t('properties_arrow_circle'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{t('properties_arrow_circle')}</title>
            <circle cx="4" cy="8" r="3" />
            <path d="M7 8h7" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        value: 'diamond',
        label: t('properties_arrow_diamond'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{t('properties_arrow_diamond')}</title>
            <path d="M2 8l3-3 3 3-3 3z" />
            <path d="M8 8h6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        value: 'square',
        label: t('properties_arrow_square'),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <title>{t('properties_arrow_square')}</title>
            <rect x="2" y="5" width="6" height="6" />
            <path d="M8 8h6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
    ]

    const lineStyleOptions: ShapeOption[] = [
      {
        value: 'solid',
        label: t('properties_line_style_solid'),
        icon: (
          <svg
            width="24"
            height="8"
            viewBox="0 0 24 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <title>{t('properties_line_style_solid')}</title>
            <line x1="0" y1="4" x2="24" y2="4" />
          </svg>
        ),
      },
      {
        value: 'dashed',
        label: t('properties_line_style_dashed'),
        icon: (
          <svg
            width="24"
            height="8"
            viewBox="0 0 24 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <title>{t('properties_line_style_dashed')}</title>
            <line x1="0" y1="4" x2="24" y2="4" strokeDasharray="6 4" />
          </svg>
        ),
      },
      {
        value: 'dotted',
        label: t('properties_line_style_dotted'),
        icon: (
          <svg
            width="24"
            height="8"
            viewBox="0 0 24 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <title>{t('properties_line_style_dotted')}</title>
            <line x1="0" y1="4" x2="24" y2="4" strokeDasharray="2 4" />
          </svg>
        ),
      },
    ]

    const getLineStyleValue = (dash?: number[]) => {
      if (!dash || dash.length === 0) return 'solid'
      if (dash[0] !== undefined && dash[0] < 1) return 'dotted'
      return 'dashed'
    }

    const handleLineStyleChange = (val: string) => {
      let dash: number[] | undefined
      if (val === 'dashed') dash = [3, 3]
      else if (val === 'dotted') dash = [0.001, 2]

      updateElement({
        stroke: { ...line.stroke, dash },
      } as Partial<ILineElement>)
    }

    return (
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {t('properties_shape_style')}
        </h4>
        {/* Line Color */}
        <div className="mb-3">
          <label className={`${labelClass} font-medium`} htmlFor={buildId('line-color')}>
            {t('properties_line_color')}
          </label>
          <input
            id={buildId('line-color')}
            type="color"
            value={line.stroke.color}
            onChange={(e) =>
              updateElement({
                stroke: { ...line.stroke, color: e.target.value },
              } as Partial<ILineElement>)
            }
            className="w-full h-10 rounded border border-theme-border bg-theme-bg-primary"
          />
        </div>

        {/* Line Width */}
        <div className="mb-3">
          <label className={`${labelClass} font-medium`} htmlFor={buildId('line-width')}>
            {t('properties_line_width')} (px)
          </label>
          <input
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
            className={inputClass}
          />
        </div>

        {/* Line Style */}
        <div className="mb-3">
          <label className={`${labelClass} font-medium`}>{t('properties_line_style')}</label>
          <ShapeSelector
            value={getLineStyleValue(line.stroke.dash)}
            onChange={handleLineStyleChange}
            options={lineStyleOptions}
          />
        </div>

        {/* Start Arrow */}
        <div className="mb-3">
          <label className={`${labelClass} font-medium`} htmlFor={buildId('start-arrow')}>
            {t('properties_arrow_start')}
          </label>
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
          <label className={`${labelClass} font-medium`} htmlFor={buildId('end-arrow')}>
            {t('properties_arrow_end')}
          </label>
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

  const renderBedProps = () => {
    if (selectedElement.type !== 'Bed') return null
    const bed = selectedElement as IBedElement

    return (
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {t('properties_bed_info')}
        </h4>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>{t('properties_label')}</label>
            <input
              type="text"
              value={bed.label || ''}
              onChange={(e) => updateElement({ label: e.target.value } as Partial<IBedElement>)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t('properties_orientation')}</label>
            <select
              value={bed.orientation || 'vertical'}
              onChange={(e) => {
                const newOrientation = e.target.value as 'vertical' | 'horizontal'
                const currentOrientation = bed.orientation || 'vertical'

                let newBox = { ...bed.box }

                // If orientation changed, swap width and height
                if (newOrientation !== currentOrientation) {
                  newBox = {
                    ...newBox,
                    width: bed.box.height,
                    height: bed.box.width,
                  }
                }

                updateElement({
                  orientation: newOrientation,
                  box: newBox,
                } as Partial<IBedElement>)
              }}
              className={inputClass}
            >
              <option value="vertical">{t('properties_orientation_vertical')}</option>
              <option value="horizontal">{t('properties_orientation_horizontal')}</option>
            </select>
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

      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        if (dataUrl) {
          // Update both assetId and src to ensure CanvasRenderer picks it up
          // CanvasRenderer prioritizes src, so we must update it.
          updateElement({ assetId: dataUrl, src: dataUrl } as Partial<IImageElement>)
        }
      }
      reader.readAsDataURL(file)
    }

    return (
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {t('properties_element_image')}
        </h4>
        <div className="mb-4 space-y-3">
          <div>
            <label className={`${labelClass} font-medium`}>{t('properties_select_image')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-theme-text-primary file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-theme-object-primary/20 file:text-theme-object-primary hover:file:bg-theme-object-primary/30"
            />
          </div>
          {image.assetId && (
            <div className="mt-2">
              <p className={labelClass}>{t('properties_preview')}</p>
              <ImagePreview assetId={image.assetId} />
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderLayoutSection = () => {
    if (!('box' in selectedElement)) return null
    const box = (selectedElement as ITextElement | IShapeElement | IImageElement | IBedElement).box

    return (
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {t('properties_layout')}
        </h4>

        {/* Position */}
        <div className="mb-3">
          <h5 className={headingClass}>{t('position')}</h5>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass} htmlFor={buildId('position-x')}>
                X
              </label>
              <input
                id={buildId('position-x')}
                type="number"
                step="0.01"
                value={box.x.toFixed(2)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isNaN(v)) return
                  updateBox({ x: Math.floor(v * 100) / 100 })
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={buildId('position-y')}>
                Y
              </label>
              <input
                id={buildId('position-y')}
                type="number"
                step="0.01"
                value={box.y.toFixed(2)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isNaN(v)) return
                  updateBox({ y: Math.floor(v * 100) / 100 })
                }}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <h5 className={headingClass}>{t('properties_size')}</h5>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className={labelClass} htmlFor={buildId('size-width')}>
                {t('properties_width')}
              </label>
              <input
                id={buildId('size-width')}
                type="number"
                step="0.01"
                value={box.width.toFixed(2)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isNaN(v)) return
                  updateBox({ width: Math.floor(v * 100) / 100 })
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={buildId('size-height')}>
                {t('properties_height')}
              </label>
              <input
                id={buildId('size-height')}
                type="number"
                step="0.01"
                value={box.height.toFixed(2)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isNaN(v)) return
                  updateBox({ height: Math.floor(v * 100) / 100 })
                }}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-64 bg-theme-bg-secondary border-l border-theme-border p-2.5 overflow-y-auto text-theme-text-primary">
      {/* Type badge - floating top-right */}
      <div className="absolute top-1.5 right-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-theme-object-primary/20 text-theme-text-primary shadow-sm">
          {typeLabelMap[selectedElement.type] ?? selectedElement.type}
        </span>
      </div>

      {renderTextProps()}
      {renderShapeProps()}
      {renderLineProps()}
      {renderBedProps()}
      {renderImageProps()}

      {renderLayoutSection()}
    </div>
  )
}
