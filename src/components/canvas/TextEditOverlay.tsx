import type Konva from 'konva'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { TextNode } from '@/types/canvas'
import { ptToMm } from '@/utils/units'
import { calculateTextDimensions } from '@/features/konva-editor/utils/textUtils'

interface TextEditOverlayProps {
  element: TextNode
  scale: number
  stageNode: Konva.Stage | null
  onUpdate: (text: string) => void
  onFinish: () => void
}

export const TextEditOverlay: React.FC<TextEditOverlayProps> = ({
  element,
  scale,
  stageNode,
  onUpdate,
  onFinish,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!stageNode || !element) return

    // Find the node in Konva stage to get absolute position
    const node = stageNode.findOne(`#${element.id}`)
    if (!node) return

    const absolutePosition = node.getAbsolutePosition()
    const areaPosition = {
      x: absolutePosition.x,
      y: absolutePosition.y,
    }

    // Calculate style
    const vAlign = element.vAlign || 'm'

    // Padding logic
    const paddingMm = element.padding || 0
    const padding = paddingMm * scale

    // Text Dimensions for alignment
    // We need the ACTUAL content height for vertical alignment
    // Use calculateTextDimensions with explicit 'Arial' fallback to match Overlay rendering default
    const dim = calculateTextDimensions(element.text, {
      family: element.font || 'Arial',
      size: element.fontSize,
      weight: element.fontWeight,
      padding: 0 // We want pure text height
    })

    // Vertical Align Offset Calculation
    // We calculate the space available *inside* the padding
    const scaledH = element.h * scale // Element Height in Screen Px
    const scaledPadding = padding
    const innerH = Math.max(0, scaledH - (scaledPadding * 2))

    const scaledTextContentHeight = dim.h * scale

    let extraTop = 0

    if (vAlign === 'm') {
      extraTop = (innerH - scaledTextContentHeight) / 2
    } else if (vAlign === 'b') {
      extraTop = innerH - scaledTextContentHeight
    }

    const paddingTopVal = scaledPadding + Math.max(0, extraTop)

    const newStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${areaPosition.y}px`,
      left: `${areaPosition.x}px`,
      width: `${element.w * scale}px`,
      height: `${element.h * scale}px`,
      fontSize: `${(element.fontSize ?? ptToMm(12)) * scale}px`,
      fontFamily: element.font || 'Arial',
      fontWeight: element.fontWeight || 400,
      fontStyle: element.italic ? 'italic' : 'normal',
      textDecoration: [
        element.underline ? 'underline' : '',
        element.lineThrough ? 'line-through' : '',
      ]
        .filter(Boolean)
        .join(' '),
      color: element.fill || '#000000',
      textAlign:
        element.align === 'r'
          ? 'right'
          : element.align === 'c'
            ? 'center'
            : element.align === 'j'
              ? 'justify'
              : 'left',
      lineHeight: 1.2, // Match Konva default
      background: 'transparent',
      border: 'none',
      outline: 'none',
      resize: 'none',
      paddingTop: `${paddingTopVal}px`,
      paddingBottom: `${scaledPadding}px`,
      paddingLeft: `${scaledPadding}px`,
      paddingRight: `${scaledPadding}px`,
      boxSizing: 'border-box',
      margin: 0,
      overflow: 'hidden',
      zIndex: 1000,
      transformOrigin: 'top left',
      transform: `rotate(${element.r || 0}deg)`,
    }

    setStyle(newStyle)

    // Auto-focus
    if (textareaRef.current) {
      if (document.activeElement !== textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true })
      }
      // Sync value if needed (e.g. undo/redo), but avoid interrupting typing
      if (textareaRef.current.value !== element.text) {
        textareaRef.current.value = element.text
      }
    }
  }, [element, scale, stageNode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Standard behavior for Shift+Enter in textarea is usually newline anyway,
        // but if we want to explicitly allow it or do something else we can.
        // For now, let it bubble or default behavior occur.
        return
      }

      if (e.metaKey || e.ctrlKey) {
        // Ctrl+Enter or Cmd+Enter to finish
        e.preventDefault()
        onFinish()
        return
      }

      // Plain Enter -> Newline (default behavior of textarea)
      // Do nothing, let event populate textarea
    }

    if (e.key === 'Escape') {
      onFinish()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(e.target.value)
  }

  return (
    <textarea
      ref={textareaRef}
      style={style}
      defaultValue={element.text}
      onChange={handleChange}
      onBlur={onFinish}
      onKeyDown={handleKeyDown}
    />
  )
}
