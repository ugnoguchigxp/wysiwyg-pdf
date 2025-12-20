# Mindmap Editor - 計画書兼仕様書

本ドキュメントは、`wysiwyg-pdf` プロジェクト内に **FreeMind ライクな Mindmap Editor** を構築するための計画書兼仕様書です。

---

## 1. プロジェクト概要

### 1.1 目標
FreeMind の操作感を忠実に再現した、高速でキーボード中心の Mindmap Editor を作成する。

### 1.2 主要コンセプト
- **思考の速度**: マウスを使わずに、キーボードだけでブランチを作成・編集できる
- **ブランチの展開/折りたたみ (Folding)**: 子ノードを非表示にして全体像を把握しやすくする
- **自動レイアウト**: ノードは階層に基づいて自動配置される（ドラッグ配置は将来拡張）

### 1.3 技術スタック (既存リソースの活用)
| リソース | 活用方法 |
| :--- | :--- |
| `react-konva` / `konva` | Mindmap のキャンバス描画 (ノード、接続線) |
| `src/types/canvas.ts` の `Doc`, `WidgetNode`, `Link` | **Mindmap を `Doc` 形式で永続化**。ノードは `WidgetNode (widget: 'mindNode')` として格納 |
| `src/components/ui/*` | ツールバー、ダイアログ等の UI プリミティブ |
| `src/utils/*` | ユーティリティ関数 |
| `src/i18n/I18nContext` | 多言語対応 |
| Tailwind CSS + shadcn 変数 | スタイリング |

---

## 2. 機能仕様

### 2.1 コア機能 (FreeMind 準拠)

| 機能カテゴリ | 詳細 |
| :--- | :--- |
| **ルートノード** | マップの中心となるノード。常に1つ存在 |
| **子ノード追加** | 選択中のノードに子ノードを追加 |
| **兄弟ノード追加** | 選択中のノードと同じ階層にノードを追加 |
| **ノード削除** | ノードとその子孫を削除 |
| **テキスト編集** | ノードテキストのインライン編集 |
| **ノード移動** | ドラッグで別の親に移動 (Phase 2 以降) |
| **折りたたみ** | 子ノードの表示/非表示を切り替え |
| **Undo/Redo** | 操作の取り消し/やり直し |
| **ズーム/パン** | キャンバスの拡大縮小・スクロール |

### 2.2 キーボードショートカット (FreeMind 完全準拠)

FreeMind の公式ショートカットをベースに実装します。

#### ノード操作
| アクション | キー | 備考 |
| :--- | :--- | :--- |
| **兄弟ノード追加 (下)** | `Enter` | 選択ノードの下に兄弟を追加 |
| **兄弟ノード追加 (上)** | `Shift + Enter` | 選択ノードの上に兄弟を追加 |
| **子ノード追加** | `Insert` または `Tab` | 右側の子として追加 |
| **親ノード追加** | `Shift + Insert` | 選択ノードを包含する親を作成 |
| **ノード削除** | `Delete` / `Backspace` | 選択ノードと子孫を削除 |
| **テキスト編集** | `F2` | インライン編集開始 |
| **長文テキスト編集** | `Alt + Enter` | モーダルダイアログで編集 |

#### ナビゲーション
| アクション | キー | 備考 |
| :--- | :--- | :--- |
| **ルートへ移動** | `Escape` | |
| **上/下/左/右移動** | `Arrow Keys` | 兄弟間・親子間移動 |
| **ノード位置入れ替え (上)** | `Ctrl + Up` | |
| **ノード位置入れ替え (下)** | `Ctrl + Down` | |

#### 折りたたみ (Folding)
| アクション | キー | 備考 |
| :--- | :--- | :--- |
| **折りたたみ切り替え** | `Space` | 子ノードの表示/非表示 |
| **子を全て折りたたむ** | `Ctrl + Space` | |
| **全て展開** | `Alt + End` | |
| **全て折りたたむ** | `Alt + Home` | |

#### ズーム
| アクション | キー | 備考 |
| :--- | :--- | :--- |
| **ズームイン** | `Alt + Down` または `Ctrl + +` | |
| **ズームアウト** | `Alt + Up` または `Ctrl + -` | |

