# Unified JSON Schema v2 (Optimized)

## 1. Design Principles

- **最小限のフィールド数**: 必須フィールドのみ。オプションは省略可能
- **フラットな構造**: 不要なネストを排除
- **単一の抽象化**: `nodes` はすべての描画要素を表現。`links` は接続のみ
- **型による分岐最小化**: `kind` は最小セット、詳細は `props` で表現
- **厳密な型定義**: Discriminated Union による型安全性の確保
- **描画順の簡素化**: `z` indexを廃止し、配列順（Document Order）を描画順とする

---

## 2. Schema Definition

```typescript
// ========================================
// Primitive Types
// ========================================

type NodeId = string;   // nanoid (21 chars recommended)
type SurfaceId = string;
type LinkId = string;
type Color = string;    // Hex (#RRGGBB), rgba(), hsl() supported

// ========================================
// Coordinate System & Line Definitions
// ========================================
// (Implemented as spec comment for developers)
//
// 1. Base Geometry (x, y, w, h):
//    - Defines the "bounding box" of the element BEFORE rotation.
//    - x, y: Top-left corner of the optional bounding box relative to Surface.
//    - rot (r): Rotation in degrees around the center of this bounding box.
//
// 2. Line/Path Coordinates (pts):
//    - LineNode uses "pts" ONLY. It describes ABSOLUTE coordinates on the surface.
//    - x, y, w, h are NOT used for lines (rendering engine calculates bbox if needed).
//    - This avoids ambiguity between "relative points" vs "absolute position".
//
// 3. Units:
//    - Doc.unit is the single source of truth.
//    - Default recommendation: 'pt' (DTP standard).
//    - Mixed units are NOT allowed.

// ========================================
// Document Root
// ========================================

interface Doc {
  v: 1                           // Schema version (number for compactness)
  id: string
  title: string
  unit: 'mm' | 'pt' | 'px' | 'in' // Singular, not "units" (in = inch)
  
  // Surfaces (where nodes live)
  surfaces: Surface[]
  
  // All drawable elements
  // Order determines Z-index (First = Background, Last = Foreground)
  nodes: UnifiedNode[]
  
  // Connections between nodes (optional, for mindmap/flowchart)
  links?: Link[]
  
  // Optional features (omit if unused)
  binding?: BindingConfig
  animation?: AnimationConfig
  snap?: SnapConfig
}

interface Surface {
  id: SurfaceId
  type: 'page' | 'canvas'        // page=A4等, canvas=無限キャンバス
  w: number
  h: number
  
  // Page specific details
  margin?: Margin                // For 'page' type
  bg?: string                    // Color hex or image URL (data:image/...)
}

interface Margin {
  t: number
  r: number
  b: number
  l: number
}

// ========================================
// Nodes (All Drawable Elements)
// ========================================

type UnifiedNode = 
  | TextNode 
  | ShapeNode 
  | LineNode 
  | ImageNode 
  | GroupNode 
  | TableNode 
  | SignatureNode
  | WidgetNode;

// Common properties for all nodes
interface BaseNode {
  id: NodeId
  s: SurfaceId                   // Surface ID (short key name)
  
  // Note: 'z' is REMOVED. Use array index.
  
  // Geometry (Optional for LineNode)
  x?: number
  y?: number
  w?: number
  h?: number
  r?: number                     // Rotation in degrees (default: 0)

  // Common Style
  opacity?: number               // 0-1
  locked?: boolean
  hidden?: boolean
  tags?: string[]
  
  // Binding (optional)
  bind?: string                  // Simple path like "customer.name"
  
  // Metadata
  name?: string
}

interface TextNode extends BaseNode {
  t: 'text'
  x: number; y: number; w: number; h: number // Required
  text: string
  
  // Text Style
  font?: string                  // Font family
  fontSize?: number
  fontWeight?: number            // 400, 700, etc.
  italic?: boolean
  underline?: boolean
  lineThrough?: boolean
  align?: 'l' | 'c' | 'r' | 'j'  // left/center/right/justify (short)
  vAlign?: 't' | 'm' | 'b'       // top/middle/bottom (short)
  fill?: Color                   // Text color
}

interface ShapeNode extends BaseNode {
  t: 'shape'
  x: number; y: number; w: number; h: number // Required
  shape: ShapeType
  radius?: number                // Border radius for rect
  
  // Shape Style
  fill?: Color
  stroke?: Color
  strokeW?: number
  dash?: number[]
}

interface LineNode extends BaseNode {
  t: 'line'
  // x, y, w, h are IGNORED/UNDEFINED for lines.
  
  pts: number[]                  // Flat array: [x1,y1,x2,y2,...] ABSOLUTE coordinates
  arrows?: [ArrowType, ArrowType] // [start, end]
  
  // Line Style
  stroke: Color
  strokeW: number
  dash?: number[]
}

interface ImageNode extends BaseNode {
  t: 'image'
  x: number; y: number; w: number; h: number // Required
  src: string                    // URL or base64
}

interface GroupNode extends BaseNode {
  t: 'group'
  x: number; y: number; w: number; h: number // Bounding box of group
  children: NodeId[]
}

interface TableNode extends BaseNode {
  t: 'table'
  x: number; y: number; w: number; h: number // Required
  table: TableData
}

interface WidgetNode extends BaseNode {
  t: 'widget'
  x: number; y: number; w: number; h: number // Required
  widget: string                 // 'chart' | 'bed' | 'mindNode' | ...
  data?: Record<string, unknown> // Flexible data storage
}

interface SignatureNode extends BaseNode {
  t: 'signature'
  x: number; y: number; w: number; h: number // Bounding box
  strokes: number[][]            // Array of stroke paths: [[x1,y1,x2,y2,...], ...]
  stroke: Color                  // Stroke color
  strokeW: number                // Stroke width
}

// Note: SignatureNode is a first-class node type (not Widget) because:
// - It has specific, well-defined structure
// - Used frequently in document workflows
// - Benefits from type-safe validation

// ========================================
// Type Enums & Helpers
// ========================================

type ShapeType = 
  | 'rect' | 'circle' | 'triangle' | 'diamond' 
  | 'star' | 'pentagon' | 'hexagon'
  | 'arrow-u' | 'arrow-d' | 'arrow-l' | 'arrow-r'

type ArrowType = 'none' | 'arrow' | 'circle' | 'diamond'

interface TableData {
  rows: number[]                 // Row heights in Doc.unit (all rows must be specified)
  cols: number[]                 // Column widths in Doc.unit (all columns must be specified)
  cells: Cell[]                  // Sparse array: only non-empty cells need to be defined
}

interface Cell {
  r: number                      // Row index
  c: number                      // Column index
  rs?: number                    // Row span
  cs?: number                    // Col span
  v: string                      // Value/content
  // Cell-specific styles
  bg?: string
  border?: string
  font?: string
  fontSize?: number
  align?: 'l' | 'c' | 'r'
}

// ========================================
// Links (Smart Connectors)
// ========================================

interface Link {
  id: LinkId
  s: SurfaceId                   // Surface where the link is rendered
  from: NodeId                   // Both from/to nodes MUST be on the same Surface
  to: NodeId                     // Cross-surface links are NOT supported
  fromAnchor?: Anchor            // Default: 'auto'
  toAnchor?: Anchor
  routing?: 'straight' | 'orthogonal' | 'bezier'
  stroke?: Color
  strokeW?: number
  arrows?: [ArrowType, ArrowType]
  // Note: z-index for links is determined by array order in Doc.links
}

type Anchor = 'auto' | 't' | 'b' | 'l' | 'r' | 'tl' | 'tr' | 'bl' | 'br'

// ========================================
// Optional Subsystems
// ========================================

interface BindingConfig {
  sampleData: Record<string, unknown>  // Renamed from 'data' for clarity
  sources?: DataSource[]
}

interface DataSource {
  id: string
  type: 'json' | 'api'
  url?: string
}

interface AnimationConfig {
  timelines: Timeline[]
}

interface Timeline {
  id: string
  surface: SurfaceId
  duration: number               // Seconds
  loop?: boolean
  tracks: Track[]
}

interface Track {
  node: NodeId
  prop: string                   // e.g., 'x', 'y', 'opacity'
  keys: Keyframe[]
}

interface Keyframe {
  t: number                      // Time in seconds
  v: number | string
  ease?: 'linear' | 'ease' | 'ease-in' | 'ease-out'
}

interface SnapConfig {
  grid?: number                  // Grid size
  guides?: boolean               // Show alignment guides
}
```

