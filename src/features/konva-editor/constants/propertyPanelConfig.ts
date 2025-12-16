/**
 * Unified Property Panel Configuration
 *
 * ReportエディタとBedLayoutエディタで共通のプロパティパネル設定
 * DRY原則: プリセット定義を再利用することで最小限の設定を実現
 */

import type { ShapeNode, UnifiedNode, WidgetNode } from '@/types/canvas'

// ========================================
// Layout Types (グリッド・パネルレイアウト)
// ========================================

/** グリッドレイアウト設定 */
export interface GridLayout {
  cols: number
  gap?: number
  className?: string
}

/** パネル全体のレイアウト設定 */
export interface PanelLayout {
  width: number | string
  padding: number
  sectionGap: number
  backgroundColor?: string
}

// ========================================
// Widget Types (UIウィジェット定義)
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

// ========================================
// Preset System (プリセットシステム)
// ========================================

/**
 * プリセット参照型
 * 文字列の場合はプリセット名として解釈
 */
export type PresetRef<T> = string | T

/**
 * プリセット定義を解決してインライン化する
 */
export function resolvePreset<T>(ref: PresetRef<T>, presets: Record<string, T>): T {
  if (typeof ref === 'string') {
    const preset = presets[ref]
    if (!preset) {
      throw new Error(`Unknown preset: ${ref}`)
    }
    return preset
  }
  return ref
}

// ========================================
// Widget Configuration Types
// ========================================

/** 基本ウィジェット設定 */
interface BaseWidgetConfig {
  type: WidgetType
  labelKey?: string
  grid?: GridLayout
  condition?: (node: UnifiedNode) => boolean
  className?: string
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
  props?: { showColor?: boolean; showWidth?: boolean; minWidth?: number; maxWidth?: number }
}

