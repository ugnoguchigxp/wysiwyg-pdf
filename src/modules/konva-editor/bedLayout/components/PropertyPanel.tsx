import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
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
  UnifiedNode,
  TextNode,
  LineNode,
  ShapeNode,
  ImageNode,
  WidgetNode,
} from '../../types'

export interface PropertyPanelProps {
  selectedElement: UnifiedNode | null
  onChange: (id: string, newAttrs: Partial<UnifiedNode>) => void
  onDelete: (id: string) => void
  document?: BedLayoutDocument
  onDocumentChange?: (newDoc: BedLayoutDocument) => void
  i18nOverrides?: Record<string, string>
}

const labelClass = 'block text-[11px] text-theme-text-secondary mb-0.5'
const headingClass = 'text-[11px] font-medium text-theme-text-secondary mb-1.5'
const inputClass =
  'w-full px-1.5 py-1 border border-theme-border rounded text-[11px] bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-accent'
const sectionCardClass = 'mb-2.5 p-2.5 bg-theme-bg-tertiary rounded border border-theme-border'

const ImagePreview: React.FC<{ assetId: string, i18nOverrides?: Record<string, string> }> = ({ assetId, i18nOverrides }) => {
  const { t } = useTranslation()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const [src, setSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    if (!assetId) {
      setStatus('error')
      return
    }
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
        {resolveText('loading', 'Loading...')}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="w-full h-20 bg-theme-bg-tertiary border border-theme-border rounded flex items-center justify-center text-xs text-red-500">
        {resolveText('no_image', 'No image')}
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
  onDelete,
  document,
  onDocumentChange,
  i18nOverrides,
}) => {
  const { t } = useTranslation()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  if (!selectedElement) {
    if (!document || !onDocumentChange) return null

    return (
      <div className="w-64 bg-theme-bg-secondary border-l border-theme-border p-4 overflow-y-auto text-theme-text-primary">
        <h3 className="text-sm font-semibold mb-4 text-theme-text-primary">
          {resolveText('properties_layout', 'Layout')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{resolveText('properties_width', 'Width')}</label>
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
            <label className={labelClass}>{resolveText('properties_height', 'Height')}</label>
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

  const updateElement = (newAttrs: Partial<UnifiedNode>) => {
    let finalAttrs = newAttrs

    // Auto-resize text element if font changes
    if (selectedElement.t === 'text' && ('font' in newAttrs || 'fontSize' in newAttrs || 'fontWeight' in newAttrs || 'text' in newAttrs)) {
      const textEl = selectedElement as TextNode
      const updates = newAttrs as Partial<TextNode>
      const newFont = {
        family: updates.font ?? textEl.font ?? 'Helvetica',
        size: updates.fontSize ?? textEl.fontSize ?? 12,
        weight: updates.fontWeight ?? textEl.fontWeight ?? 400
      }
      const text = updates.text ?? textEl.text
      const { width, height } = measureText(text, newFont)
      finalAttrs = {
        ...newAttrs,
        w: width + 10,
        h: height + 4,
      }
    }

    onChange(selectedElement.id, finalAttrs)
  }

  const buildId = (suffix: string) => `prop-${selectedElement.id}-${suffix}`

  const renderTextProps = () => {
    if (selectedElement.t !== 'text') return null
    const textEl = selectedElement as TextNode

    const fontSizes = [
      '8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64', '72', '96',
    ]

    return (
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {resolveText('properties_element_text', 'Text')}
        </h4>

        {/* Font Family & Size */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className={labelClass}>{resolveText('properties_font', 'Font')}</label>
            <select
              value={textEl.font}
              onChange={(e) => updateElement({ font: e.target.value } as Partial<TextNode>)}
              className={inputClass}
            >
              <option value="Meiryo">Meiryo</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{resolveText('properties_font_size', 'Size')}</label>
            <EditableSelect
              value={(textEl.fontSize ?? 12).toString()}
              onChange={(val: string) => updateElement({ fontSize: Number(val) } as Partial<TextNode>)}
              options={fontSizes}
              className={inputClass}
            />
          </div>
        </div>

        {/* Color */}
        <div className="mb-3">
          <label className={labelClass}>{resolveText('color', 'Color')}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textEl.fill}
              onChange={(e) => updateElement({ fill: e.target.value } as Partial<TextNode>)}
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
                  onClick={() => updateElement({ fontWeight: textEl.fontWeight === 700 ? 400 : 700 } as Partial<TextNode>)}
                  className={`p-1 rounded border ${textEl.fontWeight === 700 ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent' : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'}`}
                >
                  <Bold size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>{resolveText('properties_font_style_bold', 'Bold')}</p></TooltipContent>
            </Tooltip>
            {/* Italic, Underline etc not fully standard in schema yet but assuming support in renderer or extended props */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => updateElement({ italic: !textEl.italic } as Partial<TextNode>)}
                  className={`p-1 rounded border ${textEl.italic ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent' : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'}`}
                >
                  <Italic size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>{resolveText('properties_font_style_italic', 'Italic')}</p></TooltipContent>
            </Tooltip>
            {/* Underline */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => updateElement({ underline: !textEl.underline } as Partial<TextNode>)}
                  className={`p-1 rounded border ${textEl.underline ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent' : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary'}`}
                >
                  <Underline size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>{resolveText('properties_font_style_underline', 'Underline')}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Text Align */}
        <div>
          <label className={`${labelClass} font-medium`}>{resolveText('properties_text_align', 'Align')}</label>
          <div className="flex bg-theme-bg-primary rounded border border-theme-border p-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateElement({ align: 'l' } as Partial<TextNode>)}
                    className={`flex-1 flex items-center justify-center py-1 rounded ${textEl.align === 'l' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                  >
                    <AlignLeft size={14} />
                  </button>
                </TooltipTrigger>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateElement({ align: 'c' } as Partial<TextNode>)}
                    className={`flex-1 flex items-center justify-center py-1 rounded ${textEl.align === 'c' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                  >
                    <AlignCenter size={14} />
                  </button>
                </TooltipTrigger>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updateElement({ align: 'r' } as Partial<TextNode>)}
                    className={`flex-1 flex items-center justify-center py-1 rounded ${textEl.align === 'r' ? 'bg-theme-bg-tertiary text-theme-accent' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                  >
                    <AlignRight size={14} />
                  </button>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    )
  }

  const renderShapeProps = () => {
    if (selectedElement.t !== 'shape') return null
    const shape = selectedElement as ShapeNode

    return (
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {resolveText('properties_shape_style', 'Shape Style')}
        </h4>
        {/* Colors */}
        <div>
          <h5 className={`${headingClass} font-medium`}>{resolveText('color', 'Color')}</h5>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className={labelClass} htmlFor={buildId('fill-color')}>
                {resolveText('properties_fill_color', 'Fill Color')}
              </label>
              <input
                id={buildId('fill-color')}
                type="color"
                value={shape.fill ?? '#ffffff'}
                onChange={(e) => updateElement({ fill: e.target.value } as Partial<ShapeNode>)}
                className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={buildId('stroke-color')}>
                {resolveText('properties_border', 'Border')}
              </label>
              <input
                id={buildId('stroke-color')}
                type="color"
                value={shape.stroke ?? '#000000'}
                onChange={(e) => updateElement({ stroke: e.target.value } as Partial<ShapeNode>)}
                className="w-full h-8 rounded border border-theme-border bg-theme-bg-primary"
              />
            </div>
          </div>
        </div>

        {/* Stroke width */}
        <div className="mt-3">
          <label className={labelClass} htmlFor={buildId('stroke-width')}>
            {resolveText('properties_line_width', 'Line Width')}
          </label>
          <input
            id={buildId('stroke-width')}
            type="number"
            value={shape.strokeW ?? 1}
            onChange={(e) => updateElement({ strokeW: Number(e.target.value) } as Partial<ShapeNode>)}
            className={inputClass}
          />
        </div>
      </div>
    )
  }

  const renderLineProps = () => {
    if (selectedElement.t !== 'line') return null
    const line = selectedElement as LineNode

    const lineStyleOptions: ShapeOption[] = [
      {
        value: 'solid',
        label: resolveText('properties_line_style_solid', 'Solid'),
        icon: <div className="w-6 h-0.5 bg-current" />,
      },
      {
        value: 'dashed',
        label: resolveText('properties_line_style_dashed', 'Dashed'),
        icon: <div className="w-6 h-0.5 border-b-2 border-dashed border-current" />,
      },
      {
        value: 'dotted',
        label: resolveText('properties_line_style_dotted', 'Dotted'),
        icon: <div className="w-6 h-0.5 border-b-2 border-dotted border-current" />,
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

      updateElement({ dash } as Partial<LineNode>)
    }

    return (
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {resolveText('properties_shape_style', 'Shape Style')}
        </h4>
        {/* Line Color */}
        <div className="mb-3">
          <label className={`${labelClass} font-medium`} htmlFor={buildId('line-color')}>
            {resolveText('properties_line_color', 'Line Color')}
          </label>
          <input
            id={buildId('line-color')}
            type="color"
            value={line.stroke}
            onChange={(e) => updateElement({ stroke: e.target.value } as Partial<LineNode>)}
            className="w-full h-10 rounded border border-theme-border bg-theme-bg-primary"
          />
        </div>

        {/* Line Width */}
        <div className="mb-3">
          <label className={`${labelClass} font-medium`} htmlFor={buildId('line-width')}>
            {resolveText('properties_line_width', 'Line Width')} (px)
          </label>
          <input
            id={buildId('line-width')}
            type="number"
            min="1"
            value={line.strokeW}
            onChange={(e) => updateElement({ strokeW: Number(e.target.value) } as Partial<LineNode>)}
            className={inputClass}
          />
        </div>

        {/* Line Style */}
        <div className="mb-3">
          <label className={`${labelClass} font-medium`}>
            {resolveText('properties_line_style', 'Line Style')}
          </label>
          <ShapeSelector
            value={getLineStyleValue(line.dash)}
            onChange={handleLineStyleChange}
            options={lineStyleOptions}
          />
        </div>
      </div>
    )
  }

  const renderImageProps = () => {
    if (selectedElement.t !== 'image') return null;
    const img = selectedElement as ImageNode;

    return (
      <div className={sectionCardClass}>
        <h4>{resolveText('properties_element_image', 'Image')}</h4>
        <div className="mb-2">
          <ImagePreview assetId={img.src} i18nOverrides={i18nOverrides} />
        </div>
      </div>
    )
  }

  const renderBedProps = () => {
    if (selectedElement.t !== 'widget' || (selectedElement as WidgetNode).widget !== 'bed') return null
    const bed = selectedElement as WidgetNode

    return (
      <div className={sectionCardClass}>
        <h4 className="text-xs font-medium text-theme-text-primary mb-2">
          {resolveText('toolbar_bed', 'Bed')}
        </h4>
        <div className="mb-2">
          <label className={labelClass}>{resolveText('label', 'Label')}</label>
          <input
            type="text"
            value={bed.name || ''}
            onChange={e => updateElement({ name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="mb-2">
          <label className={labelClass}>{resolveText('rotation', 'Orientation')}</label>
          <select
            value={(bed.data?.orientation as string) || 'horizontal'}
            onChange={e => updateElement({ data: { ...bed.data, orientation: e.target.value } } as Partial<WidgetNode>)}
            className={inputClass}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-theme-bg-secondary border-l border-theme-border p-4 overflow-y-auto text-theme-text-primary">
      <h3 className="text-sm font-semibold mb-4 text-theme-text-primary">
        {resolveText('properties_layout', 'Layout')}
      </h3>

      {/* Common Props */}
      <div className={sectionCardClass}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>X</label>
            <input type="number"
              value={Math.round(selectedElement.x || 0)}
              onChange={e => updateElement({ x: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Y</label>
            <input type="number"
              value={Math.round(selectedElement.y || 0)}
              onChange={e => updateElement({ y: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>W</label>
            <input type="number"
              value={Math.round(selectedElement.w || 0)}
              onChange={e => updateElement({ w: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>H</label>
            <input type="number"
              value={Math.round(selectedElement.h || 0)}
              onChange={e => updateElement({ h: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {renderTextProps()}
      {renderShapeProps()}
      {renderLineProps()}
      {renderImageProps()}
      {renderBedProps()}

      <div className="mt-4 pt-4 border-t border-theme-border">
        <button
          onClick={() => onDelete(selectedElement.id)}
          className="w-full py-1 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded"
        >
          {resolveText('delete', 'Delete')}
        </button>
      </div>
    </div>
  )
}
