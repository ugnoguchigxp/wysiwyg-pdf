import type Konva from 'konva'
import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
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
  const isComposing = useRef(false)
  const [style, setStyle] = useState<React.CSSProperties>({})

  // 1. Text Sync Effect - Handles content updates
  useLayoutEffect(() => {
    if (textareaRef.current) {
      if (document.activeElement !== textareaRef.current) {
        // Auto-focus on mount (or re-mount)
        textareaRef.current.focus({ preventScroll: true })
      }

      // Sync value ONLY if not composing and not currently focused
      // preventing interruptions during IME composition or regular typing.
      if (!isComposing.current && document.activeElement !== textareaRef.current && textareaRef.current.value !== element.text) {
        textareaRef.current.value = element.text
      }
    }
  }, [element.text])

  // 2. Style/Geometry Effect - Handles positioning and sizing
  // Use useLayoutEffect to prevent visual flashes before paint
  useLayoutEffect(() => {
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
    // Use calculateTextDimensions with 'Arial' to match Konva default
    // Note: We use element.text here for dimension calc, but we shouldn't re-run this ENTIRE effect just for text change unless W/H implies it?
    // Actually, for alignment (vertical center), we NEED content height.
    // So 'dim' calculation depends on text.
    // IF text changes, 'dim.h' changes, so 'paddingTop' (extraTop) changes.
    // So we MUST re-calculate style on text change.
    // BUT we can still use useLayoutEffect to make it synchronous.
    const dim = calculateTextDimensions(element.text, {
      family: element.font || 'Arial',
      size: element.fontSize,
      weight: element.fontWeight,
      padding: 0 // pure text content
    })

    // Geometry Calculation
    // Match CanvasElementRenderer: Text node is positioned AT padding, with width = W - 2P
    const scaledW = element.w * scale
    const scaledH = element.h * scale
    const scaledPadding = padding // calculated above as element.padding * scale

    const innerW = Math.max(0, scaledW - (scaledPadding * 2))
    const innerH = Math.max(0, scaledH - (scaledPadding * 2))

    // Position offset (Inner Box)
    const boxLeft = areaPosition.x + scaledPadding
    const boxTop = areaPosition.y + scaledPadding

    // Vertical alignment within the inner box
    const scaledTextContentHeight = dim.h * scale
    let extraTop = 0
    if (vAlign === 'm') {
      extraTop = (innerH - scaledTextContentHeight) / 2
    } else if (vAlign === 'b') {
      extraTop = innerH - scaledTextContentHeight
    }
    const finalPaddingTop = Math.max(0, extraTop)

    const newStyle: React.CSSProperties = {
      position: 'absolute',
      // Position at inner box
      top: `${boxTop}px`,
      left: `${boxLeft}px`,
      width: `${innerW}px`,
      height: `${innerH}px`,

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
      lineHeight: 1.2,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      resize: 'none',

      // No horizontal padding in the textarea itself, because we sized it to the inner content box
      paddingLeft: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingTop: `${finalPaddingTop}px`,

      boxSizing: 'border-box',
      margin: 0,
      overflow: 'hidden',
      whiteSpace: 'pre', // Prevent wrapping in edit mode
      zIndex: 1000,
      transformOrigin: 'top left',
      transform: `rotate(${element.r || 0}deg)`,
    }

    setStyle(newStyle)
  }, [
    element.id,
    element.x, element.y, element.w, element.h,
    element.padding, element.vAlign,
    element.fontSize, element.font, element.fontWeight,
    element.text, // Text is needed for vertical alignment (content height)
    scale,
    stageNode,
    // Add other relevant props if they affect style
    element.italic, element.underline, element.lineThrough, element.fill, element.align, element.r
  ])

  const handleFinish = () => {
    if (textareaRef.current) {
      onUpdate(textareaRef.current.value)
    }
    onFinish()
  }

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
        handleFinish()
        return
      }

      // Plain Enter -> Newline (default behavior of textarea)
      // Do nothing, let event populate textarea
    }

    if (e.key === 'Escape') {
      handleFinish()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(e.target.value)
  }

  const handleCompositionStart = () => {
    isComposing.current = true
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposing.current = false
    // Ensure final value is synced up
    onUpdate(e.currentTarget.value)
  }

  return (
    <textarea
      ref={textareaRef}
      style={style}
      defaultValue={element.text}
      onChange={handleChange}
      onBlur={handleFinish}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      wrap="off"
    />
  )
}
