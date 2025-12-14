/**
 * Unified JSON Schema v2 (Optimized)
 * Replaces the old CanvasElement/ITemplateDoc structure.
 */

// ========================================
// Primitive Types
// ========================================

export type NodeId = string;   // nanoid (21 chars recommended)
export type SurfaceId = string;
export type LinkId = string;
export type Color = string;    // Hex (#RRGGBB), rgba(), hsl() supported
export type Unit = 'mm' | 'pt' | 'px' | 'in';

// ========================================
// Document Root
// ========================================

export interface Doc {
  v: 1                           // Schema version (number for compactness)
  id: string
  title: string
  unit: Unit

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

export interface Surface {
  id: SurfaceId
  type: 'page' | 'canvas'        // page=A4等, canvas=無限キャンバス
  w: number
  h: number

  // Page specific details
  margin?: Margin                // For 'page' type
  bg?: string                    // Color hex or image URL (data:image/...)
}

export interface Margin {
  t: number
  r: number
  b: number
  l: number
}

// ========================================
// Nodes (All Drawable Elements)
// ========================================

export type UnifiedNode =
  | TextNode
  | ShapeNode
  | LineNode
  | ImageNode
  | GroupNode
  | TableNode
  | SignatureNode
  | WidgetNode;

// Common properties for all nodes
export interface BaseNode {
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

export interface TextNode extends BaseNode {
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

  // Border (for connector/label use cases)
  stroke?: Color
  strokeW?: number
}

export interface ShapeNode extends BaseNode {
  t: 'shape'
  x: number; y: number; w: number; h: number // Required
  shape: ShapeType
  radius?: number                // Border radius for rect

  // Shape Style
  fill?: Color
  stroke?: Color
  strokeW?: number
  dash?: number[]
  sides?: number                 // For polygon/star (vertex count)
}

export interface LineNode extends BaseNode {
  t: 'line'
  // x, y, w, h are IGNORED/UNDEFINED for lines.

  pts: number[]                  // Flat array: [x1,y1,x2,y2,...] ABSOLUTE coordinates
  arrows?: [ArrowType, ArrowType] // [start, end]

  // Optional connector behavior (draw.io-like)
  // If set, the endpoint position is derived from the target node's bounding box anchor.
  startConn?: { nodeId: NodeId; anchor: Anchor }
  endConn?: { nodeId: NodeId; anchor: Anchor }

  // Line Style
  stroke: Color
  strokeW: number
  dash?: number[]
}

export interface ImageNode extends BaseNode {
  t: 'image'
  x: number; y: number; w: number; h: number // Required
  src: string                    // URL or base64
}

export interface GroupNode extends BaseNode {
  t: 'group'
  x: number; y: number; w: number; h: number // Bounding box of group
  children: NodeId[]
}

export interface TableNode extends BaseNode {
  t: 'table'
  x: number; y: number; w: number; h: number // Required
  table: TableData
}

export interface WidgetNode extends BaseNode {
  t: 'widget'
  x: number; y: number; w: number; h: number // Required
  widget: string                 // 'chart' | 'bed' | 'mindNode' | ...
  data?: Record<string, unknown> // Flexible data storage
}

export interface SignatureNode extends BaseNode {
  t: 'signature'
  x: number; y: number; w: number; h: number // Bounding box
  strokes: number[][]            // Array of stroke paths: [[x1,y1,x2,y2,...], ...]
  stroke: Color                  // Stroke color
  strokeW: number                // Stroke width
}

// ========================================
// Type Enums & Helpers
// ========================================

export type ShapeType =
  | 'rect' | 'circle' | 'triangle' | 'diamond'
  | 'star' | 'pentagon' | 'hexagon'
  | 'arrow-u' | 'arrow-d' | 'arrow-l' | 'arrow-r'
  | 'trapezoid' | 'cylinder' | 'heart' | 'tree' | 'house'

export type ArrowType = 'none' | 'arrow' | 'circle' | 'diamond' | 'standard' | 'filled' | 'triangle' | 'open' | 'square'

export interface TableData {
  rows: number[]                 // Row heights in Doc.unit (all rows must be specified)
  cols: number[]                 // Column widths in Doc.unit (all columns must be specified)
  cells: Cell[]                  // Sparse array: only non-empty cells need to be defined
}

export interface Cell {
  r: number                      // Row index
  c: number                      // Column index
  rs?: number                    // Row span
  cs?: number                    // Col span
  v: string                      // Value/content
  // Cell-specific styles
  bg?: string
  border?: string
  borderColor?: string
  borderW?: number
  font?: string
  fontSize?: number
  align?: 'l' | 'c' | 'r'
  vAlign?: 't' | 'm' | 'b'
  color?: string
}

// ========================================
// Links (Smart Connectors)
// ========================================

export interface Link {
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
}

export type Anchor = 'auto' | 't' | 'b' | 'l' | 'r' | 'tl' | 'tr' | 'bl' | 'br'

// ========================================
// Optional Subsystems
// ========================================

export interface BindingConfig {
  sampleData: Record<string, unknown>  // Renamed from 'data' for clarity
  sources?: DataSource[]
}

export interface DataSource {
  id: string
  type: 'json' | 'api'
  url?: string
}

export interface AnimationConfig {
  timelines: Timeline[]
}

export interface Timeline {
  id: string
  surface: SurfaceId
  duration: number               // Seconds
  loop?: boolean
  tracks: Track[]
}

export interface Track {
  node: NodeId
  prop: string                   // e.g., 'x', 'y', 'opacity'
  keys: Keyframe[]
}

export interface Keyframe {
  t: number                      // Time in seconds
  v: number | string
  ease?: 'linear' | 'ease' | 'ease-in' | 'ease-out'
}

export interface SnapConfig {
  grid?: number                  // Grid size
  guides?: boolean               // Show alignment guides
}

// ========================================
// Legacy / Adapter Types
// ========================================

export interface BedLayoutDocument {
  id: string
  type: 'bed_layout'
  name: string
  layout: {
    mode: 'landscape' | 'portrait'
    width: number
    height: number
  }
  elementsById: Record<string, UnifiedNode>
  elementOrder: string[]
}

export interface FormDocument {
  id: string
  type: 'form'
  name: string
  paper: {
    size: 'A4' | 'B5' | 'Custom'
    orientation: 'portrait' | 'landscape'
    width: number
    height: number
    margins?: { top: number; right: number; bottom: number; left: number }
  }
  background?: {
    src: string
    opacity: number
    fit: 'fill' | 'contain' | 'cover' | 'none'
  }
  elementsById: Record<string, UnifiedNode>
  elementOrder: string[]
}
