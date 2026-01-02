/**
 * 色変換ユーティリティ
 *
 * Excel色形式 → CSS色形式への変換
 */

import type { ColorInfo } from '../types/excel'

// ========================================
// Excelテーマカラー（Office 2007+）
// ========================================

/**
 * デフォルトのOfficeテーマカラー
 * theme index → base color (RRGGBB)
 */
const DEFAULT_THEME_COLORS: Record<number, string> = {
  0: 'FFFFFF', // Background 1 (white)
  1: '000000', // Text 1 (black)
  2: 'E7E6E6', // Background 2
  3: '44546A', // Text 2 (Blue-Gray)
  4: '4472C4', // Accent 1 (Blue)
  5: 'ED7D31', // Accent 2 (Orange)
  6: 'A5A5A5', // Accent 3 (Gray)
  7: 'FFC000', // Accent 4 (Gold)
  8: '5B9BD5', // Accent 5 (Blue)
  9: '70AD47', // Accent 6 (Green)
}

// ========================================
// 変換関数
// ========================================

/**
 * ColorInfo → CSS色文字列
 *
 * @param color ColorInfo
 * @param themeColors カスタムテーマカラー（オプション）
 * @returns CSS色文字列 (#RRGGBB or rgba())
 */
export function colorInfoToCSS(
  color: ColorInfo | undefined,
  themeColors: Record<number, string> = DEFAULT_THEME_COLORS
): string | undefined {
  if (!color) return undefined

  // ARGB形式（AARRGGBB）
  if (color.argb) {
    return argbToCSS(color.argb)
  }

  // テーマカラー
  if (color.theme !== undefined) {
    const baseColor = themeColors[color.theme] ?? '000000'
    if (color.tint !== undefined && color.tint !== 0) {
      return applyTint(baseColor, color.tint)
    }
    return `#${baseColor}`
  }

  // インデックスカラー (Excel Legacy Palette)
  if (color.indexed !== undefined) {
    return getIndexedColor(color.indexed)
  }

  return undefined
}

// 標準カラーパレット (Index 0-63)
// 参考: https://github.com/SheetJS/sheetjs/blob/master/bits/18_features.js#L5
const INDEXED_COLORS: Record<number, string> = {
  0: '000000',
  1: 'FFFFFF',
  2: 'FF0000',
  3: '00FF00',
  4: '0000FF',
  5: 'FFFF00',
  6: 'FF00FF',
  7: '00FFFF',
  8: '000000',
  9: 'FFFFFF',
  10: 'FF0000',
  11: '00FF00',
  12: '0000FF',
  13: 'FFFF00',
  14: 'FF00FF',
  15: '00FFFF',
  16: '800000',
  17: '008000',
  18: '000080',
  19: '808000',
  20: '800080',
  21: '008080',
  22: 'C0C0C0',
  23: '808080',
  24: '9999FF',
  25: '993366',
  26: 'FFFFCC',
  27: 'CCFFFF',
  28: '660066',
  29: 'FF8080',
  30: '0066CC',
  31: 'CCCCFF',
  32: '000080',
  33: 'FF00FF',
  34: 'FFFF00',
  35: '00FFFF',
  36: '800080',
  37: '800000',
  38: '008080',
  39: '0000FF',
  40: '00CCFF',
  41: 'CCFFFF',
  42: 'CCFFCC',
  43: 'FFFF99',
  44: '99CCFF',
  45: 'FF99CC',
  46: 'CC99FF',
  47: 'FFCC99',
  48: '3366FF',
  49: '33CCCC',
  50: '99CC00',
  51: 'FFCC00',
  52: 'FF9900',
  53: 'FF6600',
  54: '666699',
  55: '969696',
  56: '003366',
  57: '339966',
  58: '003300',
  59: '333300',
  60: '993300',
  61: '993366',
  62: '333399',
  63: '333333',
  64: 'FFFFFF', // System Foreground (Window Text) or Background? Usually auto. Treat as White/Transparent or black depending on context. But here we assume explicit color.
}

function getIndexedColor(index: number): string {
  const hex = INDEXED_COLORS[index]
  return hex ? `#${hex}` : '#000000'
}

/**
 * ARGB文字列 → CSS色
 *
 * @param argb AARRGGBB形式の文字列
 * @returns CSS色文字列
 */
export function argbToCSS(argb: string): string {
  // 8文字の場合: AARRGGBB
  if (argb.length === 8) {
    const alpha = parseInt(argb.substring(0, 2), 16)
    const rgb = argb.substring(2)

    if (alpha === 255) {
      return `#${rgb}`
    }

    const r = parseInt(rgb.substring(0, 2), 16)
    const g = parseInt(rgb.substring(2, 4), 16)
    const b = parseInt(rgb.substring(4, 6), 16)
    const a = (alpha / 255).toFixed(2)

    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  // 6文字の場合: RRGGBB
  if (argb.length === 6) {
    return `#${argb}`
  }

  // その他はそのまま返す
  return argb.startsWith('#') ? argb : `#${argb}`
}

/**
 * テーマカラーにtintを適用
 *
 * tint > 0: 白に近づける
 * tint < 0: 黒に近づける
 *
 * @param baseColor RRGGBB形式
 * @param tint -1.0 ~ 1.0
 * @returns CSS色文字列
 */
export function applyTint(baseColor: string, tint: number): string {
  const r = parseInt(baseColor.substring(0, 2), 16)
  const g = parseInt(baseColor.substring(2, 4), 16)
  const b = parseInt(baseColor.substring(4, 6), 16)

  let newR: number
  let newG: number
  let newB: number

  if (tint > 0) {
    // 白に近づける
    newR = Math.round(r + (255 - r) * tint)
    newG = Math.round(g + (255 - g) * tint)
    newB = Math.round(b + (255 - b) * tint)
  } else {
    // 黒に近づける
    newR = Math.round(r * (1 + tint))
    newG = Math.round(g * (1 + tint))
    newB = Math.round(b * (1 + tint))
  }

  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

/**
 * CSS色 → ARGB文字列
 *
 * @param css CSS色文字列
 * @returns AARRGGBB形式の文字列
 */
export function cssToArgb(css: string): string {
  // #RRGGBB形式
  if (css.startsWith('#')) {
    const hex = css.substring(1)
    if (hex.length === 6) {
      return `FF${hex.toUpperCase()}`
    }
    if (hex.length === 3) {
      const expanded = hex
        .split('')
        .map((c) => c + c)
        .join('')
      return `FF${expanded.toUpperCase()}`
    }
  }

  // rgba()形式
  const rgbaMatch = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0')
    const a = rgbaMatch[4]
      ? Math.round(parseFloat(rgbaMatch[4]) * 255)
          .toString(16)
          .padStart(2, '0')
      : 'FF'
    return `${a}${r}${g}${b}`.toUpperCase()
  }

  // 不明な形式はそのまま返す
  return 'FF000000'
}
