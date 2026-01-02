/**
 * 単位変換ユーティリティ
 *
 * Excel単位 → mm への変換を行う
 * excel_pdf_guide.md に基づく変換式を実装
 */

// ========================================
// 定数
// ========================================

/** 1インチ = 25.4mm */
export const INCH_TO_MM = 25.4

/** 1ポイント = 1/72インチ */
export const PT_TO_INCH = 1 / 72

/** 1CSSピクセル = 1/96インチ */
export const PX_TO_INCH = 1 / 96

/**
 * Maximum Digit Width (MDW)
 * フォントの最大数字幅（px）
 * Calibri 11pt で約7px が目安
 * 実際にはフォント依存のため、設定可能にする
 */
export const DEFAULT_MDW = 7

// ========================================
// 用紙サイズ (mm)
// ========================================

export const PAPER_SIZES = {
  letter: { w: 215.9, h: 279.4 },
  legal: { w: 215.9, h: 355.6 },
  a3: { w: 297, h: 420 },
  a4: { w: 210, h: 297 },
  a5: { w: 148, h: 210 },
  b4: { w: 250, h: 353 },
  b5: { w: 176, h: 250 },
} as const

export type PaperSizeKey = keyof typeof PAPER_SIZES

// ========================================
// 変換関数
// ========================================

/**
 * ポイント → mm
 * @param pt ポイント値
 * @returns mm値
 */
export function ptToMm(pt: number): number {
  return pt * INCH_TO_MM * PT_TO_INCH
}

/**
 * mm → ポイント
 * @param mm mm値
 * @returns ポイント値
 */
export function mmToPt(mm: number): number {
  return mm / (INCH_TO_MM * PT_TO_INCH)
}

/**
 * ピクセル → mm
 * @param px ピクセル値
 * @returns mm値
 */
export function pxToMm(px: number): number {
  return px * INCH_TO_MM * PX_TO_INCH
}

/**
 * mm → ピクセル
 * @param mm mm値
 * @returns ピクセル値
 */
export function mmToPx(mm: number): number {
  return mm / (INCH_TO_MM * PX_TO_INCH)
}

/**
 * インチ → mm
 * @param inch インチ値
 * @returns mm値
 */
export function inchToMm(inch: number): number {
  return inch * INCH_TO_MM
}

/**
 * mm → インチ
 * @param mm mm値
 * @returns インチ値
 */
export function mmToInch(mm: number): number {
  return mm / INCH_TO_MM
}

/**
 * Excel行高（pt） → mm
 *
 * ExcelJSの row.height は pt として扱う
 * @param heightPt 行高（pt）
 * @returns 行高（mm）
 */
export function excelRowHeightToMm(heightPt: number): number {
  return ptToMm(heightPt)
}

/**
 * Excel列幅（文字数単位） → mm
 *
 * Excelの列幅は「最大数字幅(MDW)の文字数」で表現される
 * 変換式: px = Truncate(((256 * width + Truncate(128 / MDW)) / 256) * MDW)
 *
 * @param width Excel列幅（文字数単位）
 * @param mdw Maximum Digit Width（デフォルト: 7px）
 * @returns 列幅（mm）
 */
export function excelColWidthToMm(width: number, mdw: number = DEFAULT_MDW): number {
  // Excel列幅 → px
  // excel_pdf_guide.md準拠: Strict conversion
  const px = Math.trunc(((256 * width + Math.trunc(128 / mdw)) / 256) * mdw)
  // px → mm
  return pxToMm(px)
}

/**
 * mm → Excel列幅（文字数単位）
 *
 * 逆変換（近似）
 * @param mm 列幅（mm）
 * @param mdw Maximum Digit Width（デフォルト: 7px）
 * @returns Excel列幅（文字数単位）
 */
export function mmToExcelColWidth(mm: number, mdw: number = DEFAULT_MDW): number {
  const px = mmToPx(mm)
  // 逆算（近似）
  return ((px / mdw) * 256) / 256
}

/**
 * デフォルト行高を取得（mm）
 *
 * Excelのデフォルト行高は約15pt（フォント依存）
 */
export function getDefaultRowHeightMm(): number {
  return ptToMm(15)
}

/**
 * デフォルト列幅を取得（mm）
 *
 * Excelのデフォルト列幅は約8.43文字
 */
export function getDefaultColWidthMm(mdw: number = DEFAULT_MDW): number {
  return excelColWidthToMm(8.43, mdw)
}

/**
 * 用紙サイズを取得（mm）
 * @param size 用紙サイズキー
 * @param landscape 横向きかどうか
 * @returns { w, h } mm
 */
export function getPaperSizeMm(
  size: PaperSizeKey,
  landscape: boolean = false
): { w: number; h: number } {
  const paper = PAPER_SIZES[size]
  if (landscape) {
    return { w: paper.h, h: paper.w }
  }
  return { ...paper }
}
