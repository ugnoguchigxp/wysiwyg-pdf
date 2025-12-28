# Slide Master Feature Proposal

## 概要

スライド全体に共通するデザイン（背景、ロゴ、ヘッダー/フッターなど）を一括管理する「スライドマスター」機能を実装します。
マスター編集モードで配置されたオブジェクトは、通常のスライド編集時には「背景」として機能し、選択・編集できなくなります。

---

## データ構造

### 設計方針

**マスターは通常のスライド（Surface）として扱います。**
マスターとスライドの区別は `masterId` の有無で判定します。

```typescript
export interface Surface {
  id: string
  type: 'page' | 'canvas' | 'slide'  // 変更なし
  w: number
  h: number
  bg?: string      // Color hex または image URL（data:image/...） ※既存フィールド
  masterId?: string  // 参照するマスターID（新規追加）
}
```

### マスターとスライドの区別

| 種類 | 条件 | 説明 |
|------|------|------|
| **マスター** | `masterId === undefined` | 他のスライドの背景として使用される |
| **スライド** | `masterId !== undefined` | マスターを参照して背景を表示 |

### Blank マスター

*   新規スライド作成時、デフォルトで `masterId: 'blank'` を設定。
*   `'blank'` マスターはノードを持たない組み込みマスター（または実際に空の Surface）。
*   ユーザーが別のマスターを選択した場合、`masterId` を更新。

### 構造例

```typescript
const doc: Doc = {
  surfaces: [
    // マスター（masterId なし）
    { id: 'blank', type: 'slide', w: 297, h: 210, bg: '#ffffff' },
    { id: 'master-dark', type: 'slide', w: 297, h: 210, bg: '#1e293b' },
    
    // スライド（masterId あり）
    { id: 'slide-1', type: 'slide', w: 297, h: 210, masterId: 'master-dark' },
    { id: 'slide-2', type: 'slide', w: 297, h: 210, masterId: 'master-dark' },
    { id: 'slide-3', type: 'slide', w: 297, h: 210, masterId: 'blank' },  // Blank マスター
  ],
  nodes: [
    // master-dark のノード
    { id: 'logo-1', t: 'image', s: 'master-dark', ... },
    { id: 'page-num', t: 'text', s: 'master-dark', dynamicContent: 'slide-number', ... },
    
    // スライドのノード
    { id: 'title-1', t: 'text', s: 'slide-1', ... },
    { id: 'title-2', t: 'text', s: 'slide-2', ... },
  ]
}
```

---

## Z-Index (描画順序) の管理

### 描画レイヤー構造

```
[最背面]
  1. マスター背景色 (masterSurface.bg)
  2. マスターノード (n.s === masterId) — Z-index: 1〜99
  3. スライドノード (n.s === currentSlideId) — Z-index: 100〜
[最前面]
```

### 編集時の制約

| モード | 編集対象 | マスターノード | Z-index |
|--------|----------|----------------|---------|
| **マスター編集** | マスターのノード | 編集可能 | 1〜99 |
| **スライド編集** | スライドのノード | ロック（操作不可） | 100〜 |

---

## UI / UX

### 1. マスター編集モード

*   ツールバーに「マスターを編集」ボタンを追加。
*   クリックすると `currentSlideId` をマスターIDに切り替え。

### 2. マスター編集中の挙動

*   **左パネル:** スライド一覧の代わりに **マスター（レイアウト）一覧** を表示。
    *   マスターの選択・切り替えが可能。
    *   マスターの追加・削除（レイアウトの作成）が可能。
*   **メインキャンバス:** 選択されたマスターを編集。
*   「終了」ボタンで通常編集モードに戻る。

### 3. スライド一覧のサムネイル

**サムネイルにもマスターを含めて描画します。**

*   各スライドのサムネイルは、マスター背景 + マスターノード + スライドノードを合成して生成。
*   これにより、スライド一覧でも完成形のプレビューが確認できる。

### 4. ページオブジェクト（スライド番号）

*   `TextNode.dynamicContent: 'slide-number'` で定義。
*   マスター編集時: `#` を表示。
*   スライド表示時: ページ番号（`1`, `2`, ...）に置換。

