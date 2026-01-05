import type Konva from 'konva'
import type React from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import {
  buildListLine,
  getNextListNumber,
  normalizeListText,
  parseListLine,
} from '@/features/konva-editor/utils/textList'
import { calculateTextDimensions } from '@/features/konva-editor/utils/textUtils'
import type { TextNode } from '@/types/canvas'
import { ptToMm } from '@/utils/units'

interface TextEditOverlayProps {
  element: TextNode
  scale: number
  stageNode: Konva.Stage | null
  onUpdate: (text: string, rect?: { x: number; y: number; w: number; h: number }) => void
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
        textareaRef.current.focus({ preventScroll: true })
      }

      if (
        !isComposing.current &&
        document.activeElement !== textareaRef.current &&
        textareaRef.current.value !== element.text
      ) {
        textareaRef.current.value = element.text
      }
    }
  }, [element.text])

  // 2. Style/Geometry Effect - Handles positioning and sizing
  useLayoutEffect(() => {
    if (!stageNode || !element) return

    const node = stageNode.findOne(`#${element.id}`)
    if (!node) return

    const absolutePosition = node.getAbsolutePosition()
    const areaPosition = {
      x: absolutePosition.x,
      y: absolutePosition.y,
    }

    const scaledW = element.w * scale
    const scaledH = element.h * scale

    // パディング計算
    const paddingMm = element.padding || 0
    const padding = paddingMm * scale

    // 内部ボックスの位置とサイズ
    const boxLeft = areaPosition.x + padding
    const boxTop = areaPosition.y + padding
    const boxW = Math.max(0, scaledW - padding * 2)
    const boxH = Math.max(0, scaledH - padding * 2)

    // Debug log
    console.log('[TextEditOverlay] render:', {
      id: element.id,
      w: element.w,
      h: element.h,
      vertical: element.vertical,
      boxW,
      boxH,
      areaPosition,
    })

    let newStyle: React.CSSProperties = {
      position: 'absolute',
      // 位置は絶対座標（Canvasレンダリング領域と一致）
      top: `${boxTop}px`,
      left: `${boxLeft}px`,
      width: `${boxW}px`,
      height: `${boxH}px`,
      fontSize: `${(element.fontSize ?? ptToMm(12)) * scale}px`,
      fontFamily: element.font || 'Noto Sans JP',
      fontWeight: element.fontWeight || 400,
      fontStyle: element.italic ? 'italic' : 'normal',
      color: element.fill || '#000000',
      // 背景は透明にしてKonvaのテキストと重ねても違和感ないようにする（あるいは半透明白？）
      // 横書きでは transparent だったが、見やすくするために半透明白を維持するか、統一するか。
      // ユーザー要望「横書きロジックをそのまま」に従い、transparentを基本とするが、
      // 編集エリアがわかりにくいので少し色をつけるか？
      // 初期コードでは `rgba(255, 255, 255, 0.9)` だった。
      background: 'rgba(255, 255, 255, 0.5)',
      border: 'none',
      outline: '1px solid #007AFF',
      resize: 'none',
      boxSizing: 'border-box',
      margin: 0,
      overflow: 'hidden',
      zIndex: 1000,
      transformOrigin: 'top left',
      transform: `rotate(${element.r || 0}deg)`,
    }

    if (element.vertical) {
      // 縦書きテキスト: Hidden textarea + Konva描画アプローチ
      //
      // 仕組み:
      // 1. textarea は完全に透明で最小サイズ（スクロール防止）
      // 2. 入力は textarea で受け付ける（IME対応）
      // 3. 表示は Konva の VerticalKonvaText がリアルタイムで描画
      //
      // これにより「縦書き入力している感覚」を実現
      newStyle = {
        position: 'absolute',
        // テキストノードの左上に配置（小さいのでどこでもOK）
        left: `${areaPosition.x}px`,
        top: `${areaPosition.y}px`,
        // 最小サイズにしてスクロールを防ぐ
        width: '1px',
        height: '1px',
        // 完全に透明にする
        opacity: 0,
        // クリック・フォーカスは受け付ける
        pointerEvents: 'auto',
        // 背景・ボーダーも透明
        background: 'transparent',
        border: 'none',
        outline: 'none',
        // テキスト関連
        fontSize: '16px',
        color: 'transparent',
        caretColor: 'transparent',
        resize: 'none',
        overflow: 'hidden',
        padding: 0,
        margin: 0,
        zIndex: 1000,
      }
    } else {
      // 横書きスタイル
      const vAlign = element.vAlign || 'm'
      const dim = calculateTextDimensions(element.text, {
        family: element.font || 'Arial',
        size: element.fontSize,
        weight: element.fontWeight,
        padding: 0,
      })

      const scaledTextContentHeight = dim.h * scale
      let extraTop = 0
      if (vAlign === 'm') {
        extraTop = (boxH - scaledTextContentHeight) / 2
      } else if (vAlign === 'b') {
        extraTop = boxH - scaledTextContentHeight
      }
      const finalPaddingTop = Math.max(0, extraTop)

      newStyle = {
        ...newStyle,
        textAlign:
          element.align === 'r'
            ? 'right'
            : element.align === 'c'
              ? 'center'
              : element.align === 'j'
                ? 'justify'
                : 'left',
        lineHeight: 1.2,
        textDecoration: [
          element.underline ? 'underline' : '',
          element.lineThrough ? 'line-through' : '',
        ]
          .filter(Boolean)
          .join(' '),
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingTop: `${finalPaddingTop}px`,
        whiteSpace: 'pre',
      }
    }

    setStyle(newStyle)
  }, [
    element.id,
    element.x,
    element.y,
    element.w,
    element.h,
    element.padding,
    element.vAlign,
    element.fontSize,
    element.font,
    element.fontWeight,
    element.text,
    element.vertical,
    scale,
    stageNode,
    element.italic,
    element.underline,
    element.lineThrough,
    element.fill,
    element.align,
    element.r,
  ])

  const handleFinish = () => {
    if (textareaRef.current) {
      onUpdate(textareaRef.current.value)
    }
    onFinish()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || isComposing.current) {
      return
    }
    if (e.key === 'Tab') {
      const textarea = textareaRef.current
      if (!textarea) return

      e.preventDefault()
      if (element.vertical) return

      const value = textarea.value
      const selectionStart = textarea.selectionStart ?? 0
      const selectionEnd = textarea.selectionEnd ?? 0

      const lines = value.split('\n')
      const lineStarts: number[] = []
      let offset = 0
      for (const line of lines) {
        lineStarts.push(offset)
        offset += line.length + 1
      }

      const getLineIndex = (pos: number) => {
        for (let i = lineStarts.length - 1; i >= 0; i -= 1) {
          if (pos >= lineStarts[i]) return i
        }
        return 0
      }

      const startLine = getLineIndex(selectionStart)
      const endLine =
        selectionEnd > 0 && value[selectionEnd - 1] === '\n'
          ? getLineIndex(selectionEnd - 1)
          : getLineIndex(selectionEnd)

      let changed = false
      const updatedLines = lines.map((line, index) => {
        if (index < startLine || index > endLine) return line
        const parsed = parseListLine(line, { vertical: element.vertical })
        if (!parsed.isList || !parsed.type) return line
        const delta = e.shiftKey ? -1 : 1
        const nextLevel = Math.min(5, Math.max(1, parsed.level + delta))
        if (nextLevel === parsed.level) return line
        changed = true
        return buildListLine(parsed.content, parsed.type, nextLevel, {
          vertical: element.vertical,
        })
      })

      if (!changed) return

      const normalized = normalizeListText(updatedLines.join('\n'), {
        vertical: element.vertical,
      })
      const newLines = normalized.split('\n')
      const newLineStarts: number[] = []
      let newOffset = 0
      for (const line of newLines) {
        newLineStarts.push(newOffset)
        newOffset += line.length + 1
      }

      const adjustPosition = (pos: number) => {
        const lineIndex = getLineIndex(pos)
        const oldLine = lines[lineIndex] ?? ''
        const newLine = newLines[lineIndex] ?? ''
        const oldLineStart = lineStarts[lineIndex] ?? 0
        const newLineStart = newLineStarts[lineIndex] ?? 0
        const column = pos - oldLineStart
        const oldParsed = parseListLine(oldLine, {
          vertical: element.vertical,
        })
        const newParsed = parseListLine(newLine, {
          vertical: element.vertical,
        })
        const oldPrefix = oldParsed.isList ? oldParsed.prefixLength : 0
        const newPrefix = newParsed.isList ? newParsed.prefixLength : 0
        const prefixDelta = column >= oldPrefix ? newPrefix - oldPrefix : 0
        const newColumn = Math.min(newLine.length, Math.max(0, column + prefixDelta))
        return newLineStart + newColumn
      }

      const nextStart = adjustPosition(selectionStart)
      const nextEnd = adjustPosition(selectionEnd)

      textarea.value = normalized
      textarea.selectionStart = nextStart
      textarea.selectionEnd = nextEnd
      onUpdate(normalized)
      return
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return
      }

      const textarea = textareaRef.current
      if (!textarea) return

      const selectionStart = textarea.selectionStart ?? 0
      const selectionEnd = textarea.selectionEnd ?? 0
      if (selectionStart === selectionEnd) {
        const value = textarea.value
        const lines = value.split('\n')
        let lineStart = 0
        let lineIndex = 0
        for (let i = 0; i < lines.length; i += 1) {
          const lineEnd = lineStart + lines[i].length
          if (selectionStart >= lineStart && selectionStart <= lineEnd) {
            lineIndex = i
            break
          }
          lineStart = lineEnd + 1
        }
        const lineText = lines[lineIndex] ?? ''
        const parsed = parseListLine(lineText, { vertical: element.vertical })

        if (parsed.isList && parsed.type) {
          e.preventDefault()
          if (parsed.content.trim() === '') {
            const before = value.slice(0, lineStart)
            const after = value.slice(lineStart + lineText.length)
            const updated = `${before}${after}`
            textarea.value = updated
            textarea.selectionStart = lineStart
            textarea.selectionEnd = lineStart
            onUpdate(updated)
            return
          }

          const nextNumber =
            parsed.type === 'number'
              ? getNextListNumber(value, lineIndex, parsed.level, {
                  vertical: element.vertical,
                })
              : undefined
          const newLine = buildListLine('', parsed.type, parsed.level, {
            vertical: element.vertical,
            number: nextNumber,
          })
          const insert = `\n${newLine}`
          const updated = value.slice(0, selectionStart) + insert + value.slice(selectionEnd)
          const nextPos = selectionStart + insert.length

          if (parsed.type === 'number') {
            const normalized = normalizeListText(updated, {
              vertical: element.vertical,
            })
            const oldLines = updated.split('\n')
            const newLines = normalized.split('\n')
            const oldLineStarts: number[] = []
            const newLineStarts: number[] = []
            let oldOffset = 0
            let newOffset = 0
            for (const line of oldLines) {
              oldLineStarts.push(oldOffset)
              oldOffset += line.length + 1
            }
            for (const line of newLines) {
              newLineStarts.push(newOffset)
              newOffset += line.length + 1
            }

            const getLineIndex = (pos: number) => {
              for (let i = oldLineStarts.length - 1; i >= 0; i -= 1) {
                if (pos >= oldLineStarts[i]) return i
              }
              return 0
            }

            const adjustPosition = (pos: number) => {
              const lineIndex = getLineIndex(pos)
              const oldLine = oldLines[lineIndex] ?? ''
              const newLine = newLines[lineIndex] ?? ''
              const oldLineStart = oldLineStarts[lineIndex] ?? 0
              const newLineStart = newLineStarts[lineIndex] ?? 0
              const column = pos - oldLineStart
              const oldParsed = parseListLine(oldLine, {
                vertical: element.vertical,
              })
              const newParsed = parseListLine(newLine, {
                vertical: element.vertical,
              })
              const oldPrefix = oldParsed.isList ? oldParsed.prefixLength : 0
              const newPrefix = newParsed.isList ? newParsed.prefixLength : 0
              const prefixDelta = column >= oldPrefix ? newPrefix - oldPrefix : 0
              const newColumn = Math.min(newLine.length, Math.max(0, column + prefixDelta))
              return newLineStart + newColumn
            }

            const adjustedPos = adjustPosition(nextPos)
            textarea.value = normalized
            textarea.selectionStart = adjustedPos
            textarea.selectionEnd = adjustedPos
            onUpdate(normalized)
            return
          }

          textarea.value = updated
          textarea.selectionStart = nextPos
          textarea.selectionEnd = nextPos
          onUpdate(updated)
          return
        }
      }

      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        handleFinish()
        return
      }
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
    handleChange({
      target: { value: e.currentTarget.value },
    } as React.ChangeEvent<HTMLTextAreaElement>)
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
