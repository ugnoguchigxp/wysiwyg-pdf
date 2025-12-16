import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Circle,
  Database,
  Diamond,
  Heart,
  Hexagon,
  Home,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  PenTool,
  Pentagon,
  Shapes,
  Square,
  Star,
  Table,
  Trees,
  Triangle,
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
import { measureText } from '@/features/konva-editor/utils/textUtils'
import type {
  Doc,
  ImageNode,
  LineNode,
  ShapeNode,
  TableNode,
  TextNode,
  UnifiedNode,
} from '@/types/canvas'
import { createContextLogger } from '@/utils/logger'
import { mmToPx, ptToMm, pxToMm } from '@/utils/units'

const log = createContextLogger('WysiwygEditorToolbar')

const TOOLBAR_BUTTON_CLASS =
  'w-10 h-10 flex items-center justify-center rounded border border-theme-border bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-object-primary/20 transition-colors'
const TOOLBAR_BUTTON_ACTIVE_CLASS =
  'w-10 h-10 flex items-center justify-center rounded border border-theme-object-primary bg-theme-object-primary/10 text-theme-object-primary'

const TrapezoidIcon = ({ size = 20, className = '', title = 'Trapezoid' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <title>{title}</title>
    <path d="M4 20h16l-4-16H8L4 20z" />
  </svg>
)

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

  const getTargetSurfaceId = () => {
    if (currentPageId) return currentPageId
    return templateDoc.surfaces[0]?.id ?? 'page-1'
  }

  const withNewElement = (element: UnifiedNode) => {
    const nextDoc: Doc = {
      ...templateDoc,
      nodes: [...templateDoc.nodes, element],
    }
    onTemplateChange(nextDoc)
    onSelectElement(element.id)
    onToolSelect?.('select')
    log.debug('Element added from toolbar', { id: element.id, type: element.t })
  }

  const calculateInitialPosition = (surfaceId: string) => {
    const surface = templateDoc.surfaces.find((s) => s.id === surfaceId)
    // Default to A4 size if surface not found (210mm * 297mm approx 595px * 842px at 72dpi, but let's assume px)
    const surfaceW = surface?.w ?? 800
    const surfaceH = surface?.h ?? 600

    const nodesOnSurface = templateDoc.nodes.filter((n) => n.s === surfaceId).length
    const offset = nodesOnSurface * (surfaceW * 0.01)

    return {
      x: surfaceW * 0.15 + offset,
      y: surfaceH * 0.15 + offset,
      offset,
    }
  }

  const addText = () => {
    const s = getTargetSurfaceId()
    const { x, y } = calculateInitialPosition(s)
    const id = `text-${crypto.randomUUID()}`
    const textContent = resolveText('toolbar_default_text', 'Text')
    const fontSizePt = 12
    const fontSizeMm = ptToMm(fontSizePt)
    const font = {
      family: 'Meiryo',
      size: mmToPx(fontSizeMm, { dpi }),
      weight: 400,
    }
    const { width, height } = measureText(textContent, font)

    const text: TextNode = {
      id,
      t: 'text',
      s,
      locked: false,
      r: 0,
      name: 'Text',
      text: textContent,
      font: font.family,
      fontSize: fontSizeMm,
      fontWeight: font.weight,
      fill: '#000000',
      align: 'l',
      vAlign: 't',
      x,
      y,
      w: pxToMm(width + 10, { dpi }),
      h: pxToMm(height + 4, { dpi }),
    }
    withNewElement(text)
  }

  const addShape = (shapeType: string) => {
    const s = getTargetSurfaceId()
    const { x, y } = calculateInitialPosition(s)
    const id = `${shapeType.toLowerCase()}-${crypto.randomUUID()}`

    let width = 30
    let height = 30

    if (shapeType === 'trapezoid') {
      width = 40
      height = 24
    } else if (shapeType === 'cylinder') {
      width = 24
      height = 40
    } else if (['arrow-u', 'arrow-d'].includes(shapeType)) {
      width = 16
      height = 32
    } else if (['arrow-l', 'arrow-r'].includes(shapeType)) {
      width = 32
      height = 16
    }

    const shape: ShapeNode = {
      id,
      t: 'shape',
      shape: shapeType.toLowerCase() as ShapeNode['shape'],
      s,
      locked: false,
      r: 0,
      name: shapeType,
      x,
      y,
      w: width,
      h: height,
      stroke: '#000000',
      strokeW: 0.2,
      fill: '#ffffff',
    }
    withNewElement(shape)
  }

  const addLine = () => {
    const s = getTargetSurfaceId()
    const { x, y } = calculateInitialPosition(s)
    const id = `line-${crypto.randomUUID()}`

    // Default line length and position adjustment relative to calc pos
    // Original pts: [60, 340, 220, 340] -> length 160, y: 340
    // We want start point to be at calculated x, y

    const line: LineNode = {
      id,
      t: 'line',
      s,
      locked: false,
      name: 'Line',
      pts: [x, y, x + 50, y],
      stroke: '#000000',
      strokeW: 0.2,
    }
    withNewElement(line)
  }

  const addImage = () => {
    const s = getTargetSurfaceId()
    const { x, y } = calculateInitialPosition(s)
    const id = `image-${crypto.randomUUID()}`
    const image: ImageNode = {
      id,
      t: 'image',
      s,
      locked: false,
      r: 0,
      name: 'Image',
      x,
      y,
      w: 40,
      h: 30,
      src: '', // Empty
    }
    withNewElement(image)
  }

  const addTable = () => {
    const s = getTargetSurfaceId()
    const { x, y } = calculateInitialPosition(s)
    const id = `table-${crypto.randomUUID()}`
    const table: TableNode = {
      id,
      t: 'table',
      s,
      locked: false,
      r: 0,
      name: 'Table',
      x,
      y,
      w: 90,
      h: 30,
      table: {
        rows: [10, 10, 10],
        cols: [30, 30, 30],
        cells: [
          // Minimal cells
          { r: 0, c: 0, v: '', borderW: 0.2, borderColor: '#000000' },
          { r: 0, c: 1, v: '', borderW: 0.2, borderColor: '#000000' },
          { r: 0, c: 2, v: '', borderW: 0.2, borderColor: '#000000' },
        ],
      },
    }
    // Fill all cells for completeness
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!table.table.cells.find((cell) => cell.r === r && cell.c === c)) {
          table.table.cells.push({ r, c, v: '', borderW: 0.2, borderColor: '#000000' })
        }
      }
    }

    withNewElement(table)
  }

  const shapes = [
    { type: 'rect', icon: <Square size={20} /> },
    { type: 'circle', icon: <Circle size={20} /> },
    { type: 'triangle', icon: <Triangle size={20} /> },
    {
      type: 'trapezoid',
      icon: <TrapezoidIcon size={20} title={resolveText('shape_trapezoid', 'Trapezoid')} />,
    },
    { type: 'diamond', icon: <Diamond size={20} /> },
    { type: 'cylinder', icon: <Database size={20} /> },
    { type: 'heart', icon: <Heart size={20} /> },
    { type: 'star', icon: <Star size={20} /> },
    { type: 'pentagon', icon: <Pentagon size={20} /> },
    { type: 'hexagon', icon: <Hexagon size={20} /> },
    { type: 'arrow-u', icon: <ArrowUp size={20} /> },
    { type: 'arrow-d', icon: <ArrowDown size={20} /> },
    { type: 'arrow-l', icon: <ArrowLeft size={20} /> },
    { type: 'arrow-r', icon: <ArrowRight size={20} /> },
    { type: 'tree', icon: <Trees size={20} /> },
    { type: 'house', icon: <Home size={20} /> },
  ] as const

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-theme-bg-secondary border-r border-theme-border text-theme-text-secondary">
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
        <div className="border-t border-theme-border my-1 w-full" />

        {/* Add Text Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={addText}
              className={TOOLBAR_BUTTON_CLASS}
              aria-label={resolveText('toolbar_add_text', 'Add Text')}
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
              onClick={addImage}
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
              onClick={addLine}
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
              onClick={addTable}
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
            {shapes.map((shape) => (
              <DropdownMenuItem
                key={shape.type}
                onClick={() => addShape(shape.type)}
                className="flex items-center justify-center p-2 rounded cursor-pointer hover:bg-theme-hover text-theme-text-primary"
              >
                {shape.icon}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      {/* Divider before Zoom Controls */}
      <div className="border-t border-theme-border my-3 w-full" />

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
          className="text-theme-text-secondary text-xs font-medium hover:text-theme-object-primary transition-colors"
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
