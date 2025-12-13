import type Konva from 'konva'
import React, { useEffect, useRef } from 'react'
import { Transformer } from 'react-konva'
import { BedElement } from '../../konva-editor/bedLayout/elements/BedElement'
import { ImageElement } from '../../konva-editor/bedLayout/elements/ImageElement'
import { LineElement } from '../../konva-editor/bedLayout/elements/LineElement'
import { ShapeElement } from '../../konva-editor/bedLayout/elements/ShapeElement'
import { TextElement } from '../../konva-editor/bedLayout/elements/TextElement'
import type { UnifiedNode, TextNode, ShapeNode, ImageNode, WidgetNode, LineNode } from '../../konva-editor/types'

import type { BedStatusData } from '../types'

interface ElementRendererProps {
  element: UnifiedNode
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<UnifiedNode>) => void
  readOnly?: boolean
  onBedClick?: (bedId: string, currentStatus?: BedStatusData) => void
  bedStatus?: BedStatusData
}

const ElementRendererComponent: React.FC<ElementRendererProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  readOnly = false,
  onBedClick,
  bedStatus,
}) => {
  const shapeRef = useRef<Konva.Node>(null)
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const handleChange = (newAttrs: Partial<UnifiedNode>) => {
    if (readOnly) return
    onChange(newAttrs)
  }

  const commonProps = {
    isSelected,
    onSelect: readOnly ? () => { } : onSelect,
    onChange: handleChange,
    draggable: !readOnly && !element.locked,
  }

  let content = null

  switch (element.t) {
    case 'text':
      content = (
        <TextElement
          {...commonProps}
          element={element as TextNode}
          shapeRef={shapeRef as React.RefObject<Konva.Text>}
        />
      )
      break
    case 'shape':
      content = (
        <ShapeElement
          {...commonProps}
          element={element as ShapeNode}
          shapeRef={shapeRef as React.RefObject<Konva.Group>}
        />
      )
      break
    case 'image':
      content = (
        <ImageElement
          {...commonProps}
          element={element as ImageNode}
          shapeRef={shapeRef as React.RefObject<Konva.Image>}
        />
      )
      break
    case 'widget':
      if (element.widget === 'bed') {
        content = (
          <BedElement
            {...commonProps}
            element={element as WidgetNode}
            shapeRef={shapeRef as React.RefObject<Konva.Rect>}
            bedStatus={bedStatus}
            onClick={readOnly && onBedClick ? () => onBedClick(element.id, bedStatus) : undefined}
            onTap={readOnly && onBedClick ? () => onBedClick(element.id, bedStatus) : undefined}
            onMouseEnter={
              readOnly && onBedClick
                ? (e: Konva.KonvaEventObject<MouseEvent>) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'pointer'
                }
                : undefined
            }
            onMouseLeave={
              readOnly && onBedClick
                ? (e: Konva.KonvaEventObject<MouseEvent>) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'default'
                }
                : undefined
            }
          />
        )
      }
      break
    case 'line':
      content = (
        <LineElement
          {...commonProps}
          element={element as LineNode}
          shapeRef={shapeRef as React.RefObject<Konva.Group>}
        />
      )
      break
    default:
      return null
  }

  return (
    <>
      {content}
      {!readOnly && isSelected && element.t !== 'line' && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
          rotateEnabled={element.t !== 'widget'} // Assuming widgets/bed allow rotation? Old code disabled for Bed.
          onTransformEnd={() => {
            const node = shapeRef.current
            if (!node) return

            const scaleX = node.scaleX()
            const scaleY = node.scaleY()
            // resets scale
            node.scaleX(1)
            node.scaleY(1)

            const newWidth = Math.max(5, node.width() * scaleX)
            const newHeight = Math.max(5, node.height() * scaleY)

            // Unified Node update
            onChange({
              ...element,
              x: node.x(),
              y: node.y(),
              w: newWidth,
              h: newHeight,
              r: node.rotation()
            } as UnifiedNode)
          }}
        />
      )}
    </>
  )
}

export const ElementRenderer = React.memo(ElementRendererComponent)
