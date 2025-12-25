# テスト容易性向上のためのリファクタリング計画

カバレッジ100%を目指すにあたり、現在の「巨大なコンポーネント」「ロジックとUIの密結合」は大きな障壁となります。
特に `ReportKonvaEditor.tsx` や `CanvasElementRenderer.tsx` は、UIの描画処理と複雑なデータ操作ロジックが混在しており、このままテストを書くと「UIの変更でテストが壊れる」「全パターンの網羅が困難」といった問題が発生します。

以下に、テストを書きやすくするための具体的なリファクタリング案と分割方針をまとめます。

## 1. 優先度高：ロジックの分離 (Pure Functions化)

最もテスト効果が高く、かつ安全に行えるのは「計算・データ操作ロジックの切り出し」です。これらはUIに依存しない純粋な関数として切り出すことで、Jest等で高速かつ網羅的なユニットテストが可能になります。

### A. テーブル操作ロジック (`ReportKonvaEditor.tsx`)
現在、`handleContextMenuAction` 内に数百行にわたってテーブルの行追加・削除・結合（Merge）のロジックが記述されています。これはバグが起きやすく、かつパターンの網羅が必要な部分です。

*   **現状**: コンポーネント内のCallback関数として実装。状態(`templateDoc`)に直接依存。
*   **対策**: `src/features/report-editor/utils/tableOperations.ts` に切り出す。
*   **インターフェース案**:
    ```typescript
    // 純粋関数として定義（UIへの依存なし）
    export function insertRow(table: TableNode, rowIndex: number, where: 'above' | 'below'): TableNode { ... }
    export function mergeCells(table: TableNode, range: CellRange): TableNode { ... }
    export function deleteCol(table: TableNode, colIndex: number): TableNode { ... }
    ```
*   **テスト**: `insertRow` などの関数に対して、入力データと期待される出力データのパターンを網羅するテストを書く。Reactのレンダリングを伴わないため高速。

### B. シグネチャ（手書き署名）処理 (`ReportKonvaEditor.tsx`, `CanvasElementRenderer.tsx`)
署名のストロークデータの正規化、バウンディングボックス計算(`getStrokesBox`)、簡略化(`simplifyPoints`)などがコンポーネントに散らばっています。

*   **対策**: `src/features/report-editor/utils/signatureUtils.ts` に集約。
*   **テスト**: 座標配列を渡し、正規化された座標が返ってくるか検証する。

## 2. 巨大コンポーネントの分割 (Component Decomposition)

`CanvasElementRenderer.tsx` (約1700行) と `ReportKonvaEditor.tsx` (約1400行) は、責務が多すぎます。

### A. CanvasElementRenderer の分割
現在、`switch (element.t)` ですべての図形を描画していますが、これを図形ごとのサブコンポーネントに分けます。

*   **分割案**:
    *   `src/components/canvas/renderers/TextRenderer.tsx` (TextNode用)
    *   `src/components/canvas/renderers/ShapeRenderer.tsx` (Rect, Circle, Star等のShapeNode用)
    *   `src/components/canvas/renderers/LineRenderer.tsx` (LineNode用)
    *   `src/components/canvas/renderers/ImageRenderer.tsx`
*   **メリット**: 各レンダラーごとにpropsのテストが可能になる。「Shapeの描画テスト」でTextのロジックを気にする必要がなくなる。

### B. ReportKonvaEditor の分割
フックへの抽出とサブコンポーネント化を進めます。

*   **カスタムフックへの抽出**:
    *   `useTableContextMenu`: コンテキストメニューの表示制御、アクションハンドリング。
    *   `useSignatureDrawing`: 手書き描画の状態管理 (`isDrawing`, `currentStrokes` 等)。
*   **サブコンポーネント**:
    *   `PageBackground`: 既にありますが、ファイル分離を検討。
    *   `EditorContextMenu`: コンテキストメニュー部分を別ファイルへ。

### C. widgets.tsx の分割
`src/features/konva-editor/components/PropertyPanel/widgets.tsx` (1000行超) は複数の独立したウィジェットが含まれています。

*   **対策**: `src/features/konva-editor/components/PropertyPanel/widgets/` ディレクトリを作成し、1ファイル1ウィジェットにする（`ColorPickerWidget.tsx`, `FontWidget.tsx` 等）。
*   **メリット**: 個別のウィジェット単位でStorybook等を使った表示テストや、インタラクションのテストが容易になる。

## 3. 具体的なリファクタリング手順とテスト戦略

