# Excel Importer 設計書

## 1. 概要

### 1.1 目的
Excelファイル（.xlsx）を読み込み、wysiwyg-pdfプロジェクトの`Doc`オブジェクトに変換するモジュール。

### 1.2 スコープ
- **入力**: `.xlsx`ファイル（ArrayBuffer または ファイルパス）
- **出力**: `Doc`オブジェクト（wysiwyg-pdf形式）
- **対象**: セルデータ、スタイル、結合セル、印刷設定

### 1.3 将来の分離を考慮した設計方針
- wysiwyg-pdf本体への依存は**型定義のみ**
- ExcelJSへの依存は**parser層に局所化**
- 中間表現を挟むことでパーサー差し替えを容易に

---

## 2. アーキテクチャ

### 2.1 レイヤー構成

```
┌─────────────────────────────────────────────────────────┐
│                    Public API (index.ts)                │
│                   importExcel(buffer, options)          │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    Parser Layer                         │
│  ExcelJS → ExcelWorkbook (中間表現)                      │
│  - workbook.ts: ワークブック解析                          │
│  - sheet.ts: シート解析                                  │
│  - cell.ts: セル解析                                     │
│  - style.ts: スタイル解析                                │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Converter Layer                       │
│  ExcelWorkbook → OutputDoc (wysiwyg-pdf形式)            │
│  - doc.ts: Doc変換                                      │
│  - surface.ts: Surface変換 + ページ分割                  │
│  - table.ts: TableNode変換                              │
│  - cell.ts: Cell変換                                    │
│  - style.ts: スタイル変換                                │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    Utils Layer                          │
│  - units.ts: 単位変換 (pt/px/Excel単位 → mm)            │
│  - color.ts: 色変換 (ARGB/Theme → CSS)                  │
│  - font.ts: フォントマッピング                           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 ディレクトリ構造

```
excel-importer/
├── index.ts              # Public API
├── README.md             # 使用方法
├── DESIGN.md             # この設計書
├── types/
│   ├── index.ts          # 型エクスポート
│   ├── excel.ts          # 中間表現の型 (ExcelWorkbook等)
│   ├── output.ts         # 出力型 (OutputDoc等、wysiwyg-pdf互換)
│   └── options.ts        # ImportOptions
├── parser/
│   ├── index.ts          # パーサーエクスポート
│   ├── workbook.ts       # parseExcelBuffer, parseExcelFile
│   ├── sheet.ts          # parseSheet
│   ├── cell.ts           # parseCell
│   └── style.ts          # parseCellStyle
├── converter/
│   ├── index.ts          # コンバーターエクスポート
│   ├── doc.ts            # convertWorkbook
│   ├── surface.ts        # convertSheet (ページ分割含む)
│   ├── table.ts          # convertToTableNode
│   ├── cell.ts           # convertCell
│   └── style.ts          # convertCellStyle
└── utils/
    ├── index.ts          # ユーティリティエクスポート
    ├── units.ts          # 単位変換
    ├── color.ts          # 色変換
    └── font.ts           # フォントマッピング
```

---

## 3. 型定義詳細

### 3.1 中間表現 (types/excel.ts)

#### ExcelWorkbook
```typescript
interface ExcelWorkbook {
  sheets: ExcelSheet[]
  defaultFont: FontInfo
  metadata?: {
    title?: string
    author?: string
    created?: Date
    modified?: Date
  }
}
```

#### ExcelSheet
```typescript
interface ExcelSheet {
  name: string
  index: number
  pageSetup: PageSetup
  printArea?: CellRange        // 印刷範囲（未設定の場合undefined）
  rows: ExcelRow[]
  columns: ExcelColumn[]
  mergedCells: MergedCell[]
  usedRange?: CellRange        // 実データ範囲
}
```

#### PageSetup
```typescript
interface PageSetup {
  paperSize: 'letter' | 'legal' | 'a3' | 'a4' | 'a5' | 'b4' | 'b5'
  orientation: 'portrait' | 'landscape'
  margin: {
    top: number     // inch
    right: number   // inch
    bottom: number  // inch
    left: number    // inch
    header: number  // inch
    footer: number  // inch
  }
  scale?: number              // 1-400 (%)
  fitToPage?: {
    width?: number            // ページ数
    height?: number           // ページ数
  }
  horizontalPageBreaks?: number[]  // 行インデックス
  verticalPageBreaks?: number[]    // 列インデックス
}
```

#### ExcelRow / ExcelColumn
```typescript
interface ExcelRow {
  index: number      // 0-based
  height: number     // pt
  hidden: boolean
  cells: ExcelCell[]
}

