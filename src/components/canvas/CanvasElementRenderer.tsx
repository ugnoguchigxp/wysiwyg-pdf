import type Konva from 'konva'
import type React from 'react'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import {
  Ellipse,
  Group,
  Image as KonvaImage,
  Line,
  Path,
  Rect,
  Star,
  Text,
} from 'react-konva'
import { findImageWithExtension } from '../../modules/konva-editor/report-editor/pdf-editor/components/WysiwygCanvas/canvasImageUtils'
import type {
  UnifiedNode,
  TextNode,
  ShapeNode,
  LineNode,
  ImageNode,
  TableNode,
  SignatureNode,
} from '../../types/canvas'

export type CanvasShapeRefCallback = (node: Konva.Node | null) => void

export type CanvasElementCommonProps = Konva.NodeConfig & {
  ref: CanvasShapeRefCallback
}

// Helpers
const isWHElement = (node: UnifiedNode): node is Extract<UnifiedNode, { w: number, h: number, x: number, y: number }> => {
  return node.t !== 'line' // Line does not have w/h/x/y in the same way (pts only)
}

type TransformableNode = Konva.Node & {
  x(): number
  y(): number
  width(): number
  height(): number
  scaleX(): number
  scaleY(): number
  rotation(): number
}

interface CanvasElementRendererProps {
  element: UnifiedNode
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<UnifiedNode> & { id?: string }) => void
  onDblClick?: () => void
  onCellDblClick?: (elementId: string, row: number, col: number) => void
  onCellClick?: (elementId: string, row: number, col: number) => void
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void
  editingCell?: { elementId: string; row: number; col: number } | null
  selectedCell?: { row: number; col: number } | null
  isEditing?: boolean
  readOnly?: boolean
  renderCustom?: (
    element: UnifiedNode,
    commonProps: CanvasElementCommonProps,
    shapeRef: CanvasShapeRefCallback
  ) => React.ReactNode
}

// Separate component for Image to handle loading state
const CanvasImage = forwardRef<
  Konva.Image | Konva.Group,
  { element: ImageNode; commonProps: CanvasElementCommonProps }
>(({ element, commonProps }, ref) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error' | 'empty'>('empty')

  useEffect(() => {
    if (!element.src) {
      setStatus('empty')
      setImage(null)
      return
    }

    setStatus('loading')

    // Support both direct URL and extension lookup if needed (assuming src is URL for now based on V2, but let's keep findImage logic if src looks like an ID?)
    // V2 Schema says src: string (URL or base64).
    // If it's a simple ID, we might need findImageWithExtension.
    // Let's assume valid URL first, or check if it has extension.
    if (element.src.startsWith('http') || element.src.startsWith('data:')) {
      const img = new window.Image()
      img.src = element.src
      img.onload = () => {
        setImage(img)
        setStatus('loaded')
      }
      img.onerror = () => {
        setStatus('error')
      }
    } else {
      // Fallback/Legacy ID behavior
      findImageWithExtension(element.src)
        .then((result) => {
          if (result) {
            setImage(result.img)
            setStatus('loaded')
          } else {
            setStatus('error')
          }
        })
        .catch((_err) => {
          setStatus('error')
        })
    }
  }, [element.src])

  const { ref: _ignoredRef, ...propsWithoutRef } = commonProps

  if (status === 'loaded' && image) {
    return (
      <KonvaImage
        {...propsWithoutRef}
        image={image}
        width={element.w}
        height={element.h}
        ref={ref as React.Ref<Konva.Image>}
        opacity={element.opacity ?? 1}
      />
    )
  }

  // Placeholder styling
  const isError = status === 'error'
  const isLoading = status === 'loading'
  const bgColor = isError ? '#fee2e2' : isLoading ? '#eff6ff' : '#e5e7eb'
  const borderColor = isError ? '#ef4444' : isLoading ? '#3b82f6' : '#6b7280'
  const textColor = isError ? '#b91c1c' : isLoading ? '#1d4ed8' : '#374151'
  const labelText = isError ? 'Error' : isLoading ? 'Loading...' : 'Image'

  return (
    <Group {...propsWithoutRef} ref={ref as React.Ref<Konva.Group>}>
      <Rect
        width={element.w}
        height={element.h}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={3}
      />
      <Text
        x={0}
        y={0}
        width={element.w}
        height={element.h}
        text={labelText}
        fill={textColor}
        align="center"
        verticalAlign="middle"
        fontSize={14}
        fontStyle="bold"
        fontFamily="Helvetica"
      />
    </Group>
  )
})

