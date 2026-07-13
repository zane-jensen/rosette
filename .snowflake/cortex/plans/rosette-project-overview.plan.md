# Rosette Rich Editor — Codebase Overview & Roadmap

## Context

The project is `@rosette/rich-editor` — a React 19 package that implements a custom rich-text editor whose data model mirrors the Wix/Ricos JSON format. The entire stack is hand-rolled (no Tiptap, ProseMirror, or Slate dependency):

- Vite 8 (dev + lib build), TypeScript 6, Tailwind v4
- Published entry: `dist/rich-editor.js` + `dist/index.d.ts`

```
mermaid
flowchart TD
    RicosDoc["RicosDocument (Wix)"]
    Converter["convertFromRicosDocument\nnodes/ricos.ts"]
    RosetteTree["RosetteNode[]\n(TEXT / LIST_ITEM / OL / UL)"]
    EditorProvider["EditorProvider\nproviders/editor/EditorProvider.tsx"]
    EditorUI["Editor.tsx\n(contenteditable + beforeinput)"]
    Renderer["renderNode.tsx"]
    DOM["React DOM"]

    RicosDoc --> Converter --> RosetteTree --> EditorProvider
    EditorProvider --> EditorUI
    EditorUI -->|"key/input events"| EditorProvider
    EditorProvider --> Renderer --> DOM
```

---

## What is fully implemented

| Area | Status |
|---|---|
| Custom event-interception editor (beforeinput, keydown) | Solid |
| TEXT, LIST_ITEM, ORDERED_LIST, UNORDERED_LIST node types | Complete |
| Tree traversal (findNodeById, updateNodeById, deleteNodeById, getNodeBefore) | Complete |
| Commands: deleteNode, insertNodeAfter/Before, insertToolbarNode | Complete |
| Tab/Shift+Tab list indent/outdent | Complete |
| Enter inside list — escape empty list item | Complete |
| Backspace at line start — merge with previous | Complete |
| Copy/paste with `application/rosette+json` custom format | Complete |
| RICOS → Rosette conversion (PARAGRAPH, LIST, IMAGE, FILE) | Partial (see gaps) |
| Library build pipeline (vite.config.lib.ts + api-extractor) | Complete |
| Tailwind v4 theming via CSS `@theme` | Complete |

---

## Gaps identified

### 1. HEADING type is unhandled

In [`src/nodes/ricos.ts`](src/nodes/ricos.ts), the `switch` has no `HEADING` case. It falls to `default`, which concatenates child text into a flat `TextNode` and loses the heading level entirely. The Rosette node type set in [`src/nodes/types.ts`](src/nodes/types.ts) has no `HEADING` entry.

### 2. Inline decorations (bold, color, link, superscript) are silently dropped

`textData.decorations` is defined in [`src/types/Ricos.ts`](src/types/Ricos.ts) but never read during conversion. `TextNode` in [`src/nodes/types.ts`](src/nodes/types.ts) only carries `style?: { color?: string }` — no bold, italic, link, or superscript. The real-world fixture in `public/ricos-sample.json` contains all four decoration types.

### 3. No diff / form view exists

The user described a key use-case: "intercepted slightly to be used in a diff form view with content on a different platform." No such component or utility exists in the codebase. The `flushDirtyNodes` reconciliation pattern in `EditorProvider` is the closest analog but is purely an internal DOM-sync mechanism.

### 4. IMAGE and FILE render as placeholder text

Both convert to `TextNode("[Image: <id>]")` / `TextNode("[File: <name>]")`. No ImageNode or FileNode type exists.

### 5. `tags` field is dead code

Every Rosette node has `tags: string[]` (always `[]`), unused in every file that reads or writes nodes.

### 6. Zero tests

No `*.test.*` or `*.spec.*` files exist. The `public/ricos-sample.json` is a good fixture for conversion tests but is never imported by any test runner.

---

## Implementation steps

### Step 1 — Add HEADING node type

**Files:** [`src/nodes/types.ts`](src/nodes/types.ts), [`src/nodes/factories.tsx`](src/nodes/factories.tsx), [`src/nodes/ricos.ts`](src/nodes/ricos.ts), [`src/nodes/renderNode.tsx`](src/nodes/renderNode.tsx), [`src/components/Editor/Editor.tsx`](src/components/Editor/Editor.tsx)

