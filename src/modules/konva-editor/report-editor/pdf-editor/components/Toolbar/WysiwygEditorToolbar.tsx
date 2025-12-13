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
import { useTranslation } from 'react-i18next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../../../components/ui/Tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../../components/ui/DropdownMenu'
import { createContextLogger } from '../../../../../../utils/logger'
import type {
  IImageElement,
  ILineElement,
  IShapeElement,
  ITableElement,
  ITemplateDoc,
  ITextElement,
} from '../../types/wysiwyg'
import { measureText } from '../../utils/textUtils'

const log = createContextLogger('WysiwygEditorToolbar')

const TOOLBAR_BUTTON_CLASS =
  'w-10 h-10 flex items-center justify-center rounded border border-theme-border bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-object-primary/20 transition-colors'

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
  templateDoc: ITemplateDoc
  onTemplateChange: (doc: ITemplateDoc) => void
  onSelectElement: (elementId: string) => void
  currentPageId?: string
  i18nOverrides?: Record<string, string>
}

export const WysiwygEditorToolbar: React.FC<IWysiwygEditorToolbarProps> = ({
  zoom,
  onZoomChange,
  templateDoc,
  onTemplateChange,
  onSelectElement,
  currentPageId,
  i18nOverrides,
}) => {
  const { t } = useTranslation()

  // Helper to resolve translation: Override -> i18next -> Default
  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
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

  const getTargetPageId = () => {
    if (currentPageId) return currentPageId
    return templateDoc.pages[0]?.id ?? 'page-1'
  }

  const getNextZIndex = () => {
    if (!templateDoc.elements.length) return 1
    return Math.max(...templateDoc.elements.map((el) => el.z)) + 1
  }

  const withNewElement = (
    element: ITextElement | IShapeElement | ILineElement | IImageElement | ITableElement
  ) => {
    const nextDoc: ITemplateDoc = {
      ...templateDoc,
      elements: [...templateDoc.elements, element],
    }
    onTemplateChange(nextDoc)
    // Selection is handled by parent's pending logic via Effect
    onSelectElement(element.id)
    log.debug('Element added from toolbar', { id: element.id, type: element.type })
  }

  const addText = () => {
    const pageId = getTargetPageId()
    const id = `text-${crypto.randomUUID()}`
    const textContent = resolveText('toolbar_default_text', 'Text')
    const font = {
      family: 'Meiryo',
      size: 12,
      weight: 400,
    }
    const { width, height } = measureText(textContent, font)

    const text: ITextElement = {
      id,
      type: 'Text',
      pageId,
      z: getNextZIndex(),
      visible: true,
      locked: false,
      rotation: 0,
      name: 'Text',
      text: textContent,
      font,
      color: '#000000',
      align: 'left',
      box: {
        x: 50,
        y: 50,
        width: width + 10,
        height: height + 4,
      },
      listType: 'none',
    }
    withNewElement(text)
  }

  const addShape = (type: IShapeElement['type']) => {
    const pageId = getTargetPageId()
    const id = `${type.toLowerCase()}-${crypto.randomUUID()}`

    let width = 80
    let height = 80

    if (type === 'Trapezoid') {
      width = 100
      height = 60
    } else if (type === 'Cylinder') {
      width = 60
      height = 100
    } else if (['ArrowUp', 'ArrowDown'].includes(type)) {
      width = 40
      height = 80
    } else if (['ArrowLeft', 'ArrowRight'].includes(type)) {
      width = 80
      height = 40
    }

    const shape: IShapeElement = {
      id,
      type,
      pageId,
      z: getNextZIndex(),
      visible: true,
      locked: false,
      rotation: 0,
      name: type,
      box: {
        x: 100,
        y: 100,
        width,
        height,
      },
      stroke: {
        color: '#000000',
        width: 1,
      },
      fill: {
        color: '#ffffff',
      },
    }
    withNewElement(shape)
  }

  const addLine = () => {
    const pageId = getTargetPageId()
    const id = `line-${crypto.randomUUID()}`
    const line: ILineElement = {
      id,
      type: 'Line',
      pageId,
      z: getNextZIndex(),
      visible: true,
      locked: false,
      rotation: 0,
      name: 'Line',
      startPoint: { x: 60, y: 340 },
      endPoint: { x: 220, y: 340 },
      stroke: {
        color: '#000000',
        width: 1,
      },
      startArrow: 'none',
      endArrow: 'none',
    }
    withNewElement(line)
  }

  const addImage = () => {
    const pageId = getTargetPageId()
    const id = `image-${crypto.randomUUID()}`
    const image: IImageElement = {
      id,
      type: 'Image',
      pageId,
      z: getNextZIndex(),
      visible: true,
      locked: false,
      rotation: 0,
      name: 'Image',
      box: {
        x: 150,
        y: 420,
        width: 120,
        height: 80,
      },
      assetId: '',
    }
    withNewElement(image)
  }

  const addTable = () => {
    const pageId = getTargetPageId()
    const id = `table-${crypto.randomUUID()}`
    const table: ITableElement = {
      id,
      type: 'Table',
      pageId,
      z: getNextZIndex(),
      visible: true,
      locked: false,
      rotation: 0,
      name: 'Table',
      box: {
        x: 50, // Default position
        y: 50,
        width: 300, // 3 cols * 100
        height: 150, // 3 rows * 50
      },
      rowCount: 3,
      colCount: 3,
      rows: [
        { id: 'r1', height: 50 },
        { id: 'r2', height: 50 },
        { id: 'r3', height: 50 },
      ],
      cols: [
        { id: 'c1', width: 100 },
        { id: 'c2', width: 100 },
        { id: 'c3', width: 100 },
      ],
      cells: [
        // Row 0
        {
          row: 0,
          col: 0,
          content: '',
          styles: {
            align: 'left',
            verticalAlign: 'top',
            backgroundColor: '#f0f0f0',
            borderWidth: 1,
            borderColor: '#000000',
          },
        },
        {
          row: 0,
          col: 1,
          content: '',
          styles: {
            align: 'left',
            verticalAlign: 'top',
            backgroundColor: '#f0f0f0',
            borderWidth: 1,
            borderColor: '#000000',
          },
        },
        {
          row: 0,
          col: 2,
          content: '',
          styles: {
            align: 'left',
            verticalAlign: 'top',
            backgroundColor: '#f0f0f0',
            borderWidth: 1,
            borderColor: '#000000',
          },
        },
        // Row 1
        {
          row: 1,
          col: 0,
          content: '',
          styles: { align: 'left', verticalAlign: 'top', borderWidth: 1, borderColor: '#000000' },
        },
        {
          row: 1,
          col: 1,
          content: '',
          styles: { align: 'left', verticalAlign: 'top', borderWidth: 1, borderColor: '#000000' },
        },
        {
          row: 1,
          col: 2,
          content: '',
          styles: { align: 'left', verticalAlign: 'top', borderWidth: 1, borderColor: '#000000' },
        },
        // Row 2
        {
          row: 2,
          col: 0,
          content: '',
          styles: { align: 'left', verticalAlign: 'top', borderWidth: 1, borderColor: '#000000' },
        },
        {
          row: 2,
          col: 1,
          content: '',
          styles: { align: 'left', verticalAlign: 'top', borderWidth: 1, borderColor: '#000000' },
        },
        {
          row: 2,
          col: 2,
          content: '',
          styles: { align: 'left', verticalAlign: 'top', borderWidth: 1, borderColor: '#000000' },
        },
      ],
    }
    withNewElement(table)
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

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-theme-bg-secondary border-r border-theme-border text-theme-text-secondary">
      <TooltipProvider>
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
          <TooltipContent side="right">{resolveText('toolbar_add_text', 'Add Text')}</TooltipContent>
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
          <TooltipContent side="right">{resolveText('toolbar_add_image', 'Add Image')}</TooltipContent>
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
          aria-label="Zoom in"
          disabled={zoom >= 200}
        >
          <ZoomIn size={18} />
        </button>
        <button
          type="button"
          onClick={handleZoomReset}
          className="text-theme-text-secondary text-xs font-medium hover:text-theme-object-primary transition-colors"
          aria-label="Reset zoom"
        >
          {zoom}%
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className={`${TOOLBAR_BUTTON_CLASS} disabled:opacity-50`}
          aria-label="Zoom out"
          disabled={zoom <= 25}
        >
          <ZoomOut size={18} />
        </button>
      </div>
    </div>
  )
}
