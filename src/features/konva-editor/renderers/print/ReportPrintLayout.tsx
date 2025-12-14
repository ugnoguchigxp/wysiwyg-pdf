import React, { useEffect, useState } from 'react'
import '@/features/konva-editor/styles/print.css'
import type {
  UnifiedNode,
  Doc,
  Surface,
  ImageNode,
  LineNode,
  ShapeNode,
  SignatureNode,
  TableNode,
  TextNode,
} from '@/types/canvas'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'

export const RenderSignature = ({ element }: { element: SignatureNode }) => {
  const { strokes, stroke, strokeW } = element
  return (
    <svg
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }}
    >
      {strokes.map((points, i) => (
        <polyline
          key={i}
          points={points.join(' ')}
          fill="none"
          stroke={stroke || '#000'}
          strokeWidth={strokeW || 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

export const RenderShape = ({ element }: { element: ShapeNode }) => {
  const { w: width, h: height, shape } = element
  const fill = element.fill || 'none'
  const stroke = element.stroke || 'none'
  const strokeWidth = element.strokeW || 1

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
          rx={element.radius}
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

  // Calculate bounding box for SVG viewbox/positioning
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let i = 0; i < pts.length; i += 2) {
    if (pts[i] < minX) minX = pts[i]
    if (pts[i] > maxX) maxX = pts[i]
    if (pts[i + 1] < minY) minY = pts[i + 1]
    if (pts[i + 1] > maxY) maxY = pts[i + 1]
  }

  const width = Math.abs(maxX - minX)
  const height = Math.abs(maxY - minY)

  // Points relative to SVG
  const relativePts = []
  for (let i = 0; i < pts.length; i += 2) {
    relativePts.push((pts[i] - minX) + ',' + (pts[i + 1] - minY))
  }

  return (
    <svg
      width={width + 20}
      height={height + 20}
      style={{ overflow: 'visible', position: 'absolute', left: minX, top: minY }}
    >
      <polyline
        points={relativePts.join(' ')}
        stroke={stroke}
        strokeWidth={strokeW}
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

  const occupied = Array(rowCount).fill(null).map(() => Array(colCount).fill(false))

  return (
    <table
      style={{
        width: `${element.w}pt`,
        height: `${element.h}pt`,
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        position: 'absolute',
        left: `${element.x}pt`,
        top: `${element.y}pt`,
        // zIndex: element.z, // Not used
      }}
    >
      <colgroup>
        {cols.map((w, i) => (
          <col key={i} style={{ width: `${w}pt` }} />
        ))}
      </colgroup>
      <tbody>
        {rows.map((h, rowIndex) => (
          <tr key={rowIndex} style={{ height: `${h}pt` }}>
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

              const fontSize = cell.fontSize || 12
              const borderW = cell.borderW ?? (cell.border ? 1 : 1)
              const borderColor = cell.borderColor || cell.border || '#ccc'

              return (
                <td
                  key={`${rowIndex}-${colIndex}`}
                  colSpan={colSpan}
                  rowSpan={rowSpan}
                  style={{
                    border: borderW > 0 ? `${borderW}px solid ${borderColor}` : 'none',
                    backgroundColor: cell.bg || 'transparent',
                    fontFamily: cell.font || 'Helvetica',
                    fontSize: `${fontSize}pt`,
                    textAlign: cell.align === 'r' ? 'right' : cell.align === 'c' ? 'center' : 'left',
                    verticalAlign: cell.vAlign === 'b' ? 'bottom' : cell.vAlign === 'm' ? 'middle' : 'top',
                    color: cell.color || '#000000',
                    padding: '4px',
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
    left: `${element.x}pt`,
    top: `${element.y}pt`,
    width: `${element.w}pt`,
    height: `${element.h}pt`,
    transform: element.r ? `rotate(${element.r}deg)` : undefined,
  }

  if (element.t === 'text') {
    const textEl = element as TextNode
    return (
      <div style={{
        ...style,
        fontSize: `${textEl.fontSize}pt`,
        fontWeight: textEl.fontWeight,
        fontStyle: textEl.italic ? 'italic' : 'normal',
        textDecoration: [textEl.underline ? 'underline' : '', textEl.lineThrough ? 'line-through' : ''].filter(Boolean).join(' '),
        color: textEl.fill,
        textAlign: textEl.align === 'r' ? 'right' : textEl.align === 'c' ? 'center' : 'left',
        fontFamily: textEl.font,
        display: 'flex',
        alignItems: textEl.vAlign === 'b' ? 'flex-end' : textEl.vAlign === 'm' ? 'center' : 'flex-start',
        justifyContent: textEl.align === 'c' ? 'center' : textEl.align === 'r' ? 'flex-end' : 'flex-start',
        whiteSpace: 'pre-wrap',
      }}>
        {textEl.text}
      </div>
    )
  }

  if (element.t === 'shape') {
    return (
      <div style={style}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <RenderShape element={element as ShapeNode} />
        </svg>
      </div>
    )
  }

  if (element.t === 'image') {
    return (
      <div style={style}>
        {imageSrc ? <img src={imageSrc} style={{ width: '100%', height: '100%', objectFit: 'fill' }} alt="" /> : <div></div>}
      </div>
    )
  }

  if (element.t === 'table') {
    return <RenderTable element={element as TableNode} />
  }

  if (element.t === 'signature') {
    return <div style={style}><RenderSignature element={element as SignatureNode} /></div>
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

  const PrintPage = ({ surface, pageIndex }: { surface: Surface; pageIndex: number }) => {
    const [bgImageSrc, setBgImageSrc] = useState<string | null>(null)

    // Logic for bg image if URL or ID
    useEffect(() => {
      if (surface.bg && !surface.bg.startsWith('#')) {
        if (surface.bg.startsWith('http') || surface.bg.startsWith('data:')) {
          setBgImageSrc(surface.bg)
        } else {
          findImageWithExtension(surface.bg).then(res => {
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
          backgroundColor: (surface.bg && surface.bg.startsWith('#')) ? surface.bg : 'white',
          width,
          height,
        }}
      >
        {bgImageSrc && (
          <img
            src={bgImageSrc}
            alt=""
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 0 }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          {doc.nodes
            .filter((el) => el.s === surface.id)
            .map((element) => (
              <PrintElement key={element.id} element={element} />
            ))}
        </div>
        <div style={{ position: 'absolute', bottom: '10mm', right: '10mm', fontSize: '10pt', color: '#666', zIndex: 2 }}>
          {pageIndex + 1} / {doc.surfaces.length}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="print-container" style={{ width }}>
      {doc.surfaces.map((surface, index) => (
        <PrintPage key={surface.id} surface={surface} pageIndex={index} />
      ))}
    </div>
  )
})
