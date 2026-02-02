import { Group, Text } from 'react-konva'
import type { TextNode } from '@/types/canvas'
import { calculateVerticalLayout } from '../utils/vertical-layout'

interface VerticalKonvaTextProps {
  node: TextNode
  visible?: boolean
}

/**
 * 縦書きテキストをKonvaでレンダリングするコンポーネント
 */
export function VerticalKonvaText({ node, visible = true }: VerticalKonvaTextProps) {
  const {
    x = 0,
    y = 0,
    w = 100,
    h = 100,

    text,
    fontSize = 16,
    font = 'Noto Sans JP',
    fill = '#000000',
    align,
    vAlign,
  } = node

  // パディング調整：node.paddingを使用する（デフォルト10）
  const padding = node.padding !== undefined ? node.padding : 10
  const COLUMN_SPACING = 1.5

  // レイアウト計算
  // 開始X座標の計算：
  // HTMLのエディタ(vertical-rl, line-height:1.5)は、Paddingを除いた領域の右端から開始する。
  // Column 0 の行ボックス右端 = w - padding.
  // 行ボックス幅 = fontSize * 1.5.
  // 文字の左端 = (RightEdge) - (ColWidth / 2) - (FontSize / 2)
  //            = (w - padding) - (fontSize * 1.5 / 2) - (fontSize / 2)
  //            = w - padding - fontSize * 1.25
  // 1. 各文字のレイアウト計算（基準位置: X=0, Y=0）
  // 最初に列数を確定させるためにダミー計算
  const dummyMetrics = calculateVerticalLayout(text, 0, 0, {
    fontSize,
    columnSpacing: COLUMN_SPACING,
    letterSpacing: 0,
    maxHeight: h - padding * 2,
  })

  if (dummyMetrics.length === 0) return null

  const maxColumn = Math.max(...dummyMetrics.map((m) => m.column))
  const columnWidth = fontSize * COLUMN_SPACING
  const textBlockWidth = maxColumn * columnWidth + fontSize

  // 最初の列の右端を textBlockWidth - fontSize に設定することで、
  // 全ての文字が 0 〜 textBlockWidth の範囲に収まるようにする
  const startXInBlock = textBlockWidth - fontSize
  const charMetrics = calculateVerticalLayout(text, startXInBlock, 0, {
    fontSize,
    columnSpacing: COLUMN_SPACING,
    letterSpacing: 0,
    maxHeight: h - padding * 2,
  })

  // 2. 水平方向(X)のオフセット計算
  const availableWidth = w - padding * 2
  let alignOffsetX = padding // Default: right (padding from left)
  if (align === 'c') {
    alignOffsetX = (availableWidth - textBlockWidth) / 2 + padding
  } else if (align === 'l') {
    alignOffsetX = padding // Actually padding from right? No, standard padding is from left.
    // speech-bubble usually wants centering.
    // For vertical-rl, align:right starts at right, align:left starts at left.
    alignOffsetX = padding
  } else {
    // Standard align:r (right) or default: Stay at the right side of available area
    alignOffsetX = availableWidth - textBlockWidth + padding
  }

  // 4. 垂直方向(Y)のオフセット計算 (各列ごとの最大高さに基づいて中心へ)
  // ここでは各文字に個別に適用
  const availableHeight = h - padding * 2
  const columnHeights = new Map<number, number>()
  charMetrics.forEach(m => {
    const h = m.row * fontSize + fontSize
    columnHeights.set(m.column, Math.max(columnHeights.get(m.column) || 0, h))
  })

  return (
    <Group x={x + alignOffsetX} y={y + padding} visible={visible}>
      {charMetrics.map((metric, index) => {
        let vOffset = 0
        if (vAlign === 'm') {
          vOffset = (availableHeight - (columnHeights.get(metric.column) || 0)) / 2
        } else if (vAlign === 'b') {
          vOffset = availableHeight - (columnHeights.get(metric.column) || 0)
        }

        return (
          <Text
            key={`${node.id}-char-${index}`}
            text={metric.char}
            x={metric.x + metric.offsetX}
            y={metric.y + metric.offsetY + vOffset}
            fontSize={fontSize}
            fontFamily={font}
            fill={fill}
            rotation={metric.rotation}
            offsetX={metric.rotation !== 0 ? fontSize / 2 : 0}
            offsetY={metric.rotation !== 0 ? fontSize / 2 : 0}
            width={fontSize}
            height={fontSize}
            align="center"
            verticalAlign="middle"
            lineHeight={1}
            wrap="none"
          />
        )
      })}
    </Group>
  )
}
