import { isBracket, isRotatedChar, isTopRightAlign } from './glyph-detector'

// 右上寄せ（句読点・小書き仮名）のオフセット係数
// マス中央から右上へ移動させる量（fontSize に対する倍率）
const TOP_RIGHT_OFFSET_RATIO = 0.55

/**
 * 1文字分の描画情報
 */
export interface CharMetric {
  char: string
  x: number // 描画X座標（マス左上基準）
  y: number // 描画Y座標（マス左上基準）
  offsetY: number // マス内でのY方向オフセット
  offsetX: number // マス内でのX方向オフセット
  rotation: number // 回転角度（度）
  column: number // 何列目か（0始まり）
  row: number // 何行目か（0始まり）
}

export interface VerticalLayoutOptions {
  fontSize: number
  columnSpacing?: number // 列間（fontSize に対する倍率, default: 1.5）
  letterSpacing?: number // 字間（fontSize に対する倍率, default: 0）
  autoIndent?: boolean // 段落頭の自動字下げ
  indentSize?: number // 字下げ量（default: 1 = 1文字分）
  maxHeight?: number // 自動折り返し用の最大高さ
}

/**
 * テキストを縦書きレイアウトに変換する
 *
 * @param text - 入力テキスト（改行含む）
 * @param startX - 開始X座標（最初の列の右端）
 * @param startY - 開始Y座標（最初の行の上端）
 * @param options - レイアウトオプション
 * @returns 各文字の描画情報配列
 */
export function calculateVerticalLayout(
  text: string,
  startX: number,
  startY: number,
  options: VerticalLayoutOptions
): CharMetric[] {
  const {
    fontSize,
    columnSpacing = 1.5,
    letterSpacing = 0,
    autoIndent = false,
    indentSize = 1,
    maxHeight,
  } = options

  const result: CharMetric[] = []
  const paragraphs = text.split('\n')

  // 列間の実際のピクセル幅
  const columnWidth = fontSize * columnSpacing
  // 文字送りの実際のピクセル高さ
  const charHeight = fontSize * (1 + letterSpacing)

  let currentColumn = 0

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const paragraph = paragraphs[pIdx]
    const chars = Array.from(paragraph) // サロゲートペア対応

    let rowInColumn = 0

    // 段落インデント（段落の先頭は常にインデント対象）
    if (autoIndent && chars.length > 0) {
      rowInColumn = indentSize
    }

    for (let cIdx = 0; cIdx < chars.length; cIdx++) {
      const char = chars[cIdx]

      // 現在の描画位置を計算
      let x = startX - currentColumn * columnWidth
      let y = startY + rowInColumn * charHeight

      // 自動折り返し判定
      if (maxHeight && y + fontSize > startY + maxHeight) {
        currentColumn++
        rowInColumn = 0
        x = startX - currentColumn * columnWidth
        y = startY + rowInColumn * charHeight
      }

      // 文字種別のオフセット・回転を計算
      const metric = calculateCharMetric(char, x, y, fontSize, currentColumn, rowInColumn)
      result.push(metric)

      rowInColumn++
    }

    // 段落が変わるたびに新しい列へ（改行 = 次列へ進む）
    // ※ここではシンプルに「改行 = 次列」としているが、
    // 要件によっては「改行 = 同列で続ける」も考えられる
    currentColumn++
  }

  return result
}

/**
 * 1文字の描画メトリクスを計算
 */
function calculateCharMetric(
  char: string,
  baseX: number,
  baseY: number,
  fontSize: number,
  column: number,
  row: number
): CharMetric {
  let offsetX = 0
  let offsetY = 0
  let rotation = 0

  if (isTopRightAlign(char)) {
    // 右上寄せ: マスの右上（極端に寄せる）
    // KonvaのText(align=center)で描画される横書きグリフ（左下寄り）を
    // 縦書きのマスの右上に持っていくため、大きく移動させる。
    offsetX = fontSize * TOP_RIGHT_OFFSET_RATIO
    offsetY = -fontSize * TOP_RIGHT_OFFSET_RATIO
  } else if (isRotatedChar(char)) {
    // 90度回転（半角英数字、長音記号など）
    rotation = 90
    // 回転後の中央揃えのためのオフセット調整は不要（中心回転させているため）
  } else if (isBracket(char)) {
    // 括弧は90度回転させる
    // 注意: Konvaではフォントの縦書きグリフ（vert機能）を直接利用できないため、
    // 横書きグリフを回転させて縦書き表示を実現している。
    // HTMLのwriting-mode: vertical-rlでは自動で縦書きグリフが使用される。
    rotation = 90
  }

  return {
    char,
    x: baseX,
    y: baseY,
    offsetX,
    offsetY,
    rotation,
    column,
    row,
  }
}
