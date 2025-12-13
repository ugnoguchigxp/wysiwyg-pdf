# Lint Fix Checklist: Remove `any` Type Usage

This document tracks the progress of removing explicit `any` types from the codebase.
Total Warnings: 213 (all `@typescript-eslint/no-explicit-any`)

## Source Code (High Priority)
These files affect the application runtime and should be prioritized.

- [x] `src/components/canvas/CanvasElementRenderer.tsx` (1 warning)
- [x] `src/modules/konva-editor/report-editor/pdf-editor/components/Toolbar/WysiwygEditorToolbar.tsx` (1 warning)

## Test Code (Medium Priority)
These files use `any` frequently for mocking purposes. They should be refactored to use proper mock types or `unknown` where appropriate.

- [x] `Test/src/types/schema.test.ts` (3 warnings)
- [x] `Test/src/modules/konva-editor/signature-editor/SignatureKonvaEditor.test.tsx` (5 warnings)
- [x] `Test/src/modules/konva-editor/report-editor/pdf-editor/components/WysiwygCanvas/pageUtils.test.ts` (4 warnings)
- [x] `Test/src/modules/konva-editor/utils/dashboardAdapter.test.ts` (15 warnings)
- [x] `Test/src/modules/konva-editor/report-editor/pdf-editor/components/PropertiesPanel/WysiwygPropertiesPanel.test.tsx` (Multiple warnings)
- [x] `Test/src/modules/konva-editor/report-editor/pdf-editor/components/WysiwygCanvas/canvasImageUtils.test.ts` (Multiple warnings)

## Strategy
1.  **Source Code**: Replaced `any` with specific interfaces (`ShapeNode['shape']`, `React.RefObject`).
2.  **Test Code**:
    -   Note: Test files have been excluded from linting per user request (`Test/**` added to `globalIgnores` in `eslint.config.js`).
    -   However, types were still improved in these files to ensure robustness.
    -   All verify steps pass.
