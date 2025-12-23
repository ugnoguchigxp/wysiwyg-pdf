# マインドマップ画像・PDF保存機能仕様

## 1. 概要

マインドマップエディタで作成したコンテンツを**画像（PNG）**または**PDF**形式でダウンロードできる機能を追加します。既存のreport-editor機能を踏襲し、同様のUIとダウンロードロジックを実装します。

## 2. ユースケース

- マインドマップを画像ファイルとして保存・共有したい場合
- プレゼンテーションやドキュメントに埋め込む用に画像として出力したい場合
- PDFとして保存して配布・印刷したい場合
- 高解像度での出力が必要な場合

## 3. UI/UX仕様

### 3.1 ボタン配置

- **配置場所**: 画面上部のツールバー（ヘッダー領域）
- **ボタン構成**:
  - **画像ダウンロードボタン**: 「Image」（アイコン: `ImageIcon`）
  - **PDFダウンロードボタン**: 「PDF」（アイコン: `Download`）
- **配置位置**: Mermaidエクスポート/インポートボタンの後ろ、保存ボタンの前
- **スタイル**: report-editorの`EditorHeader`と同様のデザイン

```tsx
// 想定する配置順序
[Import Mermaid] [Export Mermaid] | [Image] [PDF] | [Save]
```

### 3.2 画像ダウンロード機能

#### 3.2.1 動作フロー

1. ユーザーが「Image」ボタンをクリック
2. Konva Stageから2倍解像度でPNG画像を生成
3. `mindmap-{timestamp}.png` という名前でダウンロード
4. ダウンロード完了（モーダル表示なし）

#### 3.2.2 仕様詳細

- **画像形式**: PNG
- **解像度**: 2倍（`pixelRatio: 2`）
- **ファイル名**: `mindmap-{Date.now()}.png`
- **出力内容**: 
  - グリッドは非表示
  - 選択ハンドル（Transformer）は非表示
  - 全てのノードとエッジを含む

### 3.3 PDFダウンロード機能

#### 3.3.1 動作フロー

1. ユーザーが「PDF」ボタンをクリック
2. Konva Stageから画像を生成
3. jsPDFを使用してPDFを作成
4. 画像をPDFに埋め込み
5. `mindmap-{timestamp}.pdf` という名前でダウンロード
6. ダウンロード完了（モーダル表示なし）

#### 3.3.2 仕様詳細

- **PDF形式**: A4サイズ、横向き（landscape）または縦向き（portrait）
- **画像の配置**: センタリング、アスペクト比を維持して最大化
- **ファイル名**: `mindmap-{Date.now()}.pdf`
- **依存ライブラリ**: `jspdf`

## 4. 技術実装計画

### 4.1 report-editorの実装参考

#### 4.1.1 画像ダウンロード実装（参考コード）

```typescript
// ReportKonvaEditor.tsx の downloadImage 関数
downloadImage: () => {
  if (!stageRef.current) return
  const stage = stageRef.current

  // Hide grid layer
  const gridLayer = stage.findOne('.grid-layer')
  const wasGridVisible = gridLayer?.visible()

  // Hide transformer handles (selection UI)
  const transformers = (stage.find('Transformer') as unknown as Konva.Node[])
    .filter((n): n is Konva.Transformer => n.getClassName?.() === 'Transformer')
  const transformerVisibility = transformers.map((tr) => tr.visible())

  try {
    gridLayer?.hide()
    transformers.forEach((tr) => tr.hide())

    const dataURL = stage.toDataURL({ pixelRatio: 2 })

    const link = document.createElement('a')
    link.download = `report-${Date.now()}.png`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    // Restore grid layer
    if (gridLayer && wasGridVisible) {
      gridLayer.show()
    }
    // Restore transformer handles
    transformers.forEach((tr, idx) => {
      const prev = transformerVisibility[idx]
      if (prev) tr.show()
    })
  }
}
```

### 4.2 マインドマップエディタへの適用

#### 4.2.1 画像ダウンロード実装

