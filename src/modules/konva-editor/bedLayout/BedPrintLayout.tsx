import React from 'react'
import { useTranslation } from 'react-i18next'
import type {
  CanvasElement,
  IImageElement,
  ILineElement,
  IShapeElement,
  ITextElement,
} from '../../../types/canvas'
import { RenderLine, RenderShape } from '../report-editor/pdf-editor/components/PrintLayout'
import type { BedLayoutDocument, IBedElement } from '../types'

const RenderBed = ({ element }: { element: IBedElement }) => {
  const { status, patientName, bloodPressure, orientation, label } = element

  // Status colors (Matching BedElement.tsx)
  let strokeColor = '#3b82f6' // Default Blue (Idle)
  let strokeWidth = 2
  let bgColor = '#ffffff'

  if (status === 'active') {
    strokeColor = '#22c55e' // Green (Active)
    strokeWidth = 3
  } else if (status === 'warning') {
    strokeColor = '#eab308' // Yellow (Warning)
    strokeWidth = 4
    bgColor = '#fefce8' // Light yellow background
  } else if (status === 'alarm') {
    strokeColor = '#ef4444' // Red (Alarm)
    strokeWidth = 4
    bgColor = '#fef2f2' // Light red background
  }

  const isVertical = orientation === 'vertical'

  // Pillow style
  const pillowStyle: React.CSSProperties = isVertical
    ? {
      top: '5px',
      left: '10%',
      width: '80%',
      height: '20px',
    }
    : {
      top: '10%',
      left: '5px',
      width: '20px',
      height: '80%',
    }

  // Text Halo effect (simulated with text-shadow)
  const textHalo =
    '2px 0 0 white, -2px 0 0 white, 0 2px 0 white, 0 -2px 0 white, 1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        border: `${strokeWidth}px solid ${strokeColor}`,
        borderRadius: '4px',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: '"Meiryo", sans-serif',
      }}
    >
      {/* Pillow */}
      <div
        style={{
          position: 'absolute',
          backgroundColor: '#e5e7eb',
          borderRadius: '2px',
          opacity: 0.5,
          ...pillowStyle,
        }}
      />

      {/* Content Container - Centered */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none', // Let clicks pass through if needed (though this is print)
        }}
      >
        {/* Bed Label */}
        <div
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#374151',
            textShadow: textHalo,
            lineHeight: 1,
            textAlign: 'center',
            marginBottom: patientName ? '0' : '0', // Adjust spacing if needed
          }}
        >
          {label || 'Bed'}
        </div>

        {/* Patient Name */}
        {patientName && (
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#000000',
              textShadow: textHalo,
              lineHeight: 1,
              textAlign: 'center',
              marginTop: '18px',
            }}
          >
            {patientName}
          </div>
        )}

        {/* Blood Pressure */}
        {bloodPressure && (
          <div
            style={{
              fontSize: '18px',
              color: '#000000',
              textShadow: textHalo,
              lineHeight: 1,
              textAlign: 'center',
              marginTop: patientName ? '18px' : '18px',
            }}
          >
            {bloodPressure}
          </div>
        )}
      </div>
    </div>
  )
}

const BedPrintElement: React.FC<{ element: CanvasElement, i18nOverrides?: Record<string, string> }> = ({ element, i18nOverrides }) => {
  const { t } = useTranslation()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  if (!element.visible) return null

  // Line handling
  if (element.type === 'Line') {
    return <RenderLine element={element as ILineElement} />
  }

  // Common style for box-based elements
  if (!('box' in element)) return null

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.box.x}px`,
    top: `${element.box.y}px`,
    width: `${element.box.width}px`,
    height: `${element.box.height}px`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    zIndex: element.z,
  }

  if (element.type === 'Bed') {
    return (
      <div style={style}>
        <RenderBed element={element as IBedElement} />
      </div>
    )
  }

  if (element.type === 'Text') {
    const textEl = element as ITextElement
    return (
      <div
        style={{
          ...style,
          fontSize: `${textEl.font.size}px`,
          fontWeight: textEl.font.weight,
          fontStyle: textEl.font.italic ? 'italic' : 'normal',
          textDecoration: [
            textEl.font.underline ? 'underline' : '',
            textEl.font.strikethrough ? 'line-through' : '',
          ]
            .filter(Boolean)
            .join(' '),
          color: textEl.color,
          backgroundColor: textEl.backgroundColor,
          textAlign: textEl.align,
          fontFamily: '"Meiryo", "Hiragino Kaku Gothic ProN", "MS PGothic", sans-serif',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent:
            textEl.align === 'center'
              ? 'center'
              : textEl.align === 'right'
                ? 'flex-end'
                : 'flex-start',
          whiteSpace: 'pre-wrap',
        }}
      >
        {textEl.text}
      </div>
    )
  }

  if (
    [
      'Rect',
      'Circle',
      'Triangle',
      'Diamond',
      'Trapezoid',
      'Cylinder',
      'Heart',
      'Star',
      'Pentagon',
      'Hexagon',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Tree',
      'House',
    ].includes(element.type)
  ) {
    return (
      <div style={style}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <title>{resolveText('bed_layout_shape_preview', 'Bed layout shape')}</title>
          <RenderShape element={element as IShapeElement} />
        </svg>
      </div>
    )
  }

  if (element.type === 'Image') {
    const imageEl = element as IImageElement
    return (
      <div style={style}>
        {imageEl.src ? (
          <img
            src={imageEl.src}
            alt={resolveText('bed_layout_image_preview', 'Asset preview')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              display: 'block',
              opacity: imageEl.opacity ?? 1,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '1px dashed gray',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'gray',
            }}
          >
            {resolveText('no_image', 'No image')}
          </div>
        )}
      </div>
    )
  }

  return null
}

export const BedPrintLayout = React.forwardRef<HTMLDivElement, { document: BedLayoutDocument, i18nOverrides?: Record<string, string> }>(
  ({ document, i18nOverrides }, ref) => {
    const { width, height } = document.layout

    return (
      <div ref={ref} className="print-container">
        <div
          className="print-page"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor: 'white', // Bed Layout usually has white background or transparent
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {document.elementOrder.map((id) => {
            const element = document.elementsById[id]
            if (!element) return null
            return <BedPrintElement key={id} element={element} i18nOverrides={i18nOverrides} />
          })}
        </div>
      </div>
    )
  }
)