interface ExcelColumn {
  index: number      // 0-based
  width: number      // Excel単位（文字数ベース）
  hidden: boolean
}
```

#### ExcelCell
```typescript
interface ExcelCell {
  row: number        // 0-based
  col: number        // 0-based
  value: string | number | boolean | Date | null
  formula?: string
  style: CellStyle
}
```

#### CellStyle
```typescript
interface CellStyle {
  font?: {
    name: string
    size: number           // pt
    bold?: boolean
    italic?: boolean
    underline?: boolean | 'single' | 'double'
    strike?: boolean
    color?: ColorInfo
  }
  fill?: {
    type: 'solid' | 'pattern' | 'gradient'
    color?: ColorInfo
    patternType?: string
    patternColor?: ColorInfo
  }
  border?: {
    top?: BorderStyle
    right?: BorderStyle
    bottom?: BorderStyle
    left?: BorderStyle
  }
  alignment?: {
    horizontal?: 'left' | 'center' | 'right' | 'fill' | 'justify'
    vertical?: 'top' | 'middle' | 'bottom'
    wrapText?: boolean
    shrinkToFit?: boolean
    indent?: number
    textRotation?: number
  }
  numberFormat?: string
}

interface BorderStyle {
  style: 'thin' | 'medium' | 'thick' | 'dotted' | 'dashed' | 'double' | 'none'
  color?: ColorInfo
}

interface ColorInfo {
  argb?: string      // AARRGGBB
  theme?: number     // テーマカラーインデックス
  tint?: number      // -1.0 ~ 1.0
}
```

#### MergedCell / CellRange
```typescript
interface MergedCell {
  startRow: number   // 0-based
  startCol: number   // 0-based
  endRow: number     // 0-based (inclusive)
  endCol: number     // 0-based (inclusive)
}

interface CellRange {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}
```

### 3.2 出力型 (types/output.ts)

wysiwyg-pdfの`Doc`型と互換。将来的に直接importに置き換え可能。

#### OutputDoc
```typescript
interface OutputDoc {
  v: 1
  id: string
  title: string
  unit: 'mm'
  surfaces: OutputSurface[]
  nodes: OutputNode[]
  assets?: OutputAsset[]
}
```

#### OutputSurface
```typescript
interface OutputSurface {
  id: string
  type: 'page'
  w: number          // mm
  h: number          // mm
  margin?: {
    t: number
    r: number
    b: number
    l: number
  }
  bg?: string
}
```

#### OutputTableNode
```typescript
interface OutputTableNode {
  id: string
  s: string          // Surface ID
  t: 'table'
  x: number          // mm
  y: number          // mm
  w: number          // mm
  h: number          // mm
  table: {
    rows: number[]   // 各行の高さ (mm)
    cols: number[]   // 各列の幅 (mm)
    cells: OutputCell[]
  }
}
```

#### OutputCell
```typescript
interface OutputCell {
  r: number          // 行インデックス (0-based)
  c: number          // 列インデックス (0-based)
  rs?: number        // rowspan (省略時1)
  cs?: number        // colspan (省略時1)
  v: string          // 表示値
  bg?: string        // 背景色 (#RRGGBB)
  border?: string    // 罫線スタイル (将来拡張)
  borderColor?: string
  borderW?: number
  font?: string
  fontSize?: number  // pt
  align?: 'l' | 'c' | 'r'
  vAlign?: 't' | 'm' | 'b'
  color?: string     // 文字色 (#RRGGBB)
}
```

### 3.3 オプション (types/options.ts)

```typescript
interface ImportOptions {
  // ページ設定（Excel設定を上書き）
  pageSize?: 'letter' | 'legal' | 'a3' | 'a4' | 'a5' | 'b4' | 'b5'
  orientation?: 'portrait' | 'landscape'
  margin?: { t: number; r: number; b: number; l: number }  // mm