```typescript
const handleDownloadImage = useCallback(() => {
  if (!stageRef.current) return
  const stage = stageRef.current

  // グリッドレイヤーを一時的に非表示
  const gridLayer = stage.findOne('.grid-layer')
  const wasGridVisible = gridLayer?.visible()

  // 選択ハンドル（Transformer）を一時的に非表示
  const transformers = (stage.find('Transformer') as unknown as Konva.Node[])
    .filter((n): n is Konva.Transformer => n.getClassName?.() === 'Transformer')
  const transformerVisibility = transformers.map((tr) => tr.visible())

  try {
    gridLayer?.hide()
    transformers.forEach((tr) => tr.hide())

    // 2倍解像度でPNG画像を生成
    const dataURL = stage.toDataURL({ pixelRatio: 2 })

    // ダウンロードリンクを作成
    const link = document.createElement('a')
    link.download = `mindmap-${Date.now()}.png`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    // グリッドとTransformerを元に戻す
    if (gridLayer && wasGridVisible) {
      gridLayer.show()
    }
    transformers.forEach((tr, idx) => {
      if (transformerVisibility[idx]) tr.show()
    })
  }
}, [])
```

#### 4.2.2 PDFダウンロード実装

```typescript
import jsPDF from 'jspdf'

const handleDownloadPdf = useCallback(() => {
  if (!stageRef.current) return
  const stage = stageRef.current

  // グリッドとTransformerを非表示（画像ダウンロードと同様）
  const gridLayer = stage.findOne('.grid-layer')
  const wasGridVisible = gridLayer?.visible()

  const transformers = (stage.find('Transformer') as unknown as Konva.Node[])
    .filter((n): n is Konva.Transformer => n.getClassName?.() === 'Transformer')
  const transformerVisibility = transformers.map((tr) => tr.visible())

  try {
    gridLayer?.hide()
    transformers.forEach((tr) => tr.hide())

    // 画像を生成（高解像度）
    const dataURL = stage.toDataURL({ pixelRatio: 2 })

    // PDFを作成（A4横向き）
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // A4サイズ（横）: 297mm x 210mm
    const pdfWidth = 297
    const pdfHeight = 210

    // Stageのアスペクト比を取得
    const stageWidth = stage.width()
    const stageHeight = stage.height()
    const aspectRatio = stageWidth / stageHeight

    // PDFに収まるようにサイズを計算（アスペクト比維持）
    let imgWidth = pdfWidth
    let imgHeight = pdfWidth / aspectRatio

    if (imgHeight > pdfHeight) {
      imgHeight = pdfHeight
      imgWidth = pdfHeight * aspectRatio
    }

    // センタリング
    const x = (pdfWidth - imgWidth) / 2
    const y = (pdfHeight - imgHeight) / 2

    // 画像をPDFに追加
    pdf.addImage(dataURL, 'PNG', x, y, imgWidth, imgHeight)

    // PDFをダウンロード
    pdf.save(`mindmap-${Date.now()}.pdf`)
  } finally {
    // グリッドとTransformerを元に戻す
    if (gridLayer && wasGridVisible) {
      gridLayer.show()
    }
    transformers.forEach((tr, idx) => {
      if (transformerVisibility[idx]) tr.show()
    })
  }
}, [])
```

### 4.3 コンポーネント構成

```
MindmapEditor
  └── MindmapHeader (新規作成または既存のヘッダーを拡張)
      ├── [既存のボタン群]
      ├── ImportMermaidButton
      ├── ExportMermaidButton
      ├── Divider
      ├── DownloadImageButton → handleDownloadImage
      ├── DownloadPdfButton → handleDownloadPdf
      └── SaveButton
```

### 4.4 ヘッダーコンポーネントのインターフェース

```typescript
interface MindmapHeaderProps {
  // 既存のプロパティ
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  
  // 新規追加
  onDownloadImage: () => void
  onDownloadPdf: () => void
  onImportMermaid: () => void
  onExportMermaid: () => void
  onSave: () => void
}
```

## 5. 実装手順

### Phase 1: 依存ライブラリの確認
1. `jspdf` がインストールされているか確認
2. 必要に応じて `npm install jspdf` を実行

### Phase 2: ダウンロード関数の実装
1. `handleDownloadImage` 関数を実装
2. `handleDownloadPdf` 関数を実装
3. `MindmapEditor.tsx` に追加

### Phase 3: UIボタンの追加
1. ヘッダーコンポーネントにボタンを追加
2. アイコンとスタイルを統一
3. ボタンのイベントハンドラーを接続

### Phase 4: テストと調整
1. 各種サイズのマインドマップで動作テスト
2. グリッド・Transformerの表示/非表示が正しく機能するか確認
3. ファイル名とタイムスタンプの確認

## 6. 既存コードとの整合性

### 6.1 report-editorとの共通点

- Konva Stageの`toDataURL`を使用
- グリッドレイヤーとTransformerを一時的に非表示
- 2倍解像度（`pixelRatio: 2`）での出力
- タイムスタンプ付きファイル名