#### その他
| アクション | キー | 備考 |
| :--- | :--- | :--- |
| **Undo** | `Ctrl + Z` | |
| **Redo** | `Ctrl + Y` または `Ctrl + Shift + Z` | |
| **検索** | `Ctrl + F` | |
| **次を検索** | `Ctrl + G` (または `F3`) | |

### 2.3 ビジュアルスタイル

- **ノードの形状**: 角丸長方形 (デフォルト)、下線のみ (FreeMind 風)
- **接続線**: Bezier 曲線 (親の端から子の中心へ)
- **階層別カラー**: 深度に応じて自動的に色を変更
- **折りたたみインジケーター**: ノード横に `+/-` 円形アイコン
- **選択状態**: ハイライト枠 + 青系背景

---

## 3. データ構造

### 3.1 永続化形式 (wysiwyg-pdf の `Doc` 形式を活用)

既存の `Doc` 型を拡張して Mindmap を表現します。

```typescript
// types/canvas.ts の WidgetNode を活用
interface MindmapWidgetData {
  text: string;
  isCollapsed: boolean;
  direction?: 'left' | 'right'; // Level 1 ノードのみ
  style?: {
    shape?: 'rectangle' | 'rounded' | 'underline';
    color?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
  };
}

// WidgetNode として格納
const mindmapNode: WidgetNode = {
  id: 'node-1',
  t: 'widget',
  s: 'canvas-1', // Surface ID
  x: 100,
  y: 200,
  w: 120,
  h: 40,
  widget: 'mindNode',
  data: {
    text: 'Central Idea',
    isCollapsed: false,
  } as MindmapWidgetData,
};

// 親子関係は Link で表現
const parentChildLink: Link = {
  id: 'link-1',
  s: 'canvas-1',
  from: 'root-node',
  to: 'child-node',
  routing: 'bezier',
  stroke: '#666666',
  strokeW: 2,
};
```

### 3.2 ランタイム専用データ (View State)

レイアウト計算やレンダリング時にのみ使用される一時データ。
永続化には含まれません。

```typescript
interface ComputedMindmapNode {
  // 永続化データからの参照
  nodeId: string;
  
  // 計算済みジオメトリ
  x: number;
  y: number;
  width: number;
  height: number;
  
  // ツリー構造情報
  depth: number;
  parentId: string | null;
  childIds: string[];
  
  // 表示状態
  isVisible: boolean; // 親が折りたたまれていれば false
}
```

### 3.3 Mindmap Document の構造

```typescript
// 完全な Mindmap Doc の例
const mindmapDoc: Doc = {
  v: 1,
  id: 'mindmap-doc-1',
  title: 'My Mindmap',
  unit: 'mm',
  surfaces: [
    {
      id: 'canvas-1',
      type: 'canvas', // 無限キャンバス
      w: 10000,       // 仮想的なサイズ
      h: 10000,
      bg: '#ffffff',
    },
  ],
  nodes: [
    // WidgetNode (mindNode) の配列
  ],
  links: [
    // 親子関係を表す Link の配列
  ],
};
```

---

## 4. アーキテクチャ

### 4.1 ディレクトリ構造

```
src/features/mindmap-editor/
├── MindmapEditor.tsx          # メインエディタコンポーネント
├── MindmapCanvas.tsx          # Konva Stage/Layer
├── components/
│   ├── MindmapNode.tsx        # ノードの描画 (Konva Group)
│   ├── MindmapConnection.tsx  # 接続線の描画
│   ├── FoldIndicator.tsx      # +/- ボタン
│   └── TextEditOverlay.tsx    # テキスト編集用 HTML オーバーレイ
├── hooks/
│   ├── useMindmapState.ts     # 状態管理 (ノード追加/削除/編集)
│   ├── useMindmapKeyboard.ts  # キーボードショートカット
│   ├── useMindmapLayout.ts    # レイアウト計算
│   └── useMindmapNavigation.ts# カーソル移動ロジック
├── utils/
│   ├── layoutEngine.ts        # 自動レイアウト計算アルゴリズム
│   ├── treeUtils.ts           # ツリー操作ヘルパー
│   └── docConverter.ts        # Doc ⇔ Runtime 変換
├── types.ts                   # Mindmap 固有型定義
└── index.ts                   # Public exports
```

### 4.2 レイアウトエンジン

FreeMind のレイアウトを再現するアルゴリズム：