export interface FillWidgetConfig extends BaseWidgetConfig {
  type: 'fill'
  props?: { showOpacity?: boolean }
}
export interface BorderWidgetConfig extends BaseWidgetConfig {
  type: 'border'
  props?: { showColor?: boolean; showWidth?: boolean }
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
  | PosSizeWidgetConfig
  | FontWidgetConfig
  | AlignmentWidgetConfig
  | VAlignmentWidgetConfig
  | StrokeWidgetConfig
  | FillWidgetConfig
  | BorderWidgetConfig
  | PolygonWidgetConfig
  | ImageWidgetConfig
  | LabelFieldWidgetConfig
  | HiddenFieldWidgetConfig
  | SelectWidgetConfig
  | ColorPickerWidgetConfig
  | SliderWidgetConfig
  | TextContentWidgetConfig
  | LineStyleWidgetConfig
  | ArrowheadWidgetConfig
  | DataBindingWidgetConfig
  | CustomWidgetConfig

// ========================================
// Section Configuration
// ========================================

/** セクション設定 */
export interface SectionConfig {
  id: string
  labelKey?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  grid?: GridLayout
  condition?: (node: UnifiedNode) => boolean
  widgets: PresetRef<WidgetConfig>[] // プリセット名またはインライン設定
}

// ========================================
// Object Panel Configuration
// ========================================

export interface ObjectPanelConfig {
  objectType: string
  header?: { iconName?: string; labelKey: string }
  sections: PresetRef<SectionConfig>[] // プリセット名またはインライン設定
}

export interface PropertyPanelConfig {
  editorType: 'report' | 'bedLayout'
  layout: PanelLayout
  defaultSections: PresetRef<SectionConfig>[]
  objects: ObjectPanelConfig[]
}

// ========================================
// Default Values (デフォルト値)
// ========================================

/** デフォルトのフォントファミリー */
export const DEFAULT_FONT_FAMILIES = [
  'Meiryo',
  'Arial',
  'Times New Roman',
  'Courier New',
  'Helvetica',
]

/** デフォルトのフォントサイズ */
export const DEFAULT_FONT_SIZES = [
  8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80,
  88, 96,
]

// ========================================
// PRESETS: Widget Presets (ウィジェットプリセット)
// ========================================

export const WIDGET_PRESETS: Record<string, WidgetConfig> = {
  // === Position & Size ===
  'posSize:full': {
    type: 'posSize',
    props: { showX: true, showY: true, showW: true, showH: true },
  },
  'posSize:position': {
    type: 'posSize',
    props: { showX: true, showY: true, showW: false, showH: false },
  },
  'posSize:size': {
    type: 'posSize',
    props: { showX: false, showY: false, showW: true, showH: true },
  },

  // === Font ===
  'font:full': {
    type: 'font',
    grid: { cols: 2, gap: 8 },
    props: {
      showFamily: true,
      showSize: true,
      showColor: false,
      showBold: true,
      showItalic: true,
      showUnderline: true,
      showStrikethrough: true,
    },
  },
  'font:basic': {
    type: 'font',
    grid: { cols: 2, gap: 8 },
    props: { showFamily: true, showSize: true, showColor: true },
  },
  'font:style': {
    type: 'font',
    props: { showBold: true, showItalic: true, showUnderline: true },
  },

  // === Alignment ===
  'align:horizontal': {
    type: 'alignment',
    labelKey: 'properties_text_align',
    props: { options: ['l', 'c', 'r'] },
  },
  'align:horizontal-simple': {
    type: 'alignment',
    props: { options: ['l', 'c', 'r'] },
  },
  'align:vertical': {
    type: 'vAlignment',
    labelKey: 'properties_vertical_align',
    props: { options: ['t', 'm', 'b'] },
  },

  // === Colors ===
  'fill:default': {
    type: 'fill',
    labelKey: 'properties_fill_color',
  },
  'border:default': {
    type: 'border',
    labelKey: 'properties_border_color',
    props: { showColor: true, showWidth: true },
  },
  'stroke:color': {
    type: 'colorPicker',
    labelKey: 'properties_line_color',
    props: { fieldKey: 'stroke' },
  },
  'stroke:width': {
    type: 'stroke',
    labelKey: 'properties_line_width',
    props: { showColor: false, showWidth: true, minWidth: 0, maxWidth: 20 },
  },
  'stroke:full': {
    type: 'stroke',
    labelKey: 'properties_stroke',
    props: { showColor: true, showWidth: true, minWidth: 0, maxWidth: 20 },
  },

  // === Line Style ===
  'lineStyle:default': {
    type: 'lineStyle',
    labelKey: 'properties_line_style',
    props: { options: ['solid', 'dashed', 'dotted'] },
  },
  'arrow:start': {
    type: 'arrowhead',
    labelKey: 'properties_arrow_start',
    props: { position: 'start' },
  },
  'arrow:end': {
    type: 'arrowhead',
    labelKey: 'properties_arrow_end',
    props: { position: 'end' },
  },

  // === Data Binding ===
  'binding:field': {
    type: 'dataBinding',
    props: { mode: 'field' },
  },
  'binding:repeater': {
    type: 'dataBinding',
    props: { mode: 'repeater' },
  },

  // === Image ===
  'image:preview': {
    type: 'image',
    props: { showPreview: true, showUploader: true, maxPreviewHeight: 120 },
  },

  // === Text Content ===
  'textContent:default': {
    type: 'textContent',
    props: { rows: 3 },
  },

  // === Label ===
  'labelField:name': {
    type: 'labelField',
    labelKey: 'label',
    props: { fieldKey: 'name' },
  },

  // === Custom ===
  'custom:delete': {
    type: 'custom',
    props: { renderKey: 'deleteButton' },
  },
  'custom:table': {
    type: 'custom',
    props: { renderKey: 'tableProperties' },
  },
}

// ========================================
// PRESETS: Section Presets (セクションプリセット)
// ========================================

export const SECTION_PRESETS: Record<string, SectionConfig> = {
  // === Common Sections ===
  'sec:posSize': {
    id: 'common-pos-size',
    widgets: ['posSize:full'],
  },
  'sec:delete': {
    id: 'common-delete',
    widgets: ['custom:delete'],
  },

  // === Text Sections ===
  'sec:text-font': {
    id: 'text-font',
    widgets: ['font:full'],
  },
  'sec:text-colors': {
    id: 'text-colors',
    grid: { cols: 3, gap: 4 },
    widgets: [
      {
        type: 'colorPicker',
        labelKey: 'properties_font_color',
        props: { fieldKey: 'fill' },
      },
      {
        type: 'colorPicker',
        labelKey: 'properties_border_color',
        props: { fieldKey: 'stroke' },
      },
      { type: 'border', props: { showColor: false, showWidth: true } },
    ],
  },
  'sec:text-alignment': {
    id: 'text-alignment',
    widgets: ['align:horizontal', 'align:vertical'],
  },
  'sec:text-content': {
    id: 'text-content',
    widgets: ['textContent:default'],
  },
  'sec:text-binding': {
    id: 'text-binding',
    widgets: ['binding:field'],
  },

  // === Shape Sections ===
  'sec:shape-colors': {
    id: 'shape-colors',
    grid: { cols: 2, gap: 4 },
    widgets: ['fill:default', 'border:default'],
  },
  'sec:shape-stroke': {
    id: 'shape-stroke',
    widgets: ['stroke:width'],
  },

  // === Line Sections ===
  'sec:line-style': {
    id: 'line-style',
    widgets: ['stroke:color', 'stroke:width', 'lineStyle:default'],
  },
  'sec:line-arrow': {
    id: 'line-arrow',
    grid: { cols: 2, gap: 4 },
    widgets: ['arrow:start', 'arrow:end'],
  },

  // === Image Sections ===
  'sec:image-preview': {
    id: 'image-preview',
    widgets: ['image:preview'],
  },

  // === Table Sections ===
  'sec:table-custom': {
    id: 'table-custom',
    widgets: ['custom:table'],
  },
  'sec:table-binding': {
    id: 'table-binding',
    widgets: ['binding:repeater'],
  },

  // === Signature Sections ===
  'sec:signature-style': {
    id: 'signature-style',
    widgets: ['stroke:color', 'stroke:width'],
  },
  'sec:signature-tolerance': {
    id: 'signature-tolerance',
    widgets: [
      {
        type: 'slider',
        labelKey: 'properties_signature_optimization',
        props: { fieldKey: 'tolerance', min: 1.0, max: 3.0, step: 0.1, showValue: true },
      },
    ],
  },

  // === Bed Sections ===
  'sec:bed-label': {
    id: 'bed-label',
    widgets: [
      {
        type: 'labelField',
        labelKey: 'properties_bed_name',
        props: { fieldKey: 'name' },
      },
    ],
  },
}

// ========================================
// Object Configurations (DRY Version)
// ========================================

export const TEXT_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'text',
  header: { iconName: 'Type', labelKey: 'properties_element_text' },
  sections: [
    'sec:text-font',
    'sec:text-colors',
    'sec:text-alignment',
    'sec:text-content',
    'sec:text-binding',
  ],
}

