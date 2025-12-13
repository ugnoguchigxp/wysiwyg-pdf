import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
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
  Doc,
  UnifiedNode,
  TextNode,
  ShapeNode,

  ImageNode,
  SignatureNode,
  TableNode,
} from '../../types/wysiwyg'
import { measureText } from '../../utils/textUtils'
import { findImageWithExtension } from '../WysiwygCanvas/canvasImageUtils'
import { BindingSelector } from './BindingSelector'
import { TableProperties } from './TableProperties'
import { DataBindingModal } from './DataBindingModal'

const log = createContextLogger('WysiwygPropertiesPanel')

export interface WysiwygPropertiesPanelProps {
  templateDoc: Doc
  selectedElementId: string | null
  selectedCell?: { elementId: string; row: number; col: number } | null
  onTemplateChange: (newDoc: Doc) => void
  currentPageId: string
  schema?: IDataSchema
  i18nOverrides?: Record<string, string>
  activeTool?: string
  onToolSelect?: (tool: string) => void
  drawingSettings?: { stroke: string; strokeWidth: number; useOffset?: boolean; tolerance?: number }
  onDrawingSettingsChange?: (settings: { stroke: string; strokeWidth: number; useOffset?: boolean; tolerance?: number }) => void
}

const PropertiesLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className,
  ...props
}) => (
  <label
    className={cn(
      'block text-sm font-medium text-theme-text-primary mb-1.5',
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
  src: string
  i18nOverrides?: Record<string, string>
}> = ({ src, i18nOverrides }) => {
  const { t } = useTranslation()
  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    if (!src) {
      setStatus('error')
      return
    }
    let active = true
    setStatus('loading')

    if (src.startsWith('data:') || src.startsWith('http')) {
      setImageSrc(src)
      setStatus('loaded')
      return
    }

    findImageWithExtension(src)
      .then((res) => {
        if (active) {
          if (res) {
            setImageSrc(res.url)
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
  }, [src])

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
      src={imageSrc!}
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
  activeTool,
  onToolSelect,
  drawingSettings,
  onDrawingSettingsChange,
}) => {
  const { t } = useTranslation()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const renderSignaturePanelContent = (
    data: { stroke: string; strokeWidth: number },
    onUpdate: (updates: Partial<SignatureNode>) => void,
    showFinishButton: boolean
  ) => (
    <div className="mb-4 space-y-3">
      <PropertiesSectionTitle>{resolveText('toolbar_signature', 'Signature')}</PropertiesSectionTitle>

      <div>
        <PropertiesLabel>
          {resolveText('properties_stroke_color', 'Stroke Color')}
        </PropertiesLabel>
        <PropertiesInput
          type="color"
          value={data.stroke}
          onChange={(e) => onUpdate({ stroke: e.target.value })}
          className="h-9 p-1 cursor-pointer"
        />
      </div>

      <div>
        <PropertiesLabel>
          {resolveText('properties_stroke_width', 'Thickness')} (px)
        </PropertiesLabel>
        <PropertiesInput
          type="number"
          min="1"
          value={data.strokeWidth}
          onChange={(e) => {
            const val = Number(e.target.value)
            if (val > 0) onUpdate({ strokeW: val })
          }}
        />
      </div>

      {showFinishButton && (
        <>
          <div>
            <PropertiesLabel>
              {resolveText('properties_signature_optimization', 'Vertex Count (Data Reduction Degree)')}: {drawingSettings?.tolerance ?? 2.0}
            </PropertiesLabel>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={drawingSettings?.tolerance ?? 2.5}
              onChange={(e) => {
                if (onDrawingSettingsChange && drawingSettings) {
                  onDrawingSettingsChange({ ...drawingSettings, tolerance: parseFloat(e.target.value) })
                }
              }}
              className="w-full accent-theme-object-primary"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-theme-border">
            <p className="text-xs text-theme-text-secondary mb-3">
              {resolveText('signature_instruction', 'Drag on canvas to draw.')}
            </p>
            <button
              type="button"
              onClick={() => {
                console.log('Signature JSON:', JSON.stringify(templateDoc.nodes.find(n => n.t === 'signature'), null, 2))
                console.log('Full Document JSON:', JSON.stringify(templateDoc, null, 2))
                onToolSelect?.('select')
              }}
              className="w-full flex items-center justify-center py-2 px-4 rounded bg-theme-object-primary text-white hover:bg-theme-object-primary/90 transition-colors"
            >
              {resolveText('properties_finish_drawing', 'Finish Drawing')}
            </button>
          </div>
        </>
      )}
    </div>
  )


  const [activeBindingMode, setActiveBindingMode] = React.useState<'field' | 'repeater' | null>(
    null
  )

  const openBindingModal = (mode: 'field' | 'repeater') => {
    setActiveBindingMode(mode)
  }

  const handleBindingSelect = (binding: { field?: string }) => {
    if (selectedElement) {
      updateElement({ bind: binding.field })
    }
    setActiveBindingMode(null)
  }

  const selectedElement: UnifiedNode | undefined = React.useMemo(() => {
    return templateDoc.nodes.find((el) => el.id === selectedElementId)
  }, [templateDoc.nodes, selectedElementId])

  const currentSurface = templateDoc.surfaces.find(s => s.id === currentPageId) || templateDoc.surfaces[0]

  const updateElement = (updates: Partial<UnifiedNode>) => {
    if (!selectedElement) return
    log.debug('Updating element', { id: selectedElement.id, updates })

    let finalUpdates = updates
    // Recalculate size if text content/font changes (simplified)
    if (selectedElement.t === 'text' && ('fontSize' in updates || 'font' in updates || 'text' in updates)) {
      const textEl = selectedElement as TextNode
      const updatesText = updates as Partial<TextNode>
      const newFont = {
        family: updatesText.font ?? textEl.font ?? 'Helvetica',
        size: updatesText.fontSize ?? textEl.fontSize ?? 12,
        weight: updatesText.fontWeight ?? textEl.fontWeight ?? 400
      }
      const text = updatesText.text ?? textEl.text
      const { width, height } = measureText(text, newFont)
      finalUpdates = {
        ...updates,
        w: width + 10,
        h: height + 4
      }
    }

    const nextDoc: Doc = {
      ...templateDoc,
      nodes: templateDoc.nodes.map((el) =>
        el.id === selectedElement.id ? ({ ...el, ...finalUpdates } as UnifiedNode) : el
      ),
    }
    onTemplateChange(nextDoc)
  }

  const updateSurface = (updates: Partial<typeof currentSurface>) => {
    const nextDoc = {
      ...templateDoc,
      surfaces: templateDoc.surfaces.map(s => s.id === currentSurface.id ? { ...s, ...updates } : s)
    }
    onTemplateChange(nextDoc)
  }

  const isDrawing = activeTool === 'signature'

  const renderPageBackground = () => {
    // Page Background
    const bg = currentSurface.bg || '#ffffff'
    const isColor = bg.startsWith('#') || bg.startsWith('rgb')

    return (
      <div className="w-72 bg-theme-bg-secondary border-l border-theme-border p-5 overflow-y-auto text-theme-text-primary">
        <div className={sectionCardClass}>
          <PropertiesSectionTitle>
            {resolveText('properties_page_background', 'Page Background')}
          </PropertiesSectionTitle>
          <div className="mb-2">
            <PropertiesLabel htmlFor="page-bg-color">
              {resolveText('properties_background_color', 'Background Color')}
            </PropertiesLabel>
            <PropertiesInput
              id="page-bg-color"
              type="color"
              value={isColor ? bg : '#ffffff'}
              onChange={(e) => updateSurface({ bg: e.target.value })}
              className="h-9 w-full p-1 cursor-pointer"
            />
          </div>
          {/* Image upload logic simplified */}
          <div>
            <PropertiesLabel>Image URL (or ID)</PropertiesLabel>
            <PropertiesInput
              value={!isColor ? bg : ''}
              onChange={(e) => updateSurface({ bg: e.target.value })}
              placeholder="http://..."
            />
          </div>
        </div>
      </div>
    )
  }

  // Unified Signature Panel Logic
  const renderSignaturePanel = () => {
    // Case 1: Active Tool (Priority)
    if (isDrawing) {
      return (
        <div className={sectionCardClass}>
          {renderSignaturePanelContent(
            drawingSettings || { stroke: '#000000', strokeWidth: 2 },
            (updates) => {
              if (onDrawingSettingsChange && drawingSettings) {
                const newSettings = { ...drawingSettings }
                if (updates.stroke !== undefined) newSettings.stroke = updates.stroke
                if (updates.strokeW !== undefined) newSettings.strokeWidth = updates.strokeW
                onDrawingSettingsChange(newSettings)
              }
            },
            true // showFinishButton
          )}
        </div>
      )
    }

    // Case 2: Selected Element
    if (selectedElement?.t === 'signature') {
      const sig = selectedElement as SignatureNode
      return (
        <div className={sectionCardClass}>
          {renderSignaturePanelContent(
            { stroke: sig.stroke, strokeWidth: sig.strokeW },
            (updates) => updateElement(updates),
            false // showFinishButton (implied: no tolerance slider)
          )}
        </div>
      )
    }

    return null
  }

  if (!selectedElement && !isDrawing) {
    return renderPageBackground()
  }

  const renderBindingProps = () => {
    // Only show for Text, Table(repeater)
    const validTypes = ['text', 'table']
    // For table, if cell selected, it might be separate.
    // Assuming table repeater binding on the table element itself.
    if (!selectedElement || !validTypes.includes(selectedElement.t)) return null

    // Check if table is global (repeater) or cell binding? 
    // Usually table data vs cell data.

    const label = resolveText('data_binding', 'Data Binding')
    const mode = selectedElement.t === 'table' ? 'repeater' : 'field'

    return (
      <div className={sectionCardClass}>
        <PropertiesSectionTitle>{label}</PropertiesSectionTitle>
        <BindingSelector
          label={label}
          binding={selectedElement.bind ? { field: selectedElement.bind } : undefined} // Map string bind to object if needed by Selector
          onUpdate={(binding) => updateElement({ bind: binding?.field })}
          onOpenModal={() => openBindingModal(mode)}
          i18nOverrides={i18nOverrides}
        />
      </div>
    )
  }

  const renderTextProps = () => {
    if (selectedElement?.t !== 'text') return null
    const textEl = selectedElement as TextNode

    const fontSizes = [
      8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72,
      80, 88, 96,
    ]

    return (
      <div className="mb-6 space-y-5">
        <div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <PropertiesLabel>
                {resolveText('properties_size', 'Size')}
              </PropertiesLabel>
              <Select
                value={String(textEl.fontSize ?? 12)}
                onValueChange={(val) =>
                  updateElement({ fontSize: Number(val) })
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
              <PropertiesLabel>
                {resolveText('color', 'Color')}
              </PropertiesLabel>
              <PropertiesInput
                type="color"
                value={textEl.fill}
                onChange={(e) => updateElement({ fill: e.target.value })}
                className="h-9 p-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Font Styles */}
        <div className="flex gap-1 mb-2">
          <TooltipProvider>
            {/* Bold */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    updateElement({ fontWeight: (textEl.fontWeight === 700) ? 400 : 700 })
                  }
                  className={cn("p-1 rounded border", textEl.fontWeight === 700
                    ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                    : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary')}
                >
                  <Bold size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>{resolveText('properties_font_style_bold', 'Bold')}</p></TooltipContent>
            </Tooltip>
            {/* Italic */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => updateElement({ italic: !textEl.italic })}
                  className={cn("p-1 rounded border", textEl.italic
                    ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                    : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary')}
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
                  onClick={() => updateElement({ underline: !textEl.underline })}
                  className={cn("p-1 rounded border", textEl.underline
                    ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                    : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary')}
                >
                  <Underline size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>{resolveText('properties_font_style_underline', 'Underline')}</p></TooltipContent>
            </Tooltip>
            {/* Strikethrough */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => updateElement({ lineThrough: !textEl.lineThrough })}
                  className={cn("p-1 rounded border", textEl.lineThrough
                    ? 'bg-theme-bg-tertiary text-theme-accent border-theme-accent'
                    : 'bg-theme-bg-primary text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary')}
                >
                  <Strikethrough size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>{resolveText('properties_font_style_strikethrough', 'Strikethrough')}</p></TooltipContent>
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
                  <button type="button" onClick={() => updateElement({ align: 'l' })} className={cn("flex-1 py-1 flex justify-center rounded", textEl.align === 'l' ? 'bg-theme-bg-tertiary text-theme-accent' : '')}><AlignLeft size={14} /></button>
                </TooltipTrigger>
                <TooltipContent>Left</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => updateElement({ align: 'c' })} className={cn("flex-1 py-1 flex justify-center rounded", textEl.align === 'c' ? 'bg-theme-bg-tertiary text-theme-accent' : '')}><AlignCenter size={14} /></button>
                </TooltipTrigger>
                <TooltipContent>Center</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => updateElement({ align: 'r' })} className={cn("flex-1 py-1 flex justify-center rounded", textEl.align === 'r' ? 'bg-theme-bg-tertiary text-theme-accent' : '')}><AlignRight size={14} /></button>
                </TooltipTrigger>
                <TooltipContent>Right</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => updateElement({ align: 'j' })} className={cn("flex-1 py-1 flex justify-center rounded", textEl.align === 'j' ? 'bg-theme-bg-tertiary text-theme-accent' : '')}><AlignJustify size={14} /></button>
                </TooltipTrigger>
                <TooltipContent>Justify</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    )
  }

  const renderShapeProps = () => {
    if (selectedElement?.t !== 'shape') return null
    const shape = selectedElement as ShapeNode

    return (
      <div className="mb-6 space-y-4">
        <div>
          <PropertiesSubsectionTitle>{resolveText('color', 'Color')}</PropertiesSubsectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PropertiesLabel>
                {resolveText('properties_fill_color', 'Fill Color')}
              </PropertiesLabel>
              <PropertiesInput
                type="color"
                value={shape.fill ?? '#ffffff'}
                onChange={(e) => updateElement({ fill: e.target.value })}
                className="h-9 p-1 cursor-pointer"
              />
            </div>
            <div>
              <PropertiesLabel>
                {resolveText('properties_border', 'Border')}
              </PropertiesLabel>
              <PropertiesInput
                type="color"
                value={shape.stroke ?? '#000000'}
                onChange={(e) => updateElement({ stroke: e.target.value })}
                className="h-9 p-1 cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div>
          <PropertiesLabel>{resolveText('properties_line_width', 'Line Width')}</PropertiesLabel>
          <PropertiesInput
            type="number"
            value={shape.strokeW ?? 1}
            onChange={(e) => updateElement({ strokeW: Number(e.target.value) })}
          />
        </div>
      </div>
    )
  }

  const renderImageProps = () => {
    if (selectedElement?.t !== 'image') return null
    const img = selectedElement as ImageNode

    return (
      <div className={sectionCardClass}>
        <PropertiesSectionTitle>{resolveText('properties_element_image', 'Image')}</PropertiesSectionTitle>
        <div className="mb-2">
          <ImagePreview src={img.src} i18nOverrides={i18nOverrides} />
        </div>
      </div>
    )
  }

  const renderTableProps = () => {
    if (selectedElement?.t !== 'table') return null;
    return (
      <TableProperties
        element={selectedElement as TableNode}
        onUpdate={(newAttrs) => onTemplateChange({ ...templateDoc, nodes: templateDoc.nodes.map(n => n.id === selectedElement.id ? { ...n, ...newAttrs } as UnifiedNode : n) })}
        selectedCell={selectedCell}
        i18nOverrides={i18nOverrides}
      />
    )
  }

  const renderCommonProps = () => {
    if (isDrawing || !selectedElement) return null;
    return (
      <div className={sectionCardClass}>
        <PropertiesSectionTitle>{resolveText('properties_layout', 'Layout')}</PropertiesSectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <PropertiesLabel>X</PropertiesLabel>
            <PropertiesInput
              type="number"
              value={Math.round(selectedElement.x || 0)}
              onChange={(e) => updateElement({ x: Number(e.target.value) })}
            />
          </div>
          <div>
            <PropertiesLabel>Y</PropertiesLabel>
            <PropertiesInput
              type="number"
              value={Math.round(selectedElement.y || 0)}
              onChange={(e) => updateElement({ y: Number(e.target.value) })}
            />
          </div>
          <div>
            <PropertiesLabel>W</PropertiesLabel>
            <PropertiesInput
              type="number"
              value={Math.round(selectedElement.w || 0)}
              onChange={(e) => updateElement({ w: Number(e.target.value) })}
            />
          </div>
          <div>
            <PropertiesLabel>H</PropertiesLabel>
            <PropertiesInput
              type="number"
              value={Math.round(selectedElement.h || 0)}
              onChange={(e) => updateElement({ h: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-theme-bg-secondary p-4 overflow-y-auto">
      {renderSignaturePanel()}
      {renderCommonProps()}
      {renderTextProps()}
      {renderShapeProps()}
      {renderImageProps()}
      {renderTableProps()}
      {renderBindingProps()}

      {activeBindingMode && schema && (
        <DataBindingModal
          isOpen={true}
          onClose={() => setActiveBindingMode(null)}
          onSelect={handleBindingSelect}
          mode={activeBindingMode}
          schema={schema}
        />
      )}
    </div>
  )
}
