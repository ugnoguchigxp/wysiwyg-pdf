export interface ExcelImportOptions {
  /** 用紙サイズ (default: 'a4') */
  pageSize?: 'a4' | 'a3' | 'b4' | 'b5' | 'letter' | 'legal'
  /** 向き (default: 'portrait') */
  orientation?: 'portrait' | 'landscape'
  /** ページに収める (default: true) */
  fitToPage?: boolean
  /** 対象シート番号 (0-based, 未指定で全シート) */
  sheetIndex?: number
}

export type ExcelImportResult =
  | {
      success: true
      doc: import('../../types/canvas').Doc
    }
  | {
      success: false
      error: string
    }
