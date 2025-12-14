import type { } from './global'
// Components

// Bed Layout Components
// Bed Layout Components
export * from './components/canvas/KonvaViewer'
export * from './features/bed-layout-editor/BedLayoutEditor'
export * from './features/konva-editor/viewers/BedLayoutViewer'
export * from './features/konva-editor/renderers/print/BedPrintLayout'
export { PropertyPanel as BedPropertyPanel } from './features/bed-layout-editor/components/PropertyPanel/PropertyPanel'
export {
  Toolbar as BedToolbar,
  type ToolType,
} from './features/bed-layout-editor/components/Toolbar/Toolbar'
export { BedLayoutHeader } from './features/bed-layout-editor/components/Header/BedLayoutHeader'
// Hooks
export * from './features/konva-editor/hooks/useEditorHistory'
export * from './features/konva-editor/hooks/useEditorState'
// export * from './features/bed-layout-editor/hooks/useBedLayoutSave'; // Moved to app
export * from './features/report-editor/hooks/useReportHistory'
export * from './features/konva-editor/renderers/print/ReportPrintLayout'
export * from './features/report-editor/components/PropertyPanel/WysiwygPropertiesPanel'
export * from './features/report-editor/components/Toolbar/WysiwygEditorToolbar'
export * from './features/report-editor/components/Header/EditorHeader'
export * from './features/report-editor/components/Modals/ShortcutHelpModal'
export * from './features/report-editor/ReportKonvaEditor'
export * from './features/report-editor/ReportEditor'
export * from './types/schema'

// export * from './features/report-editor/hooks/useTemplateSave'; // Moved to app
// export * from './features/bed-layout-dashboard/hooks/useBedStatusSocket'; // Moved to app

export * from './features/bed-layout-dashboard/types'
// export * from './features/report-editor/types/wysiwyg';
export type {
  UnifiedNode,
  TextNode,
  ShapeNode,
  LineNode,
  ImageNode,
  GroupNode,
  TableNode,
  SignatureNode,
  WidgetNode,
  ICanvasEditorProps,
  Surface,
  Doc,
  PageSize,
} from './features/konva-editor/types' // Wait, check UnifiedNode location.
// UnifiedNode was in pdf-editor/types/wysiwyg.
// I moved pdf-editor... wait, where did types go?
// pdf-editor had `types` folder?
// Step 81 list_dir output: ReportKonvaEditor.tsx, ReportEditor.tsx, hooks, pdf-editor.
// Step 91 list_dir report-editor/pdf-editor: output -> ContextMenu, Editor, Header, Modals, PrintLayout.tsx, PropertiesPanel, Toolbar, WysiwygCanvas.
// I DO NOT SEE `types` folder in Step 91 output for `pdf-editor`???
// Step 22 index.ts line 41: `./features/konva-editor/types`
// Why did I miss `types` in Step 91?
// Maybe it was hidden or I missed it?
// Let's assume I missed it and check if I deleted it (via src/modules rm).
// If so, I need to restore `src/features/report-editor/pdf-editor/types`.
//
// Types
// export * from './types/canvas'; // Re-exported by konva-editor/types
export * from './components/ui/Modal'
export * from './features/konva-editor/types'
export { SettingsDrawer } from './features/konva-editor/components/SettingsDrawer'
export * from './features/konva-editor/signature/SignatureKonvaEditor'