---

## 3. Key Optimizations

| Before | After | Rationale |
|--------|-------|-----------|
| `z: number` | `nodes[]` order | 配列順＝Z順とすることで、ソート計算とJSONサイズを削減 (Zero-cost abstraction) |
| Line `x,y` + `pts` | `pts` (Absolute) | Lineは絶対座標`pts`のみ保持。`x,y` との二重管理・曖昧さを排除 |
| `BindingConfig.data` | `sampleData` | `WidgetNode.data` との混同回避 |
| `schemaVersion: "1.0.0"` | `v: 1` | 数値で十分、文字列解析不要 |
| `scope: { kind, id }` | `s: string` | Surface IDのみで十分 |
| `kind` 9種類 | `t` 種類 + `widget` | 型安全な Discriminated Union |

---

## 4. Widget System (Extensible)

`widget` タイプは拡張可能なプラグインシステムとして機能:

```typescript
// Chart widget (type: 'line' | 'bar' | 'pie' | ...)
{ t: 'widget', widget: 'chart', data: { type: 'line', series: [...], xAxis: {...} } }

// Bed layout widget (medical/hospital use case)
{ t: 'widget', widget: 'bed', data: { patientId: '123', status: 'active' } }

// MindMap node widget
{ t: 'widget', widget: 'mindNode', data: { label: 'Topic', collapsed: false } }
```

