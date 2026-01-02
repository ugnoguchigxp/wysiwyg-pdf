import type { ShapeNode } from '@/types/canvas'
import type { ObjectPanelConfig } from './types'

// ========================================
// Object Configurations
// ========================================

export const TEXT_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'text',
  header: { iconName: 'Type', labelKey: 'properties_element_text' },
  sections: [
    {
      id: 'text-font',
      widgets: [
        // Use custom config to ensure Color is shown in the new FontWidget
        {
          type: 'font',
          grid: { cols: 2, gap: 8 },
          props: {
            showFamily: true,
            showSize: true,
            showColor: true, // Now integrated in FontWidget
            showBold: true,
            showItalic: true,
            showUnderline: true,
            showStrikethrough: true,
          },
        },
      ],
    },
    // Frame Section (Checkbox Toggle)
    {
      id: 'text-frame',
      labelKey: 'properties_frame',
      grid: { cols: 2, gap: 2 }, // gap-2 (8px). gap-8 was 32px!
      widgets: [
        // Row 1: Checkbox & Background Color
        {
          type: 'checkbox',
          labelKey: 'properties_show_frame', // "枠線をつける"
          props: { fieldKey: 'hasFrame' },
          // Default colSpan is 1
        },
        {
          type: 'colorPicker',
          labelKey: 'properties_background_color',
          props: { fieldKey: 'backgroundColor' },
          condition: (node) => (node as { hasFrame?: boolean }).hasFrame === true,
          // Default colSpan is 1
        },
        // Row 2: Border Color & Border Width
        {
          type: 'colorPicker',
          labelKey: 'properties_border_color_box',
          props: { fieldKey: 'borderColor' },
          condition: (node) => (node as { hasFrame?: boolean }).hasFrame === true,
          // Default colSpan is 1
        },
        {
          type: 'numberInput',
          labelKey: 'properties_border_width_box',
          props: { fieldKey: 'borderWidth', min: 0, step: 0.2, unit: 'mm' },
          condition: (node) => (node as { hasFrame?: boolean }).hasFrame === true,
          // Default colSpan is 1
        },
        // Row 3: Padding & Corner Radius
        {
          type: 'numberInput',
          labelKey: 'properties_padding',
          props: { fieldKey: 'padding', min: 0, step: 0.5, unit: 'mm' },
          condition: (node) => (node as { hasFrame?: boolean }).hasFrame === true,
          // Default colSpan is 1
        },
        {
          type: 'select',
          labelKey: 'properties_corner_radius',
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
          condition: (node) => (node as { hasFrame?: boolean }).hasFrame === true,
          // Default colSpan is 1
        },
      ],
    },
    'sec:text-alignment',
    'sec:text-list',
    'sec:text-content',
    'sec:text-binding',
  ],
}

export const BED_LAYOUT_TEXT_OBJECT_CONFIG: ObjectPanelConfig = {
  objectType: 'text',
  header: { iconName: 'Type', labelKey: 'properties_element_text' },
  sections: [
    'sec:text-font',
    'sec:text-colors',
    'sec:text-alignment',
    'sec:text-list',
    'sec:text-content',
  ],
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
  sections: ['sec:posSize', 'sec:bed-label'],
}
