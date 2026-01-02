# Excel Import Edit Capability Plan

## Overview
This plan outlines the roadmap to implement full editing capabilities for imported Excel tables within the `Report Editor`. The goal is to provide "Aspose-quality" editing features, allowing users to modify layouts, styles, and contents with high fidelity.

**Key Principles:**
*   **Fidelity:** Maintain Excel-like behavior (borders, formats, overflowing text).
*   **Undo/Redo Support:** Every cell modification must be trackable in the history stack.
*   **Stability:** Avoid complex structural changes (like merging/splitting cells) in the initial phase to maintain stability.

## Phase 1: Enhanced Property Panel

Expand `TableProperties` to support detailed styling and Excel-specific settings.

### 1-1. Detailed Border Editor
Excel cells rely heavily on complex borders.
*   **UI Component**: Add "Border Editor".
    *   **Sides**: Top, Bottom, Left, Right, All, Outside, Inside.
    *   **Styles**: Solid, Dashed, Dotted, Double, Line Weights (Thin, Medium, Thick).
    *   **Color**: Independant color picker for borders.
*   **Data Structure**: Update `updateCells` to handle `cell.borders` object (e.g., `{ t: { style, width, color }, ... }`) explicitly.

### 1-2. Layout & Overflow Settings
Allow users to control how content behaves within the cell.
*   **Wrap Text**: Toggle `cell.wrap`.
*   **Overflow Behavior**: If wrap is OFF, allow text to visually overflow into empty adjacent cells (Excel default) or clip (current Web default). *Note: Implementation requires rendering logic adjustment.*
*   **Padding**: Fine-tune cell padding (defaulting to tight Excel-like spacing).

### 1-3. Number Formatting (New)
Support Excel-compatible number formats (e.g., Currency, Date, Percent).
*   **UI**: "Format" dropdown (General, Number, Currency, Short Date, Long Date, Time, Percentage, Text) + Custom Format string input.
*   **Logic**: Use generic standard format strings compatible with Excel (e.g., `#,##0.00`, `yyyy-mm-dd`).
*   **Preview**: Show live preview of the formatted value in the panel.

## Phase 2: In-place Cell Editing

Directly edit cell content on the canvas.

### 2-1. Cell Interaction
*   **Single Click**: Select cell (show properties).
*   **Double Click**: Enter "Edit Mode".
*   **Range Selection (Future)**: Drag to select multiple cells for bulk property updates.

### 2-2. Overlay Editor
Create `src/components/canvas/CellEditOverlay.tsx`.
*   **Positioning**: overlay exactly on top of the cell.
*   **Styling**: Match font, size, and alignment of the underlying cell.
*   **Input**:
    *   Plain text editing initially.
    *   `Enter`: Commit and move selection down.
    *   `Tab`: Commit and move selection right.
    *   `Esc`: Cancel.
*   **History**: Committing a change triggers a history push (Undo/Redo checkpoint).

## Phase 3: Rich Text Support

Support mixed styling within a single cell (e.g., "Price: **$100**").

### 3-1. Data Structure Update
Define `RichTextFragment` in `types/canvas.ts`.
```typescript
interface Cell {
  v: string // Plain text value (for calculation/sort)
  richText?: {
    text: string
    font?: string
    bold?: boolean
    color?: string
    // ...
  }[]
}
```

### 3-2. Editor Implementation
*   **ContentEditable**: Use `div[contenteditable]` for the overlay.
*   **Mini Toolbar**: Floating toolbar for partial text selection styling (Bold, Italic, Color).

## Phase 4: Structural Operations (Restricted)

Focus on resizing and basic row/column operations. **Merging/Splitting cells is OUT OF SCOPE** for now to ensure stability.

### 4-1. Resizing
*   **Row/Column Headers**: Implement interactive headers (like Excel's ruler) outside the table area or on hover edges.
*   **Action**: Drag edge to update `table.rows[i]` or `table.cols[i]`.

### 4-2. Insert/Delete
*   **Context Menu**:
    *   Insert Row Above/Below
    *   Insert Column Left/Right
    *   Delete Row/Column
*   **Constraint**: If the operation intersects with a Merged Cell, validate standard Excel behavior (or block the operation if too complex).

## Architecture & History

To ensure Undo/Redo works correctly with the `FULL_TABLE` update strategy:
*   **Action Granularity**: Although the `TableNode` is large, React state updates will replace the node instance. `useReportHistory` handles this node replacement.
*   **Optimization**: Ensure `activeData` extraction in `TableProperties` is efficient.
*   **Cell Identity**: Rely on `row` and `col` indices.

## Implementation Roadmap

1.  **Step 1**: Phase 1.1 (Borders) & 1.3 (Number Formatting). *Critical for visual fidelity.*
2.  **Step 2**: Phase 2 (In-place Editing). *Critical for usability.*
3.  **Step 3**: Phase 1.2 (Overflow) & Phase 4 (resize).
4.  **Step 4**: Phase 3 (Rich Text).