### 6.2 マインドマップ特有の考慮事項

- マインドマップは可変サイズ（キャンバスがノードに合わせて拡大）
- ルートノードを中心とした左右対称のレイアウト
- 折りたたまれたノードは非表示のまま出力

## 7. テスト計画

### 7.1 ユニットテスト

- **画像ダウンロード**
  - Stageが存在しない場合のエラーハンドリング
  - グリッド表示/非表示の状態復元
  - Transformer表示/非表示の状態復元
- **PDFダウンロード**
  - アスペクト比の計算が正しいか
  - センタリングが正しく機能するか

### 7.2 インテグレーションテスト

- **画像ダウンロード**
  - シナリオ: 小さいマインドマップ（5ノード）をダウンロード
  - 検証: PNG形式で正しくダウンロードされる
- **画像ダウンロード**
  - シナリオ: 大きいマインドマップ（50ノード）をダウンロード
  - 検証: 全てのノードが含まれている
- **PDFダウンロード**
  - シナリオ: 縦長のマインドマップをダウンロード
  - 検証: アスペクト比を維持してPDFに収まっている
- **PDFダウンロード**
  - シナリオ: 横長のマインドマップをダウンロード
  - 検証: アスペクト比を維持してPDFに収まっている

### 7.3 E2Eテスト

- **画像ダウンロード**: ボタンクリック → ファイルがダウンロードされる
- **PDFダウンロード**: ボタンクリック → PDFがダウンロードされる
- **グリッド非表示**: グリッド表示中にダウンロード → グリッドが含まれない
- **選択状態**: ノード選択中にダウンロード → 選択ハンドルが含まれない

## 8. 考慮事項

### 8.1 パフォーマンス

- 大規模なマインドマップ（100ノード以上）のレンダリング時間
- 高解像度画像生成時のメモリ使用量
- ブラウザの制限（Canvas最大サイズ）

### 8.2 ユーザビリティ

- ダウンロード中の視覚的フィードバック（ローディング表示）
- ダウンロード完了の通知（トースト通知）
- ファイル名のカスタマイズオプション（オプション）

### 8.3 エッジケース

- 空のマインドマップ（ルートノードのみ）
- 非常に大きなマインドマップ（キャンバスサイズの制限）
- 折りたたまれたノードが多い場合
- 透明背景のオプション（将来の拡張）

## 9. 今後の拡張案

- **ファイル名のカスタマイズ**: ダウンロード前にファイル名を編集可能に
- **画像形式の選択**: PNG、JPEG、SVGから選択可能に
- **PDF設定**: 用紙サイズ（A4、Letter等）、向き（縦/横）を選択可能に
- **透明背景オプション**: 背景を透明にしてダウンロード
- **範囲選択ダウンロード**: マインドマップの一部のみをダウンロード
- **クリップボードにコピー**: ダウンロードではなくクリップボードに画像をコピー
- **ダウンロード履歴**: 最近ダウンロードしたファイルの履歴表示

## 10. 参考コード

### report-editorのダウンロード実装場所

- **画像ダウンロード**: [`ReportKonvaEditor.tsx#L1087-1126`](file:///Users/y.noguchi/Code/wysiwyg-pdf/src/features/report-editor/ReportKonvaEditor.tsx#L1087-1126)
- **ヘッダーUI**: [`EditorHeader.tsx#L142-156`](file:///Users/y.noguchi/Code/wysiwyg-pdf/src/features/report-editor/components/Header/EditorHeader.tsx#L142-156)

### 必要なインポート

```typescript
// MindmapEditor.tsx
import jsPDF from 'jspdf'
import { ImageIcon, Download } from 'lucide-react'
```

### ボタンのスタイル例

```tsx
<button
  onClick={handleDownloadImage}
  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent rounded-md border border-border transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
>
  <ImageIcon className="w-4 h-4" />
  Image
</button>

<button
  onClick={handleDownloadPdf}
  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent rounded-md border border-border transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
>
  <Download className="w-4 h-4" />
  PDF
</button>
```

## 11. 実装の優先順位

1. **Phase 1-2（高優先度）**: 画像ダウンロード機能の実装
2. **Phase 3（高優先度）**: UIボタンの追加とイベントハンドラー接続
3. **Phase 4（中優先度）**: PDFダウンロード機能の実装
4. **Phase 5（中優先度）**: テストとエラーハンドリングの強化
5. **拡張機能（低優先度）**: ファイル名カスタマイズ、透明背景オプション等
