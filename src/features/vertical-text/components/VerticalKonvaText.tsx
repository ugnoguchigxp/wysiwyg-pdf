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

    text,
    fontSize = 16,
    font = 'Noto Sans JP',
    fill = '#000000',
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
  const startX = w - padding - fontSize * (COLUMN_SPACING / 2 + 0.5)

  const charMetrics = calculateVerticalLayout(text, startX, padding, {
    fontSize,
    columnSpacing: COLUMN_SPACING,
    letterSpacing: 0,
    // maxHeightを指定すると、計算誤差によりエディタと異なる位置で折り返しが発生し
    // 表示が崩れる（潰れる）原因となるため、指定しない（自動折り返し無効）。
    // エディタ側で自動サイズ調整しているため、ここではその改行位置（改行コード）のみに従う。
  })

  return (
    <Group x={x} y={y} visible={visible}>
      {charMetrics.map((metric, index) => (
        <Text
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={`${node.id}-char-${index}`}
          text={metric.char}
          x={metric.x + metric.offsetX}
          y={metric.y + metric.offsetY}
          fontSize={fontSize}
          fontFamily={font}
          fill={fill}
          rotation={metric.rotation}
          // 回転の基準点を文字の中央にする
          offsetX={metric.rotation !== 0 ? fontSize / 2 : 0}
          offsetY={metric.rotation !== 0 ? fontSize / 2 : 0}
          // 描画安定化のためのプロパティ
          width={fontSize}
          height={fontSize}
          align="center"
          verticalAlign="middle"
          lineHeight={1}
          wrap="none"
        />
      ))}
    </Group>
  )
}
