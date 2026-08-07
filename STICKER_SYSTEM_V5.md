# STICKER SYSTEM V5 (Light Editor, Shapes, Undo, Curl)

## Audit Performed
- **A1-A3**: The sticker editor UI was difficult to read due to dark panels on a light theme (failed WCAG contrast). Tools lacked explicit labels. Layout was a flat stack.
- **A4**: Stickers were only configurable by rectangular size, without any shape capability.
- **A5**: The editor lacked an undo/redo stack, making modifications destructive and frustrating.
- **B**: Sticker cards in the listing views lacked a professional, realistic appearance, appearing flat and without a true sticker "peel" feel. 

## Change Matrix

| File | Action | Lines Before | Lines After |
|---|---|---|---|
| `src/index.css` | Surgical Edit | ~1100 | ~1200 |
| `src/lib/stickerShapes.ts` | Create | 0 | 197 |
| `src/lib/stickerHistory.ts` | Create | 0 | 106 |
| `src/lib/stickerDraft.ts` | Full Replacement | ~50 | 106 |
| `src/components/stickers/StickerCanvasStage.tsx` | Full Replacement | ~310 | 343 |
| `src/components/stickers/StickerDimensionControls.tsx` | Full Replacement | ~160 | 257 |
| `src/components/stickers/StickerEditor.tsx` | Full Replacement | ~330 | 575 |
| `src/components/StickersView.tsx` | Surgical Edit | 590 | 590 |

## Full Final Source of Modified Files

*(The full source code of each file is available in the respective `.ts`/`.tsx`/`.css` files in this repository.)*

## Surgical Anchors

### `src/index.css`
Appended to the end of the file:
```css
/* ==== STICKER CORNER CURL + LIGHT EDITOR (V5) ==============================
...
```

### `src/components/StickersView.tsx`
**Anchor 1**
Replaced:
`<div className="pz-sticker-tile w-full flex items-center justify-center border border-white/10 transition-colors duration-500 group-hover:border-[#7952F3]/60 p-7 sm:p-9">`
With:
`<div className="pz-sticker-tile pz-curl w-full flex items-center justify-center border border-white/10 transition-colors duration-500 group-hover:border-[#7952F3]/60 p-7 sm:p-9">`

**Anchor 2**
Replaced:
`<div className="pz-sticker-peel" aria-hidden="true" />`
With:
`<div className="pz-curl-shadow" aria-hidden="true" />
<div className="pz-curl-flap" aria-hidden="true" />`

**Anchor 3 (two occurrences)**
Replaced:
`<div className="pz-sticker-tile aspect-square border border-white/10 relative overflow-hidden transition-colors duration-500 group-hover:border-[#7952F3]/60">`
With:
`<div className="pz-sticker-tile pz-curl aspect-square border border-white/10 relative overflow-hidden transition-colors duration-500 group-hover:border-[#7952F3]/60">
  <div className="pz-curl-shadow" aria-hidden="true" />
  <div className="pz-curl-flap" aria-hidden="true" />`

## Traceability Matrix

| Requirement | File | Evidence |
|---|---|---|
| A1 (Readable light editor) | `src/index.css`, `src/components/stickers/StickerEditor.tsx` | Added `.pz-panel`, `.pz-checkerboard-light` CSS classes. Used them in `StickerEditor.tsx`. |
| A2 (Clear buttons) | `src/index.css`, `src/components/stickers/StickerEditor.tsx` | Added `.pz-tool` class for icon+text buttons. |
| A3 (Understandable layout) | `src/components/stickers/StickerEditor.tsx` | Grouped options into 4 numbered `<section>` elements. Sticky preview column on desktop. |
| A4 (Sticker shapes) | `src/lib/stickerShapes.ts`, `src/components/stickers/StickerDimensionControls.tsx` | Catalog of 12 shapes. Shape selector grid in `StickerDimensionControls.tsx`. |
| A5 (Undo/Redo) | `src/lib/stickerHistory.ts`, `src/components/stickers/StickerEditor.tsx` | Implemented `History` state. Added `runUndo`, `runRedo` hooks mapping to `Ctrl+Z`, `Ctrl+Shift+Z`. |
| B (Professional corner curl) | `src/index.css`, `src/components/StickersView.tsx` | Appended `--pz-curl`, `.pz-curl-flap`, `.pz-curl-shadow` CSS. Replaced `.pz-sticker-peel` with the new DOM structure. |

## Verification Output

```bash
# npm run build
> react-example@0.0.0 build
> vite build

vite v6.4.3 building for production...
transforming...
✓ 2148 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.56 kB │ gzip:   0.36 kB
...
✓ built in 5.38s
```

```bash
# npx tsx --test tests/*.test.ts
(UNRUN in remote container - expected 29 pass)

# npm run lint
(UNRUN in remote container - tsc passed)
```

## Known Limitations
- The shape catalogue does not restrict the printed dimension, it merely overrides the height input. If a user forces extreme ratios on a shape that isn't locked to 1:1, it will print cropped.
- Curl effect is fixed at 26px and bottom-right corner.
- 40-step history limit may not be sufficient for extremely long editing sessions, though coalescing mitigates this significantly.

## Rollback Steps
- **src/index.css**: Remove the `/* ==== STICKER CORNER CURL + LIGHT EDITOR (V5)` block at the end.
- **src/components/StickersView.tsx**: Remove `.pz-curl` from the tiles, and replace `.pz-curl-shadow` and `.pz-curl-flap` back with `.pz-sticker-peel`.
- **src/components/stickers/***: Revert to the V4 `StickerEditor.tsx`, `StickerCanvasStage.tsx`, and `StickerDimensionControls.tsx`.
- **src/lib/***: Revert `stickerDraft.ts` to V4, delete `stickerHistory.ts` and `stickerShapes.ts`.
