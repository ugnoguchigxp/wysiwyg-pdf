import type Konva from 'konva'
import type React from 'react'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import {
  Circle,
  Ellipse,
  Group,
  Image as KonvaImage,
  Line,
  Path,
  Rect,
  RegularPolygon,
  Star,
  Text,
  Transformer,
} from 'react-konva'
import { findImageWithExtension } from '../../modules/konva-editor/report-editor/pdf-editor/components/WysiwygCanvas/canvasImageUtils'
import type {
  CanvasElement as Element,
  IBox,
  IChartElement,
  IImageElement,
  ILineElement,
  ITableElement,
} from '../../types/canvas'
import { LineMarker } from './LineMarker'

export type CanvasShapeRefCallback = (node: Konva.Node | null) => void

export type CanvasElementCommonProps = Konva.NodeConfig & {
  ref: CanvasShapeRefCallback
}

type BoxElement = Extract<Element, { box: IBox }>

const isBoxElement = (element: Element): element is BoxElement => 'box' in element

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
  element: Element
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<Element> & { id?: string }) => void
  onDblClick?: () => void
  onCellDblClick?: (elementId: string, row: number, col: number) => void
  onCellClick?: (elementId: string, row: number, col: number) => void
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void
  editingCell?: { elementId: string; row: number; col: number } | null
  selectedCell?: { row: number; col: number } | null
  isEditing?: boolean
  renderCustom?: (
    element: Element,
    commonProps: CanvasElementCommonProps,
    shapeRef: CanvasShapeRefCallback
  ) => React.ReactNode
}

// Separate component for Image to handle loading state
const CanvasImage = forwardRef<
  Konva.Image | Konva.Group,
  { element: IImageElement; commonProps: CanvasElementCommonProps }
