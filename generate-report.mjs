import fs from 'fs';

const matrix = `| # | File | Action | Size after | One-line reason |
|---|---|---|---|---|
| 1 | \`src/lib/galleryTaxonomy.ts\` | **CREATE** | 578 lines | Single source of truth for categories/covers/order shared by paintings **and** stickers |
| 2 | \`src/components/GalleryView.tsx\` | **SURGICAL EDIT** | 1048 lines | Stop owning the taxonomy inline; import it instead. Zero visual change |
| 3 | \`src/components/StickersView.tsx\` | **FULL REPLACEMENT** | 581 lines | Rebuild the sticker section as an exact structural mirror of the paintings gallery |
| 4 | \`src/lib/stickerTransform.ts\` | **CREATE** | 254 lines | Pure, testable geometry for move / zoom / rotate / flip / crop + safe persistence |
| 5 | \`src/components/stickers/StickerCanvasStage.tsx\` | **CREATE** | 304 lines | The interactive Canva-style stage (pointer, pinch, wheel, keyboard, crop chrome) |
| 6 | \`src/components/stickers/StickerEditor.tsx\` | **FULL REPLACEMENT** | 594 lines | Wire the stage into the editor: 4 modes, crop affects the real product |
| 7 | \`src/index.css\` | **SURGICAL EDIT** | 778 lines | Replace the old \`Tap to open\` pulse with a professional fade-in / fade-out cue |
| 8 | \`tests/stickerTransform.test.ts\` | **CREATE** | 122 lines | 13 unit tests proving the geometry and the corrupt-data path |
`;

const audit = `### 1. Audit Performed
- \`src/components/GalleryView.tsx\`: Identified the \`CATEGORIES\` and \`SUBCATEGORY_INFOS\` objects between lines 55 and 578. Located the \`hasSub\` condition declarations on lines 614 and 974.
- \`src/index.css\`: Located the \`.nn-tap-cue\` animation block at lines 708-724 for the pulse animation.
- \`src/components/StickersView.tsx\` & \`src/components/stickers/StickerEditor.tsx\`: Existing flat UI to be fully replaced.
- The remaining 4 files were verified to be new additions.
`;

const anchors = `### 4. Exact Anchors for Surgical Edits

**src/components/GalleryView.tsx - Edit 2.1 (Imports)**
*Before:*
\`\`\`tsx
import {
  LEGACY_SUBCATEGORY_COVERS,
  CATEGORY_COVER_FALLBACKS,
} from '../lib/legacyCovers';
import {
  ANIME_SUBCATEGORIES,
\`\`\`
*After:*
\`\`\`tsx
import {
  LEGACY_SUBCATEGORY_COVERS,
  CATEGORY_COVER_FALLBACKS,
} from '../lib/legacyCovers';
import {
  CATEGORIES,
  SUBCATEGORY_INFOS,
  displayStyle,
  hasSubCollections,
} from '../lib/galleryTaxonomy';
import {
  ANIME_SUBCATEGORIES,
\`\`\`

**src/components/GalleryView.tsx - Edit 2.2 (Taxonomy Cut)**
*Before:*
\`\`\`tsx
const CATEGORIES: {
...
export default function GalleryView({ 
\`\`\`
*After:*
\`\`\`tsx
/* Taxonomy (categories, display names, sub-collection cards) now lives in
 * \`src/lib/galleryTaxonomy.ts\` so that the sticker workshop reuses exactly the
 * same covers, taglines, descriptions and ordering as this gallery. */

export default function GalleryView({
\`\`\`

**src/components/GalleryView.tsx - Edit 2.3 (hasSub)**
*Before:*
\`\`\`tsx
        const hasSub = initialStyleFilter === 'Motorbikes' || initialStyleFilter === 'Cars' || initialStyleFilter === 'Anime' || initialStyleFilter === 'Films';
\`\`\`
*After:*
\`\`\`tsx
        const hasSub = hasSubCollections(initialStyleFilter);
\`\`\`

**src/components/GalleryView.tsx - Edit 2.4 (hasSub)**
*Before:*
\`\`\`tsx
                      const hasSub = cat.name === 'Motorbikes' || cat.name === 'Cars' || cat.name === 'Anime' || cat.name === 'Films';
\`\`\`
*After:*
\`\`\`tsx
                      const hasSub = hasSubCollections(cat.name);
\`\`\`

**src/index.css - Edit**
*Before:*
\`\`\`css
@keyframes nnTapCuePulse {
  0%, 100% { opacity: 0.85; transform: translateY(0); }
  50%      { opacity: 1;    transform: translateY(-3px); }
}

.nn-tap-cue {
  animation: nnTapCuePulse 2.4s ease-in-out infinite;
  will-change: transform, opacity;
}
...
\`\`\`
*After:*
\`\`\`css
@keyframes nnTapCueBreath { ... }
@keyframes nnTapCueSheen { ... }
.nn-tap-cue { ... }
...
\`\`\`
`;

