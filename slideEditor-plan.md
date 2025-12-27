# スライドエディタ実装計画書

本ドキュメントでは、`wysiwyg-pdf` プロジェクト内に PowerPoint 風のスライドエディタ機能を実装するための計画を定義します。

---

## 1. アーキテクチャ概要

新機能モジュール `src/features/slide-editor` を作成します。

### ディレクトリ構造
```
src/features/slide-editor/
├── components/
│   ├── SlideEditor.tsx         # メインエントリーポイント
│   ├── TopToolbar.tsx          # 水平ツールバー（新規）
│   ├── SlideListPanel.tsx      # 左サイドバー（サムネイル一覧）
│   └── PresentationMode.tsx    # 全画面スライドショー
├── hooks/
│   ├── useSlideHistory.ts      # Undo/Redo（useReportHistoryをラップ）
│   └── useFitToScreen.ts       # 初期Zoom計算
├── utils/
│   └── pptxExport.ts           # PowerPoint出力
└── index.ts
```

> **Note:** `WysiwygPropertiesPanel` は `src/features/report-editor` から直接 import して再利用します。

---

## 2. データモデル

### 2.1 型定義の拡張
`src/types/canvas.ts` の `Surface.type` に `'slide'` を追加します。

```diff
- export interface Surface {
-   type: 'page' | 'canvas'
+ export interface Surface {
+   type: 'page' | 'canvas' | 'slide'
```

### 2.2 スライドドキュメントの規約
| プロパティ | 値 | 備考 |
|-----------|-----|------|
| `Doc.unit` | `'mm'` | プロジェクト標準に準拠 |
| `Surface.type` | `'slide'` | 新規追加 |
| `Surface.w` | `297` | A4横 |
| `Surface.h` | `210` | A4横 |

---

## 3. コンポーネント詳細

### 3.1 SlideEditor（メインコンテナ）

**レイアウト構成:**
```
┌─────────────────────────────────────────┐
│            TopToolbar (h:48px)          │
├──────┬─────────────────────────┬────────┤
│Slide │                         │Property│
│List  │    KonvaCanvasEditor    │ Panel  │
│(w:   │       (A4横サイズ)       │(w:280px)│
│200px)│                         │        │
└──────┴─────────────────────────┴────────┘
```

**状態管理:**
- `doc: Doc` — ドキュメント全体
- `currentSlideId: string` — 現在表示中のスライドID
- `selectedNodeIds: string[]` — 選択中の要素
- `zoom: number` — 初期値は `useFitToScreen` で算出

### 3.2 TopToolbar（水平ツールバー）

既存の `WysiwygEditorToolbar` のロジックを流用し、レイアウトを水平化します。

**ボタン構成:**
| グループ | ボタン |
|---------|--------|
| スライド操作 | 新規スライド追加 |
| 挿入 | テキスト, 図形(ドロップダウン), 画像, テーブル, 線 |
| 表示 | Zoom +/−, Fit to Screen |
| 再生 | スライドショー開始 |
| エクスポート | PPTX出力 |

### 3.3 SlideListPanel（左サイドバー）

**機能:**
- スライド一覧をサムネイル形式で表示
- クリックでスライド切り替え
- ドラッグ＆ドロップで並べ替え
- 右クリックメニュー: 削除、複製

**サムネイル生成方式（初期実装）:**
- `KonvaCanvasEditor` を `scale=0.15` で readOnly レンダリング
- パフォーマンス問題が発生した場合、`stage.toDataURL()` キャッシュに移行

### 3.4 PresentationMode（全画面表示）

**実装方針:**
- Fullscreen API (`document.documentElement.requestFullscreen()`)
- 黒背景の上にスライドを中央配置
- キーボード操作: `←/→` で前後移動、`Escape` で終了
- マウス操作: クリックで次へ

---

## 4. Zoom 自動調整（Fit to Screen）

### useFitToScreen Hook
```typescript
function useFitToScreen(
  containerRef: RefObject<HTMLElement>,
  slideWidth: number,  // mm
  slideHeight: number  // mm
): number {
  // コンテナサイズと A4 サイズを比較し、
  // 画面に収まる最大 zoom (%) を返す
}
```

