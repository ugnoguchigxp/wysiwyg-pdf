# Excel インポート機能 実装仕様書

> **対象**: wysiwyg-pdf 本体（`src/` 配下）  
> **目的**: ブラウザ上で Excel（.xlsx）を選択し、Doc オブジェクトへ変換して Canvas に表示する機能を追加する。

---

## 1. 概要

| 項目 | 内容 |
|------|------|
| 入力 | ユーザーが選択した `.xlsx` ファイル（10MB 以下） |
| 出力 | `Doc` オブジェクト（`src/types/canvas.ts` で定義） |
| 変換 | ブラウザ上で exceljs を使用しクライアント完結（サーバー不要） |

---

## 2. 追加ファイル一覧

| # | パス | 役割 |
|---|------|------|
| 1 | `src/features/excel-import/index.ts` | 公開エクスポート |
| 2 | `src/features/excel-import/useExcelImport.ts` | React Hook（ファイル選択→Doc変換→状態更新） |
| 3 | `src/features/excel-import/excelToDoc.ts` | exceljs → Doc 変換ロジック |
| 4 | `src/features/excel-import/types.ts` | ImportOptions 型定義 |
| 5 | `src/features/excel-import/ExcelImportButton.tsx` | UI ボタンコンポーネント |

---

## 3. 依存パッケージ

```bash
# プロジェクトルートで実行
pnpm add exceljs
```

---

## 4. 実装タスク（順番どおりに実施）

### Task 1: 型定義を作成

**ファイル**: `src/features/excel-import/types.ts`

```ts
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

export interface ExcelImportResult {
  success: true
  doc: import('../../types/canvas').Doc
} | {
  success: false
  error: string
}
```

---

### Task 2: 変換ロジックを作成

**ファイル**: `src/features/excel-import/excelToDoc.ts`

```ts
import ExcelJS from 'exceljs'
import type { Doc, Surface, TableNode, Cell } from '../../types/canvas'
import type { ExcelImportOptions } from './types'

const PAPER_SIZES: Record<string, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  a3: { w: 297, h: 420 },
  b4: { w: 250, h: 353 },
  b5: { w: 176, h: 250 },
  letter: { w: 215.9, h: 279.4 },
  legal: { w: 215.9, h: 355.6 },
}

export async function excelToDoc(
  buffer: ArrayBuffer,
  options: ExcelImportOptions = {}
): Promise<Doc> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const pageSize = options.pageSize ?? 'a4'
  const landscape = options.orientation === 'landscape'
  const paper = PAPER_SIZES[pageSize] ?? PAPER_SIZES.a4
  const { w, h } = landscape ? { w: paper.h, h: paper.w } : paper

  const surfaces: Surface[] = []
  const nodes: TableNode[] = []

  const targetSheets =
    options.sheetIndex !== undefined
      ? [workbook.worksheets[options.sheetIndex]].filter(Boolean)
      : workbook.worksheets

  targetSheets.forEach((sheet, idx) => {
    const surfaceId = `surface_${idx}`
    surfaces.push({ id: surfaceId, type: 'page', w, h })

    const rows: number[] = []
    const cols: number[] = []
    const cells: Cell[] = []

    // 列幅収集
    sheet.columns.forEach((col, i) => {
      const widthPx = (col.width ?? 8.43) * 7
      cols.push(widthPx * 0.264583) // px → mm
    })

    // 行高・セル収集
    sheet.eachRow({ includeEmpty: true }, (row, rowNum) => {
      const heightPt = row.height ?? 15
      rows.push(heightPt * 0.352778) // pt → mm

      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cells.push({
          r: rowNum - 1,
          c: colNum - 1,
          v: cell.text ?? '',
          bg: extractBgColor(cell),
          align: mapAlign(cell.alignment?.horizontal),
          vAlign: mapVAlign(cell.alignment?.vertical),
        })
      })
    })

    const tableW = cols.reduce((a, b) => a + b, 0)
    const tableH = rows.reduce((a, b) => a + b, 0)

    nodes.push({
      id: `table_${idx}`,
      s: surfaceId,
      t: 'table',
      x: 10,
      y: 10,
      w: tableW,
      h: tableH,
      table: { rows, cols, cells },
    })
  })

  return {
    v: 1,
    id: `excel_${Date.now()}`,
    title: 'Imported Excel',
    unit: 'mm',
    surfaces,
    nodes,
  }
}

function extractBgColor(cell: ExcelJS.Cell): string | undefined {
  const fill = cell.fill
  if (fill?.type === 'pattern' && fill.fgColor?.argb) {
    return '#' + fill.fgColor.argb.slice(2)
  }
  return undefined
}

function mapAlign(h?: string): 'l' | 'c' | 'r' | undefined {
  if (h === 'left') return 'l'
  if (h === 'center') return 'c'
  if (h === 'right') return 'r'
  return undefined
}

function mapVAlign(v?: string): 't' | 'm' | 'b' | undefined {
  if (v === 'top') return 't'
  if (v === 'middle') return 'm'
  if (v === 'bottom') return 'b'
  return undefined
}
```

