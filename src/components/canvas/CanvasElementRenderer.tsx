import type Konva from 'konva'
import type React from 'react'
import { forwardRef, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import {
  Circle,
  Ellipse,
  Group,
  Image as KonvaImage,
  Line,
  Path,
  Rect,
  Star,
  Text,
  Transformer,
} from 'react-konva'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'
import { LineMarker } from './LineMarker'
import type {
  Anchor,
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
  snapStrength?: number
  gridSize?: number
  showGrid?: boolean
  readOnly?: boolean
  allElements?: UnifiedNode[]
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
  onCellDblClick,
  onCellClick,
  onContextMenu,
  isEditing: _isEditing,
  editingCell: _editingCell,
  selectedCell: _selectedCell,
  renderCustom,
  readOnly,
  allElements,
  snapStrength = 5,
  gridSize = 15,
  showGrid = false,
}) => {
  const shapeRef = useRef<Konva.Node | null>(null)
  const trRef = useRef<Konva.Transformer | null>(null)
  const isLineHandleDraggingRef = useRef(false)
  const lineVisualRef = useRef<Konva.Line | null>(null)
  const lineStartHandleRef = useRef<Konva.Circle | null>(null)
  const lineEndHandleRef = useRef<Konva.Circle | null>(null)
  const lineStartMarkerGroupRef = useRef<Konva.Group | null>(null)
  const lineEndMarkerGroupRef = useRef<Konva.Group | null>(null)
  const lineDraftPtsRef = useRef<number[] | null>(null)

  const anchorOverlayGroupRef = useRef<Konva.Group | null>(null)
  const anchorCircleMapRef = useRef<Map<string, Konva.Circle>>(new Map())
  const lastHighlightedAnchorKeyRef = useRef<string | null>(null)

  type Conn = { nodeId: string; anchor: Anchor } | undefined
  const startConnDraftRef = useRef<Conn>(undefined)
  const endConnDraftRef = useRef<Conn>(undefined)

  const handleShapeRef = useCallback(
    (node: Konva.Node | null) => {
      shapeRef.current = node
      if (isSelected && trRef.current) {
        if (node) {
          trRef.current.nodes([node])
        } else {
          trRef.current.nodes([])
        }
        trRef.current.getLayer()?.batchDraw()
      }
    },
    [isSelected]
  )

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected, element.t, element.w, element.h])

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

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isWHElement(element)) return
    if (!allElements || allElements.length === 0) return

    const targetId = element.id
    const connected = allElements.filter(
      (n): n is LineNode =>
        n.t === 'line' &&
        (n.startConn?.nodeId === targetId || n.endConn?.nodeId === targetId)
    )
    if (connected.length === 0) return

    const stage = e.target.getStage()
    if (!stage) return

    const w = element.w ?? 0
    const h = element.h ?? 0

    let topLeftX = e.target.x()
    let topLeftY = e.target.y()

    if (element.t === 'shape') {
      const shape = element as ShapeNode
      if (['circle', 'star', 'pentagon', 'hexagon'].includes(shape.shape as string)) {
        topLeftX = topLeftX - w / 2
        topLeftY = topLeftY - h / 2
      }
    }

    const anchorPointForThis = (anchor: Anchor): { x: number; y: number } => {
      switch (anchor) {
        case 'tl': return { x: topLeftX, y: topLeftY }
        case 't': return { x: topLeftX + w / 2, y: topLeftY }
        case 'tr': return { x: topLeftX + w, y: topLeftY }
        case 'l': return { x: topLeftX, y: topLeftY + h / 2 }
        case 'r': return { x: topLeftX + w, y: topLeftY + h / 2 }
        case 'bl': return { x: topLeftX, y: topLeftY + h }
        case 'b': return { x: topLeftX + w / 2, y: topLeftY + h }
        case 'br': return { x: topLeftX + w, y: topLeftY + h }
        default:
          return { x: topLeftX + w / 2, y: topLeftY + h / 2 }
      }
    }

    for (const ln of connected) {
      const lineGroup = stage.findOne(`#${ln.id}`) as Konva.Group | null
      if (!lineGroup) continue

      const lineBody = lineGroup.findOne('.line-body') as Konva.Line | null
      if (!lineBody) continue

      const currentPts = lineBody.points()
      const nextPts = [...currentPts]
      const endIdx = Math.max(0, nextPts.length - 2)

      if (ln.startConn?.nodeId === targetId) {
        const p = anchorPointForThis(ln.startConn.anchor)
        nextPts[0] = p.x
        nextPts[1] = p.y
      }
      if (ln.endConn?.nodeId === targetId) {
        const p = anchorPointForThis(ln.endConn.anchor)
        nextPts[endIdx] = p.x
        nextPts[endIdx + 1] = p.y
      }

      lineBody.points(nextPts)

      const dx = nextPts[endIdx] - nextPts[0]
      const dy = nextPts[endIdx + 1] - nextPts[1]
      const angleToEnd = Math.atan2(dy, dx)
      const angleToStart = angleToEnd + Math.PI

      const startHandle = lineGroup.findOne('.line-handle-start') as Konva.Circle | null
      if (startHandle) startHandle.position({ x: nextPts[0], y: nextPts[1] })
      const endHandle = lineGroup.findOne('.line-handle-end') as Konva.Circle | null
      if (endHandle) endHandle.position({ x: nextPts[endIdx], y: nextPts[endIdx + 1] })

      const startMarker = lineGroup.findOne('.line-marker-start') as Konva.Group | null
      if (startMarker) {
        startMarker.position({ x: nextPts[0], y: nextPts[1] })
        startMarker.rotation((angleToStart * 180) / Math.PI)
      }
      const endMarker = lineGroup.findOne('.line-marker-end') as Konva.Group | null
      if (endMarker) {
        endMarker.position({ x: nextPts[endIdx], y: nextPts[endIdx + 1] })
        endMarker.rotation((angleToEnd * 180) / Math.PI)
      }

      lineGroup.getLayer()?.batchDraw()
    }
  }

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (element.locked || isSelected) return // Skip cursor change for selected elements (Transformer handles it)
    const container = e.target.getStage()?.container()
    if (container) container.style.cursor = 'move'
  }

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isSelected) return // Skip for selected elements
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
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    visible: !element.hidden,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => onContextMenu?.(e),
    dragBoundFunc: function (pos) {
      // Determine the effective snap interval
      // If grid is shown, strict snap to grid lines (gridSize).
      // Otherwise, use snapStrength (manual setting).
      let snap = 0
      if (showGrid && gridSize > 0) {
        snap = gridSize
      } else if (snapStrength > 0) {
        snap = snapStrength
      }

      if (snap <= 0) return pos

      const stage = this.getStage()
      if (!stage) return pos

      const transform = stage.getAbsoluteTransform().copy()
      transform.invert()
      const logicalPos = transform.point(pos)

      const snappedLogicalX = Math.round(logicalPos.x / snap) * snap
      const snappedLogicalY = Math.round(logicalPos.y / snap) * snap

      // Convert back to absolute
      const absoluteTransform = stage.getAbsoluteTransform()
      const snappedPos = absoluteTransform.point({ x: snappedLogicalX, y: snappedLogicalY })

      return snappedPos
    },
  }

  const content = useMemo(() => {
    // Try custom renderer first
    if (renderCustom) {
      const custom = renderCustom(element, commonProps, handleShapeRef)
      if (custom) return custom
    }

    switch (element.t) {
      case 'text': {
        const { text, font, fontSize, fontWeight, italic, underline, lineThrough, fill, align, vAlign, stroke, strokeW } = element as TextNode
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
            stroke={stroke}
            strokeWidth={strokeW}
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
          case 'trapezoid':
            const w = shape.w
            const h = shape.h
            return <Line {...commonProps} points={[w * 0.2, 0, w * 0.8, 0, w, h, 0, h]} closed fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} />
          case 'cylinder':
            // Simplified cylinder: rect + ellipses (handling strictly via Path or multiple shapes is complex in single component return. Using Path for visual approximation)
            // Using simple Rect for now as fallback or Path if defined.
            return <Rect {...commonProps} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} />
          case 'arrow-u':
            return <Path {...commonProps} data="M12 4l-8 8h6v8h4v-8h6z" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} scaleX={shape.w / 24} scaleY={shape.h / 24} />
          case 'arrow-d':
            return <Path {...commonProps} data="M12 20l-8-8h6v-8h4v8h6z" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} scaleX={shape.w / 24} scaleY={shape.h / 24} />
          case 'arrow-l':
            return <Path {...commonProps} data="M4 12l8-8v6h8v4h-8v6z" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} scaleX={shape.w / 24} scaleY={shape.h / 24} />
          case 'arrow-r':
            return <Path {...commonProps} data="M20 12l-8-8v6h-8v4h8v6z" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} scaleX={shape.w / 24} scaleY={shape.h / 24} />
          case 'tree':
            return <Path {...commonProps} data="M12,2L2,12h4v8h12v-8h4L12,2z" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} scaleX={shape.w / 24} scaleY={shape.h / 24} />
          case 'house':
            return <Path {...commonProps} data="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeW} scaleX={shape.w / 24} scaleY={shape.h / 24} />
          default:
            return <Rect {...commonProps} fill={shape.fill} stroke={shape.stroke} />
        }
      }
      case 'line': {
        const line = element as LineNode

        const nodesForSnap = (allElements || []).filter((n) => n.id !== line.id)

        const anchors: Anchor[] = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br']

        const getAnchorPoint = (n: UnifiedNode, anchor: Anchor): { x: number; y: number } | null => {
          if (n.t === 'line') return null
          if (n.x === undefined || n.y === undefined || n.w === undefined || n.h === undefined) return null
          const x = n.x
          const y = n.y
          const w = n.w
          const h = n.h
          switch (anchor) {
            case 'tl': return { x, y }
            case 't': return { x: x + w / 2, y }
            case 'tr': return { x: x + w, y }
            case 'l': return { x, y: y + h / 2 }
            case 'r': return { x: x + w, y: y + h / 2 }
            case 'bl': return { x, y: y + h }
            case 'b': return { x: x + w / 2, y: y + h }
            case 'br': return { x: x + w, y: y + h }
            default:
              return { x: x + w / 2, y: y + h / 2 }
          }
        }

        const resolveEndpoint = (conn: LineNode['startConn'] | LineNode['endConn'] | undefined): { x: number; y: number } | null => {
          if (!conn) return null
          const target = nodesForSnap.find((n) => n.id === conn.nodeId)
          if (!target) return null
          return getAnchorPoint(target, conn.anchor)
        }

        const basePts = line.pts || [0, 0, 100, 0]
        const resolvedStart = resolveEndpoint(line.startConn)
        const resolvedEnd = resolveEndpoint(line.endConn)

        // Use resolved endpoints for rendering (connector follow)
        const pts = [...basePts]
        if (resolvedStart) {
          pts[0] = resolvedStart.x
          pts[1] = resolvedStart.y
        }
        if (resolvedEnd) {
          pts[pts.length - 2] = resolvedEnd.x
          pts[pts.length - 1] = resolvedEnd.y
        }

        const snapStep = (showGrid && gridSize > 0) ? gridSize : (snapStrength > 0 ? snapStrength : 0)

        const snapToGrid = (pos: { x: number; y: number }) => {
          if (!snapStep) return pos
          return {
            x: Math.round(pos.x / snapStep) * snapStep,
            y: Math.round(pos.y / snapStep) * snapStep,
          }
        }

        const snap45 = (moving: { x: number; y: number }, fixed: { x: number; y: number }) => {
          const dx = moving.x - fixed.x
          const dy = moving.y - fixed.y
          const angle = Math.atan2(dy, dx)
          const dist = Math.sqrt(dx * dx + dy * dy)
          const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
          return {
            x: fixed.x + Math.cos(snapAngle) * dist,
            y: fixed.y + Math.sin(snapAngle) * dist,
          }
        }

        const applyDraftToVisuals = (draftPts: number[]) => {
          const endIdx = Math.max(0, draftPts.length - 2)
          // Update line + endpoint handles
          lineVisualRef.current?.points(draftPts)
          lineStartHandleRef.current?.position({ x: draftPts[0], y: draftPts[1] })
          lineEndHandleRef.current?.position({ x: draftPts[endIdx], y: draftPts[endIdx + 1] })

          // Update arrow markers (position + rotation)
          const dx = draftPts[endIdx] - draftPts[0]
          const dy = draftPts[endIdx + 1] - draftPts[1]
          const angleToEnd = Math.atan2(dy, dx)
          const angleToStart = angleToEnd + Math.PI

          if (lineStartMarkerGroupRef.current) {
            lineStartMarkerGroupRef.current.position({ x: draftPts[0], y: draftPts[1] })
            lineStartMarkerGroupRef.current.rotation((angleToStart * 180) / Math.PI)
          }
          if (lineEndMarkerGroupRef.current) {
            lineEndMarkerGroupRef.current.position({ x: draftPts[endIdx], y: draftPts[endIdx + 1] })
            lineEndMarkerGroupRef.current.rotation((angleToEnd * 180) / Math.PI)
          }

          lineVisualRef.current?.getLayer()?.batchDraw()
        }

        const startHandleDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
          isLineHandleDraggingRef.current = true
          lineDraftPtsRef.current = [...pts]
          startConnDraftRef.current = line.startConn
          endConnDraftRef.current = line.endConn

          if (anchorOverlayGroupRef.current) {
            anchorOverlayGroupRef.current.visible(true)
          }
          const group = e.target.getParent()
          if (group) (group as Konva.Group).draggable(false)
          e.cancelBubble = true
        }

        const moveHandleDrag = (pointIndex: number, e: Konva.KonvaEventObject<DragEvent>) => {
          const base = lineDraftPtsRef.current || [...pts]

          const endIdx = Math.max(0, base.length - 2)

          let nextPos = { x: e.target.x(), y: e.target.y() }

          const other = pointIndex === 0
            ? { x: base[endIdx], y: base[endIdx + 1] }
            : { x: base[0], y: base[1] }

          if (e.evt.shiftKey) {
            nextPos = snap45(nextPos, other)
          } else {
            nextPos = snapToGrid(nextPos)
          }

          // Connector snap (8-point anchors). Applied after grid/shift.
          const threshold = 12
          const showMargin = 80
          let best: { nodeId: string; anchor: Anchor; x: number; y: number; dist2: number } | null = null

          const baseStroke = '#0f766e'
          const glowColor = '#34d399'
          const activeFill = '#059669'
          const activeStroke = '#064e3b'

          // Update anchor overlay visibility + reset highlight
          if (anchorOverlayGroupRef.current) {
            for (const circle of anchorCircleMapRef.current.values()) {
              circle.visible(false)
              circle.radius(5)
              circle.fill('#ffffff')
              circle.stroke(baseStroke)
              circle.strokeWidth(2)
              circle.opacity(0.95)
              circle.shadowColor(glowColor)
              circle.shadowBlur(10)
              circle.shadowOpacity(0.18)
              circle.shadowEnabled(true)
            }
            lastHighlightedAnchorKeyRef.current = null
          }

          for (const n of nodesForSnap) {
            if (n.t === 'line') continue

            const nx = n.x ?? 0
            const ny = n.y ?? 0
            const nw = n.w ?? 0
            const nh = n.h ?? 0
            const inCandidateRange =
              nextPos.x >= nx - showMargin &&
              nextPos.x <= nx + nw + showMargin &&
              nextPos.y >= ny - showMargin &&
              nextPos.y <= ny + nh + showMargin

            for (const a of anchors) {
              const p = getAnchorPoint(n, a)
              if (!p) continue

              if (inCandidateRange) {
                const key = `${n.id}:${a}`
                const circle = anchorCircleMapRef.current.get(key)
                if (circle) circle.visible(true)
              }

              const dx = p.x - nextPos.x
              const dy = p.y - nextPos.y
              const d2 = dx * dx + dy * dy
              if (d2 <= threshold * threshold && (!best || d2 < best.dist2)) {
                best = { nodeId: n.id, anchor: a, x: p.x, y: p.y, dist2: d2 }
              }
            }
          }

          if (best) {
            nextPos = { x: best.x, y: best.y }
            e.target.position(nextPos)
            if (pointIndex === 0) startConnDraftRef.current = { nodeId: best.nodeId, anchor: best.anchor }
            else endConnDraftRef.current = { nodeId: best.nodeId, anchor: best.anchor }

            const key = `${best.nodeId}:${best.anchor}`
            const circle = anchorCircleMapRef.current.get(key)
            if (circle) {
              circle.visible(true)
              circle.radius(9)
              circle.fill(activeFill)
              circle.stroke(activeStroke)
              circle.strokeWidth(3)
              circle.opacity(1)
              circle.shadowColor(glowColor)
              circle.shadowBlur(22)
              circle.shadowOpacity(0.38)
              circle.shadowEnabled(true)
              lastHighlightedAnchorKeyRef.current = key
            }
          } else {
            if (pointIndex === 0) startConnDraftRef.current = undefined
            else endConnDraftRef.current = undefined
          }

          e.target.position(nextPos)

          const next = [...base]
          next[pointIndex] = nextPos.x
          next[pointIndex + 1] = nextPos.y
          lineDraftPtsRef.current = next
          applyDraftToVisuals(next)
          e.cancelBubble = true
        }

        const endHandleDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
          e.cancelBubble = true
          const next = lineDraftPtsRef.current
          const group = e.target.getParent()
          if (group) (group as Konva.Group).draggable((readOnly ? false : !element.locked) && isSelected)

          if (anchorOverlayGroupRef.current) {
            anchorOverlayGroupRef.current.visible(false)
          }
          // Commit once
          if (next) {
            const updated: Partial<LineNode> = {
              id: element.id,
              pts: next,
              startConn: startConnDraftRef.current,
              endConn: endConnDraftRef.current,
            }
            onChange(updated as unknown as Partial<UnifiedNode>)
          }
          // Release after this tick so any stray group dragend won't apply
          setTimeout(() => {
            isLineHandleDraggingRef.current = false
            lineDraftPtsRef.current = null
          }, 0)
        }

        return (
          <Group
            id={element.id}
            x={0}
            y={0}
            draggable={(readOnly ? false : !element.locked) && isSelected}
            onDragStart={commonProps.onDragStart}
            onDragEnd={(e) => {
              if (isLineHandleDraggingRef.current) {
                // If an endpoint handle drag accidentally triggered group drag events,
                // ignore them to avoid shifting the whole line.
                e.target.position({ x: 0, y: 0 })
                return
              }
              const node = e.target
              const dx = node.x()
              const dy = node.y()

              if (dx !== 0 || dy !== 0) {
                // If this line was connected, moving the whole line detaches it.
                const newPts = pts.map((p, i) => (i % 2 === 0 ? p + dx : p + dy))
                onChange({ id: element.id, pts: newPts, startConn: undefined, endConn: undefined } as unknown as Partial<UnifiedNode>)
              }

              // Reset group position to avoid mixing x/y offsets with absolute pts.
              node.position({ x: 0, y: 0 })
            }}
            onMouseDown={commonProps.onMouseDown}
            onTap={commonProps.onTap}
            onMouseEnter={commonProps.onMouseEnter}
            onMouseLeave={commonProps.onMouseLeave}
            dragBoundFunc={commonProps.dragBoundFunc}
            ref={handleShapeRef as any}
          >
            {isSelected && !readOnly && (
              <Group
                ref={(node) => {
                  anchorOverlayGroupRef.current = node
                }}
                visible={false}
                listening={false}
              >
                {nodesForSnap.flatMap((n) =>
                  anchors.map((a) => {
                    const p = getAnchorPoint(n, a)
                    if (!p) return null
                    const key = `${n.id}:${a}`
                    return (
                      <Circle
                        key={`anchor-${key}`}
                        x={p.x}
                        y={p.y}
                        radius={5}
                        fill="#ffffff"
                        stroke="#0f766e"
                        strokeWidth={2}
                        opacity={0.95}
                        shadowColor="#34d399"
                        shadowBlur={10}
                        shadowOpacity={0.18}
                        shadowEnabled
                        visible={false}
                        ref={(node) => {
                          if (node) anchorCircleMapRef.current.set(key, node)
                          else anchorCircleMapRef.current.delete(key)
                        }}
                      />
                    )
                  })
                )}
              </Group>
            )}
            <Line
              ref={(node) => {
                lineVisualRef.current = node
              }}
              name="line-body"
              points={pts}
              stroke={line.stroke || '#000000'}
              strokeWidth={line.strokeW || 1}
              dash={line.dash}
              lineCap="round"
              lineJoin="round"
              hitStrokeWidth={20}
              draggable={false}
            />

            {/* Arrow markers (wrapped in Groups for direct manipulation during drag) */}
            {(() => {
              const endIdx = Math.max(0, pts.length - 2)
              const dx = pts[endIdx] - pts[0]
              const dy = pts[endIdx + 1] - pts[1]
              const angleToEnd = Math.atan2(dy, dx)
              const angleToStart = angleToEnd + Math.PI

              const startType = line.arrows?.[0] || 'none'
              const endType = line.arrows?.[1] || 'none'
              const color = line.stroke || '#000000'
              const size = Math.max(8, (line.strokeW || 1) * 4)

              return (
                <>
                  <Group
                    ref={(node) => {
                      lineStartMarkerGroupRef.current = node
                    }}
                    name="line-marker-start"
                    x={pts[0]}
                    y={pts[1]}
                    rotation={(angleToStart * 180) / Math.PI}
                    listening={false}
                  >
                    <LineMarker x={0} y={0} angle={0} type={startType} color={color} size={size} />
                  </Group>
                  <Group
                    ref={(node) => {
                      lineEndMarkerGroupRef.current = node
                    }}
                    name="line-marker-end"
                    x={pts[endIdx]}
                    y={pts[endIdx + 1]}
                    rotation={(angleToEnd * 180) / Math.PI}
                    listening={false}
                  >
                    <LineMarker x={0} y={0} angle={0} type={endType} color={color} size={size} />
                  </Group>
                </>
              )
            })()}
            {/* Endpoint drag handles (only when selected) */}
            {isSelected && !readOnly && (() => {
              return (
                <>
                  {/* Start point handle */}
                  <Circle
                    ref={(node) => {
                      lineStartHandleRef.current = node
                    }}
                    name="line-handle-start"
                    x={pts[0]}
                    y={pts[1]}
                    radius={6}
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    draggable
                    onDragStart={startHandleDrag}
                    onDragMove={(e) => moveHandleDrag(0, e)}
                    onDragEnd={endHandleDrag}
                    onMouseDown={(e) => { e.cancelBubble = true }}
                  />
                  {/* End point handle */}
                  <Circle
                    ref={(node) => {
                      lineEndHandleRef.current = node
                    }}
                    name="line-handle-end"
                    x={pts[pts.length - 2]}
                    y={pts[pts.length - 1]}
                    radius={6}
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    draggable
                    onDragStart={startHandleDrag}
                    onDragMove={(e) => moveHandleDrag(pts.length - 2, e)}
                    onDragEnd={endHandleDrag}
                    onMouseDown={(e) => { e.cancelBubble = true }}
                  />
                </>
              )
            })()}
          </Group>
        )
      }
      case 'image': {
        return <CanvasImage element={element as ImageNode} commonProps={commonProps} ref={handleShapeRef} />
      }
      case 'table': {
        const tableElement = element as TableNode
        const { rows, cols, cells } = tableElement.table

        const rowCount = rows.length
        const colCount = cols.length

        const totalW = cols.reduce((acc, v) => acc + (v ?? 0), 0)
        const totalH = rows.reduce((acc, v) => acc + (v ?? 0), 0)

        // Track occupied cells due to row/col spans to avoid rendering duplicates.
        const occupied = Array(rowCount)
          .fill(null)
          .map(() => Array(colCount).fill(false))

        // Helpers to get cumulative positions
        const getRowY = (rowIndex: number) => {
          let y = 0
          for (let i = 0; i < rowIndex; i++) {
            if (rows[i] !== undefined) y += rows[i]
          }
          return y
        }

        const getColX = (colIndex: number) => {
          let x = 0
          for (let i = 0; i < colIndex; i++) {
            if (cols[i] !== undefined) x += cols[i]
          }
          return x
        }

        const getRowHeight = (rowIndex: number, span: number = 1) => {
          let h = 0
          for (let i = 0; i < span; i++) {
            const rh = rows[rowIndex + i]
            if (rh !== undefined) h += rh
          }
          return h
        }

        const getColWidth = (colIndex: number, span: number = 1) => {
          let w = 0
          for (let i = 0; i < span; i++) {
            const cw = cols[colIndex + i]
            if (cw !== undefined) w += cw
          }
          return w
        }

        // Build a fast lookup for cells.
        const cellMap = new Map<string, TableNode['table']['cells'][number]>()
        for (const c of cells) cellMap.set(`${c.r}:${c.c}`, c)

        const rendered: React.ReactNode[] = []

        for (let r = 0; r < rowCount; r++) {
          for (let c = 0; c < colCount; c++) {
            if (occupied[r][c]) continue

            const cell = cellMap.get(`${r}:${c}`)
            const rs = cell?.rs || 1
            const cs = cell?.cs || 1

            // Mark occupied for spans (including the top-left cell position)
            if (rs > 1 || cs > 1) {
              for (let rr = 0; rr < rs; rr++) {
                for (let cc = 0; cc < cs; cc++) {
                  if (r + rr < rowCount && c + cc < colCount) {
                    occupied[r + rr][c + cc] = true
                  }
                }
              }
            }

            const x = getColX(c)
            const y = getRowY(r)
            const w = getColWidth(c, cs)
            const h = getRowHeight(r, rs)

            const borderColor = cell?.borderColor || cell?.border || '#cccccc'
            const borderW = cell?.borderW ?? (cell?.border ? 1 : 1)
            const borderEnabled = borderW > 0
            const bg = cell?.bg
            const fontSize = cell?.fontSize || 12
            const fontFamily = cell?.font || 'Meiryo'
            const color = cell?.color || '#000000'
            const align = cell?.align || 'l'
            const vAlign = cell?.vAlign || 'm'

            const isSelectedCell =
              isSelected &&
              _selectedCell &&
              _selectedCell.row === r &&
              _selectedCell.col === c

            const cellId = `${tableElement.id}_cell_${r}_${c}`

            rendered.push(
              <Group
                key={cellId}
                x={x}
                y={y}
                onClick={(e) => {
                  e.cancelBubble = true
                  onCellClick?.(tableElement.id, r, c)
                }}
                onDblClick={(e) => {
                  e.cancelBubble = true
                  onCellDblClick?.(tableElement.id, r, c)
                }}
              >
                <Rect
                  id={cellId}
                  x={0}
                  y={0}
                  width={w}
                  height={h}
                  fill={bg || 'transparent'}
                  stroke={borderEnabled ? borderColor : undefined}
                  strokeWidth={borderEnabled ? borderW : 0}
                />

                {!!cell?.v && (
                  <Text
                    id={`${cellId}_text`}
                    x={4}
                    y={0}
                    width={Math.max(0, w - 8)}
                    height={h}
                    text={cell.v}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    fill={color}
                    align={align === 'r' ? 'right' : align === 'c' ? 'center' : 'left'}
                    verticalAlign={vAlign === 't' ? 'top' : vAlign === 'b' ? 'bottom' : 'middle'}
                    listening={false}
                  />
                )}

                {isSelectedCell && (
                  <Rect
                    x={0}
                    y={0}
                    width={w}
                    height={h}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dash={[4, 4]}
                    fillEnabled={false}
                    listening={false}
                  />
                )}
              </Group>
            )
          }
        }

        const handles: React.ReactNode[] = []
        const HANDLE_SIZE = 8
        const MIN_ROW = 10
        const MIN_COL = 10

        if (isSelected && !readOnly) {
          // Row resize handles
          for (let i = 0; i < rowCount - 1; i++) {
            const boundaryY = getRowY(i + 1)

            handles.push(
              <Rect
                key={`${tableElement.id}_row_handle_${i}`}
                x={0}
                y={boundaryY - HANDLE_SIZE / 2}
                width={totalW}
                height={HANDLE_SIZE}
                fill="transparent"
                draggable
                dragBoundFunc={function (this: Konva.Node, pos) {
                  const node = this
                  const parent = node.getParent()
                  if (!parent) return pos

                  const transform = parent.getAbsoluteTransform().copy()
                  transform.invert()
                  const localPos = transform.point(pos)

                  // Allow free movement along Y in local space, lock X to 0
                  const newLocal = { x: 0, y: localPos.y }
                  return parent.getAbsoluteTransform().point(newLocal)
                }}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'row-resize'
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'default'
                }}
                onDragStart={(e) => {
                  const node = e.target as Konva.Shape
                  node.fill('#3b82f6')
                }}
                onDragEnd={(e) => {
                  e.cancelBubble = true
                  const node = e.target as Konva.Shape
                  node.fill('transparent')
                  const delta = node.y() - (boundaryY - HANDLE_SIZE / 2)

                  // Reset visual position immediately - React will re-render with new rows if valid
                  node.position({ x: 0, y: boundaryY - HANDLE_SIZE / 2 })

                  if (Math.abs(delta) < 0.01) return

                  const newRows = [...rows]
                  const topH = (newRows[i] ?? 0) + delta
                  const bottomH = (newRows[i + 1] ?? 0) - delta
                  if (topH >= MIN_ROW && bottomH >= MIN_ROW) {
                    newRows[i] = topH
                    newRows[i + 1] = bottomH
                    onChange({
                      id: tableElement.id,
                      h: newRows.reduce((acc, v) => acc + (v ?? 0), 0),
                      table: {
                        ...tableElement.table,
                        rows: newRows,
                      },
                    } as unknown as Partial<UnifiedNode>)
                  }
                }}
              />
            )
          }

          // Column resize handles
          for (let i = 0; i < colCount - 1; i++) {
            const boundaryX = getColX(i + 1)

            handles.push(
              <Rect
                key={`${tableElement.id}_col_handle_${i}`}
                x={boundaryX - HANDLE_SIZE / 2}
                y={0}
                width={HANDLE_SIZE}
                height={totalH}
                fill="transparent"
                draggable
                dragBoundFunc={function (this: Konva.Node, pos) {
                  const node = this
                  const parent = node.getParent()
                  if (!parent) return pos

                  const transform = parent.getAbsoluteTransform().copy()
                  transform.invert()
                  const localPos = transform.point(pos)

                  // Allow free movement along X in local space, lock Y to 0
                  const newLocal = { x: localPos.x, y: 0 }
                  return parent.getAbsoluteTransform().point(newLocal)
                }}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'col-resize'
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'default'
                }}
                onDragStart={(e) => {
                  const node = e.target as Konva.Shape
                  node.fill('#3b82f6')
                }}
                onDragEnd={(e) => {
                  e.cancelBubble = true
                  const node = e.target as Konva.Shape
                  node.fill('transparent')
                  const delta = node.x() - (boundaryX - HANDLE_SIZE / 2)

                  // Reset visual position immediately
                  node.position({ x: boundaryX - HANDLE_SIZE / 2, y: 0 })

                  if (Math.abs(delta) < 0.01) return

                  const newCols = [...cols]
                  const leftW = (newCols[i] ?? 0) + delta
                  const rightW = (newCols[i + 1] ?? 0) - delta
                  if (leftW >= MIN_COL && rightW >= MIN_COL) {
                    newCols[i] = leftW
                    newCols[i + 1] = rightW
                    onChange({
                      id: tableElement.id,
                      w: newCols.reduce((acc, v) => acc + (v ?? 0), 0),
                      table: {
                        ...tableElement.table,
                        cols: newCols,
                      },
                    } as unknown as Partial<UnifiedNode>)
                  }
                }}
              />
            )
          }
        }

        return (
          <Group {...commonProps}>
            {rendered}
            {/* Table Frame Selector (Hit Area for Outer Selection) - Moved to be AFTER cells to ensure it sits ON TOP (for the border area). 
                Allows clicking the 'outer frame' to select the table instead of the edge cell. 
            */}
            <Rect
              width={tableElement.w}
              height={tableElement.h}
              fillEnabled={false}
              stroke="transparent"
              strokeWidth={1}
              hitStrokeWidth={40}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container()
                if (container) container.style.cursor = 'move'
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container()
                if (container) container.style.cursor = 'default'
              }}
              onMouseDown={(e) => {
                e.cancelBubble = true
                commonProps.onSelect?.(e)
              }}
              onClick={(e) => {
                e.cancelBubble = true
              }}
              onTap={(e) => {
                e.cancelBubble = true
                commonProps.onSelect?.(e)
              }}
            />
            {handles}
            {isSelected && !_selectedCell && (
              <Rect
                x={0}
                y={0}
                width={tableElement.w}
                height={tableElement.h}
                stroke="#cccccc"
                strokeWidth={1}
                dash={[4, 4]}
                fillEnabled={false}
                listening={false}
              />
            )}
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
  }, [element, commonProps, renderCustom, handleShapeRef, readOnly, isSelected, onChange])

  return (
    <>
      {content}
      {isSelected && !readOnly && element.t !== 'line' && (
        <Transformer
          key={`${element.id}-${element.w}-${element.h}`}
          ref={trRef as React.RefObject<Konva.Transformer>}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox
            return newBox
          }}
        />
      )}
    </>
  )
}
