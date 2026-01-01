/**
 * フォントマッピングユーティリティ
 *
 * Excelフォント名 → 出力フォント名への変換
 */

// ========================================
// デフォルトフォントマッピング
// ========================================

/**
 * Excel標準フォント → Web/PDF互換フォントへのマッピング
 */
export const DEFAULT_FONT_MAPPING: Record<string, string> = {
  // Windows標準
  'MS Gothic': 'Noto Sans JP',
  'MS PGothic': 'Noto Sans JP',
  'MS Mincho': 'Noto Serif JP',
  'MS PMincho': 'Noto Serif JP',
  'Yu Gothic': 'Noto Sans JP',
  'Yu Mincho': 'Noto Serif JP',
  Meiryo: 'Noto Sans JP',
  'Meiryo UI': 'Noto Sans JP',

  // Mac標準
  'Hiragino Sans': 'Noto Sans JP',
  'Hiragino Kaku Gothic Pro': 'Noto Sans JP',
  'Hiragino Mincho Pro': 'Noto Serif JP',

  // Office標準
  Calibri: 'Noto Sans',
  Arial: 'Noto Sans',
  'Times New Roman': 'Noto Serif',
  Verdana: 'Noto Sans',
  Tahoma: 'Noto Sans',
  'Courier New': 'Noto Sans Mono',

  // 中国語
  SimSun: 'Noto Sans SC',
  SimHei: 'Noto Sans SC',
  'Microsoft YaHei': 'Noto Sans SC',

  // 韓国語
  Gulim: 'Noto Sans KR',
  Batang: 'Noto Serif KR',
  'Malgun Gothic': 'Noto Sans KR',
}

// ========================================
// フォントマッピング関数
// ========================================

/**
 * Excelフォント名を出力フォント名に変換
 *
 * @param excelFont Excelで使用されているフォント名
 * @param customMapping カスタムマッピング（オプション）
 * @param defaultFont マッピングがない場合のデフォルト
 * @returns 出力フォント名
 */
export function mapFont(
  excelFont: string,
  customMapping?: Record<string, string>,
  defaultFont: string = 'Noto Sans JP'
): string {
  // カスタムマッピングを優先
  if (customMapping?.[excelFont]) {
    return customMapping[excelFont]
  }

  // デフォルトマッピング
  if (DEFAULT_FONT_MAPPING[excelFont]) {
    return DEFAULT_FONT_MAPPING[excelFont]
  }

  // マッピングがない場合はデフォルト
  return defaultFont
}

/**
 * フォントが日本語フォントかどうかを判定
 *
 * @param fontName フォント名
 * @returns 日本語フォントならtrue
 */
export function isJapaneseFont(fontName: string): boolean {
  const japaneseKeywords = [
    'Gothic',
    'Mincho',
    'Meiryo',
    'Hiragino',
    'Yu ',
    'MS ',
    'IPAex',
    'IPA ',
    'Noto Sans JP',
    'Noto Serif JP',
  ]

  return japaneseKeywords.some((keyword) => fontName.includes(keyword))
}

/**
 * フォントウェイトを正規化
 *
 * @param bold 太字かどうか
 * @param weight 元のウェイト値（オプション）
 * @returns 正規化されたウェイト値 (100-900)
 */
export function normalizeFontWeight(bold?: boolean, weight?: number): number {
  if (weight !== undefined) {
    return weight
  }
  return bold ? 700 : 400
}

/**
 * フォントサイズをmmに変換
 *
 * @param sizePt フォントサイズ（pt）
 * @returns フォントサイズ（mm）
 */
export function fontSizePtToMm(sizePt: number): number {
  // 1pt = 1/72 inch = 25.4/72 mm
  return sizePt * (25.4 / 72)
}

/**
 * フォントサイズをptに変換
 *
 * @param sizeMm フォントサイズ（mm）
 * @returns フォントサイズ（pt）
 */
export function fontSizeMmToPt(sizeMm: number): number {
  return sizeMm / (25.4 / 72)
}
