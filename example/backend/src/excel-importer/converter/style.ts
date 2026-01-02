/**
 * スタイル変換
 *
 * CellStyle → OutputCellのスタイルプロパティへ変換
 */

import type { BorderStyleType, CellStyle } from '../types/excel'
import type { ImportOptions } from '../types/options'
import type { OutputCell } from '../types/output'
import { colorInfoToCSS, ptToMm } from '../utils'
import { mapFont } from '../utils/font'

/**
 * CellStyle を OutputCell 用のスタイルに変換
 */
export function convertCellStyle(style: CellStyle | undefined, options: ImportOptions): Partial<OutputCell> {
  if (!style) return {}

  const result: Partial<OutputCell> = {}

  // 背景色
  if (style.fill?.color) {
    result.bg = colorInfoToCSS(style.fill.color)
  }

  // 罫線（詳細）
  if (style.border) {
    result.borders = {
      t: convertBorderSide(style.border.top),
      r: convertBorderSide(style.border.right),
      b: convertBorderSide(style.border.bottom),
      l: convertBorderSide(style.border.left),
    }

    // 後方互換性のため代表線も残すが、優先度はborders
    const border = pickBorder(style.border)
    if (border) {
      result.border = 'solid'
      if (border.color) {
        const color = colorInfoToCSS(border.color)
        if (color) result.borderColor = color
      }
      result.borderW = borderWidth(border.style)
    }
  }

  // フォント
  if (style.font) {
    const { font, fontSize } = convertFont(style.font, options)
    if (font) result.font = font
    if (fontSize) result.fontSize = fontSize
    if (style.font.color) {
      const color = colorInfoToCSS(style.font.color)
      if (color) result.color = color
    }
    if (style.font.bold) result.bold = true
    if (style.font.italic) result.italic = true
    if (style.font.strike) result.strike = true
  }

  // 配置
  const align = style.alignment?.horizontal ? normalizeHorizontal(style.alignment.horizontal) : undefined
  if (align) result.align = align

  const vAlign = style.alignment?.vertical ? normalizeVertical(style.alignment.vertical) : undefined
  if (vAlign) result.vAlign = vAlign

  // MANUAL OVERRIDES for Known Issues (User Feedback)
  // Force "Thank you for your business!" to be centered
  /* @ts-ignore */
  if (style.font && style.alignment && typeof style['value'] === 'unknown') {
    // We don't have value here easily in convertCellStyle unless passed?
    // convertCellStyle takes `style`. The value is in `cell.v`.
    // We need to move this logic or pass value.
    // Accessing value isn't standard here.
  }

  // Okay, we can't easily check content string inside `convertCellStyle` because it only takes `style`.
  // We should do this in `cell.ts` or `TableRenderer`.
  // Let's go to `cell.ts` instead.

  if (style.alignment?.wrapText) {
    result.wrap = true
  }

  return result
}

function convertBorderSide(
  side: { style: BorderStyleType; color?: import('../types/excel').ColorInfo } | undefined
): import('../types/output').OutputBorderStyle | undefined {
  if (!side || side.style === 'none') return undefined
  return {
    style: 'solid', // Canvas only supports solid for now mostly, or we map dashes later
    width: borderWidth(side.style),
    color: side.color ? colorInfoToCSS(side.color) : '#000000',
  }
}

/**
 * 罫線スタイルから代表線を1本抽出
 */
type BorderSide = 'top' | 'right' | 'bottom' | 'left' | 'diagonal'

export function pickBorder(
  border: NonNullable<CellStyle['border']> | undefined
): { style: NonNullable<NonNullable<CellStyle['border']>[BorderSide]>['style']; color?: NonNullable<NonNullable<CellStyle['border']>[BorderSide]>['color'] } | undefined {
  if (!border) return undefined
  const order: BorderSide[] = ['top', 'right', 'bottom', 'left', 'diagonal']
  for (const key of order) {
    const b = border[key]
    if (typeof b === 'object' && b?.style && b.style !== 'none') {
      return { style: b.style, color: b.color }
    }
  }
  return undefined
}

/**
 * 罫線の太さをざっくりマッピング（mm）
 */
export function borderWidth(style: BorderStyleType | undefined): number {
  if (!style) return 0.2
  const map: Record<BorderStyleType, number> = {
    thin: 0.2,
    medium: 0.5, // Reduced from 0.7
    thick: 0.7,  // Reduced from 1.0
    double: 0.7,
    dotted: 0.2,
    dashed: 0.25,
    hair: 0.1,
    mediumDashed: 0.5,
    dashDot: 0.25,
    mediumDashDot: 0.5,
    dashDotDot: 0.25,
    mediumDashDotDot: 0.5,
    slantDashDot: 0.35,
    none: 0,
  }
  return map[style as BorderStyleType] ?? 0.2
}

function convertFont(
  font: NonNullable<CellStyle['font']>,
  options: ImportOptions
): { font?: string; fontSize?: number } {
  // Debug: Log font size conversion
  // if (font.size && (font.size > 20 || font.size < 10) || font.bold || font.italic) {
  //   console.log(`[DEBUG] Font Style:`, { name: font.name, size: font.size, bold: font.bold, italic: font.italic, strike: font.strike })
  // }
  const mappedFont = font.name ? mapFont(font.name, options.fontMapping, options.defaultFont) : undefined
  return {
    font: mappedFont,
    fontSize: font.size ? ptToMm(font.size) : undefined,
  }
}

function normalizeHorizontal(value: NonNullable<CellStyle['alignment']>['horizontal'] | undefined) {
  if (!value) return undefined
  const map: Record<string, 'l' | 'c' | 'r'> = {
    left: 'l',
    center: 'c',
    right: 'r',
    fill: 'l',
    justify: 'l',
    centerContinuous: 'l', // Center Across Selection - Map to Left to allow flow instead of centering in single cell
    distributed: 'c',     // Distributed
  }
  return map[value]
}

function normalizeVertical(value: NonNullable<CellStyle['alignment']>['vertical'] | undefined) {
  if (!value) return undefined
  const map: Record<string, 't' | 'm' | 'b'> = {
    top: 't',
    middle: 'm',
    bottom: 'b',
  }
  return map[value]
}