>(({ element, commonProps }, ref) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error' | 'empty'>('empty')

  useEffect(() => {
    // console.log('CanvasImage: assetId changed', element.assetId);
    if (!element.assetId && !element.src) {
      setStatus('empty')
      setImage(null)
      return
    }

    setStatus('loading')

    // Support both assetId (local lookup) and src (direct URL)
    if (element.src) {
      const img = new window.Image()
      img.src = element.src
      img.onload = () => {
        setImage(img)
        setStatus('loaded')
      }
      img.onerror = () => {
        setStatus('error')
      }
    } else if (element.assetId) {
      findImageWithExtension(element.assetId)
        .then((result) => {
          if (result) {
            // console.log('CanvasImage: Loaded', result.url);
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
  }, [element.assetId, element.src])

  // console.log('CanvasImage: render', { status, assetId: element.assetId });

  // Remove ref from commonProps to avoid conflict
  const { ref: _ignoredRef, ...propsWithoutRef } = commonProps

  if (status === 'loaded' && image) {
    return (
      <KonvaImage
        {...propsWithoutRef}
        image={image}
        width={element.box.width}
        height={element.box.height}
        ref={ref as React.Ref<Konva.Image>}
        opacity={element.opacity ?? 1}
      />
    )
  }

  // Placeholder styling
  // Placeholder styling
  const isError = status === 'error'
  const isLoading = status === 'loading'
  // Use darker/bolder colors for default state to improve visibility
  const bgColor = isError ? '#fee2e2' : isLoading ? '#eff6ff' : '#e5e7eb'
  const borderColor = isError ? '#ef4444' : isLoading ? '#3b82f6' : '#6b7280'
  const textColor = isError ? '#b91c1c' : isLoading ? '#1d4ed8' : '#374151'
  const labelText = isError ? 'Error' : isLoading ? 'Loading...' : 'Image'

  return (
    <Group {...propsWithoutRef} ref={ref as React.Ref<Konva.Group>}>
      <Rect
        width={element.box.width}
        height={element.box.height}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={3}
      />
      <Text
        x={0}
        y={0}
        width={element.box.width}
        height={element.box.height}
        text={labelText}
        fill={textColor}
        align="center"
        verticalAlign="middle"
        fontSize={14}
        fontStyle="bold"
        fontFamily="Meiryo"
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
  isEditing,
  editingCell,
  selectedCell,
  renderCustom,
}) => {
  const shapeRef = useRef<Konva.Node | null>(null)
  const trRef = useRef<Konva.Transformer | null>(null)

  // Refs for Line manipulation
  const lineRef = useRef<Konva.Line | null>(null)
  const startMarkerRef = useRef<Konva.Group | null>(null)
  const endMarkerRef = useRef<Konva.Group | null>(null)

  // Use callback ref to handle node changes (e.g. Image loading)
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
      // For Line, we don't use Transformer, we use custom handles
      if (element.type !== 'Line') {
        trRef.current.nodes([shapeRef.current])
        trRef.current.getLayer()?.batchDraw()
      } else {
        trRef.current.nodes([]) // Clear transformer for line
      }
    }
  }, [isSelected, element.type])

  // Auto-resize Text element height
  useEffect(() => {
    if (element.type !== 'Text' || !shapeRef.current) return

    const node = shapeRef.current as Konva.Text | null
    if (!node) return

    const height = node.height()
    const currentHeight = element.box?.height ?? 0

    if (Math.abs(height - currentHeight) > 1) {
      onChange({
        id: element.id,
        box: {
          ...element.box,
          height,
        },
      })
    }
  }, [element, onChange])

  const handleTransformEnd = () => {
    const node = shapeRef.current as TransformableNode | null
    if (!node || !isBoxElement(element)) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale to 1 and update width/height
    node.scaleX(1)
    node.scaleY(1)

    const newWidth = Math.max(5, node.width() * scaleX)
    const newHeight = Math.max(5, node.height() * scaleY)

    let newX = node.x()
    let newY = node.y()

    // For center-based shapes, the node position is the center, so we need to adjust
    // to get the top-left corner of the bounding box
    if (['Circle', 'Star', 'Pentagon', 'Hexagon'].includes(element.type)) {
      newX -= newWidth / 2
      newY -= newHeight / 2
    }

    if (element.type === 'Table') {
      const tableElement = element as ITableElement
      // Prevent division by zero
      const oldWidth = tableElement.box.width || 1
      const oldHeight = tableElement.box.height || 1

      const widthRatio = newWidth / oldWidth
      const heightRatio = newHeight / oldHeight

      const newCols = tableElement.cols.map((c) => ({
        ...c,
        width: c.width * widthRatio,
      }))
      const newRows = tableElement.rows.map((r) => ({
        ...r,
        height: r.height * heightRatio,
      }))

      onChange({
        id: element.id,
        box: {
          ...element.box,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
        rotation: node.rotation(),
        cols: newCols,
        rows: newRows,
      } as unknown as Partial<Element>)
      return
    }

    onChange({
      id: element.id,
      box: {
        ...element.box,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      },
      rotation: node.rotation(),
    })
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (isBoxElement(element)) {
      let newX = e.target.x()
      let newY = e.target.y()

      // For center-based shapes, the node position is the center, so we need to adjust
      // to get the top-left corner of the bounding box
      if (['Circle', 'Star', 'Pentagon', 'Hexagon'].includes(element.type)) {
        newX -= element.box.width / 2
        newY -= element.box.height / 2
      }

      onChange({
        id: element.id,
        box: {
          ...element.box,
          x: newX,
          y: newY,
        },
      })
    } else if (element.type === 'Line') {
      // For Line, we might drag the whole group or line?
      // Actually, if we drag the line itself, we should update start/end points relative to movement
      // But usually lines are moved by handles.
      // If we allow dragging the line body, we need to calculate delta.
      // But Konva Line drag updates x/y of the node, not points.
      // We need to apply x/y to points and reset x/y to 0.
      const node = e.target
      const dx = node.x()
      const dy = node.y()
      const line = element as ILineElement

      onChange({
        id: element.id,
        startPoint: { x: line.startPoint.x + dx, y: line.startPoint.y + dy },
        endPoint: { x: line.endPoint.x + dx, y: line.endPoint.y + dy },
      })

      // Reset node position
      node.x(0)
      node.y(0)
    }
  }

  const boxedElement = isBoxElement(element) ? element : undefined

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (element.locked) return
    const container = e.target.getStage()?.container()
    if (container) {
      container.style.cursor = 'move'
    }
  }

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container()
    if (container) {
      container.style.cursor = 'default'
    }
  }

  const commonProps: CanvasElementCommonProps = {
    id: element.id,
    x: boxedElement?.box.x ?? 0,
    y: boxedElement?.box.y ?? 0,
    width: boxedElement?.box.width ?? 0,
    height: boxedElement?.box.height ?? 0,
    rotation: element.rotation || 0,
    draggable: !element.locked,
    onMouseDown: onSelect,
    onTap: onSelect,
    onDblClick,
    ref: handleShapeRef, // Use callback ref
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    visible: element.type === 'Table' ? true : !isEditing,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => {
      // e.evt.preventDefault(); // Handled by parent if needed, or here
      // We pass the event up
      onContextMenu?.(e)
    },
  }

  const renderElement = () => {
    switch (element.type) {
      case 'Text': {
        const textElement = element
        const { box, font } = textElement
        return (
          <Text
            {...commonProps}
            height={undefined} // Allow Konva to calculate height based on content
            text={textElement.text}
            fontSize={font.size}
            fontFamily={font.family}
            fontStyle={
              `${font.italic ? 'italic ' : ''}${font.weight >= 700 ? 'bold' : ''}`.trim() ||
              'normal'
            }
            textDecoration={[
              element.font.underline ? 'underline' : '',
              element.font.strikethrough ? 'line-through' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            fill={textElement.color}
            align={textElement.align}
            verticalAlign={textElement.verticalAlign}
            lineHeight={1.2}
            // Konva Text width/height handling:
            // We set width to enable wrapping.
            // We do NOT set height, so Konva calculates it based on content.
            // We then sync this calculated height back to the element state in useEffect.
            width={box.width}
          />
        )
      }
      case 'Rect': {
        const rectElement = element
        return (
          <Rect
            {...commonProps}
            fill={rectElement.fill?.color}
            stroke={rectElement.stroke?.color}
            strokeWidth={rectElement.stroke?.width}
          />
        )
      }
      case 'Circle': {
        const circleElement = element
        const { box } = circleElement
        return (
          <Ellipse
            {...commonProps}
            x={box.x + box.width / 2}
            y={box.y + box.height / 2}
            radiusX={box.width / 2}
            radiusY={box.height / 2}
            fill={circleElement.fill?.color}
            stroke={circleElement.stroke?.color}
            strokeWidth={circleElement.stroke?.width}
          />
        )
      }
      case 'Triangle': {
        const triElement = element
        const { box } = triElement
        return (
          <Line
            {...commonProps}
            points={[box.width / 2, 0, box.width, box.height, 0, box.height]}
            closed
            fill={triElement.fill?.color}
            stroke={triElement.stroke?.color}
            strokeWidth={triElement.stroke?.width}
          />
        )
      }
      case 'Trapezoid': {
        const trapElement = element
        const { box } = trapElement
        const topWidth = box.width * 0.6
        const topOffset = (box.width - topWidth) / 2
        return (
          <Line
            {...commonProps}
            points={[topOffset, 0, topOffset + topWidth, 0, box.width, box.height, 0, box.height]}
            closed
            fill={trapElement.fill?.color}
            stroke={trapElement.stroke?.color}
            strokeWidth={trapElement.stroke?.width}
          />
        )
      }
      case 'Diamond': {
        const diamondElement = element
        const { box } = diamondElement
        return (
          <Line
            {...commonProps}
            points={[
              box.width / 2,
              0,
              box.width,
              box.height / 2,
              box.width / 2,
              box.height,
              0,
              box.height / 2,
            ]}
            closed
            fill={diamondElement.fill?.color}
            stroke={diamondElement.stroke?.color}
            strokeWidth={diamondElement.stroke?.width}
          />
        )
      }
      case 'Cylinder': {
        const cylElement = element
        const { box } = cylElement
        const ellipseHeight = box.height * 0.15
        return (
          <Group {...commonProps}>
            {/* Body Rect */}
            <Rect
              x={0}
              y={ellipseHeight / 2}
              width={box.width}
              height={box.height - ellipseHeight}
              fill={cylElement.fill?.color}
              stroke={cylElement.stroke?.color}
              strokeWidth={cylElement.stroke?.width}
            />
            {/* Top Ellipse */}
            <Ellipse
              x={box.width / 2}
              y={ellipseHeight / 2}
              radiusX={box.width / 2}
              radiusY={ellipseHeight / 2}
              fill={cylElement.fill?.color}
              stroke={cylElement.stroke?.color}
              strokeWidth={cylElement.stroke?.width}
            />
            {/* Bottom Ellipse */}
            <Ellipse
              x={box.width / 2}
              y={box.height - ellipseHeight / 2}
              radiusX={box.width / 2}
              radiusY={ellipseHeight / 2}
              fill={cylElement.fill?.color}
              stroke={cylElement.stroke?.color}
              strokeWidth={cylElement.stroke?.width}
            />
          </Group>
        )
      }
      case 'Heart': {
        const heartElement = element
        const { box } = heartElement
        return (
          <Path
            {...commonProps}
            data="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={heartElement.fill?.color}
            stroke={heartElement.stroke?.color}
            strokeWidth={heartElement.stroke?.width}
            scaleX={box.width / 24}
            scaleY={box.height / 24}
            strokeScaleEnabled={false}
          />
        )
      }
      case 'Star': {
        const starElement = element
        const { box } = starElement
        return (
          <Star
            {...commonProps}
            x={box.x + box.width / 2}
            y={box.y + box.height / 2}
            numPoints={5}
            innerRadius={Math.min(box.width, box.height) / 4}
            outerRadius={Math.min(box.width, box.height) / 2}
            fill={starElement.fill?.color}
            stroke={starElement.stroke?.color}
            strokeWidth={starElement.stroke?.width}
          />
        )
      }
      case 'Pentagon': {
        const pentElement = element
        const { box } = pentElement
        return (
          <RegularPolygon
            {...commonProps}
            x={box.x + box.width / 2}
            y={box.y + box.height / 2}
            sides={5}
            radius={Math.min(box.width, box.height) / 2}
            fill={pentElement.fill?.color}
            stroke={pentElement.stroke?.color}
            strokeWidth={pentElement.stroke?.width}
          />
        )
      }
      case 'Hexagon': {
        const hexElement = element
        const { box } = hexElement
        return (
          <RegularPolygon
            {...commonProps}
            x={box.x + box.width / 2}
            y={box.y + box.height / 2}
            sides={6}
            radius={Math.min(box.width, box.height) / 2}
            fill={hexElement.fill?.color}
            stroke={hexElement.stroke?.color}
            strokeWidth={hexElement.stroke?.width}
          />
        )
      }
      case 'ArrowUp': {
        const arrowUpElement = element
        const { box } = arrowUpElement
        return (
          <Path
            {...commonProps}
            data="M12 4l-8 8h6v8h4v-8h6z"
            fill={arrowUpElement.fill?.color}
            stroke={arrowUpElement.stroke?.color}
            strokeWidth={arrowUpElement.stroke?.width}
            scaleX={box.width / 24}
            scaleY={box.height / 24}
            strokeScaleEnabled={false}
          />
        )
      }
      case 'ArrowDown': {
        const arrowDownElement = element
        const { box } = arrowDownElement
        return (
          <Path
            {...commonProps}
            data="M12 20l-8-8h6v-8h4v8h6z"
            fill={arrowDownElement.fill?.color}
            stroke={arrowDownElement.stroke?.color}
            strokeWidth={arrowDownElement.stroke?.width}
            scaleX={box.width / 24}
            scaleY={box.height / 24}
            strokeScaleEnabled={false}
          />
        )
      }
      case 'Chart': {
        const chartElement = element as IChartElement
        const { box, config } = chartElement
        return (
          <Group {...commonProps}>
            {/* Background */}
            <Rect
              width={box.width}
              height={box.height}
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth={1}
              dash={[5, 5]}
            />

            {/* Placeholder Axes */}
            <Line
              points={[10, 10, 10, box.height - 10, box.width - 10, box.height - 10]}
              stroke="#cbd5e1"
              strokeWidth={2}
            />

            {/* Placeholder Icon/Text */}
            <Text
              x={0}
              y={box.height / 2 - 20}
              width={box.width}
              text="📊"
              fontSize={32}
              align="center"
            />
            <Text
              x={0}
              y={box.height / 2 + 10}
              width={box.width}
              text={config?.title || 'Chart'}
              fontSize={14}
              fontFamily="Meiryo"
              fill="#64748b"
              align="center"
            />
          </Group>
        )
      }
      case 'ArrowLeft': {
        const arrowLeftElement = element
        const { box } = arrowLeftElement
        return (
          <Path
            {...commonProps}
            data="M4 12l8-8v6h8v4h-8v6z"
            fill={arrowLeftElement.fill?.color}
            stroke={arrowLeftElement.stroke?.color}
            strokeWidth={arrowLeftElement.stroke?.width}
            scaleX={box.width / 24}
            scaleY={box.height / 24}
            strokeScaleEnabled={false}
          />
        )
      }
      case 'ArrowRight': {
        const arrowRightElement = element
        const { box } = arrowRightElement
        return (
          <Path
            {...commonProps}
            data="M20 12l-8-8v6h-8v4h8v6z"
            fill={arrowRightElement.fill?.color}
            stroke={arrowRightElement.stroke?.color}
            strokeWidth={arrowRightElement.stroke?.width}
            scaleX={box.width / 24}
            scaleY={box.height / 24}
            strokeScaleEnabled={false}
          />
        )
      }
      case 'Tree': {
        const treeElement = element
        const { box } = treeElement
        return (
          <Path
            {...commonProps}
            data="M12 2 L8 8 H10 L6 14 H8 L4 20 H11 V24 H13 V20 H20 L16 14 H18 L14 8 H16 Z"
            fill={treeElement.fill?.color}
            stroke={treeElement.stroke?.color}
            strokeWidth={treeElement.stroke?.width}
            scaleX={box.width / 24}
            scaleY={box.height / 24}
            strokeScaleEnabled={false}
          />
        )
      }
      case 'House': {
        const houseElement = element
        const { box } = houseElement
        return (
          <Path
            {...commonProps}
            data="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
            fill={houseElement.fill?.color}
            stroke={houseElement.stroke?.color}
            strokeWidth={houseElement.stroke?.width}
            scaleX={box.width / 24}
            scaleY={box.height / 24}
            strokeScaleEnabled={false}
          />
        )
      }
      case 'Table': {
        const tableElement = element as ITableElement
        const { rows, cols, cells } = tableElement

        // Helper to get row Y position
        const getRowY = (rowIndex: number) => {
          let y = 0
          for (let i = 0; i < rowIndex; i++) {
            if (rows[i]) y += rows[i].height
          }
          return y
        }

        // Helper to get col X position
        const getColX = (colIndex: number) => {
          let x = 0
          for (let i = 0; i < colIndex; i++) {
            if (cols[i]) x += cols[i].width
          }
          return x
        }

        return (
          <Group {...commonProps}>
            {/* Render Cells */}
            {cells.map((cell, index) => {
              const x = getColX(cell.col)
              const y = getRowY(cell.row)

              // Calculate width/height including span
              let width = 0
              for (let i = 0; i < (cell.colSpan || 1); i++) {
                if (cols[cell.col + i]) width += cols[cell.col + i].width
              }

              let height = 0
              for (let i = 0; i < (cell.rowSpan || 1); i++) {
                if (rows[cell.row + i]) height += rows[cell.row + i].height
              }

              const fontSize = cell.styles.font?.size || 12
              const fontFamily = cell.styles.font?.family || 'Meiryo'
              const fontWeight = cell.styles.font?.weight || 400
              const fontColor = cell.styles.font?.color || '#000000'
              const align = cell.styles.align || 'left'
              const verticalAlign = cell.styles.verticalAlign || 'top'
              const borderColor = cell.styles.borderColor || '#000000'
              const borderWidth = cell.styles.borderWidth || 1
              const backgroundColor = cell.styles.backgroundColor

              const isEditingThisCell =
                isEditing &&
                editingCell?.elementId === tableElement.id &&
                editingCell?.row === cell.row &&
                editingCell?.col === cell.col

              return (
                <Group
                  key={`${cell.row}-${cell.col}-${index}`}
                  x={x}
                  y={y}
                  onClick={(e) => {
                    e.cancelBubble = true
                    onCellClick?.(tableElement.id, cell.row, cell.col)
                  }}
                >
                  {/* Background & Border */}
                  <Rect
                    id={`${tableElement.id}_cell_${cell.row}_${cell.col}`}
                    width={width}
                    height={height}
                    fill={backgroundColor}
                    stroke={borderColor}
                    strokeWidth={borderWidth}
                    onClick={(e) => {
                      console.log('[Debug] Rect Clicked', cell.row, cell.col)
                      e.cancelBubble = true
                      onCellClick?.(tableElement.id, cell.row, cell.col)
                    }}
                    onDblClick={(e) => {
                      e.cancelBubble = true
                      onCellDblClick?.(tableElement.id, cell.row, cell.col)
                    }}
                  />
                  {/* Cell Content */}
                  {cell.content && (
                    <Text
                      id={`${tableElement.id}_cell_${cell.row}_${cell.col}_text`} // Changed to avoid duplicate ID, suffix _text
                      name="table-cell-text"
                      x={4} // Padding
                      y={4} // Padding
                      width={width - 8} // Padding
                      height={height - 8} // Padding
                      text={cell.content}
                      fontSize={fontSize}
                      fontFamily={fontFamily}
                      fontStyle={
                        `${fontWeight >= 700 ? 'bold' : ''} ${cell.styles.font?.italic ? 'italic' : ''}`.trim() ||
                        'normal'
                      }
                      textDecoration={`${cell.styles.font?.underline ? 'underline' : ''} ${cell.styles.font?.strikethrough ? 'line-through' : ''}`.trim()}
                      fill={fontColor}
                      align={align}
                      verticalAlign={verticalAlign}
                      onClick={(e) => {
                        console.log('[Debug] Text Clicked', cell.row, cell.col)
                        e.cancelBubble = true
                        onCellClick?.(tableElement.id, cell.row, cell.col)
                      }}
                      onDblClick={(e) => {
                        e.cancelBubble = true
                        onCellDblClick?.(tableElement.id, cell.row, cell.col)
                      }}
                      visible={!isEditingThisCell}
                    />
                  )}
                </Group>
              )
            })}

            {/* Dashed Border Overlay when Cell is Selected (Context Indicator) - Click to Select Table */}
            {isSelected && selectedCell && (
              <Rect
                x={-2}
                y={-2}
                width={tableElement.box.width + 4}
                height={tableElement.box.height + 4}
                stroke="#ef4444" // Red
                strokeWidth={1}
                dash={[4, 4]}
                hitStrokeWidth={10} // Make it clickable
              />
            )}

            {/* Selected Cell Highlight */}
            {isSelected &&
              selectedCell &&
              (() => {
                const { row, col } = selectedCell
                const cell = cells.find((c) => c.row === row && c.col === col)

                const x = getColX(col)
                const y = getRowY(row)

                let width = 0
                const colSpan = cell?.colSpan || 1
                for (let i = 0; i < colSpan; i++) {
                  if (cols[col + i]) width += cols[col + i].width
                }

                let height = 0
                const rowSpan = cell?.rowSpan || 1
                for (let i = 0; i < rowSpan; i++) {
                  if (rows[row + i]) height += rows[row + i].height
                }

                return (
                  <Rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    stroke="#3b82f6" // Blue
                    strokeWidth={2}
                    dash={[4, 4]}
                    listening={false}
                  />
                )
              })()}

            {/* Table Frame Selector (Hit Area for Outer Selection) */}
            <Rect
              x={0}
              y={0}
              width={tableElement.box.width}
              height={tableElement.box.height}
              fillEnabled={false}
              stroke="transparent"
              strokeWidth={0}
              hitStrokeWidth={20}
            />

            {/* Column Resize Handles */}
            {isSelected &&
              cols.map((_, i) => {
                // If specific cell selected, only show handle for that col
                if (selectedCell && i !== selectedCell.col) return null

                if (i === cols.length - 1) return null
                const boundaryX = getColX(i + 1)
                const totalHeight = getRowY(rows.length)

                return (
                  <Rect
                    key={`col-resize-${i}`}
                    x={boundaryX - 6}
                    y={0}
                    width={12}
                    height={totalHeight}
                    fill="transparent"
                    draggable
                    onDragStart={(e) => {
                      e.cancelBubble = true
                      ;(e.target as Konva.Shape).fill('rgba(59, 130, 246, 0.5)') // Visual feedback
                    }}
                    onMouseDown={(e) => {
                      e.cancelBubble = true
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'col-resize'
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'default'
                    }}
                    dragBoundFunc={function (this: Konva.Node, pos) {
                      return {
                        x: pos.x,
                        y: this.getAbsolutePosition().y,
                      }
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true
                      const node = e.target as Konva.Shape
                      node.fill('transparent')
                      const currentX = node.x() // Relative to Group
                      // Handle center is at x + 6
                      // boundaryX is the target center
                      // delta = (currentX + 6) - boundaryX
                      const delta = currentX + 6 - boundaryX

                      if (Math.abs(delta) > 0.1) {
                        const newCols = [...cols]
                        const leftW = newCols[i].width + delta
                        const rightW = newCols[i + 1].width - delta

                        // Min width constraint (e.g. 20px)
                        if (leftW >= 20 && rightW >= 20) {
                          newCols[i] = { ...newCols[i], width: leftW }
                          newCols[i + 1] = { ...newCols[i + 1], width: rightW }
                          onChange({ ...tableElement, cols: newCols })
                        }
                      }

                      // Reset handle position locally
                      node.position({ x: boundaryX - 6, y: 0 })
                    }}
                  />
                )
              })}

            {/* Row Resize Handles */}
            {isSelected &&
              rows.map((_, i) => {
                // If specific cell selected, only show handle for that row
                if (selectedCell && i !== selectedCell.row) return null

                if (i === rows.length - 1) return null
                const boundaryY = getRowY(i + 1)
                const totalWidth = getColX(cols.length)

                return (
                  <Rect
                    key={`row-resize-${i}`}
                    x={0}
                    y={boundaryY - 6}
                    width={totalWidth}
                    height={12}
                    fill="transparent"
                    draggable
                    onDragStart={(e) => {
                      e.cancelBubble = true
                      ;(e.target as Konva.Shape).fill('rgba(59, 130, 246, 0.5)') // Visual feedback
                    }}
                    onMouseDown={(e) => {
                      e.cancelBubble = true
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'row-resize'
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container()
                      if (container) container.style.cursor = 'default'
                    }}
                    dragBoundFunc={function (this: Konva.Node, pos) {
                      return {
                        x: this.getAbsolutePosition().x,
                        y: pos.y,
                      }
                    }}
                    onDragEnd={(e) => {
                      e.cancelBubble = true
                      const node = e.target as Konva.Shape
                      node.fill('transparent')

                      const currentY = node.y() // Relative to Group
                      // Handle center is at y + 6
                      // boundaryY is the target center
                      // delta = (currentY + 6) - boundaryY
                      const delta = currentY + 6 - boundaryY

                      if (Math.abs(delta) > 0.1) {
                        const newRows = [...rows]
                        const topH = newRows[i].height + delta
                        const bottomH = newRows[i + 1].height - delta

                        // Min height constraint (e.g. 20px)
                        if (topH >= 20 && bottomH >= 20) {
                          newRows[i] = { ...newRows[i], height: topH }
                          newRows[i + 1] = { ...newRows[i + 1], height: bottomH }
                          onChange({ ...tableElement, rows: newRows })
                        }
                      }

                      // Reset handle position locally
                      node.position({ x: 0, y: boundaryY - 6 })
                    }}
                  />
                )
              })}
          </Group>
        )
      }
      case 'Image': {
        const imageElement = element
        return (
          <CanvasImage
            ref={handleShapeRef} // Use callback ref
            element={imageElement}
            commonProps={commonProps}
          />
        )
      }
      case 'Line': {
        const lineElement = element
        const { startPoint, endPoint, stroke, startArrow, endArrow } = lineElement

        // Calculate angles for markers
        const dx = endPoint.x - startPoint.x
        const dy = endPoint.y - startPoint.y
        const angle = Math.atan2(dy, dx)

        const updateLineVisuals = (
          newStart: { x: number; y: number },
          newEnd: { x: number; y: number }
        ) => {
          if (lineRef.current) {
            lineRef.current.points([newStart.x, newStart.y, newEnd.x, newEnd.y])
          }

          const newDx = newEnd.x - newStart.x
          const newDy = newEnd.y - newStart.y
          const newAngle = Math.atan2(newDy, newDx)

          if (startMarkerRef.current) {
            startMarkerRef.current.position(newStart)
            startMarkerRef.current.rotation(((newAngle + Math.PI) * 180) / Math.PI)
          }
          if (endMarkerRef.current) {
            endMarkerRef.current.position(newEnd)
            endMarkerRef.current.rotation((newAngle * 180) / Math.PI)
          }
          lineRef.current?.getLayer()?.batchDraw()
        }

        const markerSize = Math.max(10, 10 + (stroke.width - 1) * 3)

        return (
          <Group
            id={lineElement.id}
            draggable={!lineElement.locked}
            onMouseDown={onSelect}
            onTap={onSelect}
            onDragEnd={handleDragEnd}
            ref={handleShapeRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Main Line */}
            <Line
              ref={lineRef}
              points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              dash={stroke.dash?.map((d) => d * stroke.width)}
              lineCap="round"
              lineJoin="round"
              hitStrokeWidth={10} // Improve hit detection (approx 5px radius)
            />

            {/* Start Marker */}
            <Group
              ref={startMarkerRef}
              x={startPoint.x}
              y={startPoint.y}
              rotation={((angle + Math.PI) * 180) / Math.PI}
            >
              <LineMarker
                x={0}
                y={0}
                angle={0} // Rotation handled by Group
                type={startArrow}
                color={stroke.color}
                size={markerSize}
              />
            </Group>

            {/* End Marker */}
            <Group
              ref={endMarkerRef}
              x={endPoint.x}
              y={endPoint.y}
              rotation={(angle * 180) / Math.PI}
            >
              <LineMarker
                x={0}
                y={0}
                angle={0} // Rotation handled by Group
                type={endArrow}
                color={stroke.color}
                size={markerSize}
              />
            </Group>

            {/* Handles (only if selected) */}
            {isSelected && (
              <>
                <Circle
                  name="_line_handle"
                  x={startPoint.x}
                  y={startPoint.y}
                  radius={6}
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  hitStrokeWidth={20} // Extend hit area
                  draggable
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container()
                    if (container) container.style.cursor = 'pointer'
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container()
                    if (container) container.style.cursor = 'default'
                  }}
                  onDragMove={(e) => {
                    let newStart = { x: e.target.x(), y: e.target.y() }

                    // Snap to 45 degrees if Shift is pressed
                    if (e.evt.shiftKey) {
                      const dx = newStart.x - endPoint.x
                      const dy = newStart.y - endPoint.y
                      const angle = Math.atan2(dy, dx)
                      const dist = Math.sqrt(dx * dx + dy * dy)

                      // Snap angle to nearest 45 degrees (PI/4)
                      const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)

                      newStart = {
                        x: endPoint.x + Math.cos(snapAngle) * dist,
                        y: endPoint.y + Math.sin(snapAngle) * dist,
                      }

                      // Update handle position visually to match snapped point
                      e.target.position(newStart)
                    }

                    updateLineVisuals(newStart, endPoint)
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true // Prevent group drag

                    // Use the handle's current position which might be snapped
                    onChange({
                      id: lineElement.id,
                      startPoint: { x: e.target.x(), y: e.target.y() },
                    })
                  }}
                />
                <Circle
                  name="_line_handle"
                  x={endPoint.x}
                  y={endPoint.y}
                  radius={6}
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  hitStrokeWidth={20} // Extend hit area
                  draggable
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container()
                    if (container) container.style.cursor = 'pointer'
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container()
                    if (container) container.style.cursor = 'default'
                  }}
                  onDragMove={(e) => {
                    let newEnd = { x: e.target.x(), y: e.target.y() }

                    // Snap to 45 degrees if Shift is pressed
                    if (e.evt.shiftKey) {
                      const dx = newEnd.x - startPoint.x
                      const dy = newEnd.y - startPoint.y
                      const angle = Math.atan2(dy, dx)
                      const dist = Math.sqrt(dx * dx + dy * dy)

                      // Snap angle to nearest 45 degrees (PI/4)
                      const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)

                      newEnd = {
                        x: startPoint.x + Math.cos(snapAngle) * dist,
                        y: startPoint.y + Math.sin(snapAngle) * dist,
                      }

                      // Update handle position visually to match snapped point
                      e.target.position(newEnd)
                    }

                    updateLineVisuals(startPoint, newEnd)
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true

                    // Use the handle's current position which might be snapped
                    onChange({
                      id: lineElement.id,
                      endPoint: { x: e.target.x(), y: e.target.y() },
                    })
                  }}
                />
              </>
            )}
          </Group>
        )
      }
      default:
        if (renderCustom) {
          return renderCustom(element, commonProps, handleShapeRef)
        }
        return null
    }
  }

  return (
    <>
      {renderElement()}
      {isSelected && element.type !== 'Line' && !selectedCell && (
        <Transformer
          name="_transformer"
          ref={trRef}
          anchorSize={12}
          anchorCornerRadius={6}
          padding={5}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </>
  )
}