export const BED_LAYOUT_TEXT_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'text',
  header: { iconName: 'Type', labelKey: 'properties_element_text' },
  sections: ['sec:text-font', 'sec:text-colors', 'sec:text-alignment', 'sec:text-content'],
}

export const SHAPE_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'shape',
  header: { iconName: 'Square', labelKey: 'properties_element_shape' },
  sections: [
    'sec:shape-colors',
    'sec:shape-stroke',
    {
      id: 'shape-polygon',
      condition: (node) => (node as ShapeNode).shape === 'star',
      widgets: [
        {
          type: 'polygon',
          labelKey: 'properties_vertex_count',
          props: { min: 3, max: 12, step: 1 },
        },
      ],
    },
  ],
}

export const LINE_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'line',
  header: { iconName: 'Minus', labelKey: 'properties_element_line' },
  sections: ['sec:line-style', 'sec:line-arrow'],
}

export const IMAGE_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'image',
  header: { iconName: 'Image', labelKey: 'properties_element_image' },
  sections: ['sec:image-preview'],
}

export const TABLE_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'table',
  header: { iconName: 'Table', labelKey: 'properties_element_table' },
  sections: ['sec:table-custom', 'sec:table-binding'],
}

export const SIGNATURE_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'signature',
  header: { iconName: 'PenTool', labelKey: 'toolbar_signature' },
  sections: ['sec:signature-style', 'sec:signature-tolerance'],
}