  // フォント
  defaultFont?: string                    // デフォルト: 'Noto Sans JP'
  fontMapping?: Record<string, string>    // Excel名 → 出力名

  // 縮尺
  fitToPage?: boolean                     // デフォルト: true
  scale?: number                          // 1.0 = 100%

  // 範囲
  sheetIndex?: number
  sheetName?: string
  printAreaOnly?: boolean                 // デフォルト: true
  customRange?: string                    // 'A1:Z100'形式

  // 変換
  skipEmptyRows?: boolean                 // デフォルト: true
  skipEmptyColumns?: boolean              // デフォルト: true
  dateFormat?: string

  // 出力
  documentId?: string
  documentTitle?: string
}
```

---

## 4. 単位変換ロジック

### 4.1 基本定数
```typescript
const INCH_TO_MM = 25.4
const PT_TO_INCH = 1 / 72
const PX_TO_INCH = 1 / 96
```

### 4.2 行高変換 (pt → mm)
```typescript
function excelRowHeightToMm(heightPt: number): number {
  return heightPt * INCH_TO_MM * PT_TO_INCH
  // 例: 15pt → 5.29mm
}
```

### 4.3 列幅変換 (Excel単位 → mm)

Excelの列幅は「最大数字幅(MDW)の文字数」で表現される。

```typescript
const DEFAULT_MDW = 7  // Calibri 11pt での目安

function excelColWidthToMm(width: number, mdw: number = DEFAULT_MDW): number {
  // Excel単位 → px
  const px = Math.trunc(((256 * width + Math.trunc(128 / mdw)) / 256) * mdw)
  // px → mm
  return px * INCH_TO_MM * PX_TO_INCH
  // 例: 8.43 (デフォルト幅) → 約18.5mm
}
```

### 4.4 用紙サイズ (mm)
```typescript
const PAPER_SIZES = {
  letter: { w: 215.9, h: 279.4 },
  legal:  { w: 215.9, h: 355.6 },
  a3:     { w: 297,   h: 420 },
  a4:     { w: 210,   h: 297 },
  a5:     { w: 148,   h: 210 },
  b4:     { w: 250,   h: 353 },
  b5:     { w: 176,   h: 250 },
}
```

---

## 5. 変換ロジック詳細

### 5.1 Parser Layer

#### 5.1.1 parseExcelBuffer (workbook.ts)

**入力**: `ArrayBuffer`
**出力**: `ExcelWorkbook`

```
1. ExcelJSでワークブックを読み込み
2. 各ワークシートに対してparseSheetを呼び出し
3. デフォルトフォント情報を抽出
4. メタデータを抽出
5. ExcelWorkbookを返却
```

#### 5.1.2 parseSheet (sheet.ts)

**入力**: ExcelJSのWorksheet
**出力**: `ExcelSheet`

```
1. シート名・インデックスを取得
2. PageSetupを解析
   - paperSize: ExcelJSの数値 → 文字列 (9 → 'a4')
   - orientation: そのまま
   - margin: そのまま (inch)
   - scale, fitToPage: そのまま
3. 印刷範囲を解析
   - printArea文字列 → CellRange
   - 例: "Sheet1!A1:Z100" → { startRow: 0, startCol: 0, endRow: 99, endCol: 25 }
4. 列情報を収集
   - 各列のwidth, hidden
5. 行情報を収集
   - 各行のheight, hidden
   - 各行のセルをparseCellで変換
6. 結合セル情報を解析
   - merges配列 → MergedCell配列
7. UsedRangeを計算
   - 値が存在するセルの最小/最大範囲
