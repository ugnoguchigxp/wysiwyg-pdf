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
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/Tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/DropdownMenu'

export type ToolType = 'select' | 'text' | 'image' | 'bed' | 'shape' | 'line'

interface ToolbarProps {
  activeTool: ToolType
  onSelectTool: (tool: ToolType, subType?: string) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
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
  onSelectTool,
  zoom,
  onZoomIn,
  onZoomOut,
  i18nOverrides,
}) => {
  const { t } = useTranslation()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
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

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-theme-bg-secondary border-r border-theme-border text-theme-text-secondary h-full">
      <TooltipProvider>
        {/* Text Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectTool('text')}
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
              onClick={() => onSelectTool('image')}
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
              onClick={() => onSelectTool('bed')}
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
              onClick={() => onSelectTool('line')}
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
                  className={getButtonClass('shape')}
                  aria-label={resolveText('toolbar_shape', 'Shape')}
                >
                  <Shapes size={20} />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{resolveText('toolbar_shape', 'Shape')}</TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="start" className="w-56 grid grid-cols-4 gap-1 p-2 bg-theme-bg-secondary border border-theme-border shadow-lg z-50">
            {shapes.map((shape) => (
              <DropdownMenuItem
                key={shape.type}
                onClick={() => onSelectTool('shape', shape.type)}
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
        <button
          type="button"
          className="text-theme-text-secondary text-xs font-medium hover:text-theme-object-primary transition-colors"
          aria-label={resolveText('toolbar_zoom_reset', 'Reset zoom')}
          // Assuming no reset handler passed yet, just display
          onClick={() => { }}
        >
          {Math.round(zoom * 100)}%
        </button>
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

