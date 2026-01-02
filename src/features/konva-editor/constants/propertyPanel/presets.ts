import type { SectionConfig, WidgetConfig } from './types'

// ========================================
// Default Values
// ========================================

export const DEFAULT_FONT_FAMILIES = [
  'Meiryo',
  'Arial',
  'Times New Roman',
  'Courier New',
  'Helvetica',
]

export const DEFAULT_FONT_SIZES = [
  8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80,
  88, 96,
]

// ========================================
// PRESETS: Widget Presets
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
    props: { showColor: false, showWidth: true, minWidth: 0, maxWidth: 20, step: 0.2 },
  },
  'stroke:full': {
    type: 'stroke',
    labelKey: 'properties_stroke',
    props: { showColor: true, showWidth: true, minWidth: 0, maxWidth: 20, step: 0.2 },
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
  'list:default': {
    type: 'list',
    labelKey: 'properties_list',
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
// PRESETS: Section Presets
// ========================================

export const SECTION_PRESETS: Record<string, SectionConfig> = {
  // === Common Sections ===
  'sec:text-vertical': {
    id: 'common-text-vertical',
    condition: (node) => node.t === 'text',
    widgets: [
      {
        type: 'checkbox',
        labelKey: 'properties_vertical_text',
        props: { fieldKey: 'vertical' },
      },
    ],
  },
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
  'sec:text-style': {
    id: 'text-style',
    grid: { cols: 3, gap: 4 },
    widgets: [
      {
        type: 'colorPicker',
        labelKey: 'properties_font_color',
        props: { fieldKey: 'fill' },
      },
      {
        type: 'colorPicker',
        labelKey: 'properties_background_color',
        props: { fieldKey: 'backgroundColor' },
      },
      {
        type: 'colorPicker',
        labelKey: 'properties_border_color_box',
        props: { fieldKey: 'borderColor' },
      },
      {
        type: 'numberInput',
        labelKey: 'properties_border_width_box',
        props: { fieldKey: 'borderWidth', min: 0, step: 0.1, unit: 'mm' },
      },
      {
        type: 'numberInput',
        labelKey: 'properties_padding',
        props: { fieldKey: 'padding', min: 0, step: 0.5, unit: 'mm' },
      },
      {
        type: 'select',
        labelKey: 'properties_corner_radius', // Need to make sure this key exists or fallback
        props: {
          fieldKey: 'cornerRadius',
          options: [
            { value: '0', labelKey: '0%' },
            { value: '0.25', labelKey: '25%' },
            { value: '0.5', labelKey: '50%' },
            { value: '0.75', labelKey: '75%' },
            { value: '1', labelKey: '100%' },
          ],
        },
      },
    ],
  },
  'sec:text-alignment': {
    id: 'text-alignment',
    widgets: ['align:horizontal', 'align:vertical'],
  },
  'sec:text-list': {
    id: 'text-list',
    widgets: ['list:default'],
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
    widgets: [
      'stroke:color',
      'stroke:width',
      'lineStyle:default',
      {
        type: 'checkbox',
        labelKey: 'properties_smart_connection',
        props: { fieldKey: 'routing' },
      },
    ],
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
