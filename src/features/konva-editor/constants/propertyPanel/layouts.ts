import {
  BED_LAYOUT_TEXT_OBJECT_CONFIG,
  IMAGE_OBJECT_CONFIG,
  LINE_OBJECT_CONFIG,
  SHAPE_OBJECT_CONFIG,
  SIGNATURE_OBJECT_CONFIG,
  TABLE_OBJECT_CONFIG,
  TEXT_OBJECT_CONFIG,
  WIDGET_BED_OBJECT_CONFIG,
} from './objects'
import type { PanelLayout, PropertyPanelConfig } from './types'

// ========================================
// Editor Configurations
// ========================================

export const DEFAULT_PANEL_LAYOUT: PanelLayout = {
  width: 256,
  padding: 16,
  sectionGap: 16,
  backgroundColor: 'secondary',
}

export const REPORT_PANEL_CONFIG: PropertyPanelConfig = {
  editorType: 'report',
  layout: { ...DEFAULT_PANEL_LAYOUT, width: 288 },
  defaultSections: ['sec:text-vertical', 'sec:posSize'],
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
  defaultSections: ['sec:text-vertical', 'sec:posSize'],
  objects: [
    BED_LAYOUT_TEXT_OBJECT_CONFIG,
    SHAPE_OBJECT_CONFIG,
    LINE_OBJECT_CONFIG,
    IMAGE_OBJECT_CONFIG,
    WIDGET_BED_OBJECT_CONFIG,
  ],
}

export const MINDMAP_PANEL_CONFIG: PropertyPanelConfig = {
  editorType: 'report', // Re-use report type for now as schema is similar
  layout: DEFAULT_PANEL_LAYOUT,
  defaultSections: ['sec:text-vertical', 'sec:posSize'],
  objects: [TEXT_OBJECT_CONFIG, SHAPE_OBJECT_CONFIG, LINE_OBJECT_CONFIG, IMAGE_OBJECT_CONFIG],
}
