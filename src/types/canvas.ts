/**
 * Shared Canvas Types
 * Unified definitions for Report Template and Bed Layout
 */

export type Unit = 'px' | 'mm' | 'pt'

export type ElementType =
  | 'Text'
  | 'Rect'
  | 'Triangle'
  | 'Trapezoid'
  | 'Circle'
  | 'Diamond'
  | 'Cylinder'
  | 'Heart'
  | 'Star'
  | 'Pentagon'
  | 'Hexagon'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Tree'
  | 'House'
  | 'Line'
  | 'Image'
  | 'Table'
  | 'Group'
  | 'Guide'
  | 'Bed'
  | 'Chart'
  | 'Signature'

export type BindingType = 'field' | 'expr' | 'repeater'

export type ArrowType =
  | 'none'
  | 'standard'
  | 'open'
  | 'filled'
  | 'triangle'
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

export interface IConnection {
  elementId: string
  connectionPoint: ConnectionPoint
}

export interface IBinding {
  type: BindingType
  sourceId: string
  fieldId?: string // Added for strict schema binding
  path?: string
  expr?: string
  format?: string
  repeaterConfig?: {
    maxRows?: number
    overflow?: 'clip' | 'warn'
  }
}

export interface IPosition {
  x: number
  y: number
}

export interface ISize {
  width: number
  height: number
}

export interface IBox {
  x: number
  y: number
  width: number
  height: number
}

// Element interfaces
export interface IElementBase {
  id: string
  type: ElementType
  pageId?: string // Optional for Bed Layout
  z: number
  visible: boolean
  locked: boolean
  rotation: number
  name: string
  binding?: IBinding
}

export interface ITextElement extends IElementBase {
  type: 'Text'
  text: string
  font: {
    family: string
    size: number
    weight: number
    italic?: boolean
    strikethrough?: boolean
    underline?: boolean
  }
  color: string
  backgroundColor?: string
  align: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom' // Added for Bed Layout compatibility
  box: IBox
  listType?: 'none' | 'bullet' | 'numbered'
}

export interface IShapeElement extends IElementBase {
  type:
  | 'Rect'
  | 'Triangle'
  | 'Trapezoid'
  | 'Circle'
  | 'Diamond'
  | 'Cylinder'
  | 'Heart'
  | 'Star'
  | 'Pentagon'
  | 'Hexagon'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Tree'
  | 'House'
  box: IBox
  stroke: {
    color: string
    width: number
    dash?: number[]
  }
  fill: {
    color: string
  }
  label?: {
    text: string
    font: {
      family: string
      size: number
      weight: number
    }
    color: string
  }
}

export interface ILineElement extends IElementBase {
  type: 'Line'
  startPoint: IPosition
  endPoint: IPosition
  intermediatePoints?: IPosition[]
  stroke: {
    color: string
    width: number
    dash?: number[]
  }
  startArrow: ArrowType
  endArrow: ArrowType
  startConnection?: IConnection
  endConnection?: IConnection
}

export interface IImageElement extends IElementBase {
  type: 'Image'
  box: IBox
  assetId?: string // Optional for Bed Layout placeholder
  src?: string // Added for Bed Layout direct URL support
  opacity?: number // Added for Bed Layout
}

export interface ITableElement extends IElementBase {
  type: 'Table'
  box: IBox

  // Structure
  rowCount: number
  colCount: number

  rows: Array<{
    id: string
    height: number
    // Potentially add specific row styles later (e.g. frozen)
  }>

  cols: Array<{
    id: string
    width: number
  }>

  cells: Array<{
    row: number // 0-indexed
    col: number // 0-indexed
    rowSpan?: number
    colSpan?: number
    content: string
    styles: {
      backgroundColor?: string
      borderColor?: string
      borderWidth?: number
      font?: {
        family: string
        size: number
        weight: number
        color: string
        italic?: boolean
        strikethrough?: boolean
        underline?: boolean
      }
      align?: 'left' | 'center' | 'right'
      verticalAlign?: 'top' | 'middle' | 'bottom'
    }
  }>
}

// Bed Element (Specific to Bed Layout)
export interface IBedElement extends IElementBase {
  type: 'Bed'
  box: IBox
  label?: string
  patientName?: string
  patientId?: string
  bloodPressure?: string
  orientation?: 'vertical' | 'horizontal'
  status?: 'idle' | 'active' | 'warning' | 'alarm'
  statusMessage?: string
}

export interface IGroupElement extends IElementBase {
  type: 'Group'
  box: IBox
  childIds: string[]
}

export interface IChartElement extends IElementBase {
  type: 'Chart'
  box: IBox
  config: {
    title?: string
    xAxis: {
      type: 'time' | 'category'
      domain: ['dataMin', 'dataMax'] | [string, string] // [start, end]
      ticks?: string[] // '30m', '1h'
    }
    yAxes: Array<{
      id: string // 'left', 'right'
      position: 'left' | 'right'
      label?: string
      domain?: [number, number] // [min, max]
    }>
    series: Array<{
      id: string
      label: string
      dataSourceId: string // 'bp_sys', 'pulse', 'medication_event'
      yAxisId: string // 'left' or 'right'
      type: 'line' | 'bar' | 'scatter' | 'event'
      color?: string
      markerShape?: 'circle' | 'triangle' | 'square' | 'cross'
    }>
  }
}

export interface ISignatureElement extends IElementBase {
  type: 'Signature'
  box: IBox
  strokes: number[][] // Each stroke is an array of [x, y, x, y, ...]
  stroke: string // Color
  strokeWidth: number
}

export type CanvasElement =
  | ITextElement
  | IShapeElement
  | ILineElement
  | IImageElement
  | ITableElement
  | IBedElement
  | IGroupElement
  | IChartElement
  | ISignatureElement
