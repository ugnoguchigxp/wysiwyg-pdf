# Mindmap Editor - 計画書兼仕様書

本ドキュメントは、`wysiwyg-pdf` プロジェクト内に **FreeMind ライクな Mindmap Editor** を構築するための計画書兼仕様書です。

---

## 1. プロジェクト概要

### 1.1 目標
FreeMind の操作感を忠実に再現した、高速でキーボード中心の Mindmap Editor を作成する。

### 1.2 主要コンセプト
- **思考の速度**: マウスを使わずに、キーボードだけでブランチを作成・編集できる
- **ブランチの展開/折りたたみ (Folding)**: 子ノードを非表示にして全体像を把握しやすくする
- **自動レイアウト**: ノードは階層に基づいて自動配置される

### 1.3 技術スタック (既存リソースの活用)
| リソース | 活用方法 |
| :--- | :--- |
| `react-konva` / `konva` | Mindmap のキャンバス描画 |
| `src/types/canvas.ts` (`Doc`) | **標準の `TextNode` と `LineNode` を使用**して Mindmap を永続化 |
| `CanvasElementRenderer` | 既存のレンダリングロジック (テキストのボックス表示、コネクタ接続) を最大限再利用 |
| `src/components/ui/*` | ツールバー、ダイアログ等の UI プリミティブ |

---

## 2. 機能仕様

### 2.1 コア機能 (FreeMind 準拠)

| 機能カテゴリ | 詳細 |
| :--- | :--- |
| **ルートノード** | マップの中心。タグ等でルートとして識別 |
| **ノード表現** | `TextNode` の Border/Background 機能を使用。角丸、パディング対応 |
| **接続線** | `LineNode` の `startConn`/`endConn` を使用してノード間を固定接続 |
| **操作制限** | Mindmap モードでは線の取り外し (Detach) を禁止。ノードのドラッグによる親子関係の付け替え (Re-parenting) は許可 |

### 2.2 キーボードショートカット (FreeMind 準拠)
(変更なし)

---

## 3. データ構造

### 3.1 永続化形式

独自 Widget は使用せず、標準の `TextNode` と `LineNode` で構成します。

#### ノード (`TextNode`)
`widget: 'mindNode'` は廃止し、標準プロパティを使用します。

```typescript
const node: TextNode = {
  id: 'node-1',
  t: 'text',
  x: 100, y: 200, w: 120, h: 40,
  text: 'Central Idea',
  align: 'c',
  // Box Style (CanvasElementRenderer でサポート確認済み)
  backgroundColor: '#e0f2fe',
  borderColor: '#3b82f6',
  borderWidth: 2,
  padding: 10,
  // Mindmap 固有状態の識別には tags または id map を使用
  tags: ['mindmap:node'], 
};
```

#### 接続 (`LineNode`)
親子関係は `startConn` (親) -> `endConn` (子) で定義します。
`CanvasElementRenderer` がレンダリング時に座標を自動解決するため、`pts` の厳密な維持は不要です。

```typescript
const link: LineNode = {
  id: 'link-1',
  t: 'line',
  pts: [0, 0, 0, 0], // レンダリング時に自動解決
  startConn: { nodeId: 'parent-id', anchor: 'r' }, // 親の右
  endConn: { nodeId: 'child-id', anchor: 'l' },   // 子の左
  routing: 'bezier', // または straight
  stroke: '#64748b',
};
```

### 3.2 ランタイム状態 (Store/Hooks)

永続化データ (`Doc`) から、操作用の軽量なツリー構造をオンメモリで構築します。

```typescript
interface MindmapGraph {
  rootId: string;
  parentIdMap: Map<string, string>;   // childId -> parentId
  childrenMap: Map<string, string[]>; // parentId -> childIds[]
  collapsedNodes: Set<string>;        // 折りたたまれたノードID
}
```

---

## 4. アーキテクチャ

### 4.1 ディレクトリ構造 (更新)

```
src/features/mindmap-editor/
├── MindmapEditor.tsx          # エントリポイント
├── MindmapCanvas.tsx          # Konva Stage (CanvasElementRenderer を利用)
├── hooks/
│   ├── useMindmapGraph.ts     # Doc から graph を構築
│   ├── useMindmapOperations.ts # ノード追加/削除/移動の高レベルロジック
│   ├── useMindmapLayout.ts    # 自動レイアウト計算 (ノード座標の更新)
│   └── useMindmapInteraction.ts # ドラッグ&ドロップ、キーボード
├── utils/
│   ├── layoutEngine.ts        # ツリー配置アルゴリズム
│   └── treeUtils.ts           # グラフ走査ヘルパー
└── index.ts
```

### 4.2 レイアウトと接続の仕組み

1. **接続維持**: 
   `LineNode` の `startConn`/`endConn` プロパティにより、ノード (`TextNode`) が移動すると、`CanvasElementRenderer` が自動的に線の端点を追従させます。特別な「コネクタ追従ロジック」を新規実装する必要はありません。

2. **自動レイアウト**:
   `layoutEngine` が論理ツリー構造に基づき、各 `TextNode` の理想的な `x, y` を計算し、update します。線は自動追従します。

3. **線の固定 (Detach禁止)**:
   Mindmap Editor 上では、`LineNode` を選択不可にするか、ハンドル操作を無効化することで、ユーザーが意図せず線を外すのを防ぎます。

4. **Re-parenting (親子付け替え)**:
   ノード A をドラッグして ノード B の近傍 (または上) でドロップした場合：
   - A に接続されている既存の親からの `LineNode` を削除
   - B から A への新しい `LineNode` を作成
   - レイアウト再計算

---

## 5. 実装フェーズ (改定)

### Phase 1: グラフ構築と基本表示 (2 days)
- [ ] `useMindmapGraph`: `Doc.nodes` (Text/Line) からツリー構造を解析
- [ ] `MindmapCanvas`: `TextNode` (Box付き) と `LineNode` (Conn付き) を表示
- [ ] 初期の自動レイアウト適用

### Phase 2: 操作ロジック (2-3 days)
- [ ] キーボード操作 (Enter, Tab, Delete) による `TextNode`/`LineNode` の生成・削除
- [ ] テキスト編集 (既存の仕組みを利用)
- [ ] **Re-parenting**: ドラッグ&ドロップによる親の付け替え実装

### Phase 3: 折りたたみと洗練 (2 days)
- [ ] `collapsedNodes` 状態管理
- [ ] 折りたたみ時に子孫ノードの `hidden` プロパティを一括制御
- [ ] Fold Indicator (+/- ボタン) の表示 (Overseer または装飾用の別ノード ?)

### Phase 4: 仕上げ (1-2 days)
- [ ] ズーム/パン
- [ ] テーマ/スタイル調整

---

## 6. 承認チェックリスト

- [x] データ構造 (TextNode + LineNode) の採用
- [ ] Re-parenting UI の挙動確認
- [ ] 実装開始許可
