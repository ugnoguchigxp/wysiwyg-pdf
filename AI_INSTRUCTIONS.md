
# 統一ドキュメントJSON（現行仕様: `Doc` v1）

このリポジトリのエディタ（Report / BedLayout）は、**保存・受け渡しの基本フォーマットとして `Doc`（`src/types/canvas.ts`）を使用**します。

重要:

- **保存（配布）対象**: `Doc`（`v, id, title, unit, surfaces, nodes, links?, binding?, animation?, snap?`）
- **編集UI専用状態（selection / history 等）**は保存JSONに含めません（アプリ側の状態として保持）
- `BedLayoutDocument` / `FormDocument` は型定義上 `Legacy / Adapter Types` であり、内部状態や互換用途として残っています。**保存フォーマットは `Doc` に寄せてください**。

---

## 1) ルート（`Doc`）

```json
{
  "v": 1,
  "id": "doc_001",
  "title": "Sample",
  "unit": "mm",
  "surfaces": [
    { "id": "page-1", "type": "page", "w": 210, "h": 297, "margin": { "t": 10, "r": 10, "b": 10, "l": 10 } },
    { "id": "layout", "type": "canvas", "w": 600, "h": 800 }
  ],
  "nodes": [],
  "links": [],
  "binding": { "sampleData": {} },
  "snap": { "grid": 10, "guides": true }
}
```

`surfaces` は描画面です。

- 帳票は `type: "page"` を使い、ページサイズ（mm推奨）を `w/h` に持ちます。
- BedLayout のようなレイアウトは `type: "canvas"` を使い、レイアウト領域サイズを `w/h` に持ちます。

---

## 2) ノード（`UnifiedNode`）

全ての描画要素は `nodes[]` に入ります。Z順は **配列の並び順**（先=奥、後=手前）です。

共通フィールド:

- `id`: 一意ID
- `t`: 種別（`text | shape | line | image | group | table | signature | widget`）
- `s`: 配置先 surface id（例: 帳票なら `"page-1"`、bed layout なら `"layout"`）
- `x,y,w,h,r,opacity,locked,hidden,name,bind` など（型により必須/任意が異なる）

### 2.1 TextNode 例

```json
{
  "id": "text-1",
  "t": "text",
  "s": "page-1",
  "x": 20,
  "y": 18,
  "w": 120,
  "h": 8,
  "r": 0,
  "text": "請求書",
  "font": "Meiryo",
  "fontSize": 12,
  "fontWeight": 700,
  "fill": "#111111",
  "align": "l"
}
```

### 2.2 ShapeNode 例

```json
{
  "id": "shape-1",
  "t": "shape",
  "s": "layout",
  "x": 100,
  "y": 120,
  "w": 200,
  "h": 100,
  "shape": "rect",
  "fill": "#ffffff",
  "stroke": "#222222",
  "strokeW": 1
}
```

### 2.3 LineNode 例（`pts` は絶対座標）

```json
{
  "id": "line-1",
  "t": "line",
  "s": "layout",
  "pts": [100, 100, 300, 100],
  "stroke": "#000000",
  "strokeW": 2,
  "arrows": ["none", "none"]
}
```

### 2.4 WidgetNode 例（Bed要素）

```json
{
  "id": "bed-1",
  "t": "widget",
  "widget": "bed",
  "s": "layout",
  "x": 200,
  "y": 200,
  "w": 50,
  "h": 100,
  "r": 0,
  "name": "Bed",
  "data": { "bedType": "standard" }
}
```

---

## 3) links（任意）

`links[]` はノード間接続です（必要な機能を実装している場合のみ使用）。

```json
{
  "id": "link-1",
  "s": "layout",
  "from": "node-a",
  "to": "node-b",
  "routing": "orthogonal",
  "stroke": "#333333",
  "strokeW": 2,
  "arrows": ["none", "arrow"]
}
```

---

# (旧) JSON 構造サンプル

