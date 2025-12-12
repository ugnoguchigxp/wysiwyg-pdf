/**
 * Text Edit Overlay Component
 * Overlay for direct text editing on canvas
 */

import { useEffect, useRef } from 'react'
import type { IEditorText } from '../../types/editorTypes'
import { ptToPx } from '../../utils/coordinates'

interface ITextEditOverlayProps {
  item: IEditorText
  textEditValue: string
  zoom: number
  panOffset: { x: number; y: number }
  onTextChange: (value: string) => void
  onComplete: () => void
  onCancel: () => void
}

/**
 * TextEditOverlay Component
 * テキスト要素の編集オーバーレイ
 */
export const TextEditOverlay: React.FC<ITextEditOverlayProps> = ({
  item,
  textEditValue,
  zoom,
  panOffset,
  onTextChange,
  onComplete,
  onCancel,
}) => {
  const zoomScale = zoom / 100
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Convert points to pixels and apply zoom/pan
  const x = ptToPx(item.x) * zoomScale + panOffset.x
  const y = ptToPx(item.y) * zoomScale + panOffset.y
  const width = ptToPx(item.width) * zoomScale
  const height = ptToPx(item.height) * zoomScale

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 1000,
      }}
    >
      <textarea
        ref={textareaRef}
        value={textEditValue}
        onChange={(e) => onTextChange(e.target.value)}
        onBlur={onComplete}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onComplete()
          } else if (e.key === 'Escape') {
            onCancel()
          }
        }}
        className="w-full h-full border-2 border-blue-500 bg-white text-black resize-none outline-none p-1"
        style={{
          fontSize: `${(item.style['font-size'] || 12) * zoomScale}px`,
          fontFamily: item.style['font-family']?.[0] || 'Arial',
          fontWeight: item.style['font-style']?.includes('bold') ? 'bold' : 'normal',
          fontStyle: item.style['font-style']?.includes('italic') ? 'italic' : 'normal',
          textAlign: item.style['text-align'] || 'left',
          color: item.style.color || '#000000',
        }}
      />
    </div>
  )
}
