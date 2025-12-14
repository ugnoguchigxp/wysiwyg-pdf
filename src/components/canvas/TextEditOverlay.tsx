import type Konva from 'konva'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import type { TextNode } from '../../features/konva-editor/types'

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
    const newStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${areaPosition.y}px`,
      left: `${areaPosition.x}px`,
      width: `${element.w * scale}px`,
      height: `${element.h * scale}px`,
      fontSize: `${(element.fontSize || 12) * scale}px`,
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
      textAlign: element.align === 'r' ? 'right' : element.align === 'c' ? 'center' : element.align === 'j' ? 'justify' : 'left',
      lineHeight: 1.2, // Match Konva default
      background: 'transparent',
      border: 'none',
      outline: 'none',
      resize: 'none',
      padding: 0,
      margin: 0,
      overflow: 'hidden',
      zIndex: 1000, // Ensure it's on top
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