```

#### 5.1.3 parseCell (cell.ts)

**入力**: ExcelJSのCell
**出力**: `ExcelCell`

```
1. 行・列インデックスを取得 (0-based)
2. 値を抽出
   - null/undefined → null
   - 数式の場合 → result (計算結果) を使用
   - リッチテキスト → テキスト部分を結合
   - ハイパーリンク → text部分
   - Date → そのまま
   - その他 → そのまま
3. 数式を取得 (あれば)
4. スタイルをparseCellStyleで変換
```

#### 5.1.4 parseCellStyle (style.ts)

**入力**: ExcelJSのStyle
**出力**: `CellStyle`

```
1. font情報を抽出
   - name, size, bold, italic, underline, strike, color
2. fill情報を抽出
   - type ('solid', 'pattern', 'gradient')
   - color (fgColor)
3. border情報を抽出
   - top, right, bottom, left
   - 各辺のstyle, color
4. alignment情報を抽出
   - horizontal, vertical, wrapText, shrinkToFit
5. numberFormat を取得
```

### 5.2 Converter Layer

#### 5.2.1 convertWorkbook (doc.ts)

**入力**: `ExcelWorkbook`, `ImportOptions`
**出力**: `OutputDoc`

```
1. ドキュメントIDを生成 (またはオプションから取得)
2. タイトルを決定 (オプション > メタデータ > 'Untitled')
3. 対象シートを選択
   - sheetName指定 → 名前で検索
   - sheetIndex指定 → インデックスで取得
   - 未指定 → 全シート
4. 各シートをconvertSheetで変換
5. 結果を統合してOutputDocを返却
```

#### 5.2.2 convertSheet (surface.ts)

**入力**: `ExcelSheet`, `ImportOptions`, `FontInfo`
**出力**: `{ surfaces: OutputSurface[], nodes: OutputNode[] }`

**これが最も複雑な処理**

```
1. ページサイズを決定
   - オプション > シートのPageSetup > デフォルト(A4)
   - landscape時はw/hを入れ替え

2. 余白を決定 (mm)
   - オプション > シートのPageSetup (inch→mm変換)

3. 印刷範囲を決定
   - printAreaOnly && printArea存在 → printArea
   - customRange指定 → パース
   - それ以外 → usedRange

4. 対象行・列をフィルタ
   - hidden行/列を除外
   - skipEmptyRows/Columns時は空行/列を除外

5. 行高・列幅を計算 (mm)
   - excelRowHeightToMm, excelColWidthToMm

6. コンテンツサイズを計算
   - contentWidth = 列幅の合計
   - contentHeight = 行高の合計

7. 縮尺を計算
   - fitToPage時: min(drawableWidth/contentWidth, drawableHeight/contentHeight, 1.0)
   - scale指定時: その値
   - それ以外: 1.0

8. ページ分割を計算
   - 描画可能領域 = ページサイズ - 余白
   - 縮尺適用後のコンテンツが描画可能領域を超える場合、複数ページに分割
   - 手動改ページ (horizontalPageBreaks, verticalPageBreaks) を優先

9. 各ページに対してSurfaceとTableNodeを生成
   - Surface: ページサイズ、余白
   - TableNode: 該当範囲のセルデータ
```

#### 5.2.3 ページ分割アルゴリズム

```
入力:
  - rowHeights: number[]      // 各行の高さ (mm)
  - colWidths: number[]       // 各列の幅 (mm)
  - drawableHeight: number    // 描画可能高さ (mm)
  - drawableWidth: number     // 描画可能幅 (mm)
  - manualRowBreaks?: number[]
  - manualColBreaks?: number[]

出力:
  - pages: Array<{
      startRow: number
      endRow: number
      startCol: number
      endCol: number
    }>

アルゴリズム:
1. 行方向の分割点を計算
   rowBreaks = []
   currentHeight = 0
   for (i = 0; i < rowHeights.length; i++) {
     if (manualRowBreaks.includes(i)) {
       rowBreaks.push(i)
       currentHeight = 0
     } else if (currentHeight + rowHeights[i] > drawableHeight) {
       rowBreaks.push(i)
       currentHeight = rowHeights[i]
     } else {
       currentHeight += rowHeights[i]
     }
   }