export const CanvasElementRenderer: React.FC<CanvasElementRendererProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDblClick,
  onCellDblClick: _onCellDblClick,
  onCellClick: _onCellClick,
  onContextMenu,
  isEditing: _isEditing,
  editingCell: _editingCell,
  selectedCell: _selectedCell,
  renderCustom,
  readOnly,
}) => {
  const shapeRef = useRef<Konva.Node | null>(null)
  const trRef = useRef<Konva.Transformer | null>(null)

  const handleShapeRef = useCallback(
    (node: Konva.Node | null) => {
      shapeRef.current = node
      if (isSelected && trRef.current && node) {
        trRef.current.nodes([node])
        trRef.current.getLayer()?.batchDraw()
      }
    },
    [isSelected]
  )

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      if (element.t !== 'line') {
        trRef.current.nodes([shapeRef.current])
        trRef.current.getLayer()?.batchDraw()
      } else {
        trRef.current.nodes([]) // Line handled separately usually, or via standard transformer? 
        // V2 Line has pts. Transformer works on w/h. 
        // We usually don't transform lines with standard box transformer.
      }
    }
  }, [isSelected, element.t])

  // Text Auto-resize
  useEffect(() => {
    if (element.t !== 'text' || !shapeRef.current) return
    const node = shapeRef.current as Konva.Text | null
    if (!node) return

    const height = node.height()
    const currentHeight = element.h ?? 0
    if (Math.abs(height - currentHeight) > 1) {
      onChange({
        id: element.id,
        h: height,
      })
    }
  }, [element, onChange])

  const handleTransformEnd = () => {
    const node = shapeRef.current as TransformableNode | null
    if (!node || !isWHElement(element)) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    node.scaleX(1)
    node.scaleY(1)

    const newWidth = Math.max(5, node.width() * scaleX)
    const newHeight = Math.max(5, node.height() * scaleY)

    let newX = node.x()
    let newY = node.y()

    // Shapes like Circle are drawn from center if we used offsetX, but here we render with explicit x/y/w/h usually.
    // Let's check how we render shapes. 
    // If we use standard Rect, x/y is top-left.
    // If we use Ellipse, x/y is center.
    // We should adjust consistent with renderer.

    if (element.t === 'shape') {
      const type = element.shape
      if (['circle', 'star', 'pentagon', 'hexagon'].includes(type as string)) {
        // These are centered. Konva Node x/y tracks the center.
        // We want newX to be top-left of bounding box.
        newX -= newWidth / 2
        newY -= newHeight / 2
      }
    }

    if (element.t === 'table') {
      const tableElement = element as TableNode
      const oldWidth = tableElement.w || 1
      const oldHeight = tableElement.h || 1
      const widthRatio = newWidth / oldWidth
      const heightRatio = newHeight / oldHeight

      const newCols = tableElement.table.cols.map((w) => w * widthRatio)
      const newRows = tableElement.table.rows.map((h) => h * heightRatio)

      onChange({
        id: element.id,
        x: newX,
        y: newY,
        w: newWidth,
        h: newHeight,
        r: node.rotation(),
        table: {
          ...tableElement.table,
          cols: newCols,
          rows: newRows
        }
      } as unknown as Partial<UnifiedNode>)
      return
    }

    onChange({
      id: element.id,
      x: newX,
      y: newY,
      w: newWidth,
      h: newHeight,
      r: node.rotation(),
    })
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (isWHElement(element)) {
      let newX = e.target.x()
      let newY = e.target.y()

      if (element.t === 'shape') {
        if (['circle', 'star', 'pentagon', 'hexagon'].includes(element.shape as string)) {
          newX -= element.w / 2
          newY -= element.h / 2
        }
      }

      onChange({
        id: element.id,
        x: newX,
        y: newY,
      })
    } else if (element.t === 'line') {
      // Line Dragging
      const node = e.target
      const dx = node.x()
      const dy = node.y()
      const line = element as LineNode

      // Update pts
      const newPts = line.pts.map((p, i) => i % 2 === 0 ? p + dx : p + dy)

      onChange({
        id: element.id,
        pts: newPts,
      })

      node.x(0)
      node.y(0)
    }
  }

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (element.locked) return
    const container = e.target.getStage()?.container()
    if (container) container.style.cursor = 'move'
  }

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container()
    if (container) container.style.cursor = 'default'
  }

  const commonProps: CanvasElementCommonProps = {
    id: element.id,
    x: element.t === 'line' ? 0 : (element.x ?? 0),
    y: element.t === 'line' ? 0 : (element.y ?? 0),
    width: element.t === 'line' ? 0 : (element.w ?? 0), // Line doesn't use width in common props usually
    height: element.t === 'line' ? 0 : (element.h ?? 0),
    rotation: element.r || 0,
    draggable: readOnly ? false : !element.locked,
    onMouseDown: onSelect,
    onTap: onSelect,
    onDblClick,
    ref: handleShapeRef,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    visible: !element.hidden,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => onContextMenu?.(e),
  }

  // Try custom renderer first (e.g. for widgets or platform specific nodes)
  if (renderCustom) {
    const custom = renderCustom(element, commonProps, handleShapeRef)
    if (custom) return <>{custom}</>
  }

  switch (element.t) {
    case 'text': {
      const { text, font, fontSize, fontWeight, italic, underline, lineThrough, fill, align, vAlign } = element as TextNode
      return (
        <Text
          {...commonProps}
          height={undefined} // Auto-height
          text={text}
          fontSize={fontSize}
          fontFamily={font}
          fontStyle={`${italic ? 'italic ' : ''}${fontWeight && fontWeight >= 700 ? 'bold' : ''}`.trim() || 'normal'}
          textDecoration={[underline ? 'underline' : '', lineThrough ? 'line-through' : ''].filter(Boolean).join(' ')}
          fill={fill}
          align={align === 'l' ? 'left' : align === 'r' ? 'right' : align === 'c' ? 'center' : 'justify'}
          verticalAlign={vAlign === 't' ? 'top' : vAlign === 'b' ? 'bottom' : 'middle'}
          width={element.w}
        />
      )
    }
    case 'shape': {
      const shape = element as ShapeNode
      switch (shape.shape) {
        case 'rect':
          return <Rect {...commonProps} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} cornerRadius={shape.radius} />
        case 'circle':
          // Ellipse centered
          return <Ellipse {...commonProps}
            x={(shape.x || 0) + (shape.w || 0) / 2}
            y={(shape.y || 0) + (shape.h || 0) / 2}
            radiusX={(shape.w || 0) / 2}
            radiusY={(shape.h || 0) / 2}
            fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} />
        case 'triangle':
          return <Line {...commonProps} points={[shape.w / 2, 0, shape.w, shape.h, 0, shape.h]} closed fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} />
        case 'diamond':
          return <Line {...commonProps} points={[shape.w / 2, 0, shape.w, shape.h / 2, shape.w / 2, shape.h, 0, shape.h / 2]} closed fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} />
        case 'star':
          return <Star {...commonProps} x={(shape.x || 0) + shape.w / 2} y={(shape.y || 0) + shape.h / 2} numPoints={5} innerRadius={Math.min(shape.w, shape.h) / 4} outerRadius={Math.min(shape.w, shape.h) / 2} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} />
        // ... (Add other shapes if needed, keeping it simple for now as requested by user plan emphasis on structure)
        case 'arrow-u':
          return <Path {...commonProps} data="M12 4l-8 8h6v8h4v-8h6z" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} scaleX={shape.w / 24} scaleY={shape.h / 24} />
        // ...
        default:
          return <Rect {...commonProps} fill={shape.fill} stroke={shape.stroke} />
      }
    }
    case 'line': {
      const line = element as LineNode
      // Render line
      return (
        <Group>
          <Line {...commonProps} points={line.pts} stroke={line.stroke} strokeWidth={line.strokeW} dash={line.dash} />
          {/* Markers - need calculation of angle */}
        </Group>
      )
    }
    case 'image':
      return <CanvasImage element={element as ImageNode} commonProps={commonProps} ref={shapeRef as any} />

    case 'table': {
      const tbl = element as TableNode
      // Simplified table support
      return (
        <Group {...commonProps}>
          <Rect width={tbl.w} height={tbl.h} stroke="black" />
          <Text text="Table (Preview)" x={5} y={5} />
        </Group>
      )
    }

    case 'signature': {
      const sig = element as SignatureNode
      return (
        <Group {...commonProps}>
          {/* Transparent hit box */}
          <Rect width={sig.w} height={sig.h} fill="transparent" />
          {sig.strokes.map((stroke, i) => (
            <Line key={i} points={stroke} stroke={sig.stroke} strokeWidth={sig.strokeW} lineCap="round" lineJoin="round" />
          ))}
        </Group>
      )
    }

    default:
      return null
  }
}
