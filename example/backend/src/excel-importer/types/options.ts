/**
 * インポートオプションの型定義
 */

import type { PaperSize } from './excel'

export interface ImportOptions {
  // ========================================
  // ページ設定（Excel側の設定を上書き）
  // ========================================

  /** 用紙サイズ（未指定時はExcelの設定を使用） */
  pageSize?: PaperSize

  /** 用紙の向き */
  orientation?: 'portrait' | 'landscape'

  /** 余白 (mm) */
  margin?: {
    t: number
    r: number
    b: number
    l: number
  }

  // ========================================
  // フォント
  // ========================================

  /** デフォルトフォント（Excelで指定がない場合） */
  defaultFont?: string

  /** フォントマッピング（Excel名 → 出力名） */
  fontMapping?: Record<string, string>

  // ========================================
  // 縮尺
  // ========================================

  /** ページに収まるように自動縮尺 */
  fitToPage?: boolean

  /** 固定縮尺 (1.0 = 100%) */
  scale?: number

  // ========================================
  // 範囲指定
  // ========================================

  /** 対象シートのインデックス（未指定時は全シート） */
  sheetIndex?: number

  /** 対象シートの名前（sheetIndexより優先） */
  sheetName?: string

  /** 印刷範囲のみを出力 */
  printAreaOnly?: boolean

  /** カスタム範囲（A1:Z100形式） */
  customRange?: string

  // ========================================
  // 変換オプション
  // ========================================

  /** 空行を除外 */
  skipEmptyRows?: boolean

  /** 空列を除外 */
  skipEmptyColumns?: boolean

  /** 数式を評価せず数式文字列として出力 */
  preserveFormulas?: boolean

  /** 日付フォーマット */
  dateFormat?: string

  // ========================================
  // 出力オプション
  // ========================================

  /** ドキュメントID（未指定時は自動生成） */
  documentId?: string

  /** ドキュメントタイトル（未指定時はファイル名） */
  documentTitle?: string
}

/**
 * デフォルトオプション
 */
export const DEFAULT_IMPORT_OPTIONS: Required<
  Pick<
    ImportOptions,
    | 'defaultFont'
    | 'pageSize'
    | 'orientation'
    | 'fitToPage'
    | 'printAreaOnly'
    | 'skipEmptyRows'
    | 'skipEmptyColumns'
  >
> = {
  defaultFont: 'Noto Sans JP',
  pageSize: 'a4',
  orientation: 'portrait',
  fitToPage: true,
  printAreaOnly: true,
  skipEmptyRows: false,
  skipEmptyColumns: false,
}
