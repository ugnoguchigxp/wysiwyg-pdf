import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BedDouble,
  Circle,
  Database,
  Diamond,
  Heart,
  Hexagon,
  Home,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  Pentagon,
  Shapes,
  Square,
  Star,
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
  TextNode,
  UnifiedNode,
  WidgetNode,
} from '@/types/canvas'
import { mmToPx, ptToMm, pxToMm } from '@/utils/units'

export type ToolType = 'select' | 'text' | 'image' | 'bed' | 'shape' | 'line'

interface ToolbarProps {
  activeTool: ToolType
  document: Doc
  onAddElement: (element: UnifiedNode) => void
  onSelectElement: (id: string) => void
  onToolSelect?: (tool: ToolType) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  surfaceId?: string
  // Legacy props (can be ignored or removed if parent doesn't pass them,
  // but keeping for interface compatibility if parent strictly types it)
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  i18nOverrides?: Record<string, string>
}

const TOOLBAR_BUTTON_CLASS =
  'w-10 h-10 flex items-center justify-center rounded border border-theme-border bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-object-primary/20 transition-colors'

const ACTIVE_BUTTON_CLASS =
  'w-10 h-10 flex items-center justify-center rounded border-2 border-theme-object-primary bg-theme-object-primary/10 text-theme-object-primary'

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

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  document,
  onAddElement,
  onSelectElement,
  onToolSelect,
  zoom,
  onZoomIn,
  onZoomOut,
  surfaceId,
  i18nOverrides,
}) => {
  const { t } = useI18n()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const shapes = [
    { type: 'Rect', icon: <Square size={20} /> },
    { type: 'Circle', icon: <Circle size={20} /> },
    { type: 'Triangle', icon: <Triangle size={20} /> },
    {
      type: 'Trapezoid',
      icon: <TrapezoidIcon size={20} title={resolveText('shape_trapezoid', 'Trapezoid')} />,
    },
    { type: 'Diamond', icon: <Diamond size={20} /> },
    { type: 'Cylinder', icon: <Database size={20} /> },
    { type: 'Heart', icon: <Heart size={20} /> },
    { type: 'Star', icon: <Star size={20} /> },
    { type: 'Pentagon', icon: <Pentagon size={20} /> },
    { type: 'Hexagon', icon: <Hexagon size={20} /> },
    { type: 'ArrowUp', icon: <ArrowUp size={20} /> },
    { type: 'ArrowDown', icon: <ArrowDown size={20} /> },
    { type: 'ArrowLeft', icon: <ArrowLeft size={20} /> },
    { type: 'ArrowRight', icon: <ArrowRight size={20} /> },
    { type: 'Tree', icon: <Trees size={20} /> },
    { type: 'House', icon: <Home size={20} /> },
  ] as const

  const getButtonClass = (tool: ToolType) => {
    return activeTool === tool ? ACTIVE_BUTTON_CLASS : TOOLBAR_BUTTON_CLASS
  }

  const getTargetSurfaceId = () => {
    if (surfaceId) return surfaceId
    return (
      document.surfaces.find((s) => s.type === 'canvas')?.id || document.surfaces[0]?.id || 'layout'
    )
  }

  const calculateInitialPosition = (targetSurfaceId: string) => {
    const surface = document.surfaces.find((s) => s.id === targetSurfaceId)
    const surfaceW = surface?.w ?? 800
    const surfaceH = surface?.h ?? 600
    const nodesOnSurface = document.nodes.filter((n) => n.s === targetSurfaceId).length
    const offset = nodesOnSurface * (surfaceW * 0.01)
    return {
      x: surfaceW * 0.15 + offset,
      y: surfaceH * 0.15 + offset,
    }
  }

  const withNewElement = (element: UnifiedNode) => {
    onAddElement(element)
    onSelectElement(element.id)
    onToolSelect?.('select')
  }

  const addText = () => {
    const s = getTargetSurfaceId()
    const { x, y } = calculateInitialPosition(s)
    const id = `text-${crypto.randomUUID()}`
    const textContent = resolveText('toolbar_default_text', 'Text')
    const dpi = 96
    const fontSizeMm = ptToMm(12)
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
      x,
      y,
      w: pxToMm(width + 10, { dpi }),
      h: pxToMm(height + 4, { dpi }),
    }
    withNewElement(text)
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
      src: '',
    }
    withNewElement(image)
  }

  const addWall = () => {
    const s = getTargetSurfaceId()
    const { x, y } = calculateInitialPosition(s)
    const id = `wall-${crypto.randomUUID()}`
    const line: LineNode = {
      id,
      t: 'line',
      s,
      locked: false,
      name: 'Wall',
      pts: [x, y, x + 160, y],
      stroke: '#000000',
      strokeW: 0.4,
      arrows: ['none', 'none'],
    }
    withNewElement(line)
  }

  const addShape = (shapeType: string) => {
    const s = getTargetSurfaceId()
    const { x, y } = calculateInitialPosition(s)
    const id = `${shapeType.toLowerCase()}-${crypto.randomUUID()}`

    let width = 80
    let height = 80

    if (shapeType === 'trapezoid') {
      width = 100
      height = 60
    } else if (shapeType === 'cylinder') {
      width = 60
      height = 100
    } else if (['arrow-u', 'arrow-d'].includes(shapeType)) {
      width = 40
      height = 80
    } else if (['arrow-l', 'arrow-r'].includes(shapeType)) {
      width = 80
      height = 40
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
      strokeW: 1,
      fill: '#ffffff',
    }
    withNewElement(shape)
  }

  const addBed = () => {
    const s = getTargetSurfaceId()
    const { x, y } = calculateInitialPosition(s)
    const id = `bed-${crypto.randomUUID()}`
    const bed: WidgetNode = {
      id,
      t: 'widget',
      widget: 'bed',
      s,
      locked: false,
      r: 0,
      name: 'Bed',
      x,
      y,
      w: 15,
      h: 30,
      data: { bedType: 'standard', borderW: 0.4 },
    }
    withNewElement(bed)
  }

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-theme-bg-secondary border-r border-theme-border text-theme-text-secondary h-full">
      <TooltipProvider>
        {/* Select Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onToolSelect?.('select')}
              className={getButtonClass('select')}
              aria-label={resolveText('toolbar_select', 'Select')}
            >
              <MousePointer2 size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{resolveText('toolbar_select', 'Select')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Text Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={addText}
              className={getButtonClass('text')}
              aria-label={resolveText('toolbar_text', 'Text')}
            >
              <Type size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{resolveText('toolbar_text', 'Text')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Image Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={addImage}
              className={getButtonClass('image')}
              aria-label={resolveText('toolbar_image', 'Image')}
            >
              <ImageIcon size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{resolveText('toolbar_image', 'Image')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Bed Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={addBed}
              className={getButtonClass('bed')}
              aria-label={resolveText('toolbar_bed', 'Bed')}
            >
              <BedDouble size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{resolveText('toolbar_bed', 'Bed')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Line Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={addWall}
              className={getButtonClass('line')}
              aria-label={resolveText('toolbar_wall', 'Wall')}
            >
              <Minus size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{resolveText('toolbar_wall', 'Wall')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Shapes Menu */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={getButtonClass('shape')}
                  aria-label={resolveText('toolbar_shape', 'Shape')}
                >
                  <Shapes size={20} />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{resolveText('toolbar_shape', 'Shape')}</TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            align="start"
            className="w-56 grid grid-cols-4 gap-1 p-2 bg-theme-bg-secondary border border-theme-border shadow-lg z-50"
          >
            {shapes.map((shape) => (
              <DropdownMenuItem
                key={shape.type}
                onClick={() => addShape(shape.type.toLowerCase())}
                className="flex items-center justify-center p-2 rounded cursor-pointer hover:bg-theme-bg-tertiary text-theme-text-primary outline-none"
              >
                {shape.icon}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider before Zoom Controls */}
      <div className="border-t border-theme-border my-3 w-full" />

      {/* Zoom Controls */}
      <div className="flex flex-col items-center gap-1 pb-2">
        <button
          type="button"
          onClick={onZoomIn}
          className={`${TOOLBAR_BUTTON_CLASS} disabled:opacity-50`}
          aria-label={resolveText('toolbar_zoom_in', 'Zoom in')}
          disabled={zoom >= 2}
        >
          <ZoomIn size={18} />
        </button>
        <span
          className="text-theme-text-secondary text-xs font-medium"
          aria-label={resolveText('toolbar_zoom_reset', 'Reset zoom')}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={onZoomOut}
          className={`${TOOLBAR_BUTTON_CLASS} disabled:opacity-50`}
          aria-label={resolveText('toolbar_zoom_out', 'Zoom out')}
          disabled={zoom <= 0.25}
        >
          <ZoomOut size={18} />
        </button>
      </div>
    </div>
  )
}
