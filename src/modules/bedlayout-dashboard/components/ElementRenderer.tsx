import type Konva from 'konva'
import React, { useEffect, useRef } from 'react'
import { Transformer } from 'react-konva'
import { BedElement } from '../../konva-editor/bedLayout/elements/BedElement'
import { ImageElement } from '../../konva-editor/bedLayout/elements/ImageElement'
import { LineElement } from '../../konva-editor/bedLayout/elements/LineElement'
import { ShapeElement } from '../../konva-editor/bedLayout/elements/ShapeElement'
import { TextElement } from '../../konva-editor/bedLayout/elements/TextElement'
import type { BedLayoutElement } from '../../konva-editor/types'

import type { BedStatusData } from '../types'

interface ElementRendererProps {
  element: BedLayoutElement
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onChange: (newAttrs: Partial<BedLayoutElement>) => void
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

  const handleChange = (newAttrs: Partial<BedLayoutElement>) => {
    if (readOnly) return
    onChange(newAttrs)
  }

  const commonProps = {
    isSelected,
    onSelect: readOnly ? () => {} : onSelect,
    onChange: handleChange,
    draggable: !readOnly && !('locked' in element && element.locked),
  }

  let content = null

  // Helper to extract positioning props
  const getPositionProps = (el: BedLayoutElement) => {
    if (el.type === 'Line') return {}
    if ('box' in el && el.box) {
      return {
        x: el.box.x,
        y: el.box.y,
        rotation: el.rotation || 0,
      }
    }
    // Fallback for flat structure if any
    const record = el as unknown as Record<string, unknown>
    return {
      x: typeof record.x === 'number' ? record.x : 0,
      y: typeof record.y === 'number' ? record.y : 0,
      rotation: el.rotation || 0,
    }
  }

  const positionProps = getPositionProps(element)

  switch (element.type) {
    case 'Text':
      content = (
        <TextElement
          {...commonProps}
          {...positionProps}
          element={element}
          shapeRef={shapeRef as React.RefObject<Konva.Text>}
        />
      )
      break
    case 'Rect':
    case 'Circle':
    case 'Triangle':
    case 'Trapezoid':
    case 'Diamond':
    case 'Cylinder':
      content = (
        <ShapeElement
          {...commonProps}
          {...positionProps}
          element={element}
          shapeRef={shapeRef as React.RefObject<Konva.Group>}
        />
      )
      break
    case 'Image':
      content = (
        <ImageElement
          {...commonProps}
          {...positionProps}
          element={element}
          shapeRef={shapeRef as React.RefObject<Konva.Image>}
        />
      )
      break
    case 'Bed':
      content = (
        <BedElement
          {...commonProps}
          {...positionProps}
          element={element}
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
      break
    case 'Line':
      content = (
        <LineElement
          {...commonProps}
          element={element}
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
      {!readOnly && isSelected && element.type !== 'Line' && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
          rotateEnabled={element.type !== 'Bed'}
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

            if (element.type === 'Bed') {
              // BedElement logic might need adjustment if it adopts box structure or keeps flat x/y
              // Assuming BedElement still uses flat x/y for now or we update it later.
              // But wait, BedLayoutElement union uses IBedElement which has box.
              // Let's assume BedElement component handles box update.
              // But here we are updating the element state.

              // If BedElement uses box:
              onChange({
                ...element,
                box: {
                  ...element.box,
                  x: node.x(),
                  y: node.y(),
                  width: newWidth,
                  height: newHeight,
                },
              })
            } else if (
              element.type === 'Text' ||
              element.type === 'Image' ||
              element.type === 'Rect' ||
              element.type === 'Circle'
            ) {
              onChange({
                ...element,
                box: {
                  ...element.box,
                  x: node.x(),
                  y: node.y(),
                  width: newWidth,
                  height: newHeight,
                },
                rotation: node.rotation(),
              })
            }
          }}
        />
      )}
    </>
  )
}

export const ElementRenderer = React.memo(ElementRendererComponent)