export const WIDGET_BED_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'widget:bed',
  header: { iconName: 'Bed', labelKey: 'toolbar_bed' },
  sections: ['sec:bed-label'],
}

// ========================================
// Editor Configurations
// ========================================

export const DEFAULT_PANEL_LAYOUT: PanelLayout = {
  width: 256,
  padding: 16,
  sectionGap: 16,
  backgroundColor: 'theme-bg-secondary',
}

export const REPORT_PANEL_CONFIG: PropertyPanelConfig = {
  editorType: 'report',
  layout: { ...DEFAULT_PANEL_LAYOUT, width: 288 },
  defaultSections: ['sec:posSize'],
  objects: [
    TEXT_OBJECT_CONFIG,
    SHAPE_OBJECT_CONFIG,
    LINE_OBJECT_CONFIG,
    IMAGE_OBJECT_CONFIG,
    TABLE_OBJECT_CONFIG,
    SIGNATURE_OBJECT_CONFIG,
  ],
}

export const BED_LAYOUT_PANEL_CONFIG: PropertyPanelConfig = {
  editorType: 'bedLayout',
  layout: DEFAULT_PANEL_LAYOUT,
  defaultSections: ['sec:posSize'],
  objects: [
    BED_LAYOUT_TEXT_OBJECT_CONFIG,
    SHAPE_OBJECT_CONFIG,
    LINE_OBJECT_CONFIG,
    IMAGE_OBJECT_CONFIG,
    WIDGET_BED_OBJECT_CONFIG,
  ],
}

// ========================================
// Helper Functions
// ========================================

/** オブジェクトタイプに対応する設定を取得 */
export function getObjectConfig(
  config: PropertyPanelConfig,
  node: UnifiedNode
): ObjectPanelConfig | undefined {
  if (node.t === 'widget') {
    const widgetNode = node as WidgetNode
    return config.objects.find((obj) => obj.objectType === `widget:${widgetNode.widget}`)
  }
  return config.objects.find((obj) => obj.objectType === node.t)
}

/** プリセット名からセクション設定を解決 */
export function resolveSection(ref: PresetRef<SectionConfig>): SectionConfig {
  return resolvePreset(ref, SECTION_PRESETS)
}

/** プリセット名からウィジェット設定を解決 */
export function resolveWidget(ref: PresetRef<WidgetConfig>): WidgetConfig {
  return resolvePreset(ref, WIDGET_PRESETS)
}

/** 条件を満たすセクションのみをフィルタリング */
export function getVisibleSections(
  sectionRefs: PresetRef<SectionConfig>[],
  node: UnifiedNode
): SectionConfig[] {
  return sectionRefs
    .map(resolveSection)
    .filter((section) => !section.condition || section.condition(node))
}

/** 条件を満たすウィジェットのみをフィルタリング */
export function getVisibleWidgets(
  widgetRefs: PresetRef<WidgetConfig>[],
  node: UnifiedNode
): WidgetConfig[] {
  return widgetRefs
    .map(resolveWidget)
    .filter((widget) => !widget.condition || widget.condition(node))
}
