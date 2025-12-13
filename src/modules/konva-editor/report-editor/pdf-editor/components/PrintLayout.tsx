import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../styles/print.css'
import type {
  Element,
  IImageElement,
  ILineElement,
  IPage,
  IShapeElement,
  ITableElement,
  ITemplateDoc,
  ITextElement,
} from '../types/wysiwyg'
import { findImageWithExtension } from './WysiwygCanvas/canvasImageUtils'

// Helper to render shapes as SVG
// Helper to render shapes as SVG
export const RenderShape = ({ element }: { element: IShapeElement }) => {
  const { width, height } = element.box
  const fill = element.fill.color || 'none'
  const stroke = element.stroke.color || 'none'
  const strokeWidth = element.stroke.width || 1

  switch (element.type) {
    case 'Rect':
      return (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )
    case 'Circle':
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
    case 'Triangle': {
      const points = `${width / 2}, 0 ${width},${height} 0, ${height} `
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    }
    case 'Diamond': {
      const points = `${width / 2}, 0 ${width},${height / 2} ${width / 2},${height} 0, ${height / 2} `
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    }
    case 'Trapezoid': {
      const topOffset = width * 0.2
      const points = `${topOffset}, 0 ${width - topOffset}, 0 ${width},${height} 0, ${height} `
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    }
    case 'Cylinder': {
      const ellipseHeight = height * 0.15
      const ry = ellipseHeight / 2
      return (
        <>
          <rect
            x={0}
            y={ry}
            width={width}
            height={height - 2 * ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <ellipse
            cx={width / 2}
            cy={ry}
            rx={width / 2}
            ry={ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <ellipse
            cx={width / 2}
            cy={height - ry}
            rx={width / 2}
            ry={ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </>
      )
    }
    case 'Heart':
      return (
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          transform={`scale(${width / 24}, ${height / 24})`}
          vectorEffect="non-scaling-stroke"
        />
      )
    case 'Star':
      return (
        <path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          transform={`scale(${width / 24}, ${height / 24})`}
          vectorEffect="non-scaling-stroke"
        />
      )
    case 'Pentagon': {
      const points = `${width * 0.5},0 ${width},${height * 0.38} ${width * 0.82},${height} ${width * 0.18},${height} 0,${height * 0.38}`
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    }
    case 'Hexagon': {
      const points = `${width * 0.25},0 ${width * 0.75},0 ${width},${height * 0.5} ${width * 0.75},${height} ${width * 0.25},${height} 0,${height * 0.5}`
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    }
    case 'ArrowUp':
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
    case 'ArrowDown':
      return (
        <path
          d="M12 20l-8-8h6v-8h4v8h6z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          transform={`scale(${width / 24}, ${height / 24})`}
          vectorEffect="non-scaling-stroke"
        />
      )
    case 'ArrowLeft':
      return (
        <path
          d="M4 12l8-8v6h8v4h-8v6z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          transform={`scale(${width / 24}, ${height / 24})`}
          vectorEffect="non-scaling-stroke"
        />
      )
    case 'ArrowRight':
      return (
        <path
          d="M20 12l-8-8v6h-8v4h8v6z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          transform={`scale(${width / 24}, ${height / 24})`}
          vectorEffect="non-scaling-stroke"
        />
      )
    case 'Tree':
      return (
        <path
          d="M12 2 L8 8 H10 L6 14 H8 L4 20 H11 V24 H13 V20 H20 L16 14 H18 L14 8 H16 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          transform={`scale(${width / 24}, ${height / 24})`}
          vectorEffect="non-scaling-stroke"
        />
      )
    case 'House':
      return (
        <path
          d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          transform={`scale(${width / 24}, ${height / 24})`}
          vectorEffect="non-scaling-stroke"
        />
      )
    default:
      return null
  }
}

export const RenderLine = ({ element }: { element: ILineElement }) => {
  const { startPoint, endPoint, stroke } = element
  const minX = Math.min(startPoint.x, endPoint.x)
  const minY = Math.min(startPoint.y, endPoint.y)
  const width = Math.abs(endPoint.x - startPoint.x)
  const height = Math.abs(endPoint.y - startPoint.y)

  return (
    <svg
      width={width + 20}
      height={height + 20}
      style={{ overflow: 'visible', position: 'absolute', left: minX, top: minY }}
    >
      <title>Line preview</title>
      <line
        x1={startPoint.x - minX}
        y1={startPoint.y - minY}
        x2={endPoint.x - minX}
        y2={endPoint.y - minY}
        stroke={stroke.color}
        strokeWidth={stroke.width}
      />
    </svg>
  )
}

const RenderTable = ({ element }: { element: ITableElement }) => {
  const { rows, cols, cells, rowCount, colCount } = element

  // Track occupied cells for spans
  const occupied = Array(rowCount)
    .fill(null)
    .map(() => Array(colCount).fill(false))

  return (
    <table
      style={{
        width: `${element.box.width}pt`,
        height: `${element.box.height}pt`,
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        position: 'absolute',
        left: `${element.box.x}pt`,
        top: `${element.box.y}pt`,
        zIndex: element.z,
      }}
    >
      <colgroup>
        {cols.map((col, i) => (
          <col key={i} style={{ width: `${col.width}pt` }} />
        ))}
      </colgroup>
      <tbody>
        {rows.map((rowDef, rowIndex) => (
          <tr key={rowIndex} style={{ height: `${rowDef.height}pt` }}>
            {cols.map((_, colIndex) => {
              if (occupied[rowIndex][colIndex]) return null

              const cell = cells.find((c) => c.row === rowIndex && c.col === colIndex)

              const rowSpan = cell?.rowSpan || 1
              const colSpan = cell?.colSpan || 1

              // Mark occupied
              if (rowSpan > 1 || colSpan > 1) {
                for (let r = 0; r < rowSpan; r++) {
                  for (let c = 0; c < colSpan; c++) {
                    if (rowIndex + r < rowCount && colIndex + c < colCount) {
                      occupied[rowIndex + r][colIndex + c] = true
                    }
                  }
                }
              }

              // If no cell defined, render basic empty cell
              if (!cell) {
                return <td key={`${rowIndex}-${colIndex}`} />
              }

              const styles = cell.styles || {}
              const {
                family = 'Meiryo',
                size = 12,
                weight = 400,
                color = '#000',
                italic,
                underline,
                strikethrough,
              } = styles.font || {}

              return (
                <td
                  key={`${rowIndex}-${colIndex}`}
                  colSpan={colSpan}
                  rowSpan={rowSpan}
                  style={{
                    border: `${styles.borderWidth || 1}px solid ${styles.borderColor || '#000'}`,
                    backgroundColor: styles.backgroundColor || 'transparent',
                    fontFamily: family,
                    fontSize: `${size}pt`,
                    fontWeight: weight,
                    color,
                    textAlign: styles.align || 'left',
                    verticalAlign: styles.verticalAlign || 'top',
                    fontStyle: italic ? 'italic' : 'normal',
                    textDecoration: [
                      underline ? 'underline' : '',
                      strikethrough ? 'line-through' : '',
                    ]
                      .filter(Boolean)
                      .join(' '),
                    padding: '4px',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {cell.content}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const PrintElement = ({ element, i18nOverrides }: { element: Element, i18nOverrides?: Record<string, string> }) => {
  const { t } = useTranslation()
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  useEffect(() => {
    if (element.type === 'Image') {
      const imageEl = element as IImageElement
      if (imageEl.assetId) {
        findImageWithExtension(imageEl.assetId).then((res) => {
          if (res) setImageSrc(res.url)
        })
      }
    }
  }, [element])

  if (!element.visible) return null

  // Line handling
  if (element.type === 'Line') {
    return <RenderLine element={element as ILineElement} />
  }

  // Common style for box-based elements
  // We need to cast to access 'box' safely, or check type
  if (!('box' in element)) return null

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.box.x}pt`,
    top: `${element.box.y}pt`,
    width: `${element.box.width}pt`,
    height: `${element.box.height}pt`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    zIndex: element.z,
  }

  if (element.type === 'Text') {
    const textEl = element as ITextElement
    return (
      <div
        style={{
          ...style,
          fontSize: `${textEl.font.size}pt`,
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
          alignItems: 'flex-start', // Default
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
          <title>{resolveText('shape_preview', 'Shape preview')}</title>
          <RenderShape element={element as IShapeElement} />
        </svg>
      </div>
    )
  }

  if (element.type === 'Image') {
    return (
      <div style={style}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={resolveText('report_image_alt', 'Report asset')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill', // or contain/cover depending on requirement
              display: 'block',
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

  if (element.type === 'Table') {
    return <RenderTable element={element as ITableElement} />
  }

  return null
}

export const PrintLayout = React.forwardRef<
  HTMLDivElement,
  { doc: ITemplateDoc; orientation?: 'portrait' | 'landscape'; i18nOverrides?: Record<string, string> }
>(({ doc, orientation = 'portrait', i18nOverrides }, ref) => {
  const totalPages = doc.pages.length

  const isLandscape = orientation === 'landscape'
  const width = isLandscape ? '297mm' : '210mm'
  const height = isLandscape ? '210mm' : '297mm'

  const PrintPage = ({ page, pageIndex }: { page: IPage; pageIndex: number }) => {
    const [bgImageSrc, setBgImageSrc] = useState<string | null>(null)

    useEffect(() => {
      if (page.background?.imageId) {
        findImageWithExtension(page.background.imageId).then((res) => {
          if (res) setBgImageSrc(res.url)
        })
      } else {
        setBgImageSrc(null)
      }
    }, [page.background?.imageId])

    return (
      <div
        className="print-page"
        style={{
          backgroundColor: page.background?.color || 'white',
          width,
          height,
        }}
      >
        {/* Background Image */}
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
              objectFit: 'fill', // or cover/contain
              zIndex: 0, // Behind content
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Content Layer */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          {doc.elements // Use doc.elements here and filter
            .filter((el) => el.pageId === page.id)
            .map((element) => (
              <PrintElement key={element.id} element={element} i18nOverrides={i18nOverrides} />
            ))}
        </div>

        {/* Page Number */}
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
          {pageIndex + 1} / {totalPages}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="print-container" style={{ width }}>
      {doc.pages.map((page, index) => (
        <PrintPage key={page.id} page={page} pageIndex={index} />
      ))}
    </div>
  )
})
