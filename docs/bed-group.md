# ベッドグループ機能 実装計画書（レビュー反映版）

## 1. 背景と目的

透析現場では 1 つの部屋に多数のベッドが並ぶため、部屋単位だけでは担当エリアの視認性と運用性が不足します。  
本機能では、複数ベッドを「ベッドグループ」として管理し、割り当てと可視化を同時に実現します。

## 2. スコープ

### 2.1 対象（In Scope）

1. 部屋（= ドキュメント）単位でのベッドグループ CRUD。
2. ベッドごとの所属グループ設定。
3. キャンバス上でのグループ視覚化（色バッジ）と同グループ強調表示。

### 2.2 対象外（Out of Scope）

1. 医師・看護師マスタとの連携。
2. グループのアクセス権管理。
3. 印刷帳票へのグループ凡例出力。

## 3. 要件定義

### 3.1 機能要件

### グループ管理 (CRUD)
- **場所**: 上部ツールバーの専用ボタンからモーダルを起動。
- **機能**:
    - グループの追加: ランダムなカラーとデフォルト名（「新規グループ」）で作成。
    - グループの編集: 名前と色のリアルタイム編集。
    - **グループの削除制限**: 対象グループに1つでもベッドが登録されている場合、削除を不可とする（バリデーション）。
    - **所属ベッドの管理**: モーダル内で、各グループに属しているベッドの一覧を確認でき、そこから個別にグループ所属を解除できる。
- **ID管理**: 各グループは不変のUUIDを持ち、名前を変更しても所属ベッドとの紐付けは維持される。

### ベッドへの所属設定
- **場所**: 各ベッドを選択した際のプロパティパネル。
- **機能**: 「所属グループ」プルダウンから作成済みのグループを選択、または「なし」に設定。

1. グループは `id`（不変）・`name`（変更可）・`color`（表示色）を持つ。
2. ベッドは `data.groupId?: string` でグループに所属できる。
3. グループ名変更時、既存ベッドの紐付けは維持される。
4. グループ削除時、その `groupId` を参照している全ベッドの所属を解除する。
5. ベッド選択時、同一 `groupId` のベッドをハイライトする。

### 3.2 データ整合性要件

1. `id` はドキュメント内で一意。
2. `name` は空文字不可（前後空白トリム後に判定）。
3. `color` は `#RRGGBB` 形式。
4. `groupId` は「未所属」または既存グループ `id` のみ許可。
5. 既存データ（`data` 未定義の旧Doc）を後方互換で読み込めること。

## 4. データモデル設計

### 4.1 ドキュメントレベル（グループ定義）

`Doc` に拡張領域 `data?: Record<string, unknown>` を追加し、`data.bedGroups` に保存します。  
`Doc` のランタイム検証も更新対象です（`src/types/doc.schema.ts`）。

```typescript
import { z } from 'zod'

export const bedGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

export const bedGroupListSchema = z.array(bedGroupSchema)
export type BedGroup = z.infer<typeof bedGroupSchema>
```

保存イメージ:

```json
{
  "data": {
    "bedGroups": [
      { "id": "group-1b9c", "name": "Aグループ", "color": "#ef4444" },
      { "id": "group-7d2f", "name": "Bグループ", "color": "#3b82f6" }
    ]
  }
}
```

ID生成は既存ユーティリティ `generateUUID()`（`src/utils/browser.ts`）の利用を推奨します。

### 4.2 ノードレベル（ベッド所属）

`WidgetNode`（`widget: 'bed'`）の `data.groupId?: string` を使用します。  
この方式により、表示名変更と所属関係を分離できます。

### 4.3 更新対象ファイル

1. `src/types/canvas.ts`（`Doc` 型拡張）
2. `src/types/doc.schema.ts`（`DocSchema` に `data` 追加）
3. `src/types/doc.schema.test.ts`（後方互換・妥当性テスト追加）

## 5. UI/UX 設計

### 5.1 グループ管理UI（ドキュメント編集）

配置: `src/features/bed-layout-editor/components/PropertyPanel/PropertyPanel.tsx` の選択なし画面。  
機能:

1. 追加: 初期値 `{ id, name: '新規グループ', color }` で作成。
2. 一覧: 色チップ + 名前入力 + 削除ボタン。
3. 削除: 確認ダイアログ表示後、関連ベッドの所属を一括解除。

### 5.2 ベッド所属UI（ノード編集）

配置: ベッド選択時の `UnifiedPropertyPanel` 内にカスタムウィジェットを追加。  
補足: 既存 `select` ウィジェットは静的選択肢前提のため、`custom` レンダラーで動的グループ一覧を描画する。

1. 選択肢: `未所属` + グループ一覧。
2. 変更時: 対象ベッドの `data.groupId` を更新。
3. 参照先が消えた `groupId` は UI 上で `未所属` 扱いにフォールバック。

### 5.3 キャンバス描画

対象:

1. `src/features/bed-layout-editor/BedLayoutEditor.tsx`
2. `src/features/konva-editor/renderers/bed-elements/BedElement.tsx`

仕様:

1. `BedLayoutEditor` 側で `bedGroups` を `Map<id, color>` 化して `BedElement` に渡す。
2. `BedElement` はステータス枠線色と競合しないよう、右上色バッジでグループ色を表示する。
3. 選択中ベッドと同一グループのみ `isSameGroupSelected` を `true` にしてグロー表示。

## 6. 実装ステップ

### フェーズ 1: 型とスキーマ

1. `Doc` 型に `data?: Record<string, unknown>` を追加。
2. `bedGroupSchema` を追加し、読み書き時は safe parse で防御。
3. `DocSchema` に `data` を追加し既存Docとの互換を確認。

### フェーズ 2: グループCRUD

1. PropertyPanel（選択なし）に「ベッドグループ」セクションを追加。
2. `onDocumentChange` で `data.bedGroups` を更新。
3. 削除時に `document.nodes` を走査し、該当 `groupId` を除去。

### フェーズ 3: ベッド所属UI

1. `WIDGET_BED_OBJECT_CONFIG` に `custom` セクションを追加（例: `renderKey: 'bedGroupSelect'`）。
2. `PropertyPanel` の `customRenderers` で `bedGroupSelect` を実装。
3. `onChange(node.id, { data: { ...node.data, groupId } })` で反映。

### フェーズ 4: 描画とハイライト

1. `BedLayoutEditor` で選択ベッドの `groupId` を算出。
2. `BedElement` に `groupColor?: string` / `isSameGroupSelected?: boolean` を追加。
3. バッジ表示とグロー表示を実装（未所属は表示なし）。

### フェーズ 5: テスト

1. `src/types/doc.schema.test.ts`: `data.bedGroups` の検証、旧Doc読み込み。
2. `src/features/konva-editor/bedLayout/PropertyPanel.test.tsx`: CRUDと所属変更。
3. `src/features/konva-editor/renderers/bed-elements/BedElement.test.tsx`: 色バッジとハイライト描画。
4. `src/features/konva-editor/bedLayout/BedLayoutEditor.test.tsx`: Props受け渡しと同グループ判定。

## 7. 受け入れ基準

1. グループ作成・編集・削除が可能で、保存/再読込後も保持される。
2. ベッドに所属設定でき、グループ名変更後も所属が維持される。
3. グループ削除時に孤立参照（存在しない `groupId`）が残らない。
4. 選択時に同一グループだけがハイライトされる。
5. 既存レイアウト（`data` 未定義）を壊さず読み込める。
