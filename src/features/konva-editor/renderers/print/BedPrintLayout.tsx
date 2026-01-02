import React, { useEffect, useState } from 'react'
import '@/features/konva-editor/styles/print.css'
import { useI18n } from '@/i18n/I18nContext'
import { RenderLine } from '@/features/konva-editor/renderers/print/elements/RenderLine'
import { RenderShape } from '@/features/konva-editor/renderers/print/elements/RenderShape'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'
import { mmToPt, ptToMm } from '@/utils/units'
import { parseListLine } from '@/features/konva-editor/utils/textList'
import type {
  Doc,
  ImageNode,
  LineNode,
  ShapeNode,
  TextNode,
  UnifiedNode,
  WidgetNode,
} from '@/types/canvas'

const mmToPtValue = (mm: number | undefined) => mmToPt(mm ?? 0)
const mmPt = (mm: number | undefined) => `${mmToPtValue(mm)}pt`

const RenderBed = ({ element }: { element: WidgetNode }) => {
  const { t } = useI18n()
  const data = element.data || {}
  const patientName = (data.patientName as string) || ''
  const bloodPressure = (data.bloodPressure as string) || ''
  const label = (data.label as string) || t('toolbar_bed', 'Bed')

  // Status colors (Matching BedElement.tsx)
  const strokeColor = '#3b82f6' // Default Blue (Idle)
  const bgColor = '#ffffff'
  const rawBorderW = (data as { borderW?: unknown }).borderW
  const strokeWidth =
    typeof rawBorderW === 'number' && Number.isFinite(rawBorderW) ? Math.max(0, rawBorderW) : 0.4

  // Pillow style (fixed; bed rotation handles orientation)
  const pillowStyle: React.CSSProperties = {
    top: '10%',
    left: '5pt',
    width: '20pt',
    height: '80%',
  }

  const textHalo =
    '2px 0 0 white, -2px 0 0 white, 0 2px 0 white, 0 -2px 0 white, 1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white'

  const cornerR = 1
  const pillowR = 0.5

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: bgColor,
        border: `${mmToPtValue(strokeWidth)}pt solid ${strokeColor}`,
        borderRadius: mmPt(cornerR),
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
          borderRadius: mmPt(pillowR),
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
            fontSize: '18pt',
            fontWeight: 'bold',
            color: '#374151',
            textShadow: textHalo,
            lineHeight: 1,
            textAlign: 'center',
            marginBottom: patientName ? '0' : '0',
          }}
        >
          {label}
        </div>
        {patientName && (
          <div
            style={{
              fontSize: '18pt',
              fontWeight: 'bold',
              color: '#000000',
              textShadow: textHalo,
              lineHeight: 1,
              textAlign: 'center',
              marginTop: '18pt',
            }}
          >
            {patientName}
          </div>
        )}
        {bloodPressure && (
          <div
            style={{
              fontSize: '18pt',
              color: '#000000',
              textShadow: textHalo,
              lineHeight: 1,
              textAlign: 'center',
              marginTop: '18pt',
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
  const { t } = useI18n()

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
    left: mmPt(element.x),
    top: mmPt(element.y),
    width: mmPt(element.w),
    height: mmPt(element.h),
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
    const numberMarkerScale = 0.75
    const fontSizeMm = textEl.fontSize ?? ptToMm(12)
    const lineHeight = 1.2
    const textAlign = textEl.align === 'r' ? 'right' : textEl.align === 'c' ? 'center' : 'left'

    const renderListText = () => {
      if (textEl.vertical) return textEl.text
      const lines = (textEl.text || '').split('\n')
      const hasList = lines.some((line) => parseListLine(line, { vertical: false }).isList)
      if (!hasList) return textEl.text

      return lines.map((line, index) => {
        const parsed = parseListLine(line, { vertical: false })
        if (!parsed.isList || !parsed.type || !parsed.markerText) {
          return (
            <div key={`line-${index}`}>{line === '' ? '\u00A0' : line}</div>
          )
        }

        const indentSpaces = ' '.repeat(parsed.indentLength)
        const gapSpaces = ' '.repeat(parsed.gapLength)
        const markerStyle =
          parsed.type === 'number'
            ? {
              fontSize: `${mmToPtValue(fontSizeMm * numberMarkerScale)}pt`,
              verticalAlign: 'middle',
              display: 'inline-block',
            }
            : undefined

        return (
          <div key={`list-line-${index}`}>
            {indentSpaces}
            <span style={markerStyle}>{parsed.markerText}</span>
            {gapSpaces}
            {parsed.content === '' ? '\u00A0' : parsed.content}
          </div>
        )
      })
    }

    return (
      <div
        style={{
          ...style,
          fontSize: `${mmToPtValue(fontSizeMm)}pt`,
          fontWeight: textEl.fontWeight,
          fontStyle: textEl.italic ? 'italic' : 'normal',
          textDecoration: [
            textEl.underline ? 'underline' : '',
            textEl.lineThrough ? 'line-through' : '',
          ]
            .filter(Boolean)
            .join(' '),
          color: textEl.fill,
          fontFamily: '"Meiryo", "Hiragino Kaku Gothic ProN", "MS PGothic", sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          whiteSpace: 'pre',
          lineHeight,
        }}
      >
        <div style={{ width: '100%', textAlign }}>{renderListText()}</div>
      </div>
    )
  }

  if (element.t === 'shape') {
    return (
      <div style={style}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${mmToPtValue(element.w)} ${mmToPtValue(element.h)}`}
          style={{ overflow: 'visible' }}
        >
          <title>{resolveText('properties_preview', 'Preview')}</title>
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
            alt={resolveText('properties_preview', 'Preview')}
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
              border: '1pt dashed gray',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10pt',
              color: 'gray',
            }}
          >
            {resolveText('no_image', 'No Image')}
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
  const pageSize = `${width}mm ${height}mm`

  const nodes = document.nodes.filter((n) => n.s === resolvedSurfaceId)

  return (
    <div ref={ref} className="print-container">
      <style>{`@media print { @page { size: ${pageSize}; margin: 0; } }`}</style>
      <div
        className="print-page"
        style={{
          width: mmPt(width),
          height: mmPt(height),
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