---

### Task 3: React Hook を作成

**ファイル**: `src/features/excel-import/useExcelImport.ts`

```ts
import { useCallback, useRef, useState } from 'react'
import { excelToDoc } from './excelToDoc'
import type { ExcelImportOptions, ExcelImportResult } from './types'
import type { Doc } from '../../types/canvas'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

interface UseExcelImportReturn {
  /** ファイル選択ダイアログを開く */
  openFilePicker: () => void
  /** 変換中フラグ */
  isLoading: boolean
  /** 最後のエラーメッセージ */
  error: string | null
}

export function useExcelImport(
  onSuccess: (doc: Doc) => void,
  options: ExcelImportOptions = {}
): UseExcelImportReturn {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 隠し input を作成
  if (typeof document !== 'undefined' && !inputRef.current) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx'
    input.style.display = 'none'
    document.body.appendChild(input)
    inputRef.current = input
  }

  const openFilePicker = useCallback(() => {
    const input = inputRef.current
    if (!input) return

    input.onchange = async () => {
      const file = input.files?.[0]
      input.value = '' // reset
      if (!file) return

      // バリデーション
      if (!file.name.endsWith('.xlsx')) {
        setError('xlsx ファイルを選択してください')
        return
      }
      if (file.size > MAX_SIZE) {
        setError('ファイルサイズは 10MB 以下にしてください')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const buffer = await file.arrayBuffer()
        const doc = await excelToDoc(buffer, options)
        onSuccess(doc)
      } catch (e) {
        setError(e instanceof Error ? e.message : '変換に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    input.click()
  }, [onSuccess, options])

  return { openFilePicker, isLoading, error }
}
```

---

### Task 4: UI ボタンを作成

**ファイル**: `src/features/excel-import/ExcelImportButton.tsx`

```tsx
import React from 'react'
import { useExcelImport } from './useExcelImport'
import type { Doc } from '../../types/canvas'
import type { ExcelImportOptions } from './types'

interface Props {
  onImport: (doc: Doc) => void
  options?: ExcelImportOptions
  className?: string
}

export function ExcelImportButton({ onImport, options, className }: Props) {
  const { openFilePicker, isLoading, error } = useExcelImport(onImport, options)

  return (
    <button
      type="button"
      onClick={openFilePicker}
      disabled={isLoading}
      className={className}
      title={error ?? undefined}
    >
      {isLoading ? '変換中…' : 'Excel 読み込み'}
    </button>
  )
}
```

---

### Task 5: エクスポートを追加

**ファイル**: `src/features/excel-import/index.ts`

```ts
export { ExcelImportButton } from './ExcelImportButton'
export { useExcelImport } from './useExcelImport'
export { excelToDoc } from './excelToDoc'
export type { ExcelImportOptions, ExcelImportResult } from './types'
```

---

### Task 6: 本体 index.ts にエクスポートを追加

**ファイル**: `src/index.ts`（末尾に追記）

```ts
// Excel Import
export * from './features/excel-import'
```

---

## 5. 使い方（利用側コード例）

```tsx
import { ExcelImportButton } from 'wysiwyg-pdf'

function MyToolbar({ setDoc }) {
  return (
    <ExcelImportButton
      onImport={(doc) => setDoc(doc)}
      options={{ pageSize: 'a4', fitToPage: true }}
    />
  )
}
```

---

## 6. テスト観点

| # | 観点 | 確認方法 |
|---|------|----------|
| 1 | 正常系 | 小さな xlsx を読み込み Canvas に表示される |
| 2 | サイズ超過 | 11MB ファイルでエラー表示 |
| 3 | 拡張子不正 | .xls / .csv でエラー表示 |
| 4 | 複数シート | sheetIndex 未指定で全シート、指定で単一シート |

---

## 7. 今後の拡張（メモ）

- 罫線の四辺別再現（線種・太さ・色を個別に反映）
- 結合セル対応（rs/cs の考慮、セル衝突チェック）
- 画像埋め込み（Excel 内の画像を Doc.assets に登録し ImageNode へ配置）
- 文字装飾対応（フォント名・サイズ・Bold/Italic/Underline/Color）
- 数値/日付書式のフォーマット適用（Excel の numFmt を Doc 文字列へ反映）
- ハイパーリンク対応（文字列内リンクの保持）
- 条件付き書式の簡易対応（背景色・文字色のみ適用などスコープ限定で）
- ドラッグ＆ドロップ対応（drop zone での .xlsx 受け入れ）
- 大規模ファイル時のワーカー offloading（変換処理を Web Worker へ移動）
- 進捗表示の強化（シート単位/ページ単位でのプログレス）
