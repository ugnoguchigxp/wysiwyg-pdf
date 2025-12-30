import { mmToPx, ptToMm, pxToMm } from '@/utils/units'

const dpi = 96

export interface FontSettings {
  family?: string
  size?: number // in mm (typically from model)
  weight?: number | string
  padding?: number // in mm
  isVertical?: boolean
}

export const measureText = (
  text: string,
  font: { family: string; size: number; weight?: number | string }
) => {
  if (typeof document === 'undefined') return { width: 0, height: 0 }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { width: 0, height: 0 }

  const weight = font.weight || 'normal'
  ctx.font = `${weight} ${font.size}px ${font.family}`
  const metrics = ctx.measureText(text)

  // Height approximation
  const height = font.size * 1.2

  return {
    width: metrics.width,
    height,
  }
}

export const calculateTextDimensions = (text: string, fontSettings: FontSettings) => {
  const fontSizeMm = fontSettings.size || ptToMm(12)
  const font = {
    family: fontSettings.family || 'Meiryo',
    size: mmToPx(fontSizeMm, { dpi }), // convert mm to px for canvas measurement
    weight: fontSettings.weight || 400,
  }

  // Measure each line and find the maximum width
  const lines = text.split('\n')
  let maxLineLength = 0
  for (const line of lines) {
    const { width } = measureText(line || ' ', font)
    if (width > maxLineLength) maxLineLength = width
  }



  // Add padding (convert mm to px)
  const paddingMm = fontSettings.padding || 0
  const paddingPx = mmToPx(paddingMm, { dpi })

  if (fontSettings.isVertical) {
    // 縦書き: KonvaのVerticalKonvaText (グリッドレイアウト) に合わせた計算
    const columnSpacing = 1.5
    const layoutFontSize = font.size // px

    const columnWidth = layoutFontSize * columnSpacing
    const charHeight = layoutFontSize

    const numColumns = lines.length

    let maxChars = 0
    // autoIndent defaults to true in VerticalKonvaText
    const autoIndent = true
    const indentSize = 1

    for (const line of lines) {
      // サロゲートペア対応の文字数カウント
      const chars = Array.from(line)
      let len = chars.length

      // 段落（行）ごとのインデント
      if (autoIndent && len > 0) {
        len += indentSize
      }

      // 最低でも1文字分の高さは確保
      if (len === 0) len = 1

      if (len > maxChars) maxChars = len
    }

    if (maxChars === 0) maxChars = 1

    const w = numColumns * columnWidth
    const h = maxChars * charHeight

    return {
      w: pxToMm(w + (paddingPx * 2), { dpi }),
      h: pxToMm(h + (paddingPx * 2), { dpi })
    }
  } else {
    // 横書き: w = 最長行の長さ(long), h = 行の積み重なり(stack)
    // Note: 横書きのlineHeightは元々1.2だったが、エディタに合わせて調整が必要かも。
    // 一旦元のロジックに近い形にするが、ここでのlineHeight定義に注意。
    const hLH = font.size * 1.2
    const hStack = lines.length * hLH
    return {
      w: pxToMm(maxLineLength + (paddingPx * 2), { dpi }),
      h: pxToMm(hStack + (paddingPx * 2), { dpi })
    }
  }
}