以下の順序で進めることで、既存機能を壊さずにテストカバレッジを向上できます。

1.  **データ操作ロジックの抽出とテスト (最優先)**
    *   まず `tableOperations.ts` を作成し、`ReportKonvaEditor.tsx` からロジックを移動。
    *   移動した関数に対して Jest で単体テストを作成 (カバレッジ100%を目指す)。
    *   **理由**: ロジック部分はバグの温床であり、UIテストよりも低コストで高品質な保証が得られるため。

2.  **UIコンポーネントの分割**
    *   `widgets.tsx` を分割。
    *   `CanvasElementRenderer` を分割。
    *   分割した小さなコンポーネントに対して、React Testing Library で「Propsを受け取って正しく描画されるか」のテストを作成。

3.  **統合テスト**
    *   最後に `ReportKonvaEditor` 全体を通して、ユーザー操作（クリック、ドラッグ）に対する振る舞いを検証するテストを作成。
    *   内部ロジックやサブコンポーネントは既にテスト済みなので、ここでは「連携」にフォーカスする。

## 4. 推奨するディレクトリ構成案

```
src/
  features/
    report-editor/
      components/
        ContextMenu/
          TableContextMenu.tsx  <-- UI
        PropertyPanel/
          ...
      hooks/
        useTableOperations.ts   <-- ロジック（フック）
        useSignature.ts
      utils/
        tableLogic.ts           <-- 純粋関数（最重要テスト対象）
        signatureLogic.ts
      ReportKonvaEditor.tsx     <-- 構成要素を組み合わせるだけにする
  components/
    canvas/
      renderers/                <-- 新設
        TextRenderer.tsx
        ShapeRenderer.tsx
        LineRenderer.tsx
        ...
      CanvasElementRenderer.tsx <-- 分岐してこれらを呼ぶだけ
```

この構成にすることで、**「テスト対象のファイルが小さく、依存が少なくなる」** ため、テストのカバレッジを上げやすくなります。

---

## 5. 追加で検討すべき視点・改善点

### A. 現状のカバレッジ分析と優先度付け

現在のカバレッジ状況（2025年12月時点）:
- 全体: Lines 64.19% (目標 70%)
- `ReportKonvaEditor.tsx`: 47.78% (Branch: 50.74%)
- `mindmap-editor`: 0% (全くテストされていない)
- `WysiwygPropertiesPanel.tsx`: 44.91%
- `WysiwygEditorToolbar.tsx`: 56.8%

**優先度の再評価**:
1. **mindmap-editor** - 0%のモジュールは放置せず、最低限のスモークテストを追加するか、除外対象として明示すべき
2. **ReportKonvaEditor.tsx** - ビジネスロジックが集中しており、バグの影響範囲が大きい
3. **PropertiesPanel/Toolbar** - ユーザーインタラクションが多く、回帰バグのリスクが高い

### B. テスト戦略の補足

#### テストピラミッドの明示
```
        /\
       /  \  E2E (5-10%)
      /----\  - 重要なユーザーフロー
     /      \ 統合テスト (20-30%)
    /--------\  - コンポーネント間連携
   /          \ ユニットテスト (60-70%)
  /------------\  - 純粋関数、hooks、utils
```

現在の計画はユニットテストに偏重しているため、以下を追加検討:
- **Visual Regression Testing**: Konvaキャンバスの描画結果は、Snapshot/Screenshot比較が有効
- **E2Eテスト**: 「テンプレート作成→保存→再読み込み」のようなクリティカルパスは別途必要

#### モック戦略の明確化
- **Konva/react-konva**: テスト時のモック方針を決める（現状 `canvas` モックは `jsdom` で対応）
- **use-image**: 画像読み込みのモックパターンを標準化
- **perfect-freehand**: 署名描画のアルゴリズムはモック vs 実行を選択

### C. テストの保守性

#### テストヘルパー/ファクトリーの導入
```typescript
// Test/helpers/factories.ts
export const createMockTableNode = (overrides?: Partial<TableNode>): TableNode => ({
  t: 'table',
  id: 'test-table-1',
  x: 0, y: 0,
  rows: 3, cols: 3,
  // ... デフォルト値
  ...overrides,
});

export const createMockTemplateDoc = (elements: DocElement[]): TemplateDoc => ({
  // ...
});
```

**メリット**: テストデータの重複削減、変更時の修正箇所を一元化