1. **ルートノード**: キャンバス中央に配置
2. **Level 1 ノード**: ルートから左右に分岐
   - 最初のノードは右、次は左と交互に配置 (または明示的に `direction` 指定)
3. **Level 2 以降**: 親ノードから外側に伸びる
   - 右側ブランチ: 子は上から下に縦並び
   - 左側ブランチ: 同様に縦並び
4. **サブツリー高さ計算**: 
   - 各ノードのサブツリー高さを再帰的に計算
   - 兄弟間に適切なスペースを確保
   - 折りたたみ状態のノードは高さを 0 として計算

```typescript
interface LayoutConfig {
  horizontalSpacing: number;   // 親子間の水平距離
  verticalSpacing: number;     // 兄弟間の垂直距離
  nodeWidth: number;           // ノードの基本幅 (テキストで伸縮)
  nodeHeight: number;          // ノードの基本高さ
}
```

---

## 5. 実装フェーズ

### Phase 0: コアキャンバス機能の拡張 (完了)
- [x] Text オブジェクトの拡張: 枠線 (Border Box) と背景色のサポート
- [x] Connector 機能の改善:
    - [x] オブジェクト移動時のコネクタ追従
    - [x] 中間点 (Waypoint) の追加とドラッグ操作
    - [x] 90度スナップ (Shiftキー)

### Phase 1: 基盤とデータ構造 (2-3 days)
- [x] 型定義 (`src/features/mindmap-editor/types.ts`) - 部分完了
- [ ] `Doc` ⇔ Runtime 変換ユーティリティ (`docConverter.ts`)
- [ ] ツリー操作ヘルパー (`treeUtils.ts`)
- [ ] 基本レイアウトエンジン (`layoutEngine.ts`)
- [ ] `useMindmapState` フック (CRUD 操作)

### Phase 2: 基本レンダリング (2-3 days)
- [ ] `MindmapCanvas` (Konva Stage + Layer)
- [ ] `MindmapNode` コンポーネント (ノード描画)
- [ ] `MindmapConnection` コンポーネント (Bezier 曲線)
- [ ] 基本的な選択機能 (クリック)

### Phase 3: キーボード操作 (2 days)
- [ ] `useMindmapKeyboard` フック
- [ ] ノードナビゲーション (Arrow keys)
- [ ] ノード追加/削除 (Enter, Insert, Delete)
- [ ] テキスト編集 (F2)

### Phase 4: 折りたたみ機能 (1-2 days)
- [ ] 折りたたみ状態管理
- [ ] `FoldIndicator` コンポーネント
- [ ] レイアウトエンジンへの折りたたみ反映
- [ ] キーボードショートカット (Space)

### Phase 5: Undo/Redo & 永続化 (1 day)
- [ ] 既存の `useEditorHistory` を活用
- [ ] `Doc` 形式での保存/読み込み

### Phase 6: 仕上げ (2 days)
- [ ] ズーム/パンのスムーズ化
- [ ] 階層カラーリング
- [ ] 検索機能
- [ ] `src/index.ts` への Export 追加

---

## 6. テスト計画

### 6.1 ユニットテスト
- `layoutEngine.ts`: 様々なツリー構造でのレイアウト計算
- `treeUtils.ts`: ノードの追加、削除、移動
- `docConverter.ts`: 変換の双方向性

### 6.2 インテグレーションテスト
- キーボードショートカットの動作確認
- Undo/Redo の整合性

### 6.3 手動テスト
- FreeMind と並べて操作感を比較
- パフォーマンス (100+ ノード)

---

## 7. 将来の拡張候補 (スコープ外)

- ドラッグによるノードの手動配置
- ノードへのハイパーリンク追加
- ノードへのアイコン追加
- 多人数リアルタイム編集
- エクスポート (PNG, SVG, PDF)
- クラウド (ノードを視覚的にグループ化)

---

## 8. 参照資料

- [FreeMind Official](http://freemind.sourceforge.net/)
- [FreeMind Keyboard Shortcuts](https://shortcutworld.com/FreeMind/win/FreeMind-Mind-Mapping-Software_Shortcuts)
- [wysiwyg-pdf Doc Schema](./src/types/canvas.ts)

---

## 9. 承認チェックリスト

- [ ] 機能仕様の承認
- [ ] キーボードショートカットの承認
- [ ] データ構造の承認
- [ ] 実装フェーズの承認

**承認後、Phase 1 から実装を開始します。**