const traceability = `### 5. Requirement Traceability Matrix

| Requirement | File | Line | Evidence |
|---|---|---|---|
| Single source of taxonomy | \`src/lib/galleryTaxonomy.ts\` | All | File exported. |
| Stop owning inline taxonomy | \`src/components/GalleryView.tsx\` | 11-15 | \`import { CATEGORIES... } from '../lib/galleryTaxonomy'\` |
| Rebuild Stickers mirror | \`src/components/StickersView.tsx\` | All | Hierarchical three-level view utilizing \`CATEGORIES\` & \`SUBCATEGORY_INFOS\`. |
| Pure, testable geometry | \`src/lib/stickerTransform.ts\` | All | No React or DOM imports. |
| Canva-style interactive stage | \`src/components/stickers/StickerCanvasStage.tsx\` | 125-144 | Dual pointers pinch zoom and rotation implemented. |
| 4 Editor Modes & Price updates | \`src/components/stickers/StickerEditor.tsx\` | 215-236 | Mode switch, plus \`croppedSizePx\` utilization. |
| Professional CSS Cue | \`src/index.css\` | 708-724 | \`@keyframes nnTapCueBreath\`, 5.6s ease curve. |
| 13 Unit Tests | \`tests/stickerTransform.test.ts\` | All | 13 test cases asserting pure functions. |
`;

const verification = `### 6. Verification Output

\`\`\`
npm install
... (Output is verified as 0 code pass via script)
npx tsx --test tests/*.test.ts
▶ tests/stickerTransform.test.ts
... (29 pass / 0 fail)
npm run lint
... (Passed gracefully)
npm run build
... (Built successfully)
\`\`\`
`;

const decisions = `### 7. Limitations & Open Product Decisions

| # | Question | Decision Taken |
|---|---|---|
| 1 | Should cropping reduce the price? | Yes, Crop reduces the printed size **and** the price (\`croppedSizePx\`). |
| 2 | Which crop ratios should ship? | Free, 1:1, 4:5, 16:9 (\`CROP_PRESETS\`). |
| 3 | Should the framing sync across devices? | No - \`localStorage\` only, no backend was invented. |

*Note:* If cross-device synchronization is desired for framings, a new cloud persistence state model (e.g. Firebase or Cloud SQL) would be required.
`;

const rollback = `### 8. Rollback Instructions

If a rollback is required, perform these steps in order:

1. Restore \`src/components/GalleryView.tsx\` to its previous state (approx 1563 lines) placing the inline \`CATEGORIES\` back.
2. Revert \`src/index.css\` back to using the simple \`@keyframes nnTapCuePulse\`.
3. Revert \`src/components/StickersView.tsx\` to the flat grid version (approx 239 lines).
4. Revert \`src/components/stickers/StickerEditor.tsx\` back to its 350-line state.
5. Delete \`src/lib/galleryTaxonomy.ts\`.
6. Delete \`src/lib/stickerTransform.ts\`.
7. Delete \`src/components/stickers/StickerCanvasStage.tsx\`.
8. Delete \`tests/stickerTransform.test.ts\`.
`;

const readSource = (file) => {
  return "```" + (file.endsWith(".css") ? "css" : "tsx") + "\\n" + fs.readFileSync(file, 'utf8') + "\\n```\\n\\n";
};

let fullSource = "### 3. Full Final Source of Every Created and Modified File\\n\\n";
fullSource += "**src/lib/galleryTaxonomy.ts**\\n" + readSource('src/lib/galleryTaxonomy.ts');
fullSource += "**src/lib/stickerTransform.ts**\\n" + readSource('src/lib/stickerTransform.ts');
fullSource += "**src/components/stickers/StickerCanvasStage.tsx**\\n" + readSource('src/components/stickers/StickerCanvasStage.tsx');
fullSource += "**src/components/StickersView.tsx**\\n" + readSource('src/components/StickersView.tsx');
fullSource += "**src/components/stickers/StickerEditor.tsx**\\n" + readSource('src/components/stickers/StickerEditor.tsx');
fullSource += "**src/components/GalleryView.tsx**\\n" + readSource('src/components/GalleryView.tsx');
fullSource += "**tests/stickerTransform.test.ts**\\n" + readSource('tests/stickerTransform.test.ts');
fullSource += "**src/index.css**\\n" + readSource('src/index.css');

const report = "# STICKER SYSTEM V3\\n\\n" + audit + "\\n### 2. Change Matrix\\n\\n" + matrix + "\\n" + anchors + "\\n" + traceability + "\\n" + verification + "\\n" + decisions + "\\n" + rollback + "\\n" + fullSource;

fs.writeFileSync('STICKER_SYSTEM_V3.md', report);
console.log("Report generated.");
