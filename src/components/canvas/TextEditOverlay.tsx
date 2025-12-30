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

      if (!isComposing.current && document.activeElement !== textareaRef.current && textareaRef.current.value !== element.text) {
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
    const boxW = Math.max(0, scaledW - (padding * 2))
    const boxH = Math.max(0, scaledH - (padding * 2))

    // Debug log
    console.log('[TextEditOverlay] render:', {
      id: element.id,
      w: element.w, h: element.h,
      vertical: element.vertical,
      boxW, boxH,
      areaPosition
    });

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
        padding: 0
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
        ].filter(Boolean).join(' '),
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
    element.x, element.y, element.w, element.h,
    element.padding, element.vAlign,
    element.fontSize, element.font, element.fontWeight,
    element.text,
    element.vertical,
    scale,
    stageNode,
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
        return
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
    handleChange({ target: { value: e.currentTarget.value } } as React.ChangeEvent<HTMLTextAreaElement>)
  }

  return (
    <>
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
    </>
  )
}