### 5. 背景画像機能

レポートエディタと同様に、`WysiwygPropertiesPanel` の背景設定を使用します。

*   `Surface.bg` は Color hex または Image URL (data:image/...) をサポート。
*   **プロパティパネル:**
    *   背景色選択（Color picker）
    *   背景画像URL入力 または Browseボタンでファイル選択
*   **Canvas描画:** 
    *   `surface.bg` が `#` で始まる → 単色背景
    *   `surface.bg` が `http://` または `data:` で始まる → 背景画像
*   **既存実装:** `ReportKonvaEditor` の背景描画ロジックを `KonvaCanvasEditor` でも統一

---

## 実装ステップ

1.  **データモデル:** `Surface` に `masterId?: string` を追加。
2.  **マスター判定ロジック:**
    ```typescript
    const masters = doc.surfaces.filter(s => s.masterId === undefined)
    const slides = doc.surfaces.filter(s => s.masterId !== undefined)
    ```
3.  **レンダリング（共通関数）:**
    ```typescript
    function getElementsForSlide(doc: Doc, slideId: string): UnifiedNode[] {
      const slide = doc.surfaces.find(s => s.id === slideId)
      const masterSurface = slide?.masterId
        ? doc.surfaces.find(s => s.id === slide.masterId)
        : null
      
      const masterNodes = masterSurface 
        ? doc.nodes.filter(n => n.s === masterSurface.id)
        : []
      const slideNodes = doc.nodes.filter(n => n.s === slideId)
      
      return [...masterNodes, ...slideNodes]
    }
    ```
4.  **サムネイル生成:** `getElementsForSlide()` を使用。
5.  **UI:** 「マスター編集」トグルボタン。
6.  **Z-Index制御:** 並び替え時の境界制限。

---

## 実装詳細

### ロックノードの判定

```typescript
const elementsWithLock = elements.map(node => ({
  ...node,
  locked: masterNodes.some(mn => mn.id === node.id)
}))
```

### 動的コンテンツ（ページ番号）

```typescript
// スライド（masterIdあり）のみをカウント
const slides = doc.surfaces.filter(s => s.masterId !== undefined)
const slideIndex = slides.findIndex(s => s.id === currentSlideId)

const processedMasterNodes = masterNodes.map(node => {
  if (node.t === 'text' && node.dynamicContent === 'slide-number') {
    return { ...node, text: String(slideIndex + 1) }
  }
  return node
})
```

---

## テンプレート機能

### 設計方針

**テンプレートはマスター専用です。** スライドには適用しません。

### テンプレートの定義

```typescript
interface MasterTemplate {
  id: string
  name: string
  bg: string
  nodes: UnifiedNode[]  // s は適用時に書き換え
}
```

### テンプレート適用

```typescript
function applyMasterTemplate(doc: Doc, template: MasterTemplate): Doc {
  // マスターを検索（masterId === undefined）
  const masterSurface = doc.surfaces.find(s => s.masterId === undefined && s.id !== 'blank')
  if (!masterSurface) return doc
  
  const masterId = masterSurface.id
  
  // 既存マスターノードを削除
  const nodesWithoutMaster = doc.nodes.filter(n => n.s !== masterId)
  
  // テンプレートノードをインポート
  const newMasterNodes = template.nodes.map(node => ({
    ...node,
    id: `${node.t}-${crypto.randomUUID()}`,
    s: masterId,
  }))
  
  // マスターの背景色を更新
  const updatedSurfaces = doc.surfaces.map(s =>
    s.id === masterId ? { ...s, bg: template.bg } : s
  )
  
  return {
    ...doc,
    surfaces: updatedSurfaces,
    nodes: [...nodesWithoutMaster, ...newMasterNodes],
  }
}
```

### サンプルテンプレート

| テンプレート名 | 内容 |
|----------------|------|
| **Default** | 白背景、ノードなし |
| **Corporate Dark** | 濃紺背景 + アクセントライン + ページ番号 |

---

## 補足

*   初期段階では「全スライド共通のシングルマスター」として実装。
*   将来的には複数マスター対応も可能（各スライドが異なる `masterId` を持てる）。