2. 列方向の分割点を計算 (同様)

3. 行分割 × 列分割 でページを生成
   for each rowRange in rowBreaks:
     for each colRange in colBreaks:
       pages.push({ startRow, endRow, startCol, endCol })
```

#### 5.2.4 convertToTableNode (table.ts)

**入力**: 
- `sheet: ExcelSheet`
- `range: { startRow, endRow, startCol, endCol }`
- `rowHeights: number[]` (mm)
- `colWidths: number[]` (mm)
- `surfaceId: string`
- `options: ImportOptions`

**出力**: `OutputTableNode`

```
1. ノードIDを生成
2. 対象範囲の行高・列幅を抽出
3. 対象範囲のセルを変換
   - 範囲内のセルをconvertCellで変換
   - 結合セルの処理:
     - 結合の起点セルのみ出力
     - rs, csを設定
     - 結合範囲が範囲外にはみ出す場合は調整
4. テーブルサイズを計算
   - w = 列幅の合計
   - h = 行高の合計
5. OutputTableNodeを返却
```

#### 5.2.5 convertCell (cell.ts)

**入力**: `ExcelCell`, `ImportOptions`
**出力**: `OutputCell`

```
1. 行・列インデックスをそのまま使用
2. 値を文字列に変換
   - null → ''
   - Date → dateFormatで整形
   - number → numberFormatで整形 (または toString)
   - boolean → 'TRUE' / 'FALSE'
   - string → そのまま
3. スタイルをconvertCellStyleで変換
4. OutputCellを返却
```

#### 5.2.6 convertCellStyle (style.ts)

**入力**: `CellStyle`, `ImportOptions`
**出力**: OutputCellのスタイルプロパティ

```
1. 背景色を変換
   - fill.color → colorInfoToCSS → bg
2. 罫線を変換 (将来拡張)
3. フォントを変換
   - font.name → fontMapping適用 → font
   - font.size → fontSize
   - font.color → colorInfoToCSS → color
4. 配置を変換
   - horizontal: 'left'→'l', 'center'→'c', 'right'→'r'
   - vertical: 'top'→'t', 'middle'→'m', 'bottom'→'b'
```

---

## 6. 色変換ロジック

### 6.1 ARGB → CSS

```typescript
function argbToCSS(argb: string): string {
  // 8文字: AARRGGBB
  if (argb.length === 8) {
    const alpha = parseInt(argb.substring(0, 2), 16)
    const rgb = argb.substring(2)
    if (alpha === 255) return `#${rgb}`
    return `rgba(${r}, ${g}, ${b}, ${alpha/255})`
  }
  // 6文字: RRGGBB
  return `#${argb}`
}
```

### 6.2 テーマカラー → CSS

```typescript
const THEME_COLORS = {
  0: 'FFFFFF',  // Background 1
  1: '000000',  // Text 1
  2: 'E7E6E6',  // Background 2
  3: '44546A',  // Text 2
  4: '4472C4',  // Accent 1
  5: 'ED7D31',  // Accent 2
  6: 'A5A5A5',  // Accent 3
  7: 'FFC000',  // Accent 4
  8: '5B9BD5',  // Accent 5
  9: '70AD47',  // Accent 6
}

function themeColorToCSS(theme: number, tint?: number): string {
  const base = THEME_COLORS[theme] ?? '000000'
  if (!tint) return `#${base}`
  return applyTint(base, tint)
}

