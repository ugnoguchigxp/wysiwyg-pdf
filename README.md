# wysiwyg-pdf

`wysiwyg-pdf` is a **React + Konva** WYSIWYG editor toolkit for building **print-ready (A4 portrait/landscape) templates** in the browser.

npm: https://www.npmjs.com/package/wysiwyg-pdf

It is designed as a set of **composable editor building blocks**:

- **Canvas editor** (`ReportKonvaEditor`) for selection, transform, drag/drop, inline text editing, copy/paste
- **Toolbar** (`WysiwygEditorToolbar`) for inserting elements and controlling zoom
- **Properties panel** (`WysiwygPropertiesPanel`) for editing typography, colors, line styles, table structure, page background
- **Print/PDF layout** (`PrintLayout`) to render a DOM representation that prints cleanly

If you are evaluating whether to adopt this package, the key question is:

- Do you want a **ready-to-integrate template editor UI** where the persisted state is a plain JSON document (`ITemplateDoc`), and printing is handled by your app (e.g., via `react-to-print`)?

## Screenshots

<img
  src="https://raw.githubusercontent.com/ugnoguchigxp/wysiwyg-pdf/main/assets/EditorScreenshot.png"
  alt="Editor screenshot"
  width="900"
/>

<img
  src="https://raw.githubusercontent.com/ugnoguchigxp/wysiwyg-pdf/main/assets/documentViewer.png"
  alt="Document viewer screenshot"
  width="900"
/>

<img
  src="https://raw.githubusercontent.com/ugnoguchigxp/wysiwyg-pdf/main/assets/BedLayoutViewer.png"
  alt="Bed layout viewer screenshot"
  width="900"
/>

## What you get

- **Editable template document model** (`ITemplateDoc` with `pages` + `elements`)
- **Element types**: Text, Shapes, Line, Image, Table (see types exported from `pdf-editor/types/wysiwyg`)
- **Keyboard shortcuts**: undo/redo, delete, select all, arrow-key move, copy/paste
- **A4-aware coordinate system** (internal PT units with display scaling)
- **Printing support** via a dedicated print DOM layout + print CSS

## Non-goals (important for adoption decisions)

- This is **not** a full “template management product” (no backend, no auth, no persistence API)
- This is **not** a PDF renderer library; printing is done via the browser
- Multi-page UI navigation is not provided as a complete workflow (the model supports pages; your app controls UX)

## Installation

```bash
npm i wysiwyg-pdf
```

### Peer dependencies

- `react`
- `react-dom`

Use versions compatible with this package’s `peerDependencies`.

## Requirements & integration notes

### 1) i18n (react-i18next)

UI strings are retrieved via `react-i18next` (`useTranslation()`).

You must initialize i18next in the host app.

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: {} },
  },
});
```

### 2) Styling (Tailwind classes + theme CSS variables)

The UI relies heavily on:

- Tailwind utility classes (layout, spacing, borders)
- Theme CSS variables such as `--theme-bg-primary`, `--theme-text-primary`, etc.

You should either:

- Use Tailwind in your host app and define the required `--theme-*` variables
- Or port the CSS from `wysiwyg-pdf/example/src/index.css` (and the root `src/index.css` in this repository) to your project

### 3) Print CSS import

`PrintLayout` imports a `print.css` internally.
Your bundler must support resolving CSS imports from dependencies.

## Quick start (minimal editor shell)

This is a minimal composition based on `wysiwyg-pdf/example/src/App.tsx`.

```tsx
import { useRef, useState } from 'react';
import {
  ReportKonvaEditor,
  WysiwygEditorToolbar,
  WysiwygPropertiesPanel,
  type ITemplateDoc,
  type ReportKonvaEditorHandle,
  useReportHistory,
} from 'wysiwyg-pdf';

const INITIAL_DOC: ITemplateDoc = {
  meta: { id: 'doc-1', name: 'New Template', version: 1 },
  pages: [
    {
      id: 'page-1',
      size: 'A4',
      margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'pt' },
      background: { color: '#ffffff' },
    },
  ],
  elements: [],
};

export function EditorPage() {
  const [zoom, setZoom] = useState(100);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{
    elementId: string;
    row: number;
    col: number;
  } | null>(null);

  const { document: doc, setDocument, undo, redo } = useReportHistory(INITIAL_DOC);
  const editorRef = useRef<ReportKonvaEditorHandle>(null);

  const currentPageId = doc.pages[0]?.id;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-16 border-r">
        <WysiwygEditorToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          templateDoc={doc}
          onTemplateChange={setDocument}
          onSelectElement={(id) => setSelectedElementId(id)}
          currentPageId={currentPageId}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <ReportKonvaEditor
          ref={editorRef}
          templateDoc={doc}
          zoom={zoom / 100}
          selectedElementId={selectedElementId || undefined}
          onElementSelect={(el) => setSelectedElementId(el?.id ?? null)}
          onTemplateChange={setDocument}
          currentPageId={currentPageId}
          onSelectedCellChange={setSelectedCell}
          onUndo={undo}
          onRedo={redo}
        />
      </div>

      <div className="w-72 border-l overflow-hidden">
        <WysiwygPropertiesPanel
          templateDoc={doc}
          selectedElementId={selectedElementId}
          onTemplateChange={setDocument}
          currentPageId={currentPageId}
          selectedCell={selectedCell}
        />
      </div>
    </div>
  );
}
```

## Printing / “Save as PDF” (react-to-print)

`PrintLayout` renders a print-optimized DOM. Pair it with `react-to-print`.

```tsx
import { useRef } from 'react';
import { PrintLayout, type ITemplateDoc } from 'wysiwyg-pdf';
import { useReactToPrint } from 'react-to-print';

