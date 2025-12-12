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
  Redo2,
  Shapes,
  Square,
  Star,
  Trees,
  Triangle,
  Type,
  Undo2,
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

export type ToolType = 'select' | 'text' | 'image' | 'bed' | 'shape' | 'line'

interface ToolbarProps {
  activeTool: ToolType
  onSelectTool: (tool: ToolType, subType?: string) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
}

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
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
}) => {
  const { t } = useTranslation()
  const [isShapeMenuOpen, setIsShapeMenuOpen] = React.useState(false)
  const shapeMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(event.target as Node)) {
        setIsShapeMenuOpen(false)
      }
    }

    if (isShapeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isShapeMenuOpen])

  const shapes = [
    { type: 'Rect', icon: <Square size={20} /> },
    { type: 'Circle', icon: <Circle size={20} /> },
    { type: 'Triangle', icon: <Triangle size={20} /> },
    {
      type: 'Trapezoid',
      icon: <TrapezoidIcon size={20} title={t('shape_trapezoid', 'Trapezoid')} />,
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

  return (
    <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4 h-full">
      <div className="flex flex-col gap-2 w-full px-2">
        <TooltipProvider>
          {/* Text Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectTool('text')}
                className={`p-2 rounded-lg flex flex-col items-center justify-center w-full aspect-square transition-all duration-200 ${
                  activeTool === 'text'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Type className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('toolbar_text')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Image Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectTool('image')}
                className={`p-2 rounded-lg flex flex-col items-center justify-center w-full aspect-square transition-all duration-200 ${
                  activeTool === 'image'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <ImageIcon className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('toolbar_image')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Bed Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectTool('bed')}
                className={`p-2 rounded-lg flex flex-col items-center justify-center w-full aspect-square transition-all duration-200 ${
                  activeTool === 'bed'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <BedDouble className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('toolbar_bed')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Line Tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectTool('line')}
                className={`p-2 rounded-lg flex flex-col items-center justify-center w-full aspect-square transition-all duration-200 ${
                  activeTool === 'line'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Minus className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('toolbar_wall', 'Wall')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Shapes Menu */}
          <div className="relative w-full" ref={shapeMenuRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsShapeMenuOpen(!isShapeMenuOpen)}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center w-full aspect-square transition-all duration-200 ${
                    isShapeMenuOpen || activeTool === 'shape'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Shapes className="w-6 h-6" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('toolbar_shape')}</p>
              </TooltipContent>
            </Tooltip>

            {isShapeMenuOpen && (
              <div className="absolute left-full top-0 ml-2 p-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-48 grid grid-cols-4 gap-1">
                {/* Other Shapes */}
                {shapes.map((shape) => (
                  <button
                    key={shape.type}
                    type="button"
                    onClick={() => {
                      onSelectTool('shape', shape.type)
                      setIsShapeMenuOpen(false)
                    }}
                    className="p-2 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors"
                    title={shape.type}
                  >
                    {shape.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </TooltipProvider>
      </div>

      <div className="w-8 h-px bg-border my-4" />

      <div className="flex flex-col gap-2 w-full px-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent flex justify-center"
              >
                <Undo2 className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('toolbar_undo')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent flex justify-center"
              >
                <Redo2 className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('toolbar_redo')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="w-8 h-px bg-border my-4" />

      <div className="flex flex-col gap-2 w-full px-2 items-center pb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onZoomIn}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground flex justify-center w-full"
              >
                <ZoomIn className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('toolbar_zoom_in')}</p>
            </TooltipContent>
          </Tooltip>
          <span className="text-xs font-medium text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onZoomOut}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground flex justify-center w-full"
              >
                <ZoomOut className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('toolbar_zoom_out')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