function applyTint(base: string, tint: number): string {
  // tint > 0: 白に近づける
  // tint < 0: 黒に近づける
  const [r, g, b] = parseRGB(base)
  if (tint > 0) {
    return rgb(r + (255-r)*tint, g + (255-g)*tint, b + (255-b)*tint)
  } else {
    return rgb(r * (1+tint), g * (1+tint), b * (1+tint))
  }
}
```

---

## 7. フォントマッピング

### 7.1 デフォルトマッピング

```typescript
const DEFAULT_FONT_MAPPING = {
  // Windows日本語
  'MS Gothic': 'Noto Sans JP',
  'MS PGothic': 'Noto Sans JP',
  'MS Mincho': 'Noto Serif JP',
  'Yu Gothic': 'Noto Sans JP',
  'Meiryo': 'Noto Sans JP',
  
  // Mac日本語
  'Hiragino Sans': 'Noto Sans JP',
  'Hiragino Kaku Gothic Pro': 'Noto Sans JP',
  
  // Office標準
  'Calibri': 'Noto Sans',
  'Arial': 'Noto Sans',
  'Times New Roman': 'Noto Serif',
}
```

### 7.2 マッピング適用

```typescript
function mapFont(excelFont: string, options: ImportOptions): string {
  // カスタムマッピング優先
  if (options.fontMapping?.[excelFont]) {
    return options.fontMapping[excelFont]
  }
  // デフォルトマッピング
  if (DEFAULT_FONT_MAPPING[excelFont]) {
    return DEFAULT_FONT_MAPPING[excelFont]
  }
  // マッピングなし → デフォルトフォント
  return options.defaultFont ?? 'Noto Sans JP'
}
```

---

## 8. Public API

### 8.1 index.ts

```typescript
export { importExcel, importExcelFromFile } from './api'
export type { ImportOptions } from './types/options'
export type { OutputDoc, OutputSurface, OutputTableNode, OutputCell } from './types/output'
```

### 8.2 使用例

```typescript
import { importExcel } from './excel-importer'

// 基本使用
const doc = await importExcel(arrayBuffer)

// オプション指定
const doc = await importExcel(arrayBuffer, {
  pageSize: 'a4',
  orientation: 'portrait',
  fitToPage: true,
  defaultFont: 'Noto Sans JP',
  sheetIndex: 0,
  printAreaOnly: true,
})
```

---

## 9. 実装フェーズ

### Phase 1: 基盤 (必須)
1. `types/` - 全型定義
2. `utils/units.ts` - 単位変換
3. `utils/color.ts` - 色変換
4. `utils/font.ts` - フォントマッピング

### Phase 2: Parser (必須)
1. `parser/style.ts` - スタイル解析
2. `parser/cell.ts` - セル解析
3. `parser/sheet.ts` - シート解析
4. `parser/workbook.ts` - ワークブック解析

### Phase 3: Converter (必須)
1. `converter/style.ts` - スタイル変換
2. `converter/cell.ts` - セル変換
3. `converter/table.ts` - テーブル変換
4. `converter/surface.ts` - Surface変換 + ページ分割
5. `converter/doc.ts` - Doc変換

### Phase 4: API (必須)
1. `index.ts` - Public API

### Phase 5: テスト
1. 単体テスト (各関数)
2. 統合テスト (サンプルExcel → Doc)

---

## 10. 依存パッケージ

```json
{
  "dependencies": {
    "exceljs": "^4.4.0"
  }
}
```

---

## 11. 注意事項・制限

### 11.1 ExcelJSの制限
- **数式評価不可**: 数式の計算結果はExcel側で事前計算が必要
- **一部スタイル未対応**: グラデーション塗りつぶし等は簡略化

### 11.2 フォントの制限
- 出力環境にフォントが存在しない場合は代替フォントに置換
- フォント差異による行高ズレは完全には防げない

### 11.3 複雑なレイアウト
- 図形・画像は Phase 1 では未対応
- 条件付き書式は未対応
- ピボットテーブルは未対応

---

## 12. 将来の拡張

### 12.1 別パッケージ化時の手順
1. このディレクトリを新リポジトリにコピー
2. `package.json`を作成
3. `types/output.ts`をwysiwyg-pdfからの直接importに置き換え
   または型定義を複製して完全独立化

### 12.2 機能拡張候補
- 画像の抽出・変換
- 図形の抽出・変換
- ヘッダー/フッターの変換
- 条件付き書式の部分対応
