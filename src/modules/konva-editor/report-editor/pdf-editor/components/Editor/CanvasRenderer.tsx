/**
 * Canvas Renderer
 * Renders TLF elements on HTML Canvas
 */

import { createContextLogger } from '../../../../../../utils/logger'
import type {
  IEditorEllipse,
  IEditorImage,
  IEditorItem,
  IEditorLine,
  IEditorPageNumber,
  IEditorRect,
  IEditorTable,
  IEditorText,
  IEditorTextBlock,
} from '../../types/editorTypes'
import { ptToPx } from '../../utils/coordinates'

const log = createContextLogger('CanvasRenderer')

// ========================================
// Renderer Class
// ========================================

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private selectedItemId: string | null = null

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  // ========================================
  // Main Render Function
  // ========================================

  render(items: IEditorItem[], selectedItemId: string | null = null): void {
    this.selectedItemId = selectedItemId

    // Clear canvas
    this.clear()

    // Draw page background
    this.drawPageBackground()

    // Draw all items
    for (const item of items) {
      if (!item.display) {
        return
      }

      switch (item.type) {
        case 'text':
          this.drawText(item as IEditorText)
          break
        case 'text-block':
          this.drawTextBlock(item as IEditorTextBlock)
          break
        case 'rect':
          this.drawRect(item as IEditorRect)
          break
        case 'ellipse':
          this.drawEllipse(item as IEditorEllipse)
          break
        case 'line':
          this.drawLine(item as IEditorLine)
          break
        case 'image':
          this.drawImage(item as IEditorImage)
          break
        case 'page-number':
          this.drawPageNumber(item as IEditorPageNumber)
          break
        case 'table':
          this.drawTable(item as IEditorTable)
          break
        default:
          log.warn('Unsupported item type', { type: (item as IEditorItem).type })
      }
    }

    // Draw selection overlay
    if (selectedItemId) {
      const selectedItem = items.find((item) => item.id === selectedItemId)
      if (selectedItem) {
        this.drawSelection(selectedItem)
      }
    }
  }

  // ========================================
  // Clear Canvas
  // ========================================

  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  // ========================================
  // Draw Page Background
  // ========================================

  drawPageBackground(): void {
    const canvasWidth = this.ctx.canvas.width
    const canvasHeight = this.ctx.canvas.height

    // White page
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Gray border
    this.ctx.strokeStyle = '#cccccc'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(0, 0, canvasWidth, canvasHeight)
  }

  // ========================================
  // Draw Text Element
  // ========================================

  drawText(item: IEditorText): void {
    const x = ptToPx(item.x)
    const y = ptToPx(item.y)
    const width = ptToPx(item.width)
    const height = ptToPx(item.height)

    // Apply font styles
    const fontSize = item.style['font-size'] || 12
    const fontFamily = item.style['font-family']?.[0] || 'Arial'
    const fontStyle = item.style['font-style'] || []

    let font = ''
    if (fontStyle.includes('italic')) {
      font += 'italic '
    }
    if (fontStyle.includes('bold')) {
      font += 'bold '
    }
    font += `${fontSize}px ${fontFamily}`

    this.ctx.font = font
    this.ctx.fillStyle = item.style.color || '#000000'
    this.ctx.textAlign = item.style['text-align'] || 'left'
    this.ctx.textBaseline = item.style['vertical-align'] || 'top'

    // Calculate text position based on alignment
    let textX = x
    let textY = y

    switch (item.style['text-align']) {
      case 'center':
        textX = x + width / 2
        break
      case 'right':
        textX = x + width
        break
    }

    switch (item.style['vertical-align']) {
      case 'middle':
        textY = y + height / 2
        break
      case 'bottom':
        textY = y + height
        break
    }

    // Draw text lines
    const text = item.texts.join('\n')
    const lines = text.split('\n')
    const lineHeight = fontSize * 1.2

    for (const [index, line] of lines.entries()) {
      const lineY = textY + index * lineHeight
      this.ctx.fillText(line, textX, lineY)

      // Apply underline/strikethrough
      if (fontStyle.includes('underline')) {
        this.drawTextDecoration(line, textX, lineY + fontSize * 0.1, fontSize)
      }
      if (fontStyle.includes('linethrough')) {
        this.drawTextDecoration(line, textX, lineY - fontSize * 0.3, fontSize)
      }
    }

    // Draw bounding box for debugging
    if (this.selectedItemId === item.id) {
      this.ctx.strokeStyle = '#cccccc'
      this.ctx.lineWidth = 1
      this.ctx.setLineDash([5, 5])
      this.ctx.strokeRect(x, y, width, height)
      this.ctx.setLineDash([])
    }
  }

  // ========================================
  // Draw Text Decoration (underline/strikethrough)
  // ========================================

  drawTextDecoration(text: string, x: number, y: number, fontSize: number): void {
    const width = this.ctx.measureText(text).width
    this.ctx.beginPath()
    this.ctx.moveTo(x - width / 2, y)
    this.ctx.lineTo(x + width / 2, y)
    this.ctx.lineWidth = fontSize * 0.05
    this.ctx.stroke()
  }

  // ========================================
  // Draw Rectangle Element
  // ========================================

  drawRect(item: IEditorRect): void {
    const x = ptToPx(item.x)
    const y = ptToPx(item.y)
    const width = ptToPx(item.width)
    const height = ptToPx(item.height)
    const borderRadius = ptToPx(item['border-radius'] || 0)

    // Fill
    if (item.style['fill-color']) {
      this.ctx.fillStyle = item.style['fill-color']
      if (borderRadius > 0) {
        this.roundRect(x, y, width, height, borderRadius)
        this.ctx.fill()
      } else {
        this.ctx.fillRect(x, y, width, height)
      }
    }

    // Border
    if (
      item.style['border-style'] &&
      item.style['border-style'] !== 'none' &&
      (item.style['border-width'] || 0) > 0
    ) {
      this.ctx.strokeStyle = item.style['border-color'] || '#000000'
      this.ctx.lineWidth = ptToPx(item.style['border-width'] || 1)

      // Apply border style
      switch (item.style['border-style']) {
        case 'dotted':
          this.ctx.setLineDash([2, 2])
          break
        case 'dashed':
          this.ctx.setLineDash([10, 5])
          break
        default:
          this.ctx.setLineDash([])
      }

      if (borderRadius > 0) {
        this.roundRect(x, y, width, height, borderRadius)
        this.ctx.stroke()
      } else {
        this.ctx.strokeRect(x, y, width, height)
      }

      this.ctx.setLineDash([])
    }
  }

  // ========================================
  // Draw Line Element
  // ========================================

  drawLine(item: IEditorLine): void {
    const x1 = ptToPx(item.x1)
    const y1 = ptToPx(item.y1)
    const x2 = ptToPx(item.x2)
    const y2 = ptToPx(item.y2)

    this.ctx.strokeStyle = item.style['border-color'] || '#000000'
    this.ctx.lineWidth = ptToPx(item.style['border-width'] || 1)

    // Apply border style
    switch (item.style['border-style']) {
      case 'dotted':
        this.ctx.setLineDash([2, 2])
        break
      case 'dashed':
        this.ctx.setLineDash([10, 5])
        break
      default:
        this.ctx.setLineDash([])
    }

    // Draw line (with intermediate points if available)
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)

    // Draw through intermediate points (Phase 2)
    if (item.intermediatePoints && item.intermediatePoints.length > 0) {
      for (const point of item.intermediatePoints) {
        this.ctx.lineTo(ptToPx(point.x), ptToPx(point.y))
      }
    }

    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()

    this.ctx.setLineDash([])

    // Draw arrows if specified
    const startArrow = item.startArrow || 'none'
    const endArrow = item.endArrow || 'none'

    if (startArrow !== 'none' || endArrow !== 'none') {
      // Calculate angles for arrows
      const intermediatePoints = item.intermediatePoints || []
      const firstPoint = intermediatePoints.length > 0 ? intermediatePoints[0] : null
      const lastPoint =
        intermediatePoints.length > 0 ? intermediatePoints[intermediatePoints.length - 1] : null

      const firstSegmentEnd = firstPoint
        ? { x: ptToPx(firstPoint.x), y: ptToPx(firstPoint.y) }
        : { x: x2, y: y2 }
      const lastSegmentStart = lastPoint
        ? { x: ptToPx(lastPoint.x), y: ptToPx(lastPoint.y) }
        : { x: x1, y: y1 }

      const startLineAngle = Math.atan2(firstSegmentEnd.y - y1, firstSegmentEnd.x - x1)
      const endLineAngle = Math.atan2(y2 - lastSegmentStart.y, x2 - lastSegmentStart.x)

      const arrowSize = ptToPx(10) // 10pt arrow size

      // Draw start arrow (pointing away from line)
      if (startArrow !== 'none') {
        this.drawArrow(
          x1,
          y1,
          startLineAngle + Math.PI,
          startArrow,
          item.style['border-color'] || '#000000',
          arrowSize
        )
      }

      // Draw end arrow (pointing along line direction)
      if (endArrow !== 'none') {
        this.drawArrow(
          x2,
          y2,
          endLineAngle,
          endArrow,
          item.style['border-color'] || '#000000',
          arrowSize
        )
      }
    }

    // Draw intermediate point handles if this is the selected item (Phase 2)
    if (
      this.selectedItemId === item.id &&
      item.intermediatePoints &&
      item.intermediatePoints.length > 0
    ) {
      this.ctx.fillStyle = '#4F46E5'
      this.ctx.strokeStyle = '#FFFFFF'
      this.ctx.lineWidth = 2

      for (const point of item.intermediatePoints) {
        const px = ptToPx(point.x)
        const py = ptToPx(point.y)
        this.ctx.beginPath()
        this.ctx.arc(px, py, 5, 0, 2 * Math.PI)
        this.ctx.fill()
        this.ctx.stroke()
      }
    }
  }

  // ========================================
  // Draw Arrow Helper
  // ========================================

  private drawArrow(
    x: number,
    y: number,
    angle: number,
    arrowType: string,
    color: string,
    size: number
  ): void {
    if (arrowType === 'none') return

    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(angle)

    this.ctx.strokeStyle = color
    this.ctx.fillStyle = color
    this.ctx.lineWidth = 1
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'

    switch (arrowType) {
      case 'standard':
        // Standard arrow (two lines)
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(-size, -size / 2)
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(-size, size / 2)
        this.ctx.stroke()
        break

      case 'filled':
        // Filled triangle arrow
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(-size, -size / 2)
        this.ctx.lineTo(-size * 0.7, 0)
        this.ctx.lineTo(-size, size / 2)
        this.ctx.closePath()
        this.ctx.fill()
        break

      case 'triangle':
        // Triangle outline
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(-size * 0.8, -size / 2)
        this.ctx.lineTo(-size * 0.8, size / 2)
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.stroke()
        break

      case 'open':
        // Open arrow (angled lines)
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(-size, -size / 2)
        this.ctx.lineTo(-size * 0.5, 0)
        this.ctx.lineTo(-size, size / 2)
        this.ctx.lineTo(0, 0)
        this.ctx.stroke()
        break

      case 'circle':
        // Circle
        this.ctx.beginPath()
        this.ctx.arc(-size / 2, 0, size / 3, 0, 2 * Math.PI)
        this.ctx.fill()
        this.ctx.stroke()
        break

      case 'diamond':
        // Diamond
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(-size / 2, -size / 3)
        this.ctx.lineTo(-size, 0)
        this.ctx.lineTo(-size / 2, size / 3)
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.stroke()
        break

      case 'square':
        // Square
        this.ctx.beginPath()
        this.ctx.rect(-size, (-size * 2) / 3 / 2, size, (size * 2) / 3)
        this.ctx.fill()
        this.ctx.stroke()
        break
    }

    this.ctx.restore()
  }

  // ========================================
  // Draw Ellipse Element
  // ========================================

  drawEllipse(item: IEditorEllipse): void {
    const x = ptToPx(item.x)
    const y = ptToPx(item.y)
    const width = ptToPx(item.width)
    const height = ptToPx(item.height)

    const centerX = x + width / 2
    const centerY = y + height / 2
    const radiusX = width / 2
    const radiusY = height / 2

    // Fill
    if (item.style['fill-color']) {
      this.ctx.fillStyle = item.style['fill-color']
      this.ctx.beginPath()
      this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      this.ctx.fill()
    }

    // Border
    if (
      item.style['border-style'] &&
      item.style['border-style'] !== 'none' &&
      (item.style['border-width'] || 0) > 0
    ) {
      this.ctx.strokeStyle = item.style['border-color'] || '#000000'
      this.ctx.lineWidth = ptToPx(item.style['border-width'] || 1)

      // Apply border style
      switch (item.style['border-style']) {
        case 'dotted':
          this.ctx.setLineDash([2, 2])
          break
        case 'dashed':
          this.ctx.setLineDash([10, 5])
          break
        default:
          this.ctx.setLineDash([])
      }

      this.ctx.beginPath()
      this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
      this.ctx.stroke()

      this.ctx.setLineDash([])
    }
  }

  // ========================================
  // Draw TextBlock Element
  // ========================================

  drawTextBlock(item: IEditorTextBlock): void {
    const x = ptToPx(item.x)
    const y = ptToPx(item.y)
    const width = ptToPx(item.width)
    const height = ptToPx(item.height)

    // Apply font styles
    const fontSize = item.style['font-size'] || 12
    const fontFamily = item.style['font-family']?.[0] || 'Arial'
    const fontStyle = item.style['font-style'] || []

    let font = ''
    if (fontStyle.includes('italic')) {
      font += 'italic '
    }
    if (fontStyle.includes('bold')) {
      font += 'bold '
    }
    font += `${fontSize}px ${fontFamily}`

    this.ctx.font = font
    this.ctx.fillStyle = item.style.color || '#000000'
    this.ctx.textAlign = item.style['text-align'] || 'left'
    this.ctx.textBaseline = item.style['vertical-align'] || 'top'

    // Calculate text position based on alignment
    let textX = x
    let textY = y

    switch (item.style['text-align']) {
      case 'center':
        textX = x + width / 2
        break
      case 'right':
        textX = x + width
        break
    }

    switch (item.style['vertical-align']) {
      case 'middle':
        textY = y + height / 2
        break
      case 'bottom':
        textY = y + height
        break
    }

    // Display placeholder or value
    const displayText = item.value || '[TextBlock]'

    // Handle multi-line
    if (item['multiple-line']) {
      const lines = displayText.split('\n')
      const lineHeight = fontSize * 1.2

      for (const [index, line] of lines.entries()) {
        const lineY = textY + index * lineHeight
        this.ctx.fillText(line, textX, lineY)
      }
    } else {
      this.ctx.fillText(displayText, textX, textY)
    }

    // Draw bounding box for debugging
    if (this.selectedItemId === item.id) {
      this.ctx.strokeStyle = '#cccccc'
      this.ctx.lineWidth = 1
      this.ctx.setLineDash([5, 5])
      this.ctx.strokeRect(x, y, width, height)
      this.ctx.setLineDash([])
    }
  }

  // ========================================
  // Draw Selection Overlay
  // ========================================

  drawSelection(item: IEditorItem): void {
    // Special handling for line objects
    if (item.type === 'line') {
      this.drawLineSelection(item as IEditorLine)
      return
    }

    // Regular selection for other items
    const x = ptToPx(item.x)
    const y = ptToPx(item.y)
    const width = ptToPx(item.width)
    const height = ptToPx(item.height)

    // Selection border
    this.ctx.strokeStyle = '#6366f1' // Indigo
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([])
    this.ctx.strokeRect(x - 2, y - 2, width + 4, height + 4)

    // Resize handles
    const handles = [
      { x: x - 4, y: y - 4 }, // NW
      { x: x + width - 4, y: y - 4 }, // NE
      { x: x - 4, y: y + height - 4 }, // SW
      { x: x + width - 4, y: y + height - 4 }, // SE
      { x: x + width / 2 - 4, y: y - 4 }, // N
      { x: x + width / 2 - 4, y: y + height - 4 }, // S
      { x: x + width - 4, y: y + height / 2 - 4 }, // E
      { x: x - 4, y: y + height / 2 - 4 }, // W
    ]

    this.ctx.fillStyle = '#ffffff'
    this.ctx.strokeStyle = '#6366f1'
    this.ctx.lineWidth = 2

    for (const handle of handles) {
      this.ctx.fillRect(handle.x, handle.y, 8, 8)
      this.ctx.strokeRect(handle.x, handle.y, 8, 8)
    }
  }

  // ========================================
  // Draw Line Selection (endpoints only, no resize handles)
  // ========================================

  drawLineSelection(item: IEditorLine): void {
    const x1 = ptToPx(item.x1)
    const y1 = ptToPx(item.y1)
    const x2 = ptToPx(item.x2)
    const y2 = ptToPx(item.y2)

    this.ctx.save()

    // Draw the line with highlight (slightly thicker)
    this.ctx.strokeStyle = '#6366f1' // Indigo
    this.ctx.lineWidth = Math.max(ptToPx(item.style['border-width'] || 1) + 4, 6)
    this.ctx.globalAlpha = 0.3
    this.ctx.setLineDash([])

    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)

    // Draw through intermediate points
    if (item.intermediatePoints && item.intermediatePoints.length > 0) {
      for (const point of item.intermediatePoints) {
        this.ctx.lineTo(ptToPx(point.x), ptToPx(point.y))
      }
    }

    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()

    this.ctx.globalAlpha = 1.0

    // Draw endpoint handles (larger and more visible)
    const handleSize = 10

    // Start point handle
    this.ctx.fillStyle = '#ffffff'
    this.ctx.strokeStyle = '#6366f1'
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.arc(x1, y1, handleSize / 2, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.stroke()

    // End point handle
    this.ctx.beginPath()
    this.ctx.arc(x2, y2, handleSize / 2, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.stroke()

    // Draw intermediate point handles if they exist
    if (item.intermediatePoints && item.intermediatePoints.length > 0) {
      for (const point of item.intermediatePoints) {
        const px = ptToPx(point.x)
        const py = ptToPx(point.y)

        this.ctx.fillStyle = '#ffffff'
        this.ctx.strokeStyle = '#6366f1'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.arc(px, py, handleSize / 2 - 1, 0, 2 * Math.PI)
        this.ctx.fill()
        this.ctx.stroke()
      }
    }

    this.ctx.restore()
  }

  // ========================================
  // Draw Image Element
  // ========================================

  drawImage(item: IEditorImage): void {
    const x = ptToPx(item.x)
    const y = ptToPx(item.y)
    const width = ptToPx(item.width)
    const height = ptToPx(item.height)

    // Create an image element
    const img = new Image()
    img.src = item.data

    // Draw the image when loaded (for now, draw placeholder rectangle)
    if (img.complete) {
      try {
        this.ctx.drawImage(img, x, y, width, height)
      } catch (_error) {
        // If image fails to load, draw placeholder
        this.ctx.fillStyle = '#f0f0f0'
        this.ctx.fillRect(x, y, width, height)
        this.ctx.strokeStyle = '#cccccc'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(x, y, width, height)

        // Draw "Image" text
        this.ctx.fillStyle = '#999999'
        this.ctx.font = '12px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText('Image', x + width / 2, y + height / 2)
      }
    } else {
      // Draw placeholder while loading
      this.ctx.fillStyle = '#f0f0f0'
      this.ctx.fillRect(x, y, width, height)
      this.ctx.strokeStyle = '#cccccc'
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(x, y, width, height)
    }
  }

  // ========================================
  // Draw PageNumber Element
  // ========================================

  drawPageNumber(item: IEditorPageNumber): void {
    const x = ptToPx(item.x)
    const y = ptToPx(item.y)
    const width = ptToPx(item.width)
    const height = ptToPx(item.height)

    // Apply font styles
    const fontSize = item.style['font-size'] || 12
    const fontFamily = item.style['font-family']?.[0] || 'Arial'

    this.ctx.font = `${fontSize}px ${fontFamily}`
    this.ctx.fillStyle = item.style.color || '#000000'
    this.ctx.textAlign = item.style['text-align'] || 'center'
    this.ctx.textBaseline = 'top'

    // Calculate text position based on alignment
    let textX = x

    switch (item.style['text-align']) {
      case 'center':
        textX = x + width / 2
        break
      case 'right':
        textX = x + width
        break
    }

    // Display format or placeholder
    const displayText = item.format.base.replace('{page}', '1') || 'Page 1'
    this.ctx.fillText(displayText, textX, y)

    // Draw bounding box for debugging
    if (this.selectedItemId === item.id) {
      this.ctx.strokeStyle = '#cccccc'
      this.ctx.lineWidth = 1
      this.ctx.setLineDash([5, 5])
      this.ctx.strokeRect(x, y, width, height)
      this.ctx.setLineDash([])
    }
  }

  // ========================================
  // Draw Table Element
  // ========================================

  drawTable(item: IEditorTable): void {
    const startX = ptToPx(item.x)
    const startY = ptToPx(item.y)

    this.ctx.save()
    this.ctx.translate(startX, startY)

    // Helpers (using ptToPx for internal dimensions too)
    const getRowY = (rowIndex: number) => {
      let y = 0
      for (let i = 0; i < rowIndex; i++) {
        if (item.rows[i]) y += item.rows[i].height
      }
      return ptToPx(y)
    }

    const getColX = (colIndex: number) => {
      let x = 0
      for (let i = 0; i < colIndex; i++) {
        if (item.cols[i]) x += item.cols[i].width
      }
      return ptToPx(x)
    }

    const getRowHeight = (rowIndex: number, span: number = 1) => {
      let h = 0
      for (let i = 0; i < span; i++) {
        if (item.rows[rowIndex + i]) h += item.rows[rowIndex + i].height
      }
      return ptToPx(h)
    }

    const getColWidth = (colIndex: number, span: number = 1) => {
      let w = 0
      for (let i = 0; i < span; i++) {
        if (item.cols[colIndex + i]) w += item.cols[colIndex + i].width
      }
      return ptToPx(w)
    }

    // 1. Backgrounds
    if (item.cells) {
      for (const cell of item.cells) {
        if (cell.style?.['background-color']) {
          const x = getColX(cell.col)
          const y = getRowY(cell.row)
          const w = getColWidth(cell.col, cell.colSpan || 1)
          const h = getRowHeight(cell.row, cell.rowSpan || 1)

          this.ctx.fillStyle = cell.style['background-color']
          this.ctx.fillRect(x, y, w, h)
        }
      }

      // 2. Borders
      this.ctx.setLineDash([])
      for (const cell of item.cells) {
        const x = getColX(cell.col)
        const y = getRowY(cell.row)
        const w = getColWidth(cell.col, cell.colSpan || 1)
        const h = getRowHeight(cell.row, cell.rowSpan || 1)

        const borderColor = cell.style?.['border-color'] || '#000000'
        const borderWidth = cell.style?.['border-width'] || 1

        if (borderWidth > 0) {
          this.ctx.strokeStyle = borderColor
          this.ctx.lineWidth = ptToPx(borderWidth)
          this.ctx.strokeRect(x, y, w, h)
        }
      }

      // 3. Text
      for (const cell of item.cells) {
        if (!cell.content) continue

        const x = getColX(cell.col)
        const y = getRowY(cell.row)
        const w = getColWidth(cell.col, cell.colSpan || 1)
        const h = getRowHeight(cell.row, cell.rowSpan || 1)

        const style = cell.style || {}
        const fontSize = style['font-size'] || 12
        const fontFamily = style['font-family']?.[0] || 'Arial'

        this.ctx.font = `${fontSize}px ${fontFamily}`
        this.ctx.fillStyle = style.color || '#000000'

        const align = style['text-align'] || 'left'
        const vAlign = style['vertical-align'] || 'top'

        let textX = x
        let textY = y

        this.ctx.textAlign = align
        this.ctx.textBaseline = vAlign

        if (align === 'center') textX += w / 2
        else if (align === 'right') textX += w - 2
        else textX += 2

        if (vAlign === 'middle') textY += h / 2
        else if (vAlign === 'bottom') textY += h - 2
        else textY += 2

        this.ctx.fillText(cell.content, textX, textY)
      }
    }

    this.ctx.restore()

    // Draw selection box if selected
    if (this.selectedItemId === item.id) {
      // Just draw the bounding box of the whole table
      const totalWidth = getColX(item.colCount)
      const totalHeight = getRowY(item.rowCount)

      this.ctx.strokeStyle = '#cccccc'
      this.ctx.lineWidth = 1
      this.ctx.setLineDash([5, 5])
      this.ctx.strokeRect(startX, startY, totalWidth, totalHeight)
      this.ctx.setLineDash([])
    }
  }

  // ========================================
  // Helper: Round Rectangle
  // ========================================

  roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
  }
}