export function PrintButton({
  doc,
  orientation,
}: {
  doc: ITemplateDoc;
  orientation: 'portrait' | 'landscape';
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const print = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4 ${orientation};
        margin: 0;
      }
    `,
  } as any);

  return (
    <>
      <div style={{ display: 'none' }}>
        <PrintLayout ref={printRef} doc={doc} orientation={orientation} />
      </div>
      <button type="button" onClick={() => print()}>
        Print / Save as PDF
      </button>
    </>
  );
}
```

## Optional: data binding support via schema

The properties panel can receive an optional `schema?: IDataSchema`.

- `IDataSchema` is defined in `src/types/schema.ts`
- Text elements can carry a `binding` field (field binding)
- Table elements can be used for “repeater-like” content (your app defines runtime semantics)

## Public API (high-level)

From `src/index.ts`, typical consumers use:

- `ReportEditor` (pre-composed editor shell)
- `ReportKonvaEditor` / `ReportKonvaEditorHandle`
- `WysiwygEditorToolbar`
- `WysiwygPropertiesPanel`
- `PrintLayout`
- `EditorHeader`
- `ShortcutHelpModal`
- `useReportHistory`
- Types: `ITemplateDoc`, `IPage`, `ITemplateMeta`, `PageSize`, `Element`, `IDataSchema`

This package also exports bed-layout related components (e.g., `BedLayoutEditor`, `BedPrintLayout`).

## Component Customization

You can customize the editor components to fit your application's needs or build your own variants.

### Header Customization (`EditorHeader`)

The `EditorHeader` component supports customization via props:

- **orientationOptions**: Define your own set of orientation choices (e.g., 'Square').
- **children**: Render custom buttons or actions (e.g., Theme Toggle, Save status).

```tsx
<EditorHeader
  // ... other props
  orientationOptions={[
    { label: 'Portrait', value: 'portrait' },
    { label: 'Landscape', value: 'landscape' },
    { label: 'Square', value: 'square' },
  ]}
>
  <button onClick={myCustomAction}>My Action</button>
</EditorHeader>
```

You can also wrap it in your own component (like `BedLayoutHeader` does) to preset these options.

### Toolbar Customization

The toolbar (`WysiwygEditorToolbar` or `BedToolbar`) is simply a consumer of the editor state. If you need a fully custom toolbar:
1.  Create your own component.
2.  Use the state handlers provided by `useReportHistory` or `useBedEditorHistory` (e.g., `setDocument`, `undo`, `redo`).
3.  Manage tool state (e.g., `activeTool`) in your parent page and pass it to your toolbar.

### Property Panel Customization

The property panel (`WysiwygPropertiesPanel`) updates the selected element's attributes. To customize it:
- You can create a copy of the panel and add/remove fields.
- Or, if you just need to support new element types, extend the rendering logic for those types.
- The panel receives `selectedElement` and `onChange`. You can wrap it or conditional render different panels based on `selectedElement.type`.

### I18n Overrides

If your application uses different translation keys or if you want to override specific labels without setting up a full i18next resource bundle, you can use the `i18nOverrides` prop.

This prop is supported by `EditorHeader`, `WysiwygEditorToolbar`, `BedToolbar`, `WysiwygPropertiesPanel`, and `PropertyPanel` (BedLayout).

```tsx
<EditorHeader
  // ...
  i18nOverrides={{
    'editor_orientation': 'Page Orientation', // Override specific key
    'orientations_portrait': 'Vertical',
    'save': 'Save Changes',
  }}
/>

<WysiwygPropertiesPanel
  // ...
  i18nOverrides={{
    'properties_layout': 'Layout Settings',
    'properties_text_align': 'Alignment',
  }}
/>
```

Common keys you might want to override:
- **Header**: `editor_orientation`, `save`, `back`, `toolbar_undo`, `toolbar_redo`
- **Toolbar**: `toolbar_text`, `toolbar_image`, `toolbar_shape`, `toolbar_line`
- **Properties**: `properties_layout`, `properties_font`, `color`, `position`

## Development (in this repository)

An interactive reference app is available under `wysiwyg-pdf/example`.

```bash
pnpm install
pnpm -C wysiwyg-pdf/example dev
```

## Packaging notes (for maintainers)

If you publish this to npm, ensure you have a proper build output (e.g., `dist/`) and configure `main`/`module`/`types`/`exports` accordingly.
Also ensure CSS assets (e.g., `print.css`) are included in the published files.

## License

MIT