```json
{
  "schemaVersion": "1.0.0",

  "document": {
    "id": "doc_001",
    "title": "Sample: Report + Floorplan + Mindmap + Background",
    "units": "mm",

    "modes": ["report", "floorplan", "mindmap", "background"],

    "pages": [
      { "id": "page_A4_1", "w": 210, "h": 297, "mode": "report" }
    ],
    "scenes": [
      { "id": "scene_floor_1", "w": 12000, "h": 8000, "mode": "floorplan" },
      { "id": "scene_mm_1", "w": 8000, "h": 6000, "mode": "mindmap" },
      { "id": "scene_bg_1", "w": 1920, "h": 1080, "mode": "background" }
    ]
  },

  "nodes": [
    {
      "id": "n_report_title",
      "scope": { "kind": "page", "id": "page_A4_1" },
      "kind": "text",
      "geom": { "x": 20, "y": 18, "w": 170, "h": 12, "rot": 0 },
      "style": { "fontFamily": "NotoSansJP", "fontSize": 14, "fontWeight": 700, "fill": "#111" },
      "props": { "text": "請求書" },
      "z": 100
    },
    {
      "id": "n_report_customer_name",
      "scope": { "kind": "page", "id": "page_A4_1" },
      "kind": "text",
      "geom": { "x": 20, "y": 40, "w": 120, "h": 8, "rot": 0 },
      "style": { "fontFamily": "NotoSansJP", "fontSize": 10, "fill": "#111" },
      "props": { "text": "{{customer.name}}" },
      "binding": { "path": "customer.name", "format": "string" },
      "z": 110
    },

    {
      "id": "n_room_outer",
      "scope": { "kind": "scene", "id": "scene_floor_1" },
      "kind": "shape",
      "geom": { "x": 1000, "y": 800, "w": 4500, "h": 3000, "rot": 0 },
      "style": { "stroke": "#222", "strokeWidth": 12, "fill": "transparent" },
      "props": { "shape": "rect", "radius": 0 },
      "z": 10,
      "tags": ["wall"]
    },
    {
      "id": "n_sofa",
      "scope": { "kind": "scene", "id": "scene_floor_1" },
      "kind": "shape",
      "geom": { "x": 1400, "y": 2600, "w": 1400, "h": 600, "rot": 0 },
      "style": { "stroke": "#444", "strokeWidth": 2, "fill": "#ddd" },
      "props": { "shape": "rect", "radius": 40 },
      "z": 30,
      "tags": ["furniture"]
    },
    {
      "id": "n_sofa_label",
      "scope": { "kind": "scene", "id": "scene_floor_1" },
      "kind": "text",
      "geom": { "x": 1500, "y": 2750, "w": 1200, "h": 8, "rot": 0 },
      "style": { "fontFamily": "NotoSansJP", "fontSize": 10, "fill": "#111", "align": "center" },
      "props": { "text": "SOFA" },
      "z": 31
    },

    {
      "id": "n_mm_root",
      "scope": { "kind": "scene", "id": "scene_mm_1" },
      "kind": "widget",
      "geom": { "x": 4000, "y": 3000, "w": 900, "h": 220, "rot": 0 },
      "style": { "fill": "#fff", "stroke": "#222", "strokeWidth": 2, "shadow": 0.2 },
      "props": { "widget": "mindNode", "text": "帳票ツール" },
      "z": 1000
    },
    {
      "id": "n_mm_child_1",
      "scope": { "kind": "scene", "id": "scene_mm_1" },
      "kind": "widget",
      "geom": { "x": 5300, "y": 2400, "w": 900, "h": 220, "rot": 0 },
      "style": { "fill": "#fff", "stroke": "#222", "strokeWidth": 2 },
      "props": { "widget": "mindNode", "text": "テンプレ管理" },
      "z": 1000
    },

    {
      "id": "n_bg_logo",
      "scope": { "kind": "scene", "id": "scene_bg_1" },
      "kind": "text",
      "geom": { "x": 80, "y": 90, "w": 600, "h": 80, "rot": 0 },
      "style": { "fontFamily": "NotoSansJP", "fontSize": 48, "fill": "#111", "opacity": 0.15 },
      "props": { "text": "MY TOOL" },
      "z": 1,
      "tags": ["background"]
    }
  ],

  "links": [
    {
      "id": "l_mm_root_to_child1",
      "scope": { "kind": "scene", "id": "scene_mm_1" },
      "kind": "connector",
      "from": { "nodeId": "n_mm_root", "anchor": "right" },
      "to": { "nodeId": "n_mm_child_1", "anchor": "left" },
      "routing": { "type": "orthogonal", "waypoints": [] },
      "style": { "stroke": "#333", "strokeWidth": 2, "end": "arrow" },
      "z": 900
    }
  ],

  "constraints": {
    "snap": {
      "enabled": true,
      "grid": { "size": 10 },
      "angle": { "stepDeg": 15 },
      "nodeGuides": { "enabled": true, "modes": ["report", "floorplan"] }
    },
    "layout": {
      "mindmap": {
        "enabled": true,
        "sceneId": "scene_mm_1",
        "rootId": "n_mm_root",
        "algorithm": "radial",
        "direction": "both"
      }
    }
  },

  "dataBinding": {
    "sources": [
      { "id": "src_main", "type": "json", "name": "Main Data" }
    ],
    "exampleData": {
      "customer": { "name": "山田 太郎" }
    }
  },

  "animation": {
    "timelines": [
      {
        "id": "t_bg_float",
        "sceneId": "scene_bg_1",
        "loop": true,
        "durationSec": 6,
        "tracks": [
          {
            "nodeId": "n_bg_logo",
            "prop": "geom.y",
            "keys": [
              { "t": 0, "v": 90, "ease": "inOutSine" },
              { "t": 3, "v": 110, "ease": "inOutSine" },
              { "t": 6, "v": 90, "ease": "inOutSine" }
            ]
          }
        ]
      }
    ]
  },

  "editorState": {
    "activeMode": "floorplan",
    "selection": { "nodeIds": ["n_sofa"] },
    "viewport": {
      "scope": { "kind": "scene", "id": "scene_floor_1" },
      "pan": { "x": -900, "y": -600 },
      "zoom": 1.2
    },
    "history": {
      "enabled": true,
      "undo": [],
      "redo": []
    }
  }
}
```

