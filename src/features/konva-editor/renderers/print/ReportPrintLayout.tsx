import React, { useEffect, useState } from 'react'
import '@/features/konva-editor/styles/print.css'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'
import { parseListLine } from '@/features/konva-editor/utils/textList'
import { calculateVerticalLayout } from '@/features/vertical-text/utils/vertical-layout'
import type {
  Doc,
  ImageNode,
  LineNode,
  ShapeNode,
  SignatureNode,
  Surface,
  TableNode,
  TextNode,
  UnifiedNode,
} from '@/types/canvas'
import { ptToMm } from '@/utils/units'
import { RenderLine } from './elements/RenderLine'
import { RenderShape } from './elements/RenderShape'
import { RenderSignature } from './elements/RenderSignature'
import { RenderTable } from './elements/RenderTable'
import { mmPt, mmToPtValue } from './utils'

const PrintElement = ({ element }: { element: UnifiedNode }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    if (element.t === 'image') {
      const imageEl = element as ImageNode
      if (imageEl.src) {
        if (imageEl.src.startsWith('http') || imageEl.src.startsWith('data:')) {
          setImageSrc(imageEl.src)
        } else {
          findImageWithExtension(imageEl.src).then((res) => {
            if (res) setImageSrc(res.url)
          })
        }
      } else {
        setImageSrc(null)
      }
    }
  }, [element])

  if (element.hidden) return null

  if (element.t === 'line') return <RenderLine element={element as LineNode} />

  // For other elements, check common coordinate props
  // type guard for elements with x,y,w,h?
  // Text, Shape, Image, Table, Widget, Signature have x,y,w,h.
  // We can just cast or access safely.
  if (!('x' in element)) return null

  const style: React.CSSProperties = {
    position: 'absolute',
    left: mmPt(element.x),
    top: mmPt(element.y),
    width: mmPt(element.w),
    height: mmPt(element.h),
    transform: element.r ? `rotate(${element.r}deg)` : undefined,
  }

  if (element.t === 'text') {
    const textEl = element as TextNode
    const numberMarkerScale = 0.75
    const fontSizeMm = textEl.fontSize ?? ptToMm(12)
    const lineHeight = 1.2
    const textAlign = textEl.align === 'r' ? 'right' : textEl.align === 'c' ? 'center' : 'left'
    const vAlign =
      textEl.vAlign === 'b' ? 'flex-end' : textEl.vAlign === 'm' ? 'center' : 'flex-start'

    const shouldShowBox =
      textEl.hasFrame !== undefined
        ? textEl.hasFrame
        : textEl.borderColor ||
          (textEl.borderWidth && textEl.borderWidth > 0) ||
          textEl.backgroundColor

    const borderStyle =
      shouldShowBox && textEl.borderWidth && textEl.borderWidth > 0
        ? `${mmToPtValue(textEl.borderWidth)}pt solid ${textEl.borderColor || '#000'}`
        : 'none'

    const backgroundColor =
      shouldShowBox && textEl.backgroundColor ? textEl.backgroundColor : 'transparent'

    const radiusRatio = Math.max(0, Math.min(1, Number(textEl.cornerRadius || 0)))
    const minDim = Math.min(textEl.w, textEl.h)
    const actualRadius = minDim * radiusRatio * 0.5
    const borderRadius =
      shouldShowBox && actualRadius > 0 ? `${mmToPtValue(actualRadius)}pt` : undefined

    const renderListText = () => {
      // vertical text is handled separately now, but keeping check just in case
      if (textEl.vertical) return textEl.text
      const lines = (textEl.text || '').split('\n')
      const hasList = lines.some((line) => parseListLine(line, { vertical: false }).isList)
      if (!hasList) return textEl.text

      return lines.map((line, index) => {
        const parsed = parseListLine(line, { vertical: false })
        if (!parsed.isList || !parsed.type || !parsed.markerText) {
          return <div key={`line-${index}`}>{line === '' ? '\u00A0' : line}</div>
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

    if (textEl.vertical) {
      const padding = textEl.padding ?? 10
      const COLUMN_SPACING = 1.5
      const startX = textEl.w - padding - fontSizeMm * (COLUMN_SPACING / 2 + 0.5)

      const charMetrics = calculateVerticalLayout(textEl.text || '', startX, padding, {
        fontSize: fontSizeMm,
        columnSpacing: COLUMN_SPACING,
        letterSpacing: 0,
      })

      return (
        <div style={style}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              border: borderStyle,
              backgroundColor: backgroundColor,
              borderRadius: borderRadius,
              boxSizing: 'border-box',
            }}
          >
            {charMetrics.map((metric, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${mmToPtValue(metric.x + metric.offsetX)}pt`,
                  top: `${mmToPtValue(metric.y + metric.offsetY)}pt`,
                  fontSize: `${mmToPtValue(fontSizeMm)}pt`,
                  fontFamily: textEl.font,
                  color: textEl.fill,
                  width: `${mmToPtValue(fontSizeMm)}pt`,
                  height: `${mmToPtValue(fontSizeMm)}pt`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: metric.rotation ? `rotate(${metric.rotation}deg)` : undefined,
                  lineHeight: 1,
                  whiteSpace: 'pre',
                }}
              >
                {metric.char}
              </div>
            ))}
          </div>
        </div>
      )
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
          fontFamily: textEl.font,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: vAlign,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          letterSpacing: '-0.05em',
          lineHeight,
          border: borderStyle,
          backgroundColor,
          borderRadius,
          padding: textEl.padding ? `${mmToPtValue(textEl.padding)}pt` : undefined,
          boxSizing: 'border-box',
          overflow: 'hidden',
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
          <RenderShape element={element as ShapeNode} />
        </svg>
      </div>
    )
  }

  if (element.t === 'image') {
    return (
      <div style={style}>
        {imageSrc ? (
          <img src={imageSrc} style={{ width: '100%', height: '100%', objectFit: 'fill' }} alt="" />
        ) : (
          <div></div>
        )}
      </div>
    )
  }

  if (element.t === 'table') {
    return <RenderTable element={element as TableNode} />
  }

  if (element.t === 'signature') {
    return (
      <div style={style}>
        <RenderSignature element={element as SignatureNode} />
      </div>
    )
  }

  return null
}

const RenderHeaderFooter = ({
  content,
  type,
  margin,
}: {
  content: import('@/types/canvas').HeaderFooterContent | undefined
  type: 'header' | 'footer'
  margin?: import('@/types/canvas').Margin
}) => {
  if (!content) return null
  const isHeader = type === 'header'

  // Excel default header/footer margin usually ~0.3 inch (7.6mm) from edge
  const verticalPos = '7.6mm'
  const leftPos = margin ? `${mmToPtValue(margin.l)}pt` : '10mm'
  const rightPos = margin ? `${mmToPtValue(margin.r)}pt` : '10mm'

  const style: React.CSSProperties = {
    position: 'absolute',
    left: leftPos,
    right: rightPos,
    height: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isHeader ? 'flex-start' : 'flex-end',
    fontSize: '9pt',
    fontFamily: 'Helvetica, Arial, sans-serif',
    zIndex: 10,
    [isHeader ? 'top' : 'bottom']: verticalPos,
    color: '#333',
  }

  return (
    <div style={style}>
      <div style={{ flex: 1, textAlign: 'left', whiteSpace: 'pre-wrap' }}>{content.left}</div>
      <div style={{ flex: 1, textAlign: 'center', whiteSpace: 'pre-wrap' }}>{content.center}</div>
      <div style={{ flex: 1, textAlign: 'right', whiteSpace: 'pre-wrap' }}>{content.right}</div>
    </div>
  )
}

export const PrintLayout = React.forwardRef<
  HTMLDivElement,
  {
    doc: Doc
    orientation?: 'portrait' | 'landscape'
    i18nOverrides?: Record<string, string>
  }
>(({ doc, orientation = 'portrait' }, ref) => {
  const isLandscape = orientation === 'landscape'
  const width = isLandscape ? '297mm' : '210mm'
  const height = isLandscape ? '210mm' : '297mm'
  const pageSize = isLandscape ? '297mm 210mm' : '210mm 297mm'

  const PrintPage = ({ surface, pageIndex }: { surface: Surface; pageIndex: number }) => {
    const [bgImageSrc, setBgImageSrc] = useState<string | null>(null)

    // Logic for bg image if URL or ID
    useEffect(() => {
      if (surface.bg && !surface.bg.startsWith('#')) {
        if (surface.bg.startsWith('http') || surface.bg.startsWith('data:')) {
          setBgImageSrc(surface.bg)
        } else {
          findImageWithExtension(surface.bg).then((res) => {
            if (res) setBgImageSrc(res.url)
          })
        }
      } else {
        setBgImageSrc(null)
      }
    }, [surface.bg])

    return (
      <div
        className="print-page"
        style={{
          backgroundColor: surface.bg?.startsWith('#') ? surface.bg : 'white',
          width,
          height,
        }}
      >
        {bgImageSrc && (
          <img
            src={bgImageSrc}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              zIndex: 0,
            }}
          />
        )}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
          }}
        >
          {doc.nodes
            .filter((el) => el.s === surface.id)
            .map((element) => (
              <PrintElement key={element.id} element={element} />
            ))}
        </div>

        <RenderHeaderFooter content={surface.header} type="header" margin={surface.margin} />
        <RenderHeaderFooter content={surface.footer} type="footer" margin={surface.margin} />

        {!surface.footer && (
          <div
            style={{
              position: 'absolute',
              bottom: '10mm',
              right: '10mm',
              fontSize: '10pt',
              color: '#666',
              zIndex: 2,
            }}
          >
            {pageIndex + 1} / {doc.surfaces.length}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="print-container" style={{ width }}>
      <style>{`@media print { @page { size: ${pageSize}; margin: 0; } }`}</style>
      {doc.surfaces.map((surface, index) => (
        <PrintPage key={surface.id} surface={surface} pageIndex={index} />
      ))}
    </div>
  )
})