### Widget Validation Guidelines

- `data` は `Record<string, unknown>` として定義されるが、各WidgetレンダラーはZod等で独自のスキーマを持つべき
- 不正な `data` は "Broken Widget" プレースホルダーとして描画
- 新規Widget追加時は `WidgetRegistry` に登録し、バリデータとレンダラーを提供

---

## 5. Remaining Design Decisions

> [!IMPORTANT]
> 実装前に決定が必要な項目

| 項目 | 選択肢 | 推奨 |
|------|--------|------|
| **ID生成** | UUID / nanoid / incremental | nanoid (21文字, 短く衝突なし) |
| **デフォルト単位** | mm / pt | pt (既存資産との整合性) |
| **Widget登録** | 静的 / 動的レジストリ | 動的レジストリ（プラグイン拡張性） |

---

## 6. Compatibility & Validation Strategy

1.  **Strict Runtime Check**:
    - `v`, `surfaces`, `nodes` は必須フィールド
    - スキーマバージョン `v` が一致しない場合はマイグレーション処理を実行

2.  **Node Validation**:
    - 各ノードは `id`, `s`, `t` が必須
    - 座標系 (`x`, `y`, `w`, `h`) は `LineNode` 以外で必須

3.  **Widget Validation**:
    - `data` はコアロジックでは `unknown` として扱う
    - 不正なWidgetデータは "Broken Widget" プレースホルダーとして描画
    - 各Widgetレンダラーが独自のスキーマバリデーションを持つ

4.  **Z-Index Migration** (v0 → v1):
    - レガシーの `z` ベースデータはソートされ、`nodes` 配列の順序として保存
    - 移行後は `z` フィールドは無視される

5.  **Error Handling**:
    - パース失敗時は詳細なエラーメッセージを返却
    - 部分的に有効なドキュメントは "Recovery Mode" で表示可能

---

**Status**: Ready for Implementation  
**Author**: Antigravity  
**Last Updated**: 2025-12-13
