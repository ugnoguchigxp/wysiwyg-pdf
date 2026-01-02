import type { UnifiedNode } from '@/types/canvas'

// ========================================
// Layout Types
// ========================================

/** Grid Layout Configuration */
export interface GridLayout {
  cols: number
  gap?: number
  className?: string
}

/** Panel Layout Configuration */
export interface PanelLayout {
  width: number | string
  padding: number
  sectionGap: number
  backgroundColor?: string
}

// ========================================
// Widget Types
// ========================================

export type WidgetType =
  | 'posSize'
  | 'font'
  | 'alignment'
  | 'vAlignment'
  | 'stroke'
  | 'fill'
  | 'border'
  | 'polygon'
  | 'image'
  | 'labelField'
  | 'hiddenField'
  | 'select'
  | 'colorPicker'
  | 'slider'
  | 'textContent'
  | 'lineStyle'
  | 'dataBinding'
  | 'custom'
  | 'arrowhead'
  | 'numberInput'
  | 'checkbox'
  | 'list'

// ========================================
// Preset System
// ========================================

/** Preset Reference Type */
export type PresetRef<T> = string | T

// ========================================
// Widget Configuration Types
// ========================================

/** Base Widget Configuration */
interface BaseWidgetConfig {
  type: WidgetType
  labelKey?: string
  grid?: GridLayout
  condition?: (node: UnifiedNode) => boolean
  className?: string
  colSpan?: number
}

export interface PosSizeWidgetConfig extends BaseWidgetConfig {
  type: 'posSize'
  props?: { showX?: boolean; showY?: boolean; showW?: boolean; showH?: boolean }
}

export interface FontWidgetConfig extends BaseWidgetConfig {
  type: 'font'
  props?: {
    showFamily?: boolean
    showSize?: boolean
    showColor?: boolean
    showBold?: boolean
    showItalic?: boolean
    showUnderline?: boolean
    showStrikethrough?: boolean
    fontFamilies?: string[]
    fontSizes?: number[]
  }
}

export interface AlignmentWidgetConfig extends BaseWidgetConfig {
  type: 'alignment'
  props?: { options: ('l' | 'c' | 'r' | 'j')[] }
}

export interface VAlignmentWidgetConfig extends BaseWidgetConfig {
  type: 'vAlignment'
  props?: { options: ('t' | 'm' | 'b')[] }
}

export interface StrokeWidgetConfig extends BaseWidgetConfig {
  type: 'stroke'
  props?: {
    showColor?: boolean
    showWidth?: boolean
    minWidth?: number
    maxWidth?: number
    step?: number
  }
}

export interface FillWidgetConfig extends BaseWidgetConfig {
  type: 'fill'
  props?: { showOpacity?: boolean }
}
export interface BorderWidgetConfig extends BaseWidgetConfig {
  type: 'border'
  props?: { showColor?: boolean; showWidth?: boolean; step?: number }
}
export interface PolygonWidgetConfig extends BaseWidgetConfig {
  type: 'polygon'
  props?: { min?: number; max?: number; step?: number }
}
export interface ImageWidgetConfig extends BaseWidgetConfig {
  type: 'image'
  props?: { showPreview?: boolean; showUploader?: boolean; maxPreviewHeight?: number }
}
export interface LabelFieldWidgetConfig extends BaseWidgetConfig {
  type: 'labelField'
  props?: { fieldKey?: string; placeholder?: string }
}
export interface HiddenFieldWidgetConfig extends BaseWidgetConfig {
  type: 'hiddenField'
  props?: { fields: string[] }
}
export interface SelectWidgetConfig extends BaseWidgetConfig {
  type: 'select'
  props: { fieldKey: string; options: { value: string; labelKey: string }[] }
}
export interface ColorPickerWidgetConfig extends BaseWidgetConfig {
  type: 'colorPicker'
  props: { fieldKey: string }
}
export interface SliderWidgetConfig extends BaseWidgetConfig {
  type: 'slider'
  props: { fieldKey: string; min: number; max: number; step?: number; showValue?: boolean }
}
export interface TextContentWidgetConfig extends BaseWidgetConfig {
  type: 'textContent'
  props?: { rows?: number; placeholder?: string }
}
export interface LineStyleWidgetConfig extends BaseWidgetConfig {
  type: 'lineStyle'
  props?: { options: ('solid' | 'dashed' | 'dotted')[] }
}
export interface DataBindingWidgetConfig extends BaseWidgetConfig {
  type: 'dataBinding'
  props?: { mode?: 'field' | 'repeater' }
}
export interface CustomWidgetConfig extends BaseWidgetConfig {
  type: 'custom'
  props: { renderKey: string; [key: string]: unknown }
}

export interface ArrowheadWidgetConfig extends BaseWidgetConfig {
  type: 'arrowhead'
  props?: {
    position: 'start' | 'end'
  }
}

export interface NumberInputWidgetConfig extends BaseWidgetConfig {
  type: 'numberInput'
  props: {
    fieldKey: string
    min?: number
    max?: number
    step?: number
    unit?: string
  }
}

export interface CheckboxWidgetConfig extends BaseWidgetConfig {
  type: 'checkbox'
  props: {
    fieldKey: string
  }
}

export interface ListWidgetConfig extends BaseWidgetConfig {
  type: 'list'
}

export type WidgetConfig =
  | PosSizeWidgetConfig
  | FontWidgetConfig
  | AlignmentWidgetConfig
  | VAlignmentWidgetConfig
  | StrokeWidgetConfig
  | FillWidgetConfig
  | BorderWidgetConfig
  | ColorPickerWidgetConfig
  | SliderWidgetConfig
  | TextContentWidgetConfig
  | LineStyleWidgetConfig
  | ArrowheadWidgetConfig
  | LabelFieldWidgetConfig
  | ImageWidgetConfig
  | SelectWidgetConfig
  | CustomWidgetConfig
  | PolygonWidgetConfig
  | HiddenFieldWidgetConfig
  | DataBindingWidgetConfig
  | NumberInputWidgetConfig
  | CheckboxWidgetConfig
  | ListWidgetConfig

// ========================================
// Section Configuration
// ========================================

/** Section Configuration */
export interface SectionConfig {
  id: string
  labelKey?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  grid?: GridLayout
  condition?: (node: UnifiedNode) => boolean
  widgets: PresetRef<WidgetConfig>[]
}

// ========================================
// Object Panel Configuration
// ========================================

export interface ObjectPanelConfig {
  objectType: string
  header?: { iconName?: string; labelKey: string }
  sections: PresetRef<SectionConfig>[]
}

export interface PropertyPanelConfig {
  editorType: 'report' | 'bedLayout'
  layout: PanelLayout
  defaultSections: PresetRef<SectionConfig>[]
  objects: ObjectPanelConfig[]
}
