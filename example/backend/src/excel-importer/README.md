# Excel Importer

Excelファイルをwysiwyg-pdfの`Doc`オブジェクトに変換するモジュール。

> **Note**: このモジュールは将来的に別パッケージとして切り出す可能性があります。
> 依存関係を最小限に保ち、wysiwyg-pdf本体への依存を型定義のみに限定しています。

## 設計方針

### 1. 分離可能なアーキテクチャ

```
excel-importer/
├── README.md
├── index.ts              # Public API (re-export)
├── types/
│   ├── index.ts          # 内部型定義
│   ├── excel.ts          # Excel固有の中間表現
│   └── output.ts         # 出力型（wysiwyg-pdf互換）
├── parser/
│   ├── index.ts
│   ├── workbook.ts       # ワークブック解析
│   ├── sheet.ts          # シート解析
│   ├── cell.ts           # セル解析
│   └── style.ts          # スタイル解析
├── converter/
│   ├── index.ts
│   ├── doc.ts            # Doc変換
│   ├── surface.ts        # Surface変換
│   ├── table.ts          # TableNode変換
│   ├── cell.ts           # Cell変換
│   └── style.ts          # スタイル変換
├── utils/
│   ├── units.ts          # 単位変換（pt/px → mm）
│   ├── color.ts          # 色変換
│   └── font.ts           # フォントマッピング
└── __tests__/
    └── ...
```

### 2. 依存関係

**外部依存（このモジュール内で完結）:**
- `exceljs` - Excel読み込み

**wysiwyg-pdf依存（型定義のみ）:**
- `Doc`, `Surface`, `TableNode`, `Cell` などの型
- 実行時依存なし（型のみimport）

### 3. 変換フロー

```
Excel File (.xlsx)
    ↓
[ExcelJS Parser]
    ↓
ExcelWorkbook (中間表現)
    ↓
[Converter]
    ↓
Doc (wysiwyg-pdf形式)
```

## 中間表現の設計

ExcelJSの構造をそのまま使わず、中間表現を挟むことで：
- ExcelJSへの依存を局所化
- テスト容易性の向上
- 将来的なパーサー差し替えの容易化

```typescript
// 中間表現の例
interface ExcelWorkbook {
  sheets: ExcelSheet[]
  defaultFont: FontInfo
}

interface ExcelSheet {
  name: string
  printArea?: CellRange
  pageSetup: PageSetup
  rows: ExcelRow[]
  mergedCells: MergedCell[]
}

interface ExcelRow {
  index: number
  height: number // pt
  cells: ExcelCell[]
}

interface ExcelCell {
  row: number
  col: number
  value: string | number | null
  formula?: string
  style: CellStyle
}
```

## 単位変換

`excel_pdf_guide.md` に基づく変換式：

```typescript
// 基本定数
const INCH_TO_MM = 25.4
const PT_TO_INCH = 1 / 72
const PX_TO_INCH = 1 / 96

// 行高: pt → mm
const rowHeightMm = rowHeightPt * INCH_TO_MM * PT_TO_INCH

// 列幅: Excel単位 → px → mm
// MDW (Maximum Digit Width) はフォント依存、Calibri 11pt で約7px
const MDW = 7
const colWidthPx = Math.trunc(((256 * excelWidth + Math.trunc(128 / MDW)) / 256) * MDW)
const colWidthMm = colWidthPx * INCH_TO_MM * PX_TO_INCH
```

## 実装フェーズ

### Phase 1: 基本構造
- [ ] 型定義
- [ ] ExcelJS統合
- [ ] 基本的なセル読み込み

### Phase 2: レイアウト
- [ ] 行高・列幅の変換
- [ ] 結合セル対応
- [ ] 印刷範囲の解析

### Phase 3: スタイル
- [ ] 罫線
- [ ] 背景色
- [ ] フォント・文字色

### Phase 4: ページ分割
- [ ] PageSetup解析
- [ ] 自動改ページ計算
- [ ] 複数Surface生成

### Phase 5: 高度な機能
- [ ] ヘッダー/フッター
- [ ] 画像
- [ ] 図形

## 使用例

```typescript
import { importExcel } from './excel-importer'

// ファイルから
const doc = await importExcel(fileBuffer, {
  defaultFont: 'Noto Sans JP',
  pageSize: 'A4',
  fitToPage: true,
})

// オプション
interface ImportOptions {
  // ページ設定（Excel側の設定を上書き）
  pageSize?: 'A4' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
  margin?: { t: number; r: number; b: number; l: number }
  
  // フォント
  defaultFont?: string
  fontMapping?: Record<string, string>
  
  // 縮尺
  fitToPage?: boolean
  scale?: number
  
  // 範囲
  sheetIndex?: number
  printAreaOnly?: boolean
}
```

## 切り離し時の手順

1. このディレクトリを新リポジトリにコピー
2. `package.json` を作成（exceljs依存を追加）
3. wysiwyg-pdfの型定義を `peerDependencies` として参照
4. または型定義を複製して完全独立化