- Add `HEADING: 'heading'` to `NODE_TYPES` and a `HeadingNode` interface with a `level: 1 | 2 | 3 | 4 | 5 | 6` field.
- Add `createHeadingNode(level, text?)` factory.
- In `ricos.ts` add a `'HEADING'` case that reads the heading level from `wixNode.style` and creates a `HeadingNode`.
- In `renderNode.tsx` render `<h1>…<h6>` based on `level`.
- In `Editor.tsx` Enter-key handler: a heading node should spawn a plain `TextNode` (not another heading) when Enter is pressed.

### Step 2 — Preserve inline decorations

**Files:** [`src/nodes/types.ts`](src/nodes/types.ts), [`src/nodes/ricos.ts`](src/nodes/ricos.ts), [`src/components/TextElement.tsx`](src/components/TextElement.tsx)

Ricos text segments are a flat array of `{ text, decorations[] }` objects nested under a paragraph/heading. The current `PARAGRAPH` case flattens them with a space-join. The proper model is a `RichTextNode` (or extend `TextNode`) that stores an array of `{ text: string, bold?: boolean, italic?: boolean, color?: string, link?: string }` runs instead of a single `content: string`.

- Extend `TextNode` with an optional `runs?: TextRun[]` field (backward-compatible — plain `content` remains for editor-created text).
- Update `convertFromRicosDocument` to populate `runs` from `textData.decorations`.
- Update `TextElement` to render `<span>` per run with appropriate inline styles when `runs` is present.
- Update `beforeinput` handler in `Editor.tsx` to treat `runs`-based text as read-only segments (or convert to flat on first edit).

### Step 3 — Build the diff / form view

**New files:** `src/components/DiffViewer/DiffViewer.tsx`, `src/nodes/diff.ts`  
**Export from:** [`src/index.ts`](src/index.ts)

Architecture:
```
mermaid
flowchart LR
    original["RosetteNode[] (original)"]
    edited["RosetteNode[] (edited)"]
    diff["diffNodes(original, edited)\nnodes/diff.ts"]
    DiffViewer["DiffViewer.tsx"]
    output["Side-by-side or inline\ncolored diff UI"]

    original --> diff
    edited --> diff
    diff --> DiffViewer --> output
```

- `diffNodes(a, b): DiffResult[]` — walk both trees by `id`; emit `{ type: 'added' | 'removed' | 'changed' | 'unchanged', node }`.
- `DiffViewer` renders two columns (or a single interleaved view) using the diff result, with added lines in green, removed in red, changed in orange — matching the existing Tailwind theme tokens (`--color-green`, `--color-orange`).
- Expose `DiffViewer` and the `diffNodes` utility from `src/index.ts`.

### Step 4 — Resolve `tags` field

Decision needed (see question below). Either:
- **Implement:** add a tag editor in the toolbar / Panel, make `tags` filterable/searchable.
- **Remove:** strip the field from all types, factories, and serialized data.

### Step 5 — Add Vitest and write tests

- Install `vitest` as a dev dependency.
- Add `test` script to `package.json`.
- Write tests in `src/nodes/__tests__/` covering:
  - `convertFromRicosDocument` against `public/ricos-sample.json`
  - `deleteNode`, `insertNodeAfter`, `insertToolbarNode` edge cases
  - `NodeRange.nodesInRange`

### Step 6 — IMAGE and FILE node renderers

- Add `ImageNode` (with `imageId: string`, `alt?: string`) and `FileNode` (with `fileName: string`, `fileType: string`).
- Render `ImageNode` as an `<img>` (via Wix media URL construction) and `FileNode` as a styled link/attachment chip.

---

## Verification

- `npm run build:lib` must succeed with no type errors.
- `npm run dev` should show the dev sandbox rendering all node types including headings.
- Vitest suite should pass (once Step 5 is complete).
- Import `@rosette/rich-editor` in a minimal consumer app; verify `DiffViewer` renders correctly with two known node arrays.

---

## Critical Files

- [`src/nodes/ricos.ts`](src/nodes/ricos.ts) — Core conversion logic; most of Steps 1 & 2 land here
- [`src/nodes/types.ts`](src/nodes/types.ts) — All type definitions; every new node type starts here
- [`src/components/Editor/Editor.tsx`](src/components/Editor/Editor.tsx) — Event interception; heading Enter behavior goes here
- [`src/nodes/diff.ts`](src/nodes/diff.ts) — New file for diff algorithm (Step 3)
- [`src/index.ts`](src/index.ts) — Public API; every new export must be wired here
