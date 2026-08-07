| Date | File:line | Observation | Why deferred |
| --- | --- | --- | --- |

## Adding paintings (V16)

1. Add the entry to `PAINTINGS` in `src/data.ts`.
2. Required: `id` (unique), `title`, `style`, `imageUrl` **or** `image`, `widthCm`, `heightCm`, `price`.
   Strongly recommended: `subCategory` (the anime / film / game name).
3. `style` must be one of exactly these ten keys:
   `Abstract | Minimalist | Textured | Contemporary | Impressionist | Anime | Gaming | Films | Motorbikes | Cars`
   Note: the key for games is **`Gaming`**, not `Games`. The visible label is set in `STYLE_LABELS`.
4. Run `npm run audit:catalog`. It must print OK.
5. Nothing else. The painting now appears automatically in:
   - the Gallery, under its category and collection;
   - the Stickers page, with the standard sticker treatment (via `isStickerEligible` → `toStickerProduct`);
   - the Canvas pack picker and the Sticker pack picker (via `poolFor` → `categoryTree`).
   Category tabs and collection shelves are derived from the data, so a new
   collection appears the moment its first painting exists, and disappears when
   its last one is removed.

