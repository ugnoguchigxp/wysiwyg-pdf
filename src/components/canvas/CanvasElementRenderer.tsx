import type Konva from 'konva'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Transformer } from 'react-konva'
import type {
  ImageNode,
  LineNode,
  ShapeNode,
  SignatureNode,
  TableNode,
  TextNode,
} from '../../types/canvas'
// Helpers & Components Imports
import { CanvasImage } from './CanvasImage'
import { useCanvasDrag } from './hooks/useCanvasDrag'
import { useCanvasTransform } from './hooks/useCanvasTransform'
import { LineRenderer } from './renderers/LineRenderer'
import { ShapeRenderer } from './renderers/ShapeRenderer'
import { SignatureRenderer } from './renderers/SignatureRenderer'
import { TableRenderer } from './renderers/TableRenderer'
import { TextRenderer } from './renderers/TextRenderer'
import type { CanvasElementCommonProps, CanvasElementRendererProps } from './types'

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
  editingCell: _editingCell,
  selectedCell: _selectedCell,
  renderCustom,
  readOnly,
  allElements,
  snapStrength = 5,
  gridSize = 15,
  showGrid = false,
  stageScale = 1,
  onToggleCollapse,
  onDragStart,
  onDragEnter,
  onDragLeave,
  dragState,
  onDragEnd,
}) => {
  const shapeRef = useRef<Konva.Node | null>(null)
  const trRef = useRef<Konva.Transformer | null>(null)
  const [isShiftDown, setIsShiftDown] = useState(false)

  const { handleDragEnd, handleDragMove } = useCanvasDrag({
    element,
    allElements,
    onChange,
  })

  const { handleTransformEnd } = useCanvasTransform({
    element,
    allElements,
    shapeRef,
    onChange,
  })

  const invScale = stageScale > 0 ? 1 / stageScale : 1

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(false)
    }
    const onBlur = () => setIsShiftDown(false)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  const rotationSnaps = useMemo(() => {
    if (!isShiftDown) return undefined
    return [0, 45, 90, 135, 180, 225, 270, 315]
  }, [isShiftDown])

  const rotationSnapTolerance = useMemo(() => {
    return isShiftDown ? 23 : 0
  }, [isShiftDown])

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
  }, [isSelected])

  // Force update transformer when dimensions change
  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.forceUpdate()
      trRef.current.getLayer()?.batchDraw()
    }
  }, [element.w, element.h, isSelected])

  // Update rotation snaps dynamically
  useEffect(() => {
    if (!isSelected || !trRef.current) return
    if (rotationSnaps) {
      trRef.current.rotationSnaps(rotationSnaps)
      trRef.current.rotationSnapTolerance(rotationSnapTolerance)
    } else {
      trRef.current.rotationSnaps([])
      trRef.current.rotationSnapTolerance(0)
    }
    trRef.current.getLayer()?.batchDraw()
  }, [isSelected, rotationSnaps, rotationSnapTolerance])

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

  const handleMouseEnter = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (readOnly) return
      if (element.locked || isSelected) return
      const container = e.target.getStage()?.container()
      if (container) container.style.cursor = 'move'
    },
    [readOnly, element.locked, isSelected]
  )

  const handleMouseLeave = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (readOnly) return
      if (isSelected) return
      const container = e.target.getStage()?.container()
      if (container) container.style.cursor = 'default'
    },
    [readOnly, isSelected]
  )

  const handleMindmapDragStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (element.t !== 'text') return
      if (!onDragStart) return
      onDragStart(element.id, e)
    },
    [element.t, element.id, onDragStart]
  )

  const handleMindmapDragEnter = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (element.t !== 'text') return
      if (!onDragEnter) return
      onDragEnter(element.id, e)
    },
    [element.t, element.id, onDragEnter]
  )

  const content = useMemo(() => {
    const commonProps: CanvasElementCommonProps = {
      id: element.id,
      x: element.t === 'line' ? 0 : (element.x ?? 0),
      y: element.t === 'line' ? 0 : (element.y ?? 0),
      width: element.t === 'line' ? 0 : (element.w ?? 0),
      height: element.t === 'line' ? 0 : (element.h ?? 0),
      rotation: element.r || 0,
      draggable: readOnly ? false : !element.locked,
      onMouseDown: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (onDragStart) {
          handleMindmapDragStart(e)
        }
        onSelect(e)
      },
      onTap: onSelect,
      onDblClick,
      ref: handleShapeRef,
      onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => {
        if (onDragStart) {
          // Mindmap drag: notify parent
        } else {
          handleDragMove(e)
        }
      },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        if (onDragStart) {
          dragState && onDragEnd && onDragEnd()
        } else {
          handleDragEnd(e)
        }
      },
      onTransformEnd: handleTransformEnd,
      visible: !element.hidden,
      onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        handleMouseEnter(e as Konva.KonvaEventObject<MouseEvent>)
        if (onDragEnter) {
          handleMindmapDragEnter(e)
        }
      },
      onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        handleMouseLeave(e as Konva.KonvaEventObject<MouseEvent>)
        onDragLeave?.(e)
      },
      onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => onContextMenu?.(e),
      dragBoundFunc: function (pos) {
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

        const absoluteTransform = stage.getAbsoluteTransform()
        const snappedPos = absoluteTransform.point({
          x: snappedLogicalX,
          y: snappedLogicalY,
        })

        return snappedPos
      },
    }

    if (renderCustom) {
      const custom = renderCustom(element, commonProps, handleShapeRef)
      if (custom) return custom
    }

    switch (element.t) {
      case 'text':
        return (
          <TextRenderer
            element={element as TextNode}
            commonProps={commonProps}
            isEditing={isEditing}
            dragState={dragState}
            invScale={invScale}
            onToggleCollapse={onToggleCollapse}
          />
        )
      case 'shape':
        return <ShapeRenderer element={element as ShapeNode} commonProps={commonProps} />
      case 'line':
        return (
          <LineRenderer
            element={element as LineNode}
            commonProps={commonProps}
            isSelected={isSelected}
            readOnly={readOnly}
            allElements={allElements}
            showGrid={showGrid}
            gridSize={gridSize}
            snapStrength={snapStrength}
            invScale={invScale}
            onChange={onChange}
          />
        )
      case 'image':
        return (
          <CanvasImage
            element={element as ImageNode}
            commonProps={commonProps}
            invScale={invScale}
            ref={handleShapeRef}
          />
        )
      case 'table':
        return (
          <TableRenderer
            element={element as TableNode}
            commonProps={commonProps}
            isSelected={isSelected}
            readOnly={readOnly}
            invScale={invScale}
            onChange={onChange}
            onCellClick={onCellClick}
            onCellDblClick={onCellDblClick}
            selectedCell={_selectedCell}
          />
        )
      case 'signature':
        return (
          <SignatureRenderer
            element={element as SignatureNode}
            commonProps={commonProps}
            stageScale={stageScale}
          />
        )
      default:
        return null
    }
  }, [
    element,
    renderCustom,
    handleShapeRef,
    readOnly,
    isSelected,
    onChange,
    _selectedCell,
    allElements,
    gridSize,
    invScale,
    onCellClick,
    onCellDblClick,
    showGrid,
    snapStrength,
    handleDragMove,
    handleDragEnd,
    handleTransformEnd,
    handleMouseEnter,
    handleMouseLeave,
    onContextMenu,
    onSelect,
    onDblClick,
    isEditing,
    dragState,
    onToggleCollapse,
    stageScale,
    onDragStart,
    handleMindmapDragStart,
    onDragEnd,
    onDragEnter,
    handleMindmapDragEnter,
    onDragLeave,
  ])

  return (
    <>
      {content}
      {isSelected && !readOnly && element.t !== 'line' && (
        <Transformer
          key={element.id}
          ref={trRef as React.RefObject<Konva.Transformer>}
          rotateEnabled={!element.locked}
          anchorSize={8}
          borderStrokeWidth={element.locked ? 3 : 1}
          rotateAnchorOffset={16}
          rotationSnaps={rotationSnaps}
          rotationSnapTolerance={rotationSnapTolerance}
          enabledAnchors={
            !element.locked
              ? [
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                  'middle-left',
                  'middle-right',
                  'top-center',
                  'bottom-center',
                ]
              : []
          }
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox
            return newBox
          }}
        />
      )}
    </>
  )
}
