# wysiwyg-pdf

`wysiwyg-pdf` is a **React + Konva** WYSIWYG editor toolkit for building **print-ready (A4 portrait/landscape) templates** in the browser.

npm: https://www.npmjs.com/package/wysiwyg-pdf

It is designed as a set of **composable editor building blocks**:

- **Canvas editor** (`ReportKonvaEditor`) for selection, transform, drag/drop, inline text editing, copy/paste
- **Toolbar** (`WysiwygEditorToolbar`) for inserting elements and controlling zoom
- **Properties panel** (`WysiwygPropertiesPanel`) for editing typography, colors, line styles, table structure, page background
- **Print/PDF layout** (`PrintLayout`) to render a DOM representation that prints cleanly

If you are evaluating whether to adopt this package, the key question is:

- Do you want a **ready-to-integrate template editor UI** where the persisted state is a plain JSON document (`Doc`), and printing is handled by your app (e.g., via `react-to-print`)?

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

- **Editable template document model** (`Doc` with `surfaces` + `nodes`)
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

### 1) i18n (host-provided translator)

This package does not ship an i18n library. Instead, you inject a translator function via `I18nProvider`.

`t` is optional; if omitted, the default translator returns `fallback ?? key`.

```tsx
import { I18nProvider } from 'wysiwyg-pdf'

export function App() {
  return (
    <I18nProvider t={(key, fallback) => fallback ?? key}>
      {/* your editor UI */}
    </I18nProvider>
  )
}
```

If your app already uses `react-i18next`, you can bridge it:

```tsx
import { I18nProvider } from 'wysiwyg-pdf'
import { useTranslation } from 'react-i18next'

export function App() {
  const { t } = useTranslation()
  return <I18nProvider t={(key, fallback) => t(key, fallback ?? key)}>{/* ... */}</I18nProvider>
}
```

### 2) Styling (Tailwind classes + theme CSS variables)

The UI relies heavily on:

- Tailwind utility classes (layout, spacing, borders)
- shadcn-style CSS variables such as `--background`, `--foreground`, `--primary`, `--border`, etc.

You should:

- Use Tailwind in your host app, and ensure Tailwind scans this package for class usage
- Define the required shadcn-style CSS variables in your global CSS (light/dark)

This package also ships a base stylesheet you can import (recommended):

```ts
import 'wysiwyg-pdf/styles.css'
```

#### Tailwind content/@source setup (host app)

Because this package uses Tailwind class strings at runtime, your host app’s Tailwind build must include this package in its scan targets.

Tailwind v3/v4 (tailwind.config):

```js
// tailwind.config.{js,ts}
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/wysiwyg-pdf/dist/**/*.{js,cjs,mjs}',
  ],
}
```

Tailwind v4 (@source):

```css
/* your app entry CSS */
@source "../node_modules/wysiwyg-pdf/dist/**/*.{js,cjs,mjs}";
```

#### CSS variables (host app)

Define shadcn-style tokens in your global CSS. Minimal example:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 210 20% 10%;
  --card: 0 0% 100%;
  --card-foreground: 210 20% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 210 20% 10%;
  --primary: 220 90% 45%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 96%;
  --secondary-foreground: 210 20% 10%;
  --muted: 0 0% 96%;
  --muted-foreground: 210 10% 45%;
  --accent: 210 100% 26%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 75% 65%;
  --destructive-foreground: 0 0% 100%;
  --border: 210 16% 82%;
  --input: 210 16% 82%;
  --ring: 210 100% 26%;
  --radius: 0.5rem;
}

.dark {
  --background: 210 20% 10%;
  --foreground: 210 30% 96%;
  --card: 210 20% 10%;
  --card-foreground: 210 30% 96%;
  --popover: 210 20% 10%;
  --popover-foreground: 210 30% 96%;
  --primary: 200 95% 42%;
  --primary-foreground: 210 20% 10%;
  --secondary: 210 20% 16%;
  --secondary-foreground: 210 30% 96%;
  --muted: 210 20% 16%;
  --muted-foreground: 210 15% 60%;
  --accent: 210 85% 42%;
  --accent-foreground: 210 20% 10%;
  --destructive: 0 75% 38%;
  --destructive-foreground: 210 30% 96%;
  --border: 210 20% 30%;
  --input: 210 20% 30%;
  --ring: 210 85% 42%;
}
```

And in your Tailwind config, map the tokens (shadcn convention):

```js
// tailwind.config.{js,ts}
export default {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
}
```

### 3) Print CSS import

`PrintLayout` imports a `print.css` internally.
Your bundler must support resolving CSS imports from dependencies.

If your bundler requires an explicit import, you can also import it directly:

```ts
import 'wysiwyg-pdf/print.css'
```

## Quick start (minimal editor shell)

This is a minimal composition based on `wysiwyg-pdf/example/src/App.tsx`.

```tsx
import { useRef, useState } from 'react';
import {
  ReportKonvaEditor,
  WysiwygEditorToolbar,
  WysiwygPropertiesPanel,
  type Doc,
  type ReportKonvaEditorHandle,
  useReportHistory,
} from 'wysiwyg-pdf';

const INITIAL_DOC: Doc = {
  v: 1,
  id: 'doc-1',
  title: 'New Template',
  unit: 'pt',
  surfaces: [
    {
      id: 'page-1',
      type: 'page',
      w: 595.28,
      h: 841.89,
      margin: { t: 0, r: 0, b: 0, l: 0 },
      bg: '#ffffff',
    },
  ],
  nodes: [],
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

  const currentPageId = doc.surfaces[0]?.id;

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
import { PrintLayout, type Doc } from 'wysiwyg-pdf';
import { useReactToPrint } from 'react-to-print';

export function PrintButton({
  doc,
  orientation,
}: {
  doc: Doc;
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
- Types: `Doc`, `Surface`, `UnifiedNode`, `PageSize`, `IDataSchema`

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