**計算ロジック:**
1. コンテナの `clientWidth`, `clientHeight` を取得
2. スライドの pixel サイズを計算 (`mmToPx`)
3. `min(containerWidth / slideWidthPx, containerHeight / slideHeightPx)` を算出
4. マージン (例: 0.9倍) を適用して返す

---

## 5. PowerPoint エクスポート（Optional）

> **フロントエンド完結:** バックエンド不要。ブラウザ上で OOXML を生成し Blob としてダウンロード。

### 5.1 依存関係（Optional Peer Dependency）

`pptxgenjs` は **オプション依存** として設計します。

**package.json:**
```json
{
  "peerDependencies": {
    "pptxgenjs": "^4.0.0"
  },
  "peerDependenciesMeta": {
    "pptxgenjs": { "optional": true }
  }
}
```

**ライブラリサイズ:**
| 形式 | サイズ |
|------|--------|
| Minified | 363 kB |
| Gzipped | 122 kB |

### 5.2 動的インポートによるボタン制御

ホストアプリが `pptxgenjs` をインストールしている場合のみエクスポートボタンを有効化します。

```typescript
// TopToolbar.tsx
const [pptxAvailable, setPptxAvailable] = useState(false)

useEffect(() => {
  import('pptxgenjs')
    .then(() => setPptxAvailable(true))
    .catch(() => setPptxAvailable(false))
}, [])

// ボタン表示
{pptxAvailable && (
  <Button onClick={handleExport}>Export PPTX</Button>
)}
```

### 5.3 エクスポート実行時の動的インポート

```typescript
async function exportToPptx(doc: Doc) {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  // スライド生成ロジック
  pptx.writeFile({ fileName: 'presentation.pptx' })
}
```

### 5.4 初期実装スコープ
| ノードタイプ | サポート | 備考 |
|-------------|---------|------|
| TextNode | ○ | フォント、色、配置 |
| ShapeNode | ○ | 塗り、枠線 |
| ImageNode | ○ | base64/URL |
| LineNode | ○ | PPTXの折れ線コネクタにマッピング |
| TableNode | △ | 基本構造のみ |
| SignatureNode | △ | `stage.toDataURL()` で PNG 化して画像として埋め込み |


### 5.5 座標変換
- Konva: mm 単位
- pptxgenjs: インチ単位
- 変換: `mm / 25.4`

### 5.6 制約事項
- **フォント埋め込み不可:** システムフォントは PowerPoint 側で代替される
- **エフェクト再現限界:** Konva の高度なフィルタは PPT に存在しないものあり
- **大きな画像:** メモリ使用量増加・生成時間延長の可能性


---

## 6. 実装ステップ

| # | タスク | 依存 |
|---|--------|------|
| 1 | `pptxgenjs` インストール | - |
| 2 | `Surface.type` に `'slide'` 追加 | - |
| 3 | ディレクトリ構造作成 | - |
| 4 | `useFitToScreen` 実装 | - |
| 5 | `useSlideHistory` 実装 | - |
| 6 | `SlideEditor` 基本レイアウト | 4, 5 |
| 7 | `TopToolbar` 実装 | - |
| 8 | `SlideListPanel` 実装 | - |
| 9 | Canvas 統合 & PropertiesPanel 接続 | 6, 7, 8 |
| 10 | `PresentationMode` 実装 | 9 |
| 11 | PPTX エクスポート実装 | 9 |
| 12 | example への統合 | 10, 11 |

---

## 7. 検証計画

### 自動テスト
- `useFitToScreen`: 各種コンテナサイズでの計算結果
- `pptxExport`: ノード→PPTX変換の単体テスト（モック使用）

### 手動検証
1. **基本フロー:** エディタ起動 → スライド追加 → 要素配置 → スライド切り替え
2. **Fit to Screen:** ブラウザリサイズ時に再計算されるか
3. **プレゼンテーション:** 全画面表示、キー操作、終了
4. **PPTX出力:** ファイル生成 → PowerPoint/Keynote で開いて確認