#### Given-When-Then パターンの採用
```typescript
describe('insertRow', () => {
  it('should insert a row below the specified index', () => {
    // Given
    const table = createMockTableNode({ rows: 3 });
    
    // When
    const result = insertRow(table, 1, 'below');
    
    // Then
    expect(result.rows).toBe(4);
    expect(result.cells[2].some(cell => cell.isNew)).toBe(true);
  });
});
```

### D. 非機能要件のテスト

#### パフォーマンステスト
- 大量の要素（100+）を持つテンプレートの描画性能
- テーブル操作（1000行以上）の応答時間
- メモリリーク検出（長時間編集セッション）

```typescript
describe('Performance', () => {
  it('should handle 100 elements without significant lag', () => {
    const start = performance.now();
    // 操作実行
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000); // 1秒以内
  });
});
```

#### アクセシビリティテスト
- キーボードナビゲーション
- スクリーンリーダー対応（aria-label等）
- 色コントラスト（`jest-axe` 等の導入検討）

### E. エラーハンドリングとエッジケース

現在の計画では正常系が中心。以下のテストも必要:

- **不正なJSONデータの読み込み**: スキーマバリデーション
- **ネットワークエラー**: 画像読み込み失敗時のフォールバック
- **同時編集の競合**: 複数タブでの編集（将来的な要件か確認）
- **Undo/Redo の限界**: 履歴スタックのオーバーフロー
- **境界値テスト**:
  - 空のテーブル、1x1テーブル
  - 座標がマイナス値
  - 超長文テキスト

### F. CI/CD統合

#### テスト実行の最適化
```yaml
# .github/workflows/test.yml (例)
jobs:
  test:
    steps:
      - name: Unit Tests (並列実行)
        run: pnpm test --shard=${{ matrix.shard }}
      - name: Coverage Check
        run: pnpm coverage
      - name: Upload Coverage
        uses: codecov/codecov-action@v4
```

#### カバレッジレポートの可視化
- PRへのカバレッジ差分コメント
- カバレッジバッジの追加（README.md）
- 閾値未満でCIを失敗させる（現状vitest.configで設定済み）

### G. ドキュメント・開発者体験

#### テスト実行ガイドの追加
```markdown
## テストの実行方法
- `pnpm test` - 全テスト実行
- `pnpm test:watch` - 監視モード
- `pnpm coverage` - カバレッジレポート生成
- `pnpm test -- --filter=tableOperations` - 特定ファイル

## 新しいテストの追加
1. `Test/src/` 配下に対応するパスでファイル作成
2. テストヘルパー（`Test/helpers/`）を活用
3. PRではカバレッジ低下がないことを確認
```

#### コード変更時のテスト更新ルール
- ロジック変更 → 対応するユニットテストの更新必須
- UI変更 → スナップショット更新の確認
- API変更 → 統合テストの更新

### H. リスク・懸念事項

| リスク | 影響度 | 対策 |
|--------|--------|------|
| リファクタリング中の機能回帰 | 高 | 既存機能のスモークテストを先に追加 |
| テスト作成コストがリファクタリングを遅延 | 中 | 最小限のテストから開始し、段階的に拡充 |
| Konvaの内部動作がテストを困難に | 中 | モック戦略の早期確立、E2Eテストで補完 |
| mindmap-editorの0%カバレッジ | 中 | 除外対象とするか、最低限のテスト追加を決定 |

### I. マイルストーン案

| フェーズ | 期間 | 目標 | カバレッジ目標 |
|----------|------|------|----------------|
| Phase 1 | 2週間 | 純粋関数の抽出とテスト | 70% |
| Phase 2 | 2週間 | Hooks/小コンポーネントのテスト | 80% |
| Phase 3 | 2週間 | 統合テスト・E2E導入 | 85% |
| Phase 4 | 継続 | 保守・改善 | 90%+ |

### J. 除外対象の明確化

以下は意図的にカバレッジ対象外とする:
- `src/i18n/**` - 国際化リソース
- `src/types/**` - 型定義のみ
- `src/index.ts` - バレルエクスポート
- `mindmap-editor` - (要検討: 使用頻度が低い場合は除外、コア機能なら必須)

vitest.config.tsの`exclude`設定と整合性を確認すること。

---

## 6. 次のアクション

1. [ ] `mindmap-editor`の扱いを決定（テスト追加 or 除外）
2. [ ] テストヘルパー/ファクトリーの作成（`Test/helpers/`）
3. [ ] `tableOperations.ts`の抽出と100%カバレッジ達成
4. [ ] CI/CDへのカバレッジレポート統合
5. [ ] Visual Regression Testingの導入検討（Chromatic等）
