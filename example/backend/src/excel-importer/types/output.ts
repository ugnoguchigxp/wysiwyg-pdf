/**
 * 出力型定義
 *
 * wysiwyg-pdfのDoc型と互換性のある型を定義
 * 将来的にwysiwyg-pdfから直接importする場合はこのファイルを置き換え
 */

// ========================================
// Document
// ========================================

export interface OutputDoc {
  v: 1
  id: string
  title: string
  unit: 'mm'
  surfaces: OutputSurface[]
  nodes: OutputNode[]
  assets?: OutputAsset[]
}

export interface OutputSurface {
  id: string
  type: 'page'
  w: number // mm
  h: number // mm
  margin?: {
    t: number
    r: number
    b: number
    l: number
  }
  bg?: string
  header?: HeaderFooterContent
  footer?: HeaderFooterContent
}

export interface HeaderFooterContent {
  left?: string
  center?: string
  right?: string
}

export interface OutputAsset {
  id: string
  type: 'image' | 'font' | 'video'
  uri: string
  mime?: string
}

// ========================================
// Nodes
// ========================================

export type OutputNode = OutputTableNode | OutputTextNode | OutputShapeNode | OutputLineNode | OutputImageNode

interface OutputBaseNode {
  id: string
  s: string // Surface ID
  x: number
  y: number
  w: number
  h: number
  r?: number
  opacity?: number
  locked?: boolean
  hidden?: boolean
  name?: string
}

export interface OutputTableNode extends OutputBaseNode {
  t: 'table'
  table: OutputTableData
}

export interface OutputTableData {
  rows: number[] // mm
  cols: number[] // mm
  cells: OutputCell[]
}

export interface OutputCell {
  r: number
  c: number
  rs?: number
  cs?: number
  v: string
  bg?: string
  border?: string
  borderColor?: string
  borderW?: number
  borders?: {
    t?: OutputBorderStyle
    r?: OutputBorderStyle
    b?: OutputBorderStyle
    l?: OutputBorderStyle
  }
  wrap?: boolean
  font?: string
  fontSize?: number
  align?: 'l' | 'c' | 'r'
  vAlign?: 't' | 'm' | 'b'
  color?: string
  bold?: boolean
  italic?: boolean
  strike?: boolean
}

export interface OutputBorderStyle {
  style?: string
  color?: string
  width?: number
}

export interface OutputTextNode extends OutputBaseNode {
  t: 'text'
  text: string
  font?: string
  fontSize?: number
  fontWeight?: number
  italic?: boolean
  underline?: boolean
  lineThrough?: boolean
  align?: 'l' | 'c' | 'r' | 'j'
  vAlign?: 't' | 'm' | 'b'
  fill?: string
  backgroundColor?: string
}

export interface OutputShapeNode extends OutputBaseNode {
  t: 'shape'
  shape: 'rect' | 'circle' | 'triangle' | 'diamond' | string
  fill?: string
  stroke?: string
  strokeW?: number
  dash?: number[]
}

export interface OutputLineNode {
  id: string
  s: string
  t: 'line'
  pts: number[]
  stroke: string
  strokeW: number
  dash?: number[]
}

export interface OutputImageNode extends OutputBaseNode {
  t: 'image'
  src?: string
  assetId?: string
}
