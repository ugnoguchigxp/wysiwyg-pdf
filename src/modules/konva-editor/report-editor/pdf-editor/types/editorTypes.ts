export type ArrowType =
  | 'none'
  | 'standard'
  | 'filled'
  | 'triangle'
  | 'open'
  | 'circle'
  | 'diamond'
  | 'square'

export type ConnectionPoint =
  | 'top-left'
  | 'left'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'
  | 'right'
  | 'top-right'
  | 'top'

export interface IPosition {
  x: number
  y: number
}

export interface IEditorItemStyle {
  'font-size'?: number
  'font-family'?: string[]
  'font-style'?: string[] // 'bold', 'italic', 'underline', 'linethrough'
  color?: string
  'text-align'?: 'left' | 'center' | 'right'
  'vertical-align'?: 'top' | 'middle' | 'bottom'
  'fill-color'?: string
  'border-style'?: 'none' | 'solid' | 'dotted' | 'dashed'
  'border-width'?: number
  'border-color'?: string
}

export interface IEditorItemBase {
  id: string
  // type is defined in specific interfaces
  x: number
  y: number
  width: number
  height: number
  display?: boolean
  style: IEditorItemStyle
  z?: number
}

export interface IEditorText extends IEditorItemBase {
  type: 'text'
  texts: string[]
}

export interface IEditorTextBlock extends IEditorItemBase {
  type: 'text-block'
  value: string
  'multiple-line'?: boolean
}

export interface IEditorRect extends IEditorItemBase {
  type: 'rect'
  'border-radius'?: number
}

export interface IEditorEllipse extends IEditorItemBase {
  type: 'ellipse'
}

export interface IEditorLine extends IEditorItemBase {
  type: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
  startArrow?: ArrowType
  endArrow?: ArrowType
  intermediatePoints?: IPosition[]
  startConnection?: { elementId: string; connectionPoint: ConnectionPoint }
  endConnection?: { elementId: string; connectionPoint: ConnectionPoint }
}

export interface IEditorImage extends IEditorItemBase {
  type: 'image'
  data: string
}

export interface IEditorTable extends IEditorItemBase {
  type: 'table'
  rowCount: number
  colCount: number
  rows: Array<{ id: string; height: number }>
  cols: Array<{ id: string; width: number }>
  cells: Array<{
    row: number
    col: number
    rowSpan?: number
    colSpan?: number
    content: string
    style?: {
      'background-color'?: string
      'border-color'?: string
      'border-width'?: number
      'font-size'?: number
      'font-family'?: string[]
      'text-align'?: 'left' | 'center' | 'right'
      'vertical-align'?: 'top' | 'middle' | 'bottom'
      color?: string
    }
  }>
}

export interface IEditorPageNumber extends IEditorItemBase {
  type: 'page-number'
  format: {
    base: string
  }
}

export type IEditorItem =
  | IEditorText
  | IEditorTextBlock
  | IEditorRect
  | IEditorEllipse
  | IEditorLine
  | IEditorImage
  | IEditorTable
  | IEditorPageNumber
