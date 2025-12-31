import React, { useEffect, useMemo, useState } from 'react'
import '@/features/konva-editor/styles/print.css'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'
import { mmToPt, ptToMm } from '@/utils/units'
import { createHandwritingPath } from '@/utils/handwriting'
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

const mmToPtValue = (mm: number | undefined) => mmToPt(mm ?? 0)
const mmPt = (mm: number | undefined) => `${mmToPtValue(mm)}pt`

export const RenderSignature = ({ element }: { element: SignatureNode }) => {
  const { strokes, stroke, strokeW } = element

  const pathDataList = useMemo(() => {
    return strokes.map((strokePoints, i) =>
      createHandwritingPath(
        strokePoints.map((value) => mmToPt(value)),
        mmToPtValue(strokeW),
        element.pressureData?.[i],
        (element.usePressureSim ?? true) || !(element.pressureData?.[i]?.length ?? 0)
      )
    )
  }, [strokes, strokeW, element.pressureData, element.usePressureSim])

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${mmToPtValue(element.w)} ${mmToPtValue(element.h)}`}
      style={{ overflow: 'visible' }}
    >
      {pathDataList.map(
        (pathData, i) => pathData && <path key={i} d={pathData} fill={stroke || '#000'} />
      )}
    </svg>
  )
}

export const RenderShape = ({ element }: { element: ShapeNode }) => {
  const { shape } = element
  const width = mmToPtValue(element.w)
  const height = mmToPtValue(element.h)
  const fill = element.fill || 'none'
  const stroke = element.stroke || 'none'
  const strokeWidth = mmToPtValue(element.strokeW || 1)

  switch (shape) {
    case 'rect':
      return (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={mmToPtValue(element.radius)}
        />
      )
    case 'circle':
      return (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
    case 'triangle': {
      const points = `${width / 2}, 0 ${width},${height} 0, ${height} `
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    }
    case 'diamond': {
      const points = `${width / 2}, 0 ${width},${height / 2} ${width / 2},${height} 0, ${height / 2} `
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    }
    case 'arrow-u':
      return (
        <path
          d="M12 4l-8 8h6v8h4v-8h6z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          transform={`scale(${width / 24}, ${height / 24})`}
          vectorEffect="non-scaling-stroke"
        />
      )
    // Add other shapes as needed...
    default:
      return null
  }
}

export const RenderLine = ({ element }: { element: LineNode }) => {
  const { pts, stroke, strokeW } = element
  if (!pts) return null

  const ptsPt: number[] = []
  for (let i = 0; i < pts.length; i++) {
    ptsPt.push(mmToPt(pts[i]))
  }

  // Calculate bounding box for SVG viewbox/positioning
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (let i = 0; i < ptsPt.length; i += 2) {
    if (ptsPt[i] < minX) minX = ptsPt[i]
    if (ptsPt[i] > maxX) maxX = ptsPt[i]
    if (ptsPt[i + 1] < minY) minY = ptsPt[i + 1]
    if (ptsPt[i + 1] > maxY) maxY = ptsPt[i + 1]
  }

  const width = Math.abs(maxX - minX)
  const height = Math.abs(maxY - minY)

  // Points relative to SVG
  const relativePts = []
  for (let i = 0; i < ptsPt.length; i += 2) {
    relativePts.push(`${ptsPt[i] - minX},${ptsPt[i + 1] - minY}`)
  }

  return (
    <svg
      width={`${width + 20}pt`}
      height={`${height + 20}pt`}
      viewBox={`0 0 ${width + 20} ${height + 20}`}
      style={{ overflow: 'visible', position: 'absolute', left: `${minX}pt`, top: `${minY}pt` }}
    >
      <polyline
        points={relativePts.join(' ')}
        stroke={stroke}
        strokeWidth={mmToPtValue(strokeW)}
        fill="none"
      />
    </svg>
  )
}

const RenderTable = ({ element }: { element: TableNode }) => {
  const { table } = element
  const { rows, cols, cells } = table
  const rowCount = rows.length
  const colCount = cols.length

  const occupied = Array(rowCount)
    .fill(null)
    .map(() => Array(colCount).fill(false))

  return (
    <table
      style={{
        width: mmPt(element.w),
        height: mmPt(element.h),
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        position: 'absolute',
        left: mmPt(element.x),
        top: mmPt(element.y),
        // zIndex: element.z, // Not used
      }}
    >
      <colgroup>
        {cols.map((w, i) => (
          <col key={i} style={{ width: mmPt(w) }} />
        ))}
      </colgroup>
      <tbody>
        {rows.map((h, rowIndex) => (
          <tr key={rowIndex} style={{ height: mmPt(h) }}>
            {cols.map((_, colIndex) => {
              if (occupied[rowIndex][colIndex]) return null
              const cell = cells.find((c) => c.r === rowIndex && c.c === colIndex)

              const rowSpan = cell?.rs || 1
              const colSpan = cell?.cs || 1

              if (rowSpan > 1 || colSpan > 1) {
                for (let r = 0; r < rowSpan; r++) {
                  for (let c = 0; c < colSpan; c++) {
                    if (rowIndex + r < rowCount && colIndex + c < colCount) {
                      occupied[rowIndex + r][colIndex + c] = true
                    }
                  }
                }
              }

              if (!cell) return <td key={`${rowIndex}-${colIndex}`} />

              const fontSize = cell.fontSize ?? ptToMm(12)
              const borderW = cell.borderW ?? (cell.border ? 0.2 : 0.2)
              const borderColor = cell.borderColor || cell.border || '#ccc'

              return (
                <td
                  key={`${rowIndex}-${colIndex}`}
                  colSpan={colSpan}
                  rowSpan={rowSpan}
                  style={{
                    border: borderW > 0 ? `${mmToPtValue(borderW)}pt solid ${borderColor}` : 'none',
                    backgroundColor: cell.bg || 'transparent',
                    fontFamily: cell.font || 'Helvetica',
                    fontSize: `${mmToPtValue(fontSize)}pt`,
                    textAlign:
                      cell.align === 'r' ? 'right' : cell.align === 'c' ? 'center' : 'left',
                    verticalAlign:
                      cell.vAlign === 'b' ? 'bottom' : cell.vAlign === 'm' ? 'middle' : 'top',
                    color: cell.color || '#000000',
                    padding: '4pt',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {cell.v}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

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

    if (textEl.vertical) {
       const padding = textEl.padding ?? 10
       const COLUMN_SPACING = 1.5
       const startX = textEl.w - padding - (fontSizeMm * (COLUMN_SPACING / 2 + 0.5))
       
       const charMetrics = calculateVerticalLayout(textEl.text || '', startX, padding, {
          fontSize: fontSizeMm,
          columnSpacing: COLUMN_SPACING,
          letterSpacing: 0,
       })

       return (
        <div style={style}>
           <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              border: borderStyle,
              backgroundColor: backgroundColor,
              borderRadius: borderRadius,
              boxSizing: 'border-box',
           }}>
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
          whiteSpace: 'pre',
          lineHeight,
          border: borderStyle,
          backgroundColor,
          borderRadius,
          padding: textEl.padding ? `${mmToPtValue(textEl.padding)}pt` : undefined,
          boxSizing: 'border-box',
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

export const PrintLayout = React.forwardRef<
  HTMLDivElement,
  { doc: Doc; orientation?: 'portrait' | 'landscape'; i18nOverrides?: Record<string, string> }
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
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          {doc.nodes
            .filter((el) => el.s === surface.id)
            .map((element) => (
              <PrintElement key={element.id} element={element} />
            ))}
        </div>
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
