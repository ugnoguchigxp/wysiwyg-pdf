import {
  Image as ImageIcon,
  Minus,
  MousePointer2,
  PenTool,
  Shapes,
  Table,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type React from 'react'
import { useI18n } from '@/i18n/I18nContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import type { Doc } from '@/types/canvas'
import { useCanvasOperations } from '@/features/konva-editor/hooks/useCanvasOperations'
import { EDITOR_SHAPES } from '@/features/konva-editor/constants/shapes'





const TOOLBAR_BUTTON_CLASS =
  'w-10 h-10 flex items-center justify-center rounded border border-border bg-muted text-muted-foreground hover:bg-accent transition-colors'
const TOOLBAR_BUTTON_ACTIVE_CLASS =
  'w-10 h-10 flex items-center justify-center rounded border border-primary bg-primary/10 text-primary'



interface IWysiwygEditorToolbarProps {
  zoom: number
  onZoomChange: (value: number) => void
  templateDoc: Doc
  onTemplateChange: (doc: Doc) => void
  onSelectElement: (elementId: string) => void
  currentPageId?: string
  i18nOverrides?: Record<string, string>
  activeTool?: string
  onToolSelect?: (tool: string) => void
}

export const WysiwygEditorToolbar: React.FC<IWysiwygEditorToolbarProps> = ({
  zoom,
  onZoomChange,
  templateDoc,
  onTemplateChange,
  onSelectElement,
  currentPageId,
  i18nOverrides,
  activeTool = 'select',
  onToolSelect,
}) => {
  const { t } = useI18n()

  const dpi = 96

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const handleZoomIn = () => {
    onZoomChange(Math.min(200, zoom + 25))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(25, zoom - 25))
  }

  const handleZoomReset = () => {
    onZoomChange(100)
  }

  // Use the shared hook for canvas operations
  const { addText, addShape, addLine, addImage, addTable } = useCanvasOperations({
    templateDoc,
    onTemplateChange,
    onSelectElement,
    onToolSelect,
    resolveText,
    dpi
  })

  // Removed duplicated logic for addText, addShape, addLine, addImage, addTable
  const handleAddText = () => addText(currentPageId)
  const handleAddLine = () => addLine(currentPageId)
  const handleAddImage = () => addImage(currentPageId)
  const handleAddTable = () => addTable(currentPageId)
  const handleAddShape = (type: string) => addShape(type, currentPageId)




  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-secondary border-r border-border text-muted-foreground">
      <TooltipProvider>
        {/* Select Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <button
                type="button"
                onClick={() => onToolSelect?.('select')}
                className={
                  activeTool === 'select' ? TOOLBAR_BUTTON_ACTIVE_CLASS : TOOLBAR_BUTTON_CLASS
                }
                aria-label={resolveText('toolbar_select', 'Select')}
              >
                <MousePointer2 size={20} />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">{resolveText('toolbar_select', 'Select')}</TooltipContent>
        </Tooltip>

        {/* Signature Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <button
                type="button"
                onClick={() => onToolSelect?.('signature')}
                className={
                  activeTool === 'signature' ? TOOLBAR_BUTTON_ACTIVE_CLASS : TOOLBAR_BUTTON_CLASS
                }
                aria-label={resolveText('toolbar_signature', 'Signature')}
              >
                <PenTool size={20} />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">
            {resolveText('toolbar_signature', 'Signature')}
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="border-t border-border my-1 w-full" />

        {/* Add Text Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleAddText}
              className={TOOLBAR_BUTTON_CLASS}
              aria-label={resolveText('toolbar_add_text', 'Add Text')}
              data-testid="toolbar-add-text"
            >
              <Type size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {resolveText('toolbar_add_text', 'Add Text')}
          </TooltipContent>
        </Tooltip>

        {/* Add Image Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleAddImage}
              className={TOOLBAR_BUTTON_CLASS}
              aria-label={resolveText('toolbar_add_image', 'Add Image')}
            >
              <ImageIcon size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {resolveText('toolbar_add_image', 'Add Image')}
          </TooltipContent>
        </Tooltip>

        {/* Add Line Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleAddLine}
              className={TOOLBAR_BUTTON_CLASS}
              aria-label={resolveText('toolbar_line', 'Line')}
            >
              <Minus size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{resolveText('toolbar_line', 'Line')}</TooltipContent>
        </Tooltip>

        {/* Add Table Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleAddTable}
              className={TOOLBAR_BUTTON_CLASS}
              aria-label={resolveText('toolbar_add_table', 'Table')}
            >
              <Table size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{resolveText('toolbar_add_table', 'Table')}</TooltipContent>
        </Tooltip>

        {/* Shapes Menu */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={TOOLBAR_BUTTON_CLASS}
                  aria-label={resolveText('toolbar_shape', 'Shape')}
                >
                  <Shapes size={20} />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{resolveText('toolbar_shape', 'Shape')}</TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="start" className="w-56 grid grid-cols-4 gap-1 p-2">
            {EDITOR_SHAPES.map((shape) => (
              <DropdownMenuItem
                key={shape.type}
                onClick={() => handleAddShape(shape.type)}
                className="flex items-center justify-center p-2 rounded cursor-pointer hover:bg-accent text-foreground"
                title={shape.label}
              >
                {shape.icon}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      {/* Divider before Zoom Controls */}
      <div className="border-t border-border my-3 w-full" />

      {/* Zoom Controls */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={handleZoomIn}
          className={`${TOOLBAR_BUTTON_CLASS} disabled:opacity-50`}
          aria-label={resolveText('toolbar_zoom_in', 'Zoom in')}
          disabled={zoom >= 200}
        >
          <ZoomIn size={18} />
        </button>
        <button
          type="button"
          onClick={handleZoomReset}
          className="text-muted-foreground text-xs font-medium hover:text-primary transition-colors"
          aria-label={resolveText('toolbar_zoom_reset', 'Reset zoom')}
        >
          {zoom}%
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className={`${TOOLBAR_BUTTON_CLASS} disabled:opacity-50`}
          aria-label={resolveText('toolbar_zoom_out', 'Zoom out')}
          disabled={zoom <= 25}
        >
          <ZoomOut size={18} />
        </button>
      </div>
    </div>
  )
}
