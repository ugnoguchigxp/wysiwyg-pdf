import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RenderLine, RenderShape } from '@/features/konva-editor/renderers/print/ReportPrintLayout'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'
import type {
  Doc,
  ImageNode,
  LineNode,
  ShapeNode,
  TextNode,
  UnifiedNode,
  WidgetNode,
} from '@/types/canvas'

const RenderBed = ({ element }: { element: WidgetNode }) => {
  const data = element.data || {}
  const status = (data.status as string) || 'idle'
  const patientName = (data.patientName as string) || ''
  const bloodPressure = (data.bloodPressure as string) || ''
  const orientation = (data.orientation as string) || 'horizontal'
  const label = (data.label as string) || 'Bed'

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
      <div
        style={{
          position: 'absolute',
          backgroundColor: '#e5e7eb',
          borderRadius: '2px',
          opacity: 0.5,
          ...pillowStyle,
        }}
      />
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
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#374151',
            textShadow: textHalo,
            lineHeight: 1,
            textAlign: 'center',
            marginBottom: patientName ? '0' : '0',
          }}
        >
          {label || 'Bed'}
        </div>
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
        {bloodPressure && (
          <div
            style={{
              fontSize: '18px',
              color: '#000000',
              textShadow: textHalo,
              lineHeight: 1,
              textAlign: 'center',
              marginTop: '18px',
            }}
          >
            {bloodPressure}
          </div>
        )}
      </div>
    </div>
  )
}

const BedPrintElement: React.FC<{
  element: UnifiedNode
  i18nOverrides?: Record<string, string>
}> = ({ element, i18nOverrides }) => {
  const { t } = useTranslation()

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    if (element.t === 'image') {
      const img = element as ImageNode
      if (img.src) {
        if (img.src.startsWith('http') || img.src.startsWith('data:')) {
          setImageSrc(img.src)
        } else {
          findImageWithExtension(img.src).then((res) => {
            if (res) setImageSrc(res.url)
          })
        }
      }
    }
  }, [element])

  if (element.hidden) return null

  if (element.t === 'line') {
    return <RenderLine element={element as LineNode} />
  }

  if (!('x' in element)) return null

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.w}px`,
    height: `${element.h}px`,
    transform: element.r ? `rotate(${element.r}deg)` : undefined,
    // zIndex: element.z,
  }

  if (element.t === 'widget' && element.widget === 'bed') {
    return (
      <div style={style}>
        <RenderBed element={element as WidgetNode} />
      </div>
    )
  }

  if (element.t === 'text') {
    const textEl = element as TextNode
    return (
      <div
        style={{
          ...style,
          fontSize: `${textEl.fontSize}px`,
          fontWeight: textEl.fontWeight,
          fontStyle: textEl.italic ? 'italic' : 'normal',
          textDecoration: [
            textEl.underline ? 'underline' : '',
            textEl.lineThrough ? 'line-through' : '',
          ]
            .filter(Boolean)
            .join(' '),
          color: textEl.fill,
          textAlign: textEl.align === 'r' ? 'right' : textEl.align === 'c' ? 'center' : 'left',
          fontFamily: '"Meiryo", "Hiragino Kaku Gothic ProN", "MS PGothic", sans-serif',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent:
            textEl.align === 'c' ? 'center' : textEl.align === 'r' ? 'flex-end' : 'flex-start',
          whiteSpace: 'pre-wrap',
        }}
      >
        {textEl.text}
      </div>
    )
  }

  if (element.t === 'shape') {
    return (
      <div style={style}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <title>{resolveText('bed_layout_shape_preview', 'Bed layout shape')}</title>
          <RenderShape element={element as ShapeNode} />
        </svg>
      </div>
    )
  }

  if (element.t === 'image') {
    return (
      <div style={style}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={resolveText('bed_layout_image_preview', 'Asset preview')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              display: 'block',
              opacity: element.opacity ?? 1,
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

export const BedPrintLayout = React.forwardRef<
  HTMLDivElement,
  { document: Doc; i18nOverrides?: Record<string, string>; surfaceId?: string }
>(({ document, i18nOverrides, surfaceId }, ref) => {
  const resolvedSurfaceId =
    surfaceId ||
    document.surfaces.find((s) => s.type === 'canvas')?.id ||
    document.surfaces[0]?.id ||
    'layout'
  const surface = document.surfaces.find((s) => s.id === resolvedSurfaceId) || document.surfaces[0]
  const width = surface?.w ?? 0
  const height = surface?.h ?? 0

  const nodes = document.nodes.filter((n) => n.s === resolvedSurfaceId)

  return (
    <div ref={ref} className="print-container">
      <div
        className="print-page"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {nodes.map((element) => (
          <BedPrintElement key={element.id} element={element} i18nOverrides={i18nOverrides} />
        ))}
      </div>
    </div>
  )
})
