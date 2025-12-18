
# AI Instructions

This repository uses a single, unified document format: **`Doc` v1** (`src/types/canvas.ts`).

## What is persisted

- **Persist / exchange**: `Doc` (`v, id, title, unit, surfaces, nodes, links?, binding?, animation?, snap?`)
- **Do not persist**: editor-only UI state (selection, history, etc.). Keep it in the host application.

---

# Host (consumer) project setup (Styling)

The UI is built with Tailwind class strings and shadcn-style CSS variables (e.g. `--background`).

## 1) Import CSS

Recommended:

```ts
import 'wysiwyg-pdf/styles.css'
```

If you use `PrintLayout`:

```ts
import 'wysiwyg-pdf/print.css'
```

## 2) Make Tailwind scan this package

Your Tailwind build must scan this package’s output, otherwise utility classes inside the dependency will be missing.

Tailwind v3/v4 (tailwind.config):

```js
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/wysiwyg-pdf/dist/**/*.{js,cjs,mjs}',
  ],
}
```

Tailwind v4 (`@source` in your entry CSS):

```css
@source "../node_modules/wysiwyg-pdf/dist/**/*.{js,cjs,mjs}";
```

## 3) Define shadcn-style CSS variables

Define tokens in your global CSS for light/dark (see `README.md` for a minimal example).

---

# Doc v1 (JSON)

## 1) Root (`Doc`)

```json
{
  "v": 1,
  "id": "doc_001",
  "title": "Sample",
  "unit": "mm",
  "surfaces": [
    {
      "id": "page-1",
      "type": "page",
      "w": 210,
      "h": 297,
      "margin": { "t": 10, "r": 10, "b": 10, "l": 10 }
    },
    { "id": "layout", "type": "canvas", "w": 600, "h": 800 }
  ],
  "nodes": [],
  "links": [],
  "binding": { "sampleData": {} },
  "snap": { "grid": 10, "guides": true }
}
```

`surfaces` are drawing areas:

- Reports use `type: "page"` (page-sized surface, recommended unit is `mm`).
- Bed layout / free layout use `type: "canvas"`.

---

## 2) Nodes (`UnifiedNode`)

All drawable elements live in `nodes[]`. Z-order is the array order (first = back, last = front).

Common fields:

- `id`: unique id
- `t`: node type (`text | shape | line | image | group | table | signature | widget`)
- `s`: surface id (e.g. `"page-1"`, `"layout"`)
- geometry/style fields depending on node type (`x,y,w,h,r,opacity,locked,hidden,name,bind`, etc.)

### TextNode example

```json
{
  "id": "text-1",
  "t": "text",
  "s": "page-1",
  "x": 20,
  "y": 18,
  "w": 120,
  "h": 8,
  "r": 0,
  "text": "Invoice",
  "font": "Meiryo",
  "fontSize": 12,
  "fontWeight": 700,
  "fill": "#111111",
  "align": "l"
}
```

### ShapeNode example

```json
{
  "id": "shape-1",
  "t": "shape",
  "s": "layout",
  "x": 100,
  "y": 120,
  "w": 200,
  "h": 100,
  "shape": "rect",
  "fill": "#ffffff",
  "stroke": "#222222",
  "strokeW": 1
}
```

### LineNode example (`pts` are absolute coordinates)

```json
{
  "id": "line-1",
  "t": "line",
  "s": "layout",
  "pts": [100, 100, 300, 100],
  "stroke": "#000000",
  "strokeW": 2,
  "arrows": ["none", "none"]
}
```

### WidgetNode example (Bed)

```json
{
  "id": "bed-1",
  "t": "widget",
  "widget": "bed",
  "s": "layout",
  "x": 200,
  "y": 200,
  "w": 50,
  "h": 100,
  "r": 0,
  "name": "Bed",
  "data": { "bedType": "standard" }
}
```

---

## 3) Links (optional)

`links[]` connects nodes on the same surface.

```json
{
  "id": "link-1",
  "s": "layout",
  "from": "node-a",
  "to": "node-b",
  "routing": "orthogonal",
  "stroke": "#333333",
  "strokeW": 2,
  "arrows": ["none", "arrow"]
}
```

---

# Prompt template (ask AI to generate Doc JSON)

Copy/paste this into an AI chat to generate a `Doc` JSON:

> You generate a `Doc` v1 JSON object.
> Add nodes to `nodes[]` (text/shape/image/widget/etc.).
> If needed, add connections to `links[]`.
> Use `s` to place each node on the correct surface.
> Use unit `mm`.
> Output JSON only. No explanation.


