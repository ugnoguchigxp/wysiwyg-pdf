/**
 * Style Parser
 *
 * ExcelJSのスタイルを中間表現に変換
 */

import type {
  CellStyle,
  FontInfo,
  FillInfo,
  BorderInfo,
  BorderStyle,
  BorderStyleType,
  AlignmentInfo,
  ColorInfo,
} from '../types/excel'

// ExcelJSの型（プレースホルダー）
type ExcelJSStyle = {
  font?: ExcelJSFont
  fill?: ExcelJSFill
  border?: ExcelJSBorder
  alignment?: ExcelJSAlignment
  numFmt?: string
}

type ExcelJSFont = {
  name?: string
  size?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean | 'single' | 'double'
  strike?: boolean
  color?: ExcelJSColor
}

type ExcelJSFill = {
  type?: 'pattern' | 'gradient'
  pattern?: string
  fgColor?: ExcelJSColor
  bgColor?: ExcelJSColor
}

type ExcelJSBorder = {
  top?: ExcelJSBorderStyle
  right?: ExcelJSBorderStyle
  bottom?: ExcelJSBorderStyle
  left?: ExcelJSBorderStyle
  diagonal?: ExcelJSBorderStyle
  diagonalUp?: boolean
  diagonalDown?: boolean
}

type ExcelJSBorderStyle = {
  style?: string
  color?: ExcelJSColor
}

type ExcelJSAlignment = {
  horizontal?: string
  vertical?: string
  wrapText?: boolean
  shrinkToFit?: boolean
  indent?: number
  textRotation?: number
}

type ExcelJSColor = {
  argb?: string
  theme?: number
  tint?: number
  indexed?: number
}

/**
 * ExcelJSスタイルを中間表現に変換
 *
 * @param style ExcelJSのスタイル
 * @returns 中間表現のスタイル
 */
export function parseCellStyle(style: unknown): CellStyle {
  const s = style as ExcelJSStyle | undefined

  if (!s) {
    return {}
  }

  return {
    font: s.font ? parseFont(s.font) : undefined,
    fill: s.fill ? parseFill(s.fill) : undefined,
    border: s.border ? parseBorder(s.border) : undefined,
    alignment: s.alignment ? parseAlignment(s.alignment) : undefined,
    numberFormat: s.numFmt,
  }
}

/**
 * フォント情報を解析
 */
function parseFont(font: ExcelJSFont): FontInfo {
  return {
    name: font.name ?? 'Calibri',
    size: font.size ?? 11,
    bold: font.bold,
    italic: font.italic,
    underline: font.underline,
    strike: font.strike,
    color: font.color ? parseColor(font.color) : undefined,
  }
}

/**
 * 塗りつぶし情報を解析
 */
function parseFill(fill: ExcelJSFill): FillInfo | undefined {
  if (!fill.type || fill.type === 'pattern') {
    // パターン塗りつぶし
    if (fill.pattern === 'none') {
      return undefined
    }

    if (fill.pattern === 'solid' && fill.fgColor) {
      return {
        type: 'solid',
        color: parseColor(fill.fgColor),
      }
    }

    if (fill.pattern && fill.fgColor) {
      return {
        type: 'pattern',
        patternType: fill.pattern,
        color: parseColor(fill.fgColor),
        patternColor: fill.bgColor ? parseColor(fill.bgColor) : undefined,
      }
    }
  }

  if (fill.type === 'gradient') {
    return {
      type: 'gradient',
      color: fill.fgColor ? parseColor(fill.fgColor) : undefined,
    }
  }

  return undefined
}

/**
 * 罫線情報を解析
 */
function parseBorder(border: ExcelJSBorder): BorderInfo {
  return {
    top: border.top ? parseBorderStyle(border.top) : undefined,
    right: border.right ? parseBorderStyle(border.right) : undefined,
    bottom: border.bottom ? parseBorderStyle(border.bottom) : undefined,
    left: border.left ? parseBorderStyle(border.left) : undefined,
    diagonal: border.diagonal ? parseBorderStyle(border.diagonal) : undefined,
    diagonalUp: border.diagonalUp,
    diagonalDown: border.diagonalDown,
  }
}

/**
 * 罫線スタイルを解析
 */
function parseBorderStyle(style: ExcelJSBorderStyle): BorderStyle {
  return {
    style: normalizeBorderStyle(style.style),
    color: style.color ? parseColor(style.color) : undefined,
  }
}

/**
 * 罫線スタイル文字列を正規化
 */
function normalizeBorderStyle(style?: string): BorderStyleType {
  const validStyles: BorderStyleType[] = [
    'thin',
    'medium',
    'thick',
    'dotted',
    'dashed',
    'double',
    'hair',
    'mediumDashed',
    'dashDot',
    'mediumDashDot',
    'dashDotDot',
    'mediumDashDotDot',
    'slantDashDot',
    'none',
  ]

  if (style && validStyles.includes(style as BorderStyleType)) {
    return style as BorderStyleType
  }

  return 'none'
}

/**
 * 配置情報を解析
 */
function parseAlignment(alignment: ExcelJSAlignment): AlignmentInfo {
  return {
    horizontal: normalizeHorizontalAlignment(alignment.horizontal),
    vertical: normalizeVerticalAlignment(alignment.vertical),
    wrapText: alignment.wrapText,
    shrinkToFit: alignment.shrinkToFit,
    indent: alignment.indent,
    textRotation: alignment.textRotation,
  }
}

/**
 * 水平配置を正規化
 */
function normalizeHorizontalAlignment(
  align?: string
): AlignmentInfo['horizontal'] {
  const mapping: Record<string, AlignmentInfo['horizontal']> = {
    left: 'left',
    center: 'center',
    right: 'right',
    fill: 'fill',
    justify: 'justify',
    centerContinuous: 'center',
    distributed: 'distributed',
  }
  return align ? mapping[align] : undefined
}

/**
 * 垂直配置を正規化
 */
function normalizeVerticalAlignment(
  align?: string
): AlignmentInfo['vertical'] {
  const mapping: Record<string, AlignmentInfo['vertical']> = {
    top: 'top',
    middle: 'middle',
    bottom: 'middle', // Map bottom to middle to enforce vertical centering for better visual consistency
    justify: 'justify',
    distributed: 'distributed',
  }
  return align ? mapping[align] : undefined
}

/**
 * 色情報を解析
 */
function parseColor(color: ExcelJSColor): ColorInfo {
  return {
    argb: color.argb,
    theme: color.theme,
    tint: color.tint,
    indexed: color.indexed,
  }
}