* **保存（配布）**するのは基本 `document / nodes / links / constraints / dataBinding / animation`
* **編集中だけ** `editorState.history` を持ち、保存時には `editorState` を落とす。

---

## AIが「JSONを書くとどんな図になるか」を理解するための仕様テキスト

### 目的

このJSONは、帳票・図面・mindmap・アニメ背景を **同じ形式で保存**し、UIモードによって編集体験だけを変えるための統一ドキュメント形式である。

### 座標系とスコープ

* `document.units` は保存上の単位（推奨: `mm`）
* すべての描画要素は `nodes[]` に入る
* 各ノードは `scope` を持ち、どこに描くかを指定する

  * 帳票: `scope.kind="page"`（ページ上に描画）
  * 図面/mindmap/背景: `scope.kind="scene"`（無限キャンバス相当のシーンに描画）

### ノード（nodes）

AIは図を描くために `nodes[]` を生成する。ノードは次の共通フィールドを持つ。

* `id`: 一意な識別子
* `kind`: 描画タイプ（例）

  * `"shape"`: 図形（rect/circle/line/path等）
  * `"text"`: 文字
  * `"image"`: 画像
  * `"group"`: 子要素を束ねる（`parentId`で階層化してもよい）
  * `"widget"`: アプリ固有の高機能要素（mindmapノード等）
* `geom`: 位置とサイズ

  * `x, y` は左上基準、`w, h` は幅高さ、`rot` は回転（度）
* `style`: 見た目（stroke/fill/opacity/fontなど）
* `props`: 種類ごとの追加情報

  * shapeなら `{ "shape": "rect", "radius": 8 }` など
  * textなら `{ "text": "..." }`
  * widgetなら `{ "widget": "mindNode", "text": "..." }` など
* `z`: 描画順（大きいほど手前）

#### AIが図を作る基本ルール

1. **描く対象ごとにノードを作る**

   * 例：部屋の外枠=1つのrect、ソファ=1つのrect、ラベル=1つのtext
2. **同じスコープに置いたノード同士が同じキャンバス上に描画される**
3. **整列/スナップは `constraints.snap` を参考に UI が補助するが、保存上は `geom` が最終座標**

### コネクター（links）

AIが「図形同士を線で繋ぐ」図を作るには `links[]` を生成する。

* `kind="connector"` の link は、2つのノードを接続する線（矢印）を表す
* `from/to` には、接続先ノードIDとアンカー名を入れる

  * 例：`anchor` は `"left"|"right"|"top"|"bottom"|"center"` など
* `routing.type`

  * `"straight"`: 直線
  * `"orthogonal"`: 直角（draw.io風）
  * `"bezier"`: 曲線
* ノードが移動・変形しても、レンダラは `from/to` を再計算して線を追従させる

### mindmapモードの表現

mindmapは「ノード＋親子関係（リンク）」で表す。

* mindmapノードは `nodes.kind="widget"` で作り、`props.widget="mindNode"` を付ける
* 親子関係の線は `links.kind="connector"` を使う（見た目は矢印でも線でもよい）
* 自動配置（レイアウト）を使う場合は `constraints.layout.mindmap` を設定する

  * ただし最終的な描画は `nodes[].geom` に書かれた座標で決まる
  * レイアウト計算の結果を `geom` に反映すれば、どのレンダラでも再現できる

### 帳票（差し込み）モードの表現

* 差し込み対象は `nodes[].binding` に書く

  * 例：`{ "path":"customer.name", "format":"string" }`
* `props.text` に `{{...}}` を残してもよいが、描画時は `binding.path` を優先して実データを表示する

### 背景アニメの表現

* アニメーションは `animation.timelines[]` に書く
* `tracks[]` は「どのノードのどのプロパティを、時間でどう変えるか」を表す

  * 例：`prop="geom.y"` を上下に揺らす、`prop="style.opacity"` を点滅させる
* UIは requestAnimationFrame 等で時刻 `t` を進め、`keys` を補間してノードに反映する

### Undo履歴の扱い

* Undo/Redo は `editorState.history` に保持してよい
* **保存時には履歴を破棄**する（共有・配布ドキュメントは `document + nodes + links + ...` が正）
* 操作単位は「1操作=1履歴（トランザクション）」が推奨（ドラッグ完了時に1回コミット等）

---

## AIにJSON生成を頼むときの“指示テンプレ”

（この文章をそのままAIに渡すと、JSONが出やすくなります）

> あなたは統一ドキュメントJSONを生成します。
> `nodes` に図形・文字・ウィジェットを追加し、必要なら `links` で接続線を作ってください。
> スコープは `scope.kind` と `scope.id` で指定します（帳票はpage、図面/mindmap/背景はscene）。
> 座標はmmで、`geom={x,y,w,h,rot}` を必ず書きます。
> mindmapの場合は `widget=mindNode` を使い、親子の接続は `links(kind=connector)` で表現してください。
> 背景アニメは `animation.timelines[].tracks` を使い、位置/不透明度などのプロパティをキーで変化させてください。
> 出力はJSONのみで、説明は不要です。


