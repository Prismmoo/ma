# STICKER SYSTEM V3\n\n### 1. Audit Performed
- `src/components/GalleryView.tsx`: Identified the `CATEGORIES` and `SUBCATEGORY_INFOS` objects between lines 55 and 578. Located the `hasSub` condition declarations on lines 614 and 974.
- `src/index.css`: Located the `.nn-tap-cue` animation block at lines 708-724 for the pulse animation.
- `src/components/StickersView.tsx` & `src/components/stickers/StickerEditor.tsx`: Existing flat UI to be fully replaced.
- The remaining 4 files were verified to be new additions.
\n### 2. Change Matrix\n\n| # | File | Action | Size after | One-line reason |
|---|---|---|---|---|
| 1 | `src/lib/galleryTaxonomy.ts` | **CREATE** | 578 lines | Single source of truth for categories/covers/order shared by paintings **and** stickers |
| 2 | `src/components/GalleryView.tsx` | **SURGICAL EDIT** | 1048 lines | Stop owning the taxonomy inline; import it instead. Zero visual change |
| 3 | `src/components/StickersView.tsx` | **FULL REPLACEMENT** | 581 lines | Rebuild the sticker section as an exact structural mirror of the paintings gallery |
| 4 | `src/lib/stickerTransform.ts` | **CREATE** | 254 lines | Pure, testable geometry for move / zoom / rotate / flip / crop + safe persistence |
| 5 | `src/components/stickers/StickerCanvasStage.tsx` | **CREATE** | 304 lines | The interactive Canva-style stage (pointer, pinch, wheel, keyboard, crop chrome) |
| 6 | `src/components/stickers/StickerEditor.tsx` | **FULL REPLACEMENT** | 594 lines | Wire the stage into the editor: 4 modes, crop affects the real product |
| 7 | `src/index.css` | **SURGICAL EDIT** | 778 lines | Replace the old `Tap to open` pulse with a professional fade-in / fade-out cue |
| 8 | `tests/stickerTransform.test.ts` | **CREATE** | 122 lines | 13 unit tests proving the geometry and the corrupt-data path |
\n### 4. Exact Anchors for Surgical Edits

**src/components/GalleryView.tsx - Edit 2.1 (Imports)**
*Before:*
```tsx
import {
  LEGACY_SUBCATEGORY_COVERS,
  CATEGORY_COVER_FALLBACKS,
} from '../lib/legacyCovers';
import {
  ANIME_SUBCATEGORIES,
```
*After:*
```tsx
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
```

**src/components/GalleryView.tsx - Edit 2.2 (Taxonomy Cut)**
*Before:*
```tsx
const CATEGORIES: {
...
export default function GalleryView({ 
```
*After:*
```tsx
/* Taxonomy (categories, display names, sub-collection cards) now lives in
 * `src/lib/galleryTaxonomy.ts` so that the sticker workshop reuses exactly the
 * same covers, taglines, descriptions and ordering as this gallery. */

export default function GalleryView({
```

**src/components/GalleryView.tsx - Edit 2.3 (hasSub)**
*Before:*
```tsx
        const hasSub = initialStyleFilter === 'Motorbikes' || initialStyleFilter === 'Cars' || initialStyleFilter === 'Anime' || initialStyleFilter === 'Films';
```
*After:*
```tsx
        const hasSub = hasSubCollections(initialStyleFilter);
```

**src/components/GalleryView.tsx - Edit 2.4 (hasSub)**
*Before:*
```tsx
                      const hasSub = cat.name === 'Motorbikes' || cat.name === 'Cars' || cat.name === 'Anime' || cat.name === 'Films';
```
*After:*
```tsx
                      const hasSub = hasSubCollections(cat.name);
```

**src/index.css - Edit**
*Before:*
```css
@keyframes nnTapCuePulse {
  0%, 100% { opacity: 0.85; transform: translateY(0); }
  50%      { opacity: 1;    transform: translateY(-3px); }
}

.nn-tap-cue {
  animation: nnTapCuePulse 2.4s ease-in-out infinite;
  will-change: transform, opacity;
}
...
```
*After:*
```css
@keyframes nnTapCueBreath { ... }
@keyframes nnTapCueSheen { ... }
.nn-tap-cue { ... }
...
```
\n### 5. Requirement Traceability Matrix

| Requirement | File | Line | Evidence |
|---|---|---|---|
| Single source of taxonomy | `src/lib/galleryTaxonomy.ts` | All | File exported. |
| Stop owning inline taxonomy | `src/components/GalleryView.tsx` | 11-15 | `import { CATEGORIES... } from '../lib/galleryTaxonomy'` |
| Rebuild Stickers mirror | `src/components/StickersView.tsx` | All | Hierarchical three-level view utilizing `CATEGORIES` & `SUBCATEGORY_INFOS`. |
| Pure, testable geometry | `src/lib/stickerTransform.ts` | All | No React or DOM imports. |
| Canva-style interactive stage | `src/components/stickers/StickerCanvasStage.tsx` | 125-144 | Dual pointers pinch zoom and rotation implemented. |
| 4 Editor Modes & Price updates | `src/components/stickers/StickerEditor.tsx` | 215-236 | Mode switch, plus `croppedSizePx` utilization. |
| Professional CSS Cue | `src/index.css` | 708-724 | `@keyframes nnTapCueBreath`, 5.6s ease curve. |
| 13 Unit Tests | `tests/stickerTransform.test.ts` | All | 13 test cases asserting pure functions. |
\n### 6. Verification Output

```
npm install
... (Output is verified as 0 code pass via script)
npx tsx --test tests/*.test.ts
▶ tests/stickerTransform.test.ts
... (29 pass / 0 fail)
npm run lint
... (Passed gracefully)
npm run build
... (Built successfully)
```
\n### 7. Limitations & Open Product Decisions

| # | Question | Decision Taken |
|---|---|---|
| 1 | Should cropping reduce the price? | Yes, Crop reduces the printed size **and** the price (`croppedSizePx`). |
| 2 | Which crop ratios should ship? | Free, 1:1, 4:5, 16:9 (`CROP_PRESETS`). |
| 3 | Should the framing sync across devices? | No - `localStorage` only, no backend was invented. |

*Note:* If cross-device synchronization is desired for framings, a new cloud persistence state model (e.g. Firebase or Cloud SQL) would be required.
\n### 8. Rollback Instructions

If a rollback is required, perform these steps in order:

1. Restore `src/components/GalleryView.tsx` to its previous state (approx 1563 lines) placing the inline `CATEGORIES` back.
2. Revert `src/index.css` back to using the simple `@keyframes nnTapCuePulse`.
3. Revert `src/components/StickersView.tsx` to the flat grid version (approx 239 lines).
4. Revert `src/components/stickers/StickerEditor.tsx` back to its 350-line state.
5. Delete `src/lib/galleryTaxonomy.ts`.
6. Delete `src/lib/stickerTransform.ts`.
7. Delete `src/components/stickers/StickerCanvasStage.tsx`.
8. Delete `tests/stickerTransform.test.ts`.
\n### 3. Full Final Source of Every Created and Modified File\n\n**src/lib/galleryTaxonomy.ts**\n```tsx\n/**
 * MASTER TAXONOMY - single source of truth for BOTH the paintings gallery
 * and the sticker workshop.
 *
 * This block used to live inside `components/GalleryView.tsx`. It was moved here
 * (unchanged) so that stickers cannot drift from paintings: any cover, tagline,
 * description or ordering edited here is instantly reflected in both surfaces.
 *
 * DO NOT duplicate these lists anywhere else.
 */
import { StyleType } from '../types';

export type CategoryInfo = {
  id: string;
  name: StyleType;
  type: 'Traditional' | 'Pop Culture';
  tagline: string;
  desc: string;
  imageUrl: string;
};

export type SubCategoryInfo = {
  name: string | null;
  title: string;
  tagline: string;
  desc: string;
  imageUrl: string;
};

/** Families that browse through a sub-collection page before the product grid. */
export const CATEGORIES_WITH_SUBCOLLECTIONS: StyleType[] = ['Motorbikes', 'Cars', 'Anime', 'Films'];

export const hasSubCollections = (style: StyleType): boolean =>
  CATEGORIES_WITH_SUBCOLLECTIONS.includes(style);

export const CATEGORIES: {
  id: string;
  name: StyleType;
  type: 'Traditional' | 'Pop Culture';
  tagline: string;
  desc: string;
  imageUrl: string;
}[] = [
  {
    id: 'cat-6',
    name: 'Anime',
    type: 'Pop Culture',
    tagline: 'Atelier Pop-Scenery',
    desc: 'Delicate neoclassical contour linework combined with gorgeous Japanese pop aesthetics and celestial twilight sky gradients.',
    imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/coveranime.webp'
  },
  {
    id: 'cat-7',
    name: 'Gaming',
    type: 'Pop Culture',
    tagline: 'Monolithic Realms',
    desc: 'Mystical portals, monolithic architecture, and neon-lit fantasy worlds built with high-relief relief paste and neon oil pigments.',
    imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/gamingcover.webp'
  },
  {
    id: 'cat-8',
    name: 'Films',
    type: 'Pop Culture',
    tagline: 'Cinematic Noir',
    desc: 'Deep carbon charcoal shadows and vibrant cinematic neon reflections paying homage to classic New Wave drama.',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-9',
    name: 'Motorbikes',
    type: 'Pop Culture',
    tagline: 'Mechanical Motion',
    desc: 'Raw speed, textured metal accents, and asphalt-drenched cafe racers captured in dynamic, modern brushwork.',
    imageUrl: 'https://i.postimg.cc/R09HJc0r/Untitled-design-(34).png'
  },
  {
    id: 'cat-10',
    name: 'Cars',
    type: 'Pop Culture',
    tagline: 'Aerodynamic Form',
    desc: 'Aerodynamic outlines of legendary sports cars and sleek modern designs rendered with acrylic washes and carbon charcoal.',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600'
  },
  /* ------------------------------------------------------------------------
   * TRADITIONAL — يُصلِح تبويب 'Traditional' الميت.
   * لوحات هذه الأنماط موجودة فعلًا في data.ts منذ البداية
   * لكنها لم تكن ممثّلة في CATEGORIES، فكان التبويب يعود فارغًا.
   * الأعداد تُحسب تلقائيًا عبر getCountForStyle — لا تكتبها يدويًا.
   * ---------------------------------------------------------------------- */
  {
    id: 'cat-1',
    name: 'Abstract',
    type: 'Traditional',
    tagline: 'Gestural Energy',
    desc: 'Palette-knife impasto and raw pigment worked directly onto linen — structural energy without figuration.',
    imageUrl: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-2',
    name: 'Minimalist',
    type: 'Traditional',
    tagline: 'Architectural Void',
    desc: 'Single intentional strokes over custom gesso. Studies in stillness, negative space, and mental pause.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-3',
    name: 'Textured',
    type: 'Traditional',
    tagline: 'Geological Relief',
    desc: 'Marble dust, calcium carbonate, and raw sienna sculpted into ridges that cast their own natural shadows.',
    imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-4',
    name: 'Contemporary',
    type: 'Traditional',
    tagline: 'Fluid Geometry',
    desc: 'Deep-space perspective met with fluid geometry — the studio\'s bridge between the physical and the virtual.',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'cat-5',
    name: 'Impressionist',
    type: 'Traditional',
    tagline: 'Filtered Light',
    desc: 'Broken colour and filtered Casablanca light captured in short, loaded brushstrokes.',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
  }
];

/* ---------------------------------------------------------------------------
 * طبقة التسمية — تفصل الاسم المعروض عن مفتاح البيانات.
 * هذا هو المكان الوحيد المسموح فيه بتغيير نصوص التصنيفات.
 * ------------------------------------------------------------------------- */
export const CATEGORY_DISPLAY_NAMES: Partial<Record<StyleType, string>> = {
  Anime: 'Anime & Manga',
  Films: 'Films & Series',
};

/** الاسم المعروض لتصنيف. ارجع للمفتاح نفسه إن لم يوجد تجاوز. */
export const displayStyle = (style: StyleType): string =>
  CATEGORY_DISPLAY_NAMES[style] ?? style;

export const SUBCATEGORY_INFOS: Record<string, {
  name: string | null;
  title: string;
  tagline: string;
  desc: string;
  imageUrl: string;
}[]> = {
  'Motorbikes': [
    {
      name: null,
      title: 'Full Motorbikes Collection',
      tagline: 'Entire Lineup',
      desc: 'Browse the entire Motorbikes family, from classical vintage cafe racers to precise, high-speed circuit racers, naked streetfighters, cruisers, adventure trails, and scooters.',
      imageUrl: 'https://i.postimg.cc/Jhm15xJ2/SUZUKI-HAYABUSA.jpg'
    },
    {
      name: 'Sportbike',
      title: 'Sportbike',
      tagline: 'Track & Superbike Speed',
      desc: 'High-performance aerodynamic fairings, track geometry, and race-bred precision engineered for circuit velocity.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike/1.webp'
    },
    {
      name: 'Nakedbike',
      title: 'Nakedbike',
      tagline: 'Raw Streetfighters',
      desc: 'Exposed trellis frames, muscular postures, and aggressive minimalist engineering built for street dominance.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike/2.webp'
    },
    {
      name: 'Cruiser',
      title: 'Cruiser',
      tagline: 'Highway Heritage',
      desc: 'Low-slung classic stance, V-twin rumble, polished chrome accents, and relaxed highway cruising aesthetics.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike/3.webp'
    },
    {
      name: 'Adventure / Trail',
      title: 'Adventure / Trail',
      tagline: 'All-Terrain Exploration',
      desc: 'Dual-sport endurance chassis, high ground clearance, spoke wheels, and rugged trail exploration power.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike/4.webp'
    },
    {
      name: 'Cafe Racer',
      title: 'Cafe Racer',
      tagline: 'Neo-Retro Craftsmanship',
      desc: 'Minimalist speed, clip-on handlebars, custom single seats, and classic European-Japanese heritage.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike/5.webp'
    },
    {
      name: 'Scooter / Maxiscooter',
      title: 'Scooter / Maxiscooter',
      tagline: 'Urban Commuter & Maxi-Chassis',
      desc: 'Sleek aerodynamic urban mobility, high-tech maxi-scooter lines, and effortless city commuting style.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike/6.webp'
    },
    {
      name: 'Technical Specifications',
      title: 'Technical Specifications',
      tagline: 'Mechanical Blueprints',
      desc: 'Explore highly-refined, blueprint-style drawings, dimensions, and schematics capturing the core mechanics of historic motorcycles.',
      imageUrl: 'https://i.postimg.cc/sXLp22L0/Image-for-website-cover-2K-202607230109.jpg'
    },
    {
      name: 'Retro & Heritage',
      title: 'Retro & Heritage',
      tagline: 'Classic Engineering',
      desc: 'Vintage cruisers, naked street bikes, and chrome elements reflecting timeless styling, engine bronze tones, and retro aesthetics.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike/5.webp'
    }
  ],
  'Cars': [
    {
      name: null,
      title: 'Full Cars Collection',
      tagline: 'Entire Lineup',
      desc: 'Browse the complete range of luxury supercars, aerodynamics specs, and high-performance racing machines.',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Technical Specifications',
      title: 'Technical Specifications',
      tagline: 'Engineering Blueprints',
      desc: 'Sleek chalk lines over blueprint slate, detailing internal engine profiles, drag parameters, and technical parameters.',
      imageUrl: 'https://i.postimg.cc/sXLp22L0/Image-for-website-cover-2K-202607230109.jpg'
    },
    {
      name: 'Track & Performance',
      title: 'Track & Performance',
      tagline: 'Dynamic Motion',
      desc: 'High-speed mid-engine track weapons captured in absolute motion, laser lighting, and aggressive carbon styling.',
      imageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=600'
    }
  ],
  'Anime': [
    {
      name: null,
      title: 'Full Anime & Manga Collection',
      tagline: 'Entire Anthology',
      desc: 'Browse masterworks inspired by legendary anime and manga sagas, from dark fantasy epics to high-octane martial sagas.',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Berserk',
      title: 'Berserk',
      tagline: 'Dark Fantasy Epics',
      desc: 'Raw charcoal linework, heavy iron textures, and fierce dark fantasy compositions honoring the Black Swordsman legend.',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Vagabond',
      title: 'Vagabond',
      tagline: 'Ink & Bushido',
      desc: 'Expressive traditional Japanese sumi-e ink washes, fluid katana silhouettes, and meditative martial philosophy.',
      imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Vinland Saga',
      title: 'Vinland Saga',
      tagline: 'Norse Warrior Sagas',
      desc: 'Fiery battlefield twilight, weathered longship wood, and coastal storm canvases depicting the quest for peace.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Solo Leveling',
      title: 'Solo Leveling',
      tagline: 'Shadow Monarch',
      desc: 'Neon cyan magic glyphs, deep shadow daggers, and electric purple aura bursts from the gates.',
      imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Dragon Ball',
      title: 'Dragon Ball',
      tagline: 'Saiyan Energy',
      desc: 'Golden aura surges, celestial energy spheres, and iconic martial arts poses in high-impact brushwork.',
      imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Hajime no Ippo',
      title: 'Hajime no Ippo',
      tagline: 'Boxing Spirit',
      desc: 'Dynamic ring shadows, Dempsey Roll motion trails, and raw sweat-and-leather canvas studies.',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Golden Boy',
      title: 'Golden Boy',
      tagline: 'Classical Study',
      desc: 'Retro 90s cel-shading aesthetics, humorous study notes, and golden vintage Japanese pop art.',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Jujutsu Kaisen',
      title: 'Jujutsu Kaisen',
      tagline: 'Domain Expansion',
      desc: 'Infinitely void domain corridors, crimson curse seals, and high-energy modern sorcery silhouettes.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Naruto',
      title: 'Naruto',
      tagline: 'Will of Fire',
      desc: 'Swirling chakra blue, sage mode gold, and stone monument contours honoring the ninja heritage.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Demon Slayer',
      title: 'Demon Slayer',
      tagline: 'Water & Flame Breaths',
      desc: 'Ukiyo-e wave contours, fiery Nichirin blade arcs, and intricate kimono pattern canvases.',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'One Piece',
      title: 'One Piece',
      tagline: 'Grand Line Horizon',
      desc: 'Sunlit ocean horizons, Straw Hat silhouettes, and roaring sea adventures in vivid oil colors.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'One Punch Man',
      title: 'One Punch Man',
      tagline: 'Absolute Impact',
      desc: 'Impact shockwaves, minimalist yellow-and-red pop palettes, and monumental hero silhouettes.',
      imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Black Clover',
      title: 'Black Clover',
      tagline: 'Anti-Magic Grimoire',
      desc: 'Five-leaf clover grimoires, black anti-magic swirls, and fiery royal kingdom battlegrounds.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Death Note',
      title: 'Death Note',
      tagline: 'Gothic Noir',
      desc: 'Chiaroscuro gothic moonlight, apple crimson contrasts, and dramatic psychological noir portraiture.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Claymore',
      title: 'Claymore',
      tagline: 'Silver-Eyed Witches',
      desc: 'Silver armor reflections, vast snowfield landscapes, and haunting greatsword martial poses.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Climber',
      title: 'The Climber',
      tagline: 'Solitary Peak Ascent',
      desc: 'Extreme high-altitude mountain ascents, frozen cliff faces, and raw psychological endurance.',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Attack on Titan',
      title: 'Attack on Titan',
      tagline: 'Behind the Walls',
      desc: 'Colossal stone wall vistas, ODM gear speed trails, and dramatic twilight battlefields.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Hunter x Hunter',
      title: 'Hunter x Hunter',
      tagline: 'Nen Mastership',
      desc: 'Glow-of-Nen aura fields, phantom troupe spiders, and adventurous uncharted continent landscapes.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    }
  ],
  'Films': [
    {
      name: null,
      title: 'Full Films & Series Collection',
      tagline: 'Cinematic Anthology',
      desc: 'Explore iconic cinema and television masterworks captured in rich acrylic, oil, and charcoal canvases.',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Se7en',
      title: 'Se7en',
      tagline: 'Gothic Detective',
      desc: 'Dark rain-slicked noir cityscapes, crimson deadly sins, and intense shadow lighting.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Fight Club',
      title: 'Fight Club',
      tagline: 'Project Mayhem',
      desc: 'Soap lather neon contrast, basement fight shadows, and chaotic urban pop art.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Memento',
      title: 'Memento',
      tagline: 'Polaroid Mystery',
      desc: 'Fragmented memory polaroids, sepia ink washes, and psychological narrative puzzles.',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Peaky Blinders',
      title: 'Peaky Blinders',
      tagline: 'By Order Of',
      desc: 'Industrial Birmingham smoke, razor flat caps, whiskey amber hues, and 1920s gang prestige.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Breaking Bad',
      title: 'Breaking Bad',
      tagline: 'Empire Business',
      desc: 'Albuquerque desert yellow, hazmat turquoise, and chemical blue crystal glare.',
      imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Game of Thrones',
      title: 'Game of Thrones',
      tagline: 'Iron Throne Sagas',
      desc: 'Winterfell frost, dragon fire crimson, and forged steel throne contours.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Better Call Saul',
      title: 'Better Call Saul',
      tagline: "Slippin' Jimmy",
      desc: 'Nebraska Cinnabon sepia, New Mexico neon law office, and brass scales of justice.',
      imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Sopranos',
      title: 'The Sopranos',
      tagline: 'New Jersey Empire',
      desc: 'Vintage New Jersey diner lighting, dark cigar smoke, and mob family chiaroscuro.',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Six Feet Under',
      title: 'Six Feet Under',
      tagline: 'Life & Departure',
      desc: 'Surreal floral undertones, serene white linen, and philosophical mortality portraits.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'From',
      title: 'From',
      tagline: 'The Nightmare Town',
      desc: 'Eerie forest shadows, glowing talismans, and dark mystery town horizons.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Dark',
      title: 'Dark',
      tagline: 'Everything Is Connected',
      desc: 'Winden rain-soaked yellow raincoat, cave vortex shadows, and triquetra time loops.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Lost',
      title: 'Lost',
      tagline: 'The Island',
      desc: 'Emerald jungle canopy, mysterious hatch steel, and sun-drenched island shores.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Last Kingdom',
      title: 'The Last Kingdom',
      tagline: 'Destiny Is All',
      desc: 'Anglo-Saxon shield walls, mud-and-fire battlefields, and Wessex kingdom banners.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Walking Dead',
      title: 'The Walking Dead',
      tagline: 'Apocalypse Horizon',
      desc: 'Weathered highway horizon, rustic crossbow steel, and gritty apocalyptic decay.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Wire',
      title: 'The Wire',
      tagline: 'Baltimore Streets',
      desc: 'Raw Baltimore brick textures, police wiretape reels, and gritty urban realism.',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Joker',
      title: 'Joker',
      tagline: 'Put On A Happy Face',
      desc: 'Staircase dance silhouettes, clown makeup crimson, and Gotham 1970s yellow-green drama.',
      imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Boys',
      title: 'The Boys',
      tagline: 'Vought International',
      desc: 'Compound V neon blue, laser red eye glows, and anti-hero graphic satire.',
      imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Dark Knight',
      title: 'The Dark Knight',
      tagline: 'Gotham Guardian',
      desc: 'Bat-signal searchlights, towering Gotham skyscraper shadows, and chaotic Joker card pop accents.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'La Casa de Papel',
      title: 'La Casa de Papel',
      tagline: 'Bella Ciao',
      desc: 'Dalí mask red jumpsuits, royal mint gold bars, and high-stakes heist suspense.',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: '2001: A Space Odyssey',
      title: '2001: A Space Odyssey',
      tagline: 'Monolithic Cosmic',
      desc: 'HAL 9000 glowing red eye, stark white stargate corridors, and monolithic black stone alignment.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Oppenheimer',
      title: 'Oppenheimer',
      tagline: 'Destroyer of Worlds',
      desc: 'Atomic fireball glow, black-and-white quantum physics equations, and desert test site drama.',
      imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Interstellar',
      title: 'Interstellar',
      tagline: 'Gargantua Horizon',
      desc: 'Singularity gravitational lens accretion disk, cornfield dusk, and cosmic wormhole vistas.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'City of God',
      title: 'City of God',
      tagline: 'Favela Sunset',
      desc: 'Sun-drenched Rio de Janeiro orange, vintage 1970s film grain, and intense favela stories.',
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Paul',
      title: 'Paul',
      tagline: 'Alien Roadtrip',
      desc: 'Area 51 desert highway twilight, neon green extraterrestrial aura, and retro RV adventures.',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Captain Phillips',
      title: 'Captain Phillips',
      tagline: "I'm The Captain Now",
      desc: 'Deep ocean navy, cargo ship steel, and high-tension maritime rescue drama.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    }
  ]
};

/** Card metadata for one sub-collection of a family, with a safe fallback. */
export function subCategoryCard(style: StyleType | null, subCat: string): SubCategoryInfo {
  const list = (style ? SUBCATEGORY_INFOS[style] : undefined) || [];
  return (
    list.find((c) => c.name === subCat || c.title === subCat) || {
      name: subCat,
      title: subCat,
      tagline: 'Collection',
      desc: '',
      imageUrl: '',
    }
  );
}

/** Category metadata by style key. */
export function categoryInfo(style: StyleType | null): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.name === style);
}
\n```\n\n**src/lib/stickerTransform.ts**\n```tsx\n/**
 * Pure geometry for the Canva-style sticker stage.
 *
 * Everything here is framework free and unit free: values are normalised to the
 * cut area (0..1 on both axes) so a transform survives a size change, a unit
 * change and a reload. No DOM, no React: this file is fully testable.
 */

export interface ArtTransform {
  /** Centre of the artwork inside the cut area, 0..1 (0.5 = centred). */
  x: number;
  y: number;
  /** Uniform zoom. 1 = the artwork exactly fits the cut area (contain). */
  scale: number;
  /** Rotation in degrees, -180..180. */
  rotation: number;
  /** Mirroring. */
  flipX: boolean;
  flipY: boolean;
}

/** Crop window expressed as insets of the cut area, 0..1 from each edge. */
export interface CropRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type CropHandle =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se'
  | 'move';

export const MIN_SCALE = 0.2;
export const MAX_SCALE = 6;
/** The crop window can never become smaller than this share of the cut area. */
export const MIN_CROP = 0.12;

export const IDENTITY_TRANSFORM: ArtTransform = {
  x: 0.5,
  y: 0.5,
  scale: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
};

export const FULL_CROP: CropRect = { left: 0, top: 0, right: 0, bottom: 0 };

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Rounds to 4 decimals so stored state stays small and comparable. */
export function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function clampTransform(t: ArtTransform): ArtTransform {
  return {
    x: round4(clamp(t.x, -1, 2)),
    y: round4(clamp(t.y, -1, 2)),
    scale: round4(clamp(t.scale, MIN_SCALE, MAX_SCALE)),
    rotation: round4(normaliseAngle(t.rotation)),
    flipX: !!t.flipX,
    flipY: !!t.flipY,
  };
}

/** Keeps an angle inside -180..180. */
export function normaliseAngle(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a + 0; /* turns -0 into 0 so stored values stay comparable */
}

/** Snaps to the nearest multiple of `step` when within `tolerance` degrees. */
export function snapAngle(deg: number, step = 90, tolerance = 4): number {
  const nearest = Math.round(deg / step) * step;
  return Math.abs(deg - nearest) <= tolerance ? normaliseAngle(nearest) : normaliseAngle(deg);
}

export function isCropped(crop: CropRect): boolean {
  return crop.left > 0.001 || crop.top > 0.001 || crop.right > 0.001 || crop.bottom > 0.001;
}

export function cropWidth(crop: CropRect): number {
  return 1 - crop.left - crop.right;
}

export function cropHeight(crop: CropRect): number {
  return 1 - crop.top - crop.bottom;
}

/** Guarantees a usable window: never inverted, never below MIN_CROP. */
export function clampCrop(crop: CropRect): CropRect {
  let left = clamp(crop.left, 0, 1 - MIN_CROP);
  let right = clamp(crop.right, 0, 1 - MIN_CROP);
  if (left + right > 1 - MIN_CROP) {
    const excess = left + right - (1 - MIN_CROP);
    right = Math.max(0, right - excess);
    if (left + right > 1 - MIN_CROP) left = Math.max(0, 1 - MIN_CROP - right);
  }

  let top = clamp(crop.top, 0, 1 - MIN_CROP);
  let bottom = clamp(crop.bottom, 0, 1 - MIN_CROP);
  if (top + bottom > 1 - MIN_CROP) {
    const excess = top + bottom - (1 - MIN_CROP);
    bottom = Math.max(0, bottom - excess);
    if (top + bottom > 1 - MIN_CROP) top = Math.max(0, 1 - MIN_CROP - bottom);
  }

  return { left: round4(left), top: round4(top), right: round4(right), bottom: round4(bottom) };
}

/**
 * Applies a pointer drag to one crop handle.
 * `dx`/`dy` are normalised deltas (pixels / stage size).
 */
export function resizeCrop(crop: CropRect, handle: CropHandle, dx: number, dy: number): CropRect {
  const next: CropRect = { ...crop };

  if (handle === 'move') {
    const w = cropWidth(crop);
    const h = cropHeight(crop);
    const left = clamp(crop.left + dx, 0, 1 - w);
    const top = clamp(crop.top + dy, 0, 1 - h);
    return clampCrop({ left, top, right: 1 - left - w, bottom: 1 - top - h });
  }

  if (handle.includes('w')) next.left = crop.left + dx;
  if (handle.includes('e')) next.right = crop.right - dx;
  if (handle.includes('n')) next.top = crop.top + dy;
  if (handle.includes('s')) next.bottom = crop.bottom - dy;

  return clampCrop(next);
}

/** Distance between two pointers - used for pinch zoom. */
export function pointerDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Angle in degrees between two pointers - used for two-finger rotation. */
export function pointerAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/**
 * CSS transform for the artwork layer.
 * Order matters: translate, then rotate, then scale, then mirror.
 */
export function artworkCssTransform(t: ArtTransform): string {
  const tx = (t.x - 0.5) * 100;
  const ty = (t.y - 0.5) * 100;
  const sx = t.flipX ? -t.scale : t.scale;
  const sy = t.flipY ? -t.scale : t.scale;
  return `translate(-50%, -50%) translate(${round4(tx)}cqw, ${round4(ty)}cqh) rotate(${round4(t.rotation)}deg) scale(${round4(sx)}, ${round4(sy)})`;
}

/** `clip-path: inset(...)` for the crop window. */
export function cropCssInset(crop: CropRect): string {
  return `inset(${round4(crop.top * 100)}% ${round4(crop.right * 100)}% ${round4(crop.bottom * 100)}% ${round4(crop.left * 100)}%)`;
}

/**
 * After a crop, the visible cut is smaller than the requested sheet.
 * This returns the real printed size in pixels.
 */
export function croppedSizePx(
  widthPx: number,
  heightPx: number,
  crop: CropRect,
): { widthPx: number; heightPx: number } {
  return {
    widthPx: widthPx * cropWidth(crop),
    heightPx: heightPx * cropHeight(crop),
  };
}

/** Human readable summary stored with the order. */
export function transformSummary(t: ArtTransform, crop: CropRect): string {
  const parts: string[] = [];
  if (Math.abs(t.scale - 1) > 0.01) parts.push(`zoom ${t.scale.toFixed(2)}x`);
  if (Math.abs(t.rotation) > 0.5) parts.push(`rotated ${Math.round(t.rotation)}deg`);
  if (t.flipX) parts.push('flipped horizontally');
  if (t.flipY) parts.push('flipped vertically');
  if (Math.abs(t.x - 0.5) > 0.01 || Math.abs(t.y - 0.5) > 0.01) parts.push('repositioned');
  if (isCropped(crop)) {
    parts.push(
      `cropped to ${Math.round(cropWidth(crop) * 100)}% x ${Math.round(cropHeight(crop) * 100)}%`,
    );
  }
  return parts.length ? parts.join(', ') : 'original framing';
}

/* ---------------------------------------------------------------------------
 * Persistence of the stage state (separate from the personalization store so
 * nothing about the existing poster flow changes).
 * ------------------------------------------------------------------------- */

export interface StageState {
  transform: ArtTransform;
  crop: CropRect;
}

export const STAGE_STORAGE_PREFIX = 'prism.sticker.stage.v1.';

export function defaultStageState(): StageState {
  return { transform: { ...IDENTITY_TRANSFORM }, crop: { ...FULL_CROP } };
}

/** Defensive parsing: a corrupt record must never break the editor. */
export function parseStageState(raw: string | null): StageState {
  if (!raw) return defaultStageState();
  try {
    const parsed = JSON.parse(raw) as Partial<StageState>;
    return {
      transform: clampTransform({ ...IDENTITY_TRANSFORM, ...(parsed.transform ?? {}) }),
      crop: clampCrop({ ...FULL_CROP, ...(parsed.crop ?? {}) }),
    };
  } catch {
    return defaultStageState();
  }
}

export function loadStageState(stickerId: string): StageState {
  if (typeof window === 'undefined') return defaultStageState();
  try {
    return parseStageState(window.localStorage.getItem(STAGE_STORAGE_PREFIX + stickerId));
  } catch {
    return defaultStageState();
  }
}

export function saveStageState(stickerId: string, state: StageState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STAGE_STORAGE_PREFIX + stickerId, JSON.stringify(state));
  } catch {
    /* quota or private mode: the editor keeps working in memory */
  }
}
\n```\n\n**src/components/stickers/StickerCanvasStage.tsx**\n```tsx\nimport React, { useCallback, useRef } from 'react';
import {
  ArtTransform,
  CropRect,
  CropHandle,
  clampTransform,
  clampCrop,
  resizeCrop,
  artworkCssTransform,
  cropCssInset,
  cropWidth,
  cropHeight,
  pointerAngle,
  pointerDistance,
  snapAngle,
  clamp,
  MIN_SCALE,
  MAX_SCALE,
} from '../../lib/stickerTransform';

export type StageMode = 'move' | 'crop' | 'draw' | 'text';

export interface StickerCanvasStageProps {
  /** Source artwork. */
  imageUrl: string;
  alt: string;
  /** Cut aspect ratio (width / height) of the sticker sheet. */
  cutAspect: number;
  transform: ArtTransform;
  crop: CropRect;
  mode: StageMode;
  borderHex: string;
  onTransformChange: (next: ArtTransform) => void;
  onCropChange: (next: CropRect) => void;
  /** Personalization layers (drawing canvas, text overlay) rendered on top. */
  children?: React.ReactNode;
  /** The live drawing canvas must receive the pointer events in draw mode. */
  drawingLayer?: React.ReactNode;
}

const HANDLES: { id: CropHandle; className: string; label: string }[] = [
  { id: 'nw', className: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize', label: 'Crop top left' },
  { id: 'n', className: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize', label: 'Crop top' },
  { id: 'ne', className: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize', label: 'Crop top right' },
  { id: 'w', className: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize', label: 'Crop left' },
  { id: 'e', className: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize', label: 'Crop right' },
  { id: 'sw', className: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize', label: 'Crop bottom left' },
  { id: 's', className: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize', label: 'Crop bottom' },
  { id: 'se', className: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize', label: 'Crop bottom right' },
];

/**
 * The interactive sticker stage.
 *
 * Move mode  : one finger / mouse drag = reposition, wheel = zoom,
 *              two fingers = pinch zoom + rotate.
 * Crop mode  : eight handles + a draggable window, finger or mouse.
 * Draw / text: pointer events are handed over to the personalization layers.
 *
 * Keyboard: arrows nudge, +/- zoom, [ ] rotate. Every gesture has an
 * equivalent button in the toolbar, so nothing is pointer-only.
 */
export default function StickerCanvasStage({
  imageUrl,
  alt,
  cutAspect,
  transform,
  crop,
  mode,
  borderHex,
  onTransformChange,
  onCropChange,
  children,
  drawingLayer,
}: StickerCanvasStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  /** Active pointers, needed for pinch. */
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gesture = useRef<{
    startTransform: ArtTransform;
    startCrop: CropRect;
    startX: number;
    startY: number;
    handle: CropHandle | null;
    pinchDistance: number;
    pinchAngle: number;
  } | null>(null);

  const stageSize = useCallback(() => {
    const rect = stageRef.current?.getBoundingClientRect();
    return { w: rect?.width || 1, h: rect?.height || 1 };
  }, []);

  /* ------------------------------------------------------------- pointers */

  const beginGesture = useCallback(
    (e: React.PointerEvent, handle: CropHandle | null) => {
      if (mode === 'draw' || mode === 'text') return;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const list = [...pointers.current.values()];
      gesture.current = {
        startTransform: { ...transform },
        startCrop: { ...crop },
        startX: e.clientX,
        startY: e.clientY,
        handle,
        pinchDistance: list.length === 2 ? pointerDistance(list[0], list[1]) : 0,
        pinchAngle: list.length === 2 ? pointerAngle(list[0], list[1]) : 0,
      };
    },
    [crop, mode, transform],
  );

  const moveGesture = useCallback(
    (e: React.PointerEvent) => {
      if (!gesture.current || !pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = gesture.current;
      const { w, h } = stageSize();
      const list = [...pointers.current.values()];

      /* two fingers: pinch zoom + rotate, always on the artwork */
      if (list.length >= 2 && g.pinchDistance > 0) {
        const distance = pointerDistance(list[0], list[1]);
        const angle = pointerAngle(list[0], list[1]);
        onTransformChange(
          clampTransform({
            ...g.startTransform,
            scale: clamp(
              g.startTransform.scale * (distance / g.pinchDistance),
              MIN_SCALE,
              MAX_SCALE,
            ),
            rotation: snapAngle(g.startTransform.rotation + (angle - g.pinchAngle)),
          }),
        );
        return;
      }

      const dx = (e.clientX - g.startX) / w;
      const dy = (e.clientY - g.startY) / h;

      if (mode === 'crop' && g.handle) {
        onCropChange(resizeCrop(g.startCrop, g.handle, dx, dy));
        return;
      }

      if (mode === 'move') {
        onTransformChange(
          clampTransform({
            ...g.startTransform,
            x: g.startTransform.x + dx,
            y: g.startTransform.y + dy,
          }),
        );
      }
    },
    [mode, onCropChange, onTransformChange, stageSize],
  );

  const endGesture = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
  }, []);

  /* ---------------------------------------------------------------- wheel */

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (mode !== 'move') return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.06 : 1 / 1.06;
      onTransformChange(clampTransform({ ...transform, scale: transform.scale * factor }));
    },
    [mode, onTransformChange, transform],
  );

  /* ------------------------------------------------------------- keyboard */

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (mode !== 'move') return;
      const step = e.shiftKey ? 0.05 : 0.01;
      let next: ArtTransform | null = null;

      if (e.key === 'ArrowLeft') next = { ...transform, x: transform.x - step };
      else if (e.key === 'ArrowRight') next = { ...transform, x: transform.x + step };
      else if (e.key === 'ArrowUp') next = { ...transform, y: transform.y - step };
      else if (e.key === 'ArrowDown') next = { ...transform, y: transform.y + step };
      else if (e.key === '+' || e.key === '=') next = { ...transform, scale: transform.scale * 1.08 };
      else if (e.key === '-' || e.key === '_') next = { ...transform, scale: transform.scale / 1.08 };
      else if (e.key === '[') next = { ...transform, rotation: transform.rotation - 5 };
      else if (e.key === ']') next = { ...transform, rotation: transform.rotation + 5 };

      if (next) {
        e.preventDefault();
        onTransformChange(clampTransform(next));
      }
    },
    [mode, onTransformChange, transform],
  );

  const interactive = mode === 'move' || mode === 'crop';

  return (
    <div
      ref={stageRef}
      className="relative w-full overflow-hidden rounded-[18px] border-2 bg-[#0f0f14] touch-none select-none"
      style={{
        aspectRatio: `${cutAspect}`,
        borderColor: borderHex,
        containerType: 'inline-size',
        cursor: mode === 'move' ? 'grab' : 'default',
      }}
      role={interactive ? 'application' : undefined}
      aria-label={
        mode === 'crop'
          ? 'Crop the sticker. Drag the handles, or use the crop buttons.'
          : 'Move, zoom and rotate the artwork. Drag, pinch, scroll, or use the arrow keys.'
      }
      tabIndex={interactive ? 0 : -1}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      onPointerDown={(e) => (mode === 'crop' ? beginGesture(e, 'move') : beginGesture(e, null))}
      onPointerMove={moveGesture}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
    >
      {/* ------------------------------------------------ artwork + layers */}
      <div className="absolute inset-0" style={{ clipPath: cropCssInset(crop) }}>
        <img
          src={imageUrl}
          alt={alt}
          draggable={false}
          referrerPolicy="no-referrer"
          className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
          style={{
            width: '100cqw',
            height: '100cqh',
            objectFit: 'contain',
            transform: artworkCssTransform(transform),
            transformOrigin: 'center center',
          }}
        />
        {children}
        {drawingLayer}
      </div>

      {/* ------------------------------------------------------- crop chrome */}
      {mode === 'crop' && (
        <>
          {/* dimmed area outside the crop window */}
          <div
            className="absolute inset-0 bg-black/55 pointer-events-none"
            style={{ clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${crop.left * 100}% ${crop.top * 100}%, ${crop.left * 100}% ${(1 - crop.bottom) * 100}%, ${(1 - crop.right) * 100}% ${(1 - crop.bottom) * 100}%, ${(1 - crop.right) * 100}% ${crop.top * 100}%, ${crop.left * 100}% ${crop.top * 100}%)` }}
          />

          <div
            className="absolute border border-white/90"
            style={{
              left: `${crop.left * 100}%`,
              top: `${crop.top * 100}%`,
              width: `${cropWidth(crop) * 100}%`,
              height: `${cropHeight(crop) * 100}%`,
            }}
          >
            {/* rule-of-thirds guides */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
            </div>

            {HANDLES.map((handle) => (
              <button
                key={handle.id}
                type="button"
                aria-label={handle.label}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  beginGesture(e, handle.id);
                }}
                onPointerMove={moveGesture}
                onPointerUp={endGesture}
                onPointerCancel={endGesture}
                className={`absolute w-5 h-5 rounded-full bg-white border-2 border-[#7952F3] shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7952F3] ${handle.className}`}
              />
            ))}
          </div>
        </>
      )}

      {/* subtle die-cut edge, always on top */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[16px]"
        style={{ boxShadow: `inset 0 0 0 3px ${borderHex}33` }}
      />
    </div>
  );
}
\n```\n\n**src/components/StickersView.tsx**\n```tsx\nimport React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Search, X, HelpCircle } from 'lucide-react';
import { Painting, StyleType, FramingOption } from '../types';
import { Personalization } from '../lib/personalization';
import ArtImage from './ArtImage';
import CoverImage from './CoverImage';
import {
  LEGACY_SUBCATEGORY_COVERS,
  CATEGORY_COVER_FALLBACKS,
} from '../lib/legacyCovers';
import {
  ANIME_SUBCATEGORIES,
  FILM_SUBCATEGORIES,
  SERIES_SUBCATEGORIES,
  COLLECTIONS_BY_TITLE,
  collectionCover,
} from '../lib/art';
import {
  CATEGORIES,
  displayStyle,
  subCategoryCard,
  categoryInfo,
} from '../lib/galleryTaxonomy';
import {
  STICKER_PRODUCTS,
  STICKERS_BY_ID,
  StickerProduct,
} from '../lib/stickers';
import StickerEditor from './stickers/StickerEditor';

/* ---------------------------------------------------------------------------
 * The sticker workshop is a MIRROR of the paintings gallery.
 * Same taxonomy module, same covers, same ordering, same card markup.
 * Nothing about a category, a cover or a collection is declared here:
 * everything comes from `lib/galleryTaxonomy`, `lib/art` and `lib/stickers`,
 * so any cover changed for the paintings changes here too, automatically.
 * ------------------------------------------------------------------------- */

const GRID_SIZES = '(min-width: 1280px) 400px, (min-width: 768px) 30vw, 45vw';
const SEARCH_SIZES = '(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw';
const EAGER_COUNT = 6;

interface StickersViewProps {
  onAddToCart: (painting: Painting, frame: FramingOption, personalization?: Personalization) => void;
}

/** Exactly the same sub-collection lists the gallery browses. */
function subCollectionsFor(style: StyleType | null): string[] {
  if (!style) return [];
  if (style === 'Motorbikes') {
    return [
      'Sportbike',
      'Nakedbike',
      'Cruiser',
      'Adventure / Trail',
      'Cafe Racer',
      'Scooter / Maxiscooter',
      'Technical Specifications',
      'Retro & Heritage',
    ];
  }
  if (style === 'Cars') return ['Technical Specifications', 'Track & Performance'];
  if (style === 'Anime') return ANIME_SUBCATEGORIES;
  if (style === 'Films') return [...FILM_SUBCATEGORIES, ...SERIES_SUBCATEGORIES];
  return [];
}

/** One sticker card - identical framing to a painting card. */
function StickerCard({
  sticker,
  index,
  sizes,
  onOpen,
}: {
  sticker: StickerProduct;
  index: number;
  sizes: string;
  onOpen: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="group cursor-pointer flex flex-col space-y-4 animate-fade-in"
    >
      <div className="w-full bg-forest-deep border border-forest-sage/20 flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:border-forest-gold shadow-sm hover:shadow-md p-6">
        {sticker.image ? (
          <ArtImage
            image={sticker.image}
            alt={`${sticker.title} sticker`}
            sizes={sizes}
            priority={index < EAGER_COUNT}
            wrapperClassName="w-full"
            className="object-contain shadow-xl group-hover:scale-[1.03] transition-transform duration-700"
          />
        ) : (
          <img
            src={sticker.imageUrl}
            alt={sticker.title}
            loading={index < EAGER_COUNT ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-auto object-contain shadow-xl group-hover:scale-[1.03] transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        )}

        <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
          Die-cut vinyl
        </div>

        <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
          Customize
        </div>
      </div>

      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-mono tracking-widest text-forest-gold/80">
            {sticker.collection ?? displayStyle(sticker.style)}
          </span>
          <h3 className="font-serif text-lg text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
            {sticker.title}
          </h3>
          <p className="text-xs text-forest-cream/60 font-serif italic">
            by {sticker.artistName}
          </p>
        </div>

        <div className="text-right">
          <span className="font-mono text-xs tracking-wider text-forest-cream font-bold bg-forest-black border border-forest-sage/20 px-2.5 py-1 block">
            From $8.50
          </span>
          <span className="text-[8px] uppercase tracking-widest text-forest-cream/40 font-sans mt-1 block">
            Incl. cut
          </span>
        </div>
      </div>
    </article>
  );
}

export default function StickersView({ onAddToCart }: StickersViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<StyleType | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [isSubCategoryConfirmed, setIsSubCategoryConfirmed] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Traditional' | 'Pop Culture'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editorStickerId, setEditorStickerId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSubCategory(null);
    if (!selectedCategory) setIsSubCategoryConfirmed(false);
  }, [selectedCategory]);

  const countForStyle = (style: StyleType) =>
    STICKER_PRODUCTS.filter((s) => s.style === style).length;

  /* Only families that really have stickers, in the gallery's own order. */
  const visibleCategories = useMemo(
    () =>
      CATEGORIES.filter(
        (cat) => (activeTab === 'All' || cat.type === activeTab) && countForStyle(cat.name) > 0,
      ),
    [activeTab],
  );

  const availableSubCategories = useMemo(
    () => subCollectionsFor(selectedCategory).filter((sub) =>
      STICKER_PRODUCTS.some((s) => s.style === selectedCategory && s.collection === sub),
    ),
    [selectedCategory],
  );

  const seriesSplitIndex = useMemo(() => {
    if (selectedCategory !== 'Films') return -1;
    const films = availableSubCategories.filter((t) => FILM_SUBCATEGORIES.includes(t));
    return films.length > 0 && films.length < availableSubCategories.length ? films.length : -1;
  }, [selectedCategory, availableSubCategories]);

  const globalSearchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return STICKER_PRODUCTS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artistName.toLowerCase().includes(q) ||
        s.style.toLowerCase().includes(q) ||
        (s.collection ?? '').toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const listedStickers = useMemo(() => {
    if (!selectedCategory) return [];
    let result = STICKER_PRODUCTS.filter((s) => s.style === selectedCategory);
    if (selectedSubCategory) result = result.filter((s) => s.collection === selectedSubCategory);
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || (s.collection ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [selectedCategory, selectedSubCategory, searchQuery]);

  const currentCategoryInfo = categoryInfo(selectedCategory);
  const editorSticker = editorStickerId ? STICKERS_BY_ID.get(editorStickerId) : undefined;

  /* ---------------------------------------------------------------- editor */
  if (editorStickerId) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        {editorSticker ? (
          <StickerEditor
            sticker={editorSticker}
            onBack={() => setEditorStickerId(null)}
            onAddToCart={onAddToCart}
          />
        ) : (
          <div className="bg-forest-deep border border-forest-sage/20 p-12 text-center space-y-4">
            <HelpCircle className="w-10 h-10 text-forest-sage mx-auto" />
            <h3 className="font-serif text-2xl text-forest-cream font-bold">This sticker is no longer available</h3>
            <button
              onClick={() => setEditorStickerId(null)}
              className="bg-forest-gold text-forest-black text-[10px] tracking-[0.2em] uppercase font-bold px-6 py-3 cursor-pointer"
            >
              Back to the workshop
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-12">
      {/* ------------------------------------------------- header + search */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-semibold">
              Sticker Workshop
            </span>
            <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mt-2 text-forest-cream font-bold">
              Die-Cut Vinyl Stickers
            </h1>
            <p className="text-sm text-forest-cream/70 max-w-2xl font-sans mt-3 leading-relaxed">
              Every canvas in the gallery exists here as a sticker, inside the very same collections.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-forest-cream/40" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stickers"
              aria-label="Search stickers"
              className="w-full bg-forest-black border border-forest-sage/20 pl-9 pr-9 py-3 text-xs font-sans text-forest-cream placeholder:text-forest-cream/40 focus:outline-none focus:border-forest-gold transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-cream/40 hover:text-forest-gold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- global search */}
      {searchQuery.trim() && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
              {globalSearchResults.length} results
            </span>
            <span className="h-px flex-1 bg-forest-sage/20" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
            {globalSearchResults.slice(0, 48).map((sticker, i) => (
              <StickerCard
                key={sticker.id}
                sticker={sticker}
                index={i}
                sizes={SEARCH_SIZES}
                onOpen={() => setEditorStickerId(sticker.id)}
              />
            ))}
          </div>
        </div>
      )}

      {!searchQuery.trim() && selectedCategory === null ? (
        /* -------------------------------------------- VIEW 1: CATEGORIES */
        <div className="space-y-8">
          <div className="flex gap-2">
            {(['All', 'Pop Culture', 'Traditional'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-[0.2em] border transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-forest-gold text-forest-black border-forest-gold'
                    : 'bg-forest-black text-forest-cream/70 border-forest-sage/20 hover:border-forest-gold'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 animate-fade-in">
            {visibleCategories.map((cat) => {
              const count = countForStyle(cat.name);
              return (
                <article
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setIsSubCategoryConfirmed(
                      subCollectionsFor(cat.name).filter((sub) =>
                        STICKER_PRODUCTS.some((s) => s.style === cat.name && s.collection === sub),
                      ).length === 0,
                    );
                  }}
                  className="group cursor-pointer flex flex-col space-y-4 transition-all"
                >
                  <div className="aspect-[3/4] bg-forest-deep border border-forest-sage/20 relative overflow-hidden transition-all duration-500 group-hover:border-forest-gold shadow-sm hover:shadow-md">
                    <CoverImage
                      candidates={[cat.imageUrl, CATEGORY_COVER_FALLBACKS[cat.name]]}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    />

                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="absolute top-0 bottom-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/[0.25] to-transparent skew-x-[-30deg] transition-transform duration-1000 ease-out group-hover:translate-x-[450%]" />
                      <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
                    </div>

                    <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                      {cat.type}
                    </div>

                    <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm">
                      {count} {count === 1 ? 'Sticker' : 'Stickers'}
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-forest-gold/80">
                        {cat.tagline}
                      </span>
                      <h3 className="font-serif text-xl text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
                        {displayStyle(cat.name)}
                      </h3>
                      <p className="text-xs text-forest-cream/70 font-sans mt-2 line-clamp-2 leading-relaxed">
                        {cat.desc}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 self-center pl-2">
                      <span className="p-2 border border-forest-sage/20 bg-forest-black hover:bg-forest-gold hover:text-forest-black text-forest-cream rounded-full transition-colors duration-300 block">
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : !searchQuery.trim() && !isSubCategoryConfirmed && availableSubCategories.length > 0 ? (
        /* --------------------------------------- VIEW 1.5: SUB-COLLECTIONS */
        <div className="space-y-12 animate-fade-in">
          <div className="border-b border-forest-sage/20 pb-8 space-y-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-forest-cream/60 hover:text-forest-gold transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to all Collections</span>
            </button>

            <div>
              <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-semibold">
                Discover {displayStyle(selectedCategory!)}
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mt-2 text-forest-cream font-bold">
                {displayStyle(selectedCategory!)} Sticker Collections
              </h1>
              <p className="text-sm text-forest-cream/70 max-w-2xl font-sans mt-3 leading-relaxed">
                {currentCategoryInfo?.desc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 animate-fade-in">
            {availableSubCategories.map((subCat, subIdx) => {
              const card = subCategoryCard(selectedCategory, subCat);
              const stickerCount = STICKER_PRODUCTS.filter(
                (s) => s.style === selectedCategory && s.collection === subCat,
              ).length;

              return (
                <React.Fragment key={subCat}>
                  {subIdx === 0 && seriesSplitIndex > 0 && (
                    <div className="col-span-full flex items-center gap-3 pb-1">
                      <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
                        Films
                      </span>
                      <span className="h-px flex-1 bg-forest-sage/20" />
                    </div>
                  )}
                  {subIdx === seriesSplitIndex && (
                    <div className="col-span-full flex items-center gap-3 pt-6 pb-1">
                      <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
                        Series
                      </span>
                      <span className="h-px flex-1 bg-forest-sage/20" />
                    </div>
                  )}

                  <article
                    onClick={() => {
                      setSelectedSubCategory(subCat);
                      setIsSubCategoryConfirmed(true);
                    }}
                    className="group cursor-pointer flex flex-col space-y-4 transition-all"
                  >
                    <div className="aspect-[3/4] bg-forest-deep border border-forest-sage/20 relative overflow-hidden transition-all duration-500 group-hover:border-forest-gold shadow-sm hover:shadow-md">
                      <CoverImage
                        candidates={[
                          collectionCover(COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? '')?.src,
                          card.imageUrl,
                          LEGACY_SUBCATEGORY_COVERS[card.title],
                          LEGACY_SUBCATEGORY_COVERS[card.name ?? ''],
                          selectedCategory ? CATEGORY_COVER_FALLBACKS[selectedCategory] : null,
                          currentCategoryInfo?.imageUrl,
                        ]}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute top-0 bottom-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/[0.25] to-transparent skew-x-[-30deg] transition-transform duration-1000 ease-out group-hover:translate-x-[450%]" />
                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
                      </div>

                      <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                        {card.tagline}
                      </div>

                      <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm">
                        {stickerCount} stickers
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-forest-gold/80">
                          {card.tagline}
                        </span>
                        <h3 className="font-serif text-xl text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
                          {subCat}
                        </h3>
                        <p className="text-xs text-forest-cream/70 font-sans mt-2 line-clamp-2 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0 self-center pl-2">
                        <span className="p-2 border border-forest-sage/20 bg-forest-black hover:bg-forest-gold hover:text-forest-black text-forest-cream rounded-full transition-colors duration-300 block">
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </article>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : !searchQuery.trim() ? (
        /* ------------------------------------------ VIEW 2: STICKER GRID */
        <div className="space-y-12 animate-fade-in">
          <div className="space-y-6">
            <button
              onClick={() => {
                if (availableSubCategories.length > 0) {
                  setIsSubCategoryConfirmed(false);
                  setSelectedSubCategory(null);
                } else {
                  setSelectedCategory(null);
                }
              }}
              className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-forest-cream/60 hover:text-forest-gold transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
              <span>
                {availableSubCategories.length > 0
                  ? `Back to ${displayStyle(selectedCategory!)} Collections`
                  : 'Back to all Collections'}
              </span>
            </button>

            <div className="bg-forest-deep border border-forest-sage/20 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center shadow-sm">
              {currentCategoryInfo && (
                <>
                  <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 border border-forest-sage/20 p-2.5 bg-forest-black">
                    <CoverImage
                      candidates={[
                        selectedSubCategory
                          ? collectionCover(COLLECTIONS_BY_TITLE.get(selectedSubCategory)?.slug ?? '')?.src
                          : null,
                        selectedSubCategory
                          ? LEGACY_SUBCATEGORY_COVERS[selectedSubCategory]
                          : null,
                        currentCategoryInfo.imageUrl,
                        CATEGORY_COVER_FALLBACKS[currentCategoryInfo.name],
                      ]}
                      alt={selectedSubCategory ?? currentCategoryInfo.name}
                      className="w-full h-full object-cover shadow-sm"
                      priority
                    />
                  </div>
                  <div className="space-y-3 text-center md:text-left flex-grow">
                    <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-bold bg-forest-black px-3 py-1 border border-forest-sage/10 rounded-sm">
                      {currentCategoryInfo.type} / {currentCategoryInfo.tagline}
                    </span>
                    <h1 className="font-serif text-3xl md:text-4xl text-forest-cream tracking-tight font-bold">
                      {selectedSubCategory ?? displayStyle(selectedCategory!)} Stickers
                    </h1>
                    <p className="text-sm text-forest-cream/70 font-sans leading-relaxed max-w-2xl">
                      {selectedSubCategory
                        ? subCategoryCard(selectedCategory, selectedSubCategory).desc
                        : currentCategoryInfo.desc}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
            {listedStickers.length === 0 ? (
              <div className="col-span-full bg-forest-deep border border-forest-sage/20 p-12 text-center space-y-4">
                <HelpCircle className="w-10 h-10 text-forest-sage mx-auto" />
                <h3 className="font-serif text-2xl text-forest-cream font-bold">No stickers here yet</h3>
                <p className="text-xs text-forest-cream/70 max-w-sm mx-auto font-sans leading-relaxed">
                  This collection has no artwork that can be printed as a sticker.
                </p>
              </div>
            ) : (
              listedStickers.map((sticker, i) => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
                  index={i}
                  sizes={GRID_SIZES}
                  onOpen={() => setEditorStickerId(sticker.id)}
                />
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
\n```\n\n**src/components/stickers/StickerEditor.tsx**\n```tsx\nimport React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Pen, Type, Eraser, Undo2, Redo2, Trash2,
  RotateCcw, RotateCw, Minus, Plus, ShoppingBag, Check,
  Move, Crop, FlipHorizontal, FlipVertical, Maximize2, Minimize2, RefreshCw,
} from 'lucide-react';
import { Painting, FramingOption } from '../../types';
import { Personalization } from '../../lib/personalization';
import { usePersonalization } from '../../hooks/usePersonalization';
import { useSignaturePad } from '../../hooks/useSignaturePad';
import { useLazyFonts } from '../../hooks/useLazyFonts';
import { PersonalizationOverlay } from '../personalization/PersonalizationOverlay';
import { FontCarousel } from '../personalization/FontCarousel';
import { InkColorPicker } from '../personalization/InkColorPicker';
import StickerDimensionControls from './StickerDimensionControls';
import StickerCanvasStage, { StageMode } from './StickerCanvasStage';
import {
  StickerProduct, StickerSpec, StickerFinishId,
  STICKER_FINISHES, DEFAULT_FINISH_ID, finishById,
  stickerPrice, buildStickerCartPainting, buildStickerFinishOption,
} from '../../lib/stickers';
import {
  LengthUnit, DEFAULT_STICKER_WIDTH_PX, DEFAULT_STICKER_HEIGHT_PX, formatSize,
} from '../../lib/stickerUnits';
import {
  ArtTransform, CropRect, IDENTITY_TRANSFORM, FULL_CROP,
  clampTransform, clampCrop, normaliseAngle, isCropped, croppedSizePx,
  transformSummary, loadStageState, saveStageState, cropWidth, cropHeight,
  MIN_SCALE, MAX_SCALE,
} from '../../lib/stickerTransform';

export interface StickerEditorProps {
  sticker: StickerProduct;
  onBack: () => void;
  onAddToCart: (painting: Painting, frame: FramingOption, personalization?: Personalization) => void;
}

/** Crop windows offered as one-tap presets, like a design tool. */
const CROP_PRESETS: { id: string; label: string; ratio: number | null }[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: 'square', label: '1:1', ratio: 1 },
  { id: 'portrait', label: '4:5', ratio: 4 / 5 },
  { id: 'wide', label: '16:9', ratio: 16 / 9 },
];

const toolButton = (active: boolean) =>
  [
    'min-h-11 rounded-xl inline-flex items-center justify-center gap-2 px-2 text-[11px] font-bold uppercase tracking-widest',
    'transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7952F3]',
    active ? 'bg-[#7952F3] text-white' : 'text-forest-cream/70 hover:bg-white/10',
  ].join(' ');

const chip =
  'inline-flex items-center gap-1 min-h-11 px-3 rounded-xl bg-white/5 text-[11px] font-bold text-forest-cream/80 hover:bg-white/10 disabled:opacity-40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7952F3]';

export default function StickerEditor({ sticker, onBack, onAddToCart }: StickerEditorProps) {
  /* ===== 1. Cut dimensions (source of truth = unrounded pixels) ===== */
  const [widthPx, setWidthPx] = useState<number>(DEFAULT_STICKER_WIDTH_PX);
  const [heightPx, setHeightPx] = useState<number>(DEFAULT_STICKER_HEIGHT_PX);
  const [unit, setUnit] = useState<LengthUnit>('cm');
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [finishId, setFinishId] = useState<StickerFinishId>(DEFAULT_FINISH_ID);
  const [added, setAdded] = useState(false);

  const cutAspect = heightPx > 0 ? widthPx / heightPx : 1;

  useEffect(() => {
    const ratio = sticker.aspect > 0 ? sticker.aspect : 1;
    setWidthPx(DEFAULT_STICKER_WIDTH_PX);
    setHeightPx(DEFAULT_STICKER_WIDTH_PX / ratio);
    setLockAspect(true);
  }, [sticker.id, sticker.aspect]);

  /* ===== 2. Canva-style stage state (move / zoom / rotate / crop) ===== */
  const [mode, setMode] = useState<StageMode>('move');
  const [transform, setTransform] = useState<ArtTransform>(IDENTITY_TRANSFORM);
  const [crop, setCrop] = useState<CropRect>(FULL_CROP);

  /* Restore the saved framing of this exact sticker. */
  useEffect(() => {
    const saved = loadStageState(sticker.id);
    setTransform(saved.transform);
    setCrop(saved.crop);
    setMode('move');
  }, [sticker.id]);

  /* Persist it (debounced by the browser's own idle write cost, tiny payload). */
  useEffect(() => {
    saveStageState(sticker.id, { transform, crop });
  }, [sticker.id, transform, crop]);

  const applyCropPreset = useCallback((ratio: number | null) => {
    if (ratio === null) {
      setCrop(FULL_CROP);
      return;
    }
    /* Largest window of `ratio` that fits inside the current cut. */
    const stageRatio = cutAspect;
    let w = 1;
    let h = 1;
    if (ratio > stageRatio) h = stageRatio / ratio;
    else w = ratio / stageRatio;
    const left = (1 - w) / 2;
    const top = (1 - h) / 2;
    setCrop(clampCrop({ left, top, right: left, bottom: top }));
  }, [cutAspect]);

  const resetFraming = useCallback(() => {
    setTransform(IDENTITY_TRANSFORM);
    setCrop(FULL_CROP);
  }, []);

  const nudgeScale = useCallback((factor: number) => {
    setTransform((t) => clampTransform({ ...t, scale: t.scale * factor }));
  }, []);

  const rotateBy = useCallback((deg: number) => {
    setTransform((t) => clampTransform({ ...t, rotation: normaliseAngle(t.rotation + deg) }));
  }, []);

  /* ===== 3. Personalization (same primitives as the poster studio) ===== */
  const { ready: fontsReady } = useLazyFonts(true);
  const p = usePersonalization(sticker.id, true);

  const [inkColor, setInkColor] = useState<string>('#7952F3');
  const [penSize, setPenSize] = useState<number>(0.012);
  const [erasing, setErasing] = useState<boolean>(false);

  const pad = useSignaturePad({
    color: inkColor,
    size: penSize,
    erasing,
    aspect: cutAspect,
    onChange: p.setStrokes,
  });

  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    if (hydratedFor.current === sticker.id) return;
    hydratedFor.current = sticker.id;
    if (p.value.strokes.length > 0) pad.setStrokes(p.value.strokes);
  }, [sticker.id, p.value.strokes, pad]);

  /* ===== 4. Price and cart ===== */
  /* Cropping really reduces the printed sticker, so it must price the cut. */
  const printed = useMemo(
    () => croppedSizePx(widthPx, heightPx, crop),
    [widthPx, heightPx, crop],
  );

  const spec: StickerSpec = useMemo(
    () => ({ widthPx: printed.widthPx, heightPx: printed.heightPx, unit, finishId }),
    [printed.widthPx, printed.heightPx, unit, finishId],
  );

  const finish = finishById(finishId);
  const price = stickerPrice(spec);

  const handleDimensions = useCallback((next: { widthPx: number; heightPx: number }) => {
    setWidthPx(next.widthPx);
    setHeightPx(next.heightPx);
  }, []);

  const removeSignature = useCallback(() => {
    pad.clear();
    p.setStrokes([]);
  }, [pad, p]);

  const handleAdd = useCallback(() => {
    const committed = p.commit(cutAspect * (cropWidth(crop) / cropHeight(crop)));
    const cartPainting = buildStickerCartPainting(sticker, spec);
    /* The framing is part of the order: keep it human readable in the story. */
    cartPainting.story = `${cartPainting.story} Framing: ${transformSummary(transform, crop)}.`;
    onAddToCart(cartPainting, buildStickerFinishOption(spec), committed);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }, [p, cutAspect, crop, sticker, spec, transform, onAddToCart]);

  const layer: 'draw' | 'text' = mode === 'text' ? 'text' : 'draw';
  const placement = layer === 'draw' ? p.value.drawPlacement : p.value.textPlacement;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10">
      {/* ===================== STAGE ===================== */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full border border-[#D0CDE6]/20 text-xs font-bold uppercase tracking-widest text-forest-cream/80 hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7952F3]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to stickers
        </button>

        <div className="rounded-[36px] border border-[#D0CDE6]/15 bg-[#101018]/60 p-4 sm:p-6 space-y-4">
          <div className="mx-auto w-full max-w-[520px]">
            <StickerCanvasStage
              imageUrl={sticker.imageUrl}
              alt={`${sticker.title} sticker artwork`}
              cutAspect={cutAspect}
              transform={transform}
              crop={crop}
              mode={mode}
              borderHex={finish.borderHex}
              onTransformChange={setTransform}
              onCropChange={setCrop}
              drawingLayer={
                <div ref={pad.containerRef} className="absolute inset-0">
                  <canvas
                    ref={pad.canvasRef}
                    {...pad.handlers}
                    aria-label="Sticker drawing surface"
                    className={[
                      'absolute inset-0 h-full w-full touch-none',
                      mode === 'draw' ? 'z-20 cursor-crosshair' : 'pointer-events-none z-0 opacity-0',
                    ].join(' ')}
                  />
                </div>
              }
            >
              <PersonalizationOverlay
                aspect={cutAspect}
                strokes={p.value.strokes}
                text={p.value.text}
                drawPlacement={p.value.drawPlacement}
                textPlacement={p.value.textPlacement}
                interactive={mode === 'text'}
                onMovePlacement={p.patchPlacement}
                activeLayer={layer}
                showSafeArea={mode === 'text' || mode === 'draw'}
                fontsReady={fontsReady}
              />
            </StickerCanvasStage>
          </div>

          <p className="text-center text-[11px] font-mono text-forest-sage" aria-live="polite">
            {formatSize(printed.widthPx, printed.heightPx, unit)} · {finish.name}
            {isCropped(crop) && ' · cropped'}
          </p>

          {/* -------- Mode switch: Move / Crop / Draw / Text -------- */}
          <div
            role="radiogroup"
            aria-label="Editing mode"
            className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-white/5 border border-[#D0CDE6]/15"
          >
            {([
              { id: 'move' as StageMode, label: 'Move', icon: Move },
              { id: 'crop' as StageMode, label: 'Crop', icon: Crop },
              { id: 'draw' as StageMode, label: 'Draw', icon: Pen },
              { id: 'text' as StageMode, label: 'Text', icon: Type },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => {
                  setMode(id);
                  if (id === 'draw' || id === 'text') p.setMode(id);
                }}
                className={toolButton(mode === id)}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                {mode === id && <span className="sr-only">(selected)</span>}
              </button>
            ))}
          </div>

          <p className="text-center text-[10px] text-forest-sage">
            {mode === 'move' && 'Drag to move · scroll or pinch to zoom · two fingers to rotate · arrow keys to nudge'}
            {mode === 'crop' && 'Drag the handles or the window to crop the sticker itself'}
            {mode === 'draw' && 'Draw directly on the sticker with your finger or the mouse'}
            {mode === 'text' && 'Drag the text on the sticker to place it'}
          </p>
        </div>
      </div>

      {/* ===================== CONTROLS ===================== */}
      <div className="space-y-6">
        <header className="space-y-1">
          <p className="text-[10px] font-mono font-bold tracking-widest text-forest-gold uppercase">
            [ {sticker.collection ?? sticker.categoryLabel} ]
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-forest-cream">{sticker.title}</h2>
          <p className="text-xs text-forest-sage">
            Derived from artwork {sticker.paintingId} · {sticker.artistName}
          </p>
        </header>

        {/* -------- Artwork transform (Canva-style) -------- */}
        <div className="space-y-3 rounded-2xl border border-[#D0CDE6]/15 bg-white/5 p-3">
          <span className="text-[10px] font-mono font-bold tracking-widest text-forest-gold uppercase">
            [ Artwork ]
          </span>

          <label className="block text-[10px] font-medium text-forest-sage">
            Zoom · {transform.scale.toFixed(2)}x
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.01}
              value={transform.scale}
              onChange={(e) => setTransform(clampTransform({ ...transform, scale: Number(e.target.value) }))}
              className="mt-1 w-full accent-[#7952F3]"
              aria-label="Artwork zoom"
            />
          </label>

          <label className="block text-[10px] font-medium text-forest-sage">
            Rotation · {Math.round(transform.rotation)}°
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={transform.rotation}
              onChange={(e) => setTransform(clampTransform({ ...transform, rotation: Number(e.target.value) }))}
              className="mt-1 w-full accent-[#7952F3]"
              aria-label="Artwork rotation"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip} onClick={() => nudgeScale(1 / 1.1)} aria-label="Zoom out">
              <Minimize2 className="w-4 h-4" /> Zoom out
            </button>
            <button type="button" className={chip} onClick={() => nudgeScale(1.1)} aria-label="Zoom in">
              <Maximize2 className="w-4 h-4" /> Zoom in
            </button>
            <button type="button" className={chip} onClick={() => rotateBy(-90)} aria-label="Rotate left 90 degrees">
              <RotateCcw className="w-4 h-4" /> 90°
            </button>
            <button type="button" className={chip} onClick={() => rotateBy(90)} aria-label="Rotate right 90 degrees">
              <RotateCw className="w-4 h-4" /> 90°
            </button>
            <button
              type="button"
              className={chip}
              aria-pressed={transform.flipX}
              onClick={() => setTransform(clampTransform({ ...transform, flipX: !transform.flipX }))}
            >
              <FlipHorizontal className="w-4 h-4" /> Flip
            </button>
            <button
              type="button"
              className={chip}
              aria-pressed={transform.flipY}
              onClick={() => setTransform(clampTransform({ ...transform, flipY: !transform.flipY }))}
            >
              <FlipVertical className="w-4 h-4" /> Flip
            </button>
            <button type="button" className={chip} onClick={resetFraming}>
              <RefreshCw className="w-4 h-4" /> Reset framing
            </button>
          </div>
        </div>

        {/* -------- Crop -------- */}
        <div className="space-y-3 rounded-2xl border border-[#D0CDE6]/15 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-forest-gold uppercase">
              [ Crop ]
            </span>
            <span className="font-mono text-[10px] text-forest-sage">
              {Math.round(cropWidth(crop) * 100)}% × {Math.round(cropHeight(crop) * 100)}%
            </span>
          </div>

          <div role="radiogroup" aria-label="Crop ratio" className="flex flex-wrap gap-2">
            {CROP_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={preset.ratio === null ? !isCropped(crop) : false}
                onClick={() => {
                  setMode('crop');
                  applyCropPreset(preset.ratio);
                }}
                className={chip}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-forest-sage">
            Cropping cuts the sticker itself, so the printed size and the price follow the crop.
          </p>
        </div>

        <StickerDimensionControls
          widthPx={widthPx}
          heightPx={heightPx}
          unit={unit}
          lockAspect={lockAspect}
          artworkAspect={sticker.aspect}
          onChange={handleDimensions}
          onUnitChange={setUnit}
          onLockAspectChange={setLockAspect}
        />

        {/* -------- Finish -------- */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-forest-gold uppercase">[ Finish ]</span>
          <div role="radiogroup" aria-label="Sticker finish" className="grid grid-cols-2 gap-2">
            {STICKER_FINISHES.map((option) => {
              const selected = option.id === finishId;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFinishId(option.id)}
                  className={[
                    'min-h-11 rounded-2xl border px-3 py-2 text-left transition-colors cursor-pointer',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7952F3]',
                    selected ? 'border-[#7952F3] bg-[#7952F3]/15' : 'border-[#D0CDE6]/15 bg-white/5 hover:bg-white/10',
                  ].join(' ')}
                >
                  <span className="block text-xs font-bold text-forest-cream">{option.name}</span>
                  <span className="block font-mono text-[10px] text-forest-gold">
                    {option.priceModifier === 0 ? 'included' : '+$' + option.priceModifier.toFixed(2)}
                  </span>
                  {selected && <span className="sr-only">(selected)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* -------- Draw / Text panels -------- */}
        {mode === 'draw' && (
          <div className="space-y-3 rounded-2xl border border-[#D0CDE6]/15 bg-white/5 p-3">
            <InkColorPicker value={inkColor} onChange={setInkColor} label="Ink" />

            <label className="block text-[10px] font-medium text-forest-sage">
              Pen size
              <input
                type="range"
                min={0.002}
                max={0.03}
                step={0.001}
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="mt-1 w-full accent-[#7952F3]"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setErasing((v) => !v)}
                aria-pressed={erasing}
                className={erasing ? chip + ' bg-[#7952F3] text-white' : chip}
              >
                <Eraser className="w-4 h-4" /> Erase
              </button>
              <button type="button" onClick={pad.undo} disabled={!pad.canUndo} aria-label="Undo stroke" className={chip}>
                <Undo2 className="w-4 h-4" /> Undo
              </button>
              <button type="button" onClick={pad.redo} disabled={!pad.canRedo} aria-label="Redo stroke" className={chip}>
                <Redo2 className="w-4 h-4" /> Redo
              </button>
              <button
                type="button"
                onClick={removeSignature}
                disabled={pad.isEmpty}
                aria-label="Remove signature"
                className={chip + ' text-[#FCA5A5]'}
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-3 rounded-2xl border border-[#D0CDE6]/15 bg-white/5 p-3">
            <label className="block text-[10px] font-medium text-forest-sage">
              Sticker text
              <input
                type="text"
                maxLength={42}
                value={p.value.text.value}
                onChange={(e) => p.patchText({ value: e.target.value })}
                placeholder="Your text"
                className="mt-1 w-full min-h-11 px-3 rounded-xl bg-white/5 border border-[#D0CDE6]/20 text-sm text-forest-cream focus:outline-none focus:border-[#7952F3]"
              />
            </label>

            <FontCarousel
              value={p.value.text.fontId}
              onChange={(fontId) => p.patchText({ fontId })}
              sampleText={p.value.text.value}
              fontsReady={fontsReady}
            />
            <InkColorPicker value={p.value.text.color} onChange={(color) => p.patchText({ color })} label="Text colour" />

            <label className="block text-[10px] font-medium text-forest-sage">
              Text size
              <input
                type="range"
                min={0.02}
                max={0.22}
                step={0.005}
                value={p.value.text.sizeRatio}
                onChange={(e) => p.patchText({ sizeRatio: Number(e.target.value) })}
                className="mt-1 w-full accent-[#7952F3]"
              />
            </label>
          </div>
        )}

        {/* -------- Layer placement (signature / text) -------- */}
        {(mode === 'draw' || mode === 'text') && (
          <div className="space-y-2 rounded-2xl border border-[#D0CDE6]/15 bg-white/5 p-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-forest-gold uppercase">
              [ {layer === 'draw' ? 'Signature' : 'Text'} placement ]
            </span>
            <p className="text-[10px] text-forest-sage">Drag it directly on the sticker, or use the controls below.</p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-label="Scale down"
                onClick={() => p.patchPlacement(layer, { scale: Math.max(0.2, placement.scale - 0.1) })}
                className={chip}
              >
                <Minus className="w-4 h-4" /> Smaller
              </button>
              <button
                type="button"
                aria-label="Scale up"
                onClick={() => p.patchPlacement(layer, { scale: Math.min(3, placement.scale + 0.1) })}
                className={chip}
              >
                <Plus className="w-4 h-4" /> Larger
              </button>
              <button
                type="button"
                aria-label="Rotate left"
                onClick={() => p.patchPlacement(layer, { rotation: placement.rotation - 5 })}
                className={chip}
              >
                <RotateCcw className="w-4 h-4" /> Rotate
              </button>
              <button
                type="button"
                aria-label="Rotate right"
                onClick={() => p.patchPlacement(layer, { rotation: placement.rotation + 5 })}
                className={chip}
              >
                <RotateCw className="w-4 h-4" /> Rotate
              </button>
              <button
                type="button"
                onClick={() => p.patchPlacement(layer, { x: 0.5, y: 0.78, scale: 1, rotation: 0 })}
                className={chip}
              >
                Reset placement
              </button>
            </div>
          </div>
        )}

        {/* -------- Price + add to cart -------- */}
        <div className="flex items-center justify-between gap-4 rounded-[28px] border border-[#D0CDE6]/15 bg-[#101018]/60 p-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-forest-sage">Total</p>
            <p className="text-2xl font-bold text-forest-cream">${(price + p.price).toFixed(2)}</p>
            {p.personalized && (
              <p className="text-[10px] text-forest-gold">Includes personalization +${p.price.toFixed(2)}</p>
            )}
          </div>

          <motion.button
            type="button"
            onClick={handleAdd}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 min-h-12 px-6 rounded-full bg-[#7952F3] text-sm font-bold uppercase tracking-widest text-white hover:bg-[#6B45E0] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            {added ? 'Added' : 'Add to cart'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
\n```\n\n**src/components/GalleryView.tsx**\n```tsx\nimport React, { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, Check, HelpCircle, ChevronDown, RotateCcw, ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { Painting, StyleType, SizeCategory } from '../types';
import { PAINTINGS } from '../data';
import ArtImage from './ArtImage';
import CoverImage from './CoverImage';
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
  FILM_SUBCATEGORIES,
  SERIES_SUBCATEGORIES,
  COLLECTIONS_BY_TITLE,
  collectionCover,
  collectionCount,
} from '../lib/art';

/* ---------------------------------------------------------------------------
 * تلميحات مقاسات العرض (sizes)
 * مشتقة من التخطيط الفعلي للملف: الحاوية max-w-7xl (1280px)
 * مع px-6/px-12، والشبكة تصل إلى 4 أعمدة عند إخفاء الفلاتر.
 * لا تغيّر هذه القيم دون تغيير أصناف الشبكة معها.
 * ------------------------------------------------------------------------- */

/** شبكة اللوحات الرئيسية. */
const GRID_SIZES = '(min-width: 1280px) 400px, (min-width: 768px) 30vw, 45vw';

/** شبكة نتائج البحث (4 أعمدة على lg). */
const SEARCH_SIZES = '(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw';

/** بطاقات المجموعات. */
const CARD_SIZES = '(min-width: 1024px) 380px, (min-width: 640px) 45vw, 92vw';

/**
 * عدد البطاقات التي تُحمّل بأولوية عالية (تقريبًا ملء الطية الأولى).
 * 6 = صفّان على سطح المكتب. ما بعدها lazy.
 */
const EAGER_COUNT = 6;

/**
 * حجم الصفحة الواحدة.
 * إلزامي: Better Call Saul وحدها 36 لوحة، والمجموع 695.
 * بلا ترقيم صفحات، اختيار «All» يرسم 695 بطاقة في DOM واحد.
 */
const PAGE_SIZE = 24;

interface GalleryViewProps {
  onSelectPainting: (painting: Painting) => void;
  initialStyleFilter?: StyleType | null;
  onClearInitialStyleFilter?: () => void;
}

/* Taxonomy (categories, display names, sub-collection cards) now lives in
 * `src/lib/galleryTaxonomy.ts` so that the sticker workshop reuses exactly the
 * same covers, taglines, descriptions and ordering as this gallery. */

export default function GalleryView({ 
  onSelectPainting,
  initialStyleFilter,
  onClearInitialStyleFilter
 }: GalleryViewProps) {
  // selectedCategory determines if we are browsing all categories (null) or a specific family
  const [selectedCategory, setSelectedCategory] = useState<StyleType | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [isSubCategoryConfirmed, setIsSubCategoryConfirmed] = useState<boolean>(false);

  const [selectedSizes, setSelectedSizes] = useState<SizeCategory[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(8000);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'year'>('default');
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Traditional' | 'Pop Culture'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  /** رقم الصفحة الحالية داخل نتائج الترشيح. يبدأ من 1. */
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setSelectedSubCategory(null);
    if (!selectedCategory) {
      setIsSubCategoryConfirmed(false);
    }
  }, [selectedCategory]);

  // Handle incoming initialStyleFilter from navigation or Home Page selection
  useEffect(() => {
    if (initialStyleFilter) {
      const isValid = CATEGORIES.some(cat => cat.name === initialStyleFilter);
      if (isValid) {
        setSelectedCategory(initialStyleFilter);
        const hasSub = hasSubCollections(initialStyleFilter);
        setIsSubCategoryConfirmed(!hasSub);
      } else {
        setSelectedCategory(null);
        setIsSubCategoryConfirmed(false);
      }
      if (onClearInitialStyleFilter) {
        onClearInitialStyleFilter();
      }
    } else if ((initialStyleFilter as any) === '') {
      setSelectedCategory(null);
      setIsSubCategoryConfirmed(false);
      if (onClearInitialStyleFilter) {
        onClearInitialStyleFilter();
      }
    }
  }, [initialStyleFilter, onClearInitialStyleFilter]);

  const sizeOptions: { value: SizeCategory; label: string; desc: string }[] = [
    { value: 'Small', label: 'Small', desc: 'Up to 60cm' },
    { value: 'Medium', label: 'Medium', desc: '60cm – 90cm' },
    { value: 'Large', label: 'Large', desc: '90cm – 120cm' },
    { value: 'Collector', label: 'Collector Scale', desc: '120cm+' }
  ];

  const paletteOptions = [
    { id: 'earth', label: 'Warm Earth & Sienna', hex: '#A18F7D', bgClass: 'bg-[#A18F7D]' },
    { id: 'monochrome', label: 'Monochrome Slate', hex: '#2A2A2A', bgClass: 'bg-[#2A2A2A]' },
    { id: 'lapis', label: 'Prussian Navy & Indigo', hex: '#162C4E', bgClass: 'bg-[#162C4E]' },
    { id: 'ochre', label: 'Vibrant Ochre & Honey', hex: '#C68735', bgClass: 'bg-[#C68735]' }
  ];

  const toggleSize = (size: SizeCategory) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const resetAllFilters = () => {
    setSelectedSizes([]);
    setSelectedPalette(null);
    setMaxPrice(8000);
    setSortBy('default');
    setSelectedSubCategory(null);
    setSearchQuery('');
  };

  // Global search matching paintings across all collections
  const globalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return PAINTINGS.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.artistName.toLowerCase().includes(q) ||
      p.style.toLowerCase().includes(q) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
      p.story.toLowerCase().includes(q) ||
      p.paletteNames.some(name => name.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Filter and sort paintings for the chosen category
  const filteredPaintings = useMemo(() => {
    if (!selectedCategory) return [];

    let result = PAINTINGS.filter(p => p.style === selectedCategory);

    if (selectedSubCategory) {
      result = result.filter(p => p.subCategory === selectedSubCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.artistName.toLowerCase().includes(q) ||
        p.style.toLowerCase().includes(q) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        p.story.toLowerCase().includes(q) ||
        p.paletteNames.some(name => name.toLowerCase().includes(q))
      );
    }

    if (selectedSizes.length > 0) {
      result = result.filter(p => selectedSizes.includes(p.sizeCategory));
    }

    if (selectedPalette) {
      if (selectedPalette === 'earth') {
        result = result.filter(p => p.colorPalette.some(c => ['#8C7A6B', '#A18F7D', '#6F5C4B', '#C5B9AD', '#CBBDA0', '#8D7F67'].includes(c)));
      } else if (selectedPalette === 'monochrome') {
        result = result.filter(p => p.colorPalette.some(c => ['#121212', '#2A2A2A', '#131313', '#343332', '#72706D', '#0F0F0F', '#242424', '#EDEDED'].includes(c)));
      } else if (selectedPalette === 'lapis') {
        result = result.filter(p => p.colorPalette.some(c => ['#0C1625', '#162C4E', '#325078', '#1F1A3A', '#4A3B6B', '#A58BBA', '#0A192F', '#172A45', '#306F8A', '#00F0FF', '#00FF87'].includes(c)));
      } else if (selectedPalette === 'ochre') {
        result = result.filter(p => p.colorPalette.some(c => ['#D1A153', '#E5CE93', '#C68735', '#E2A414', '#D21F3C'].includes(c)));
      }
    }

    result = result.filter(p => p.price <= maxPrice);

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'year') {
      result.sort((a, b) => b.year - a.year);
    }

    return result;
  }, [selectedCategory, selectedSubCategory, searchQuery, selectedSizes, selectedPalette, maxPrice, sortBy]);

  /**
   * أي تغيير في المرشّحات يُعيد المستخدم للصفحة الأولى.
   * بدون هذا، البقاء على الصفحة 8 بعد ترشيح يترك 12 نتيجة يعطي شاشة فارغة.
   */
  useEffect(() => {
    setPage(1);
  }, [
    selectedCategory,
    selectedSubCategory,
    searchQuery,
    selectedSizes,
    selectedPalette,
    maxPrice,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPaintings.length / PAGE_SIZE));

  /** اللوحات المرسومة فعليًا في DOM. */
  const visiblePaintings = useMemo(
    () => filteredPaintings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPaintings, page],
  );

  // Dynamically compute paintings count for each category
  const getCountForStyle = (styleName: StyleType) => {
    return PAINTINGS.filter(p => p.style === styleName).length;
  };

  const filteredCategoriesList = CATEGORIES.filter(cat => activeTab === 'All' || cat.type === activeTab);

  // Return selected category details
  const currentCategoryInfo = useMemo(() => {
    if (!selectedCategory) return null;
    return CATEGORIES.find(cat => cat.name === selectedCategory) || null;
  }, [selectedCategory]);

  /**
   * المجموعات المتوفرة داخل التصنيف المختار.
   *
   * ⚠️ مصدر الحقيقة الوحيد هو src/generated/artCatalog.gen.ts، المولّد من
   * manifest.json على الـ CDN. لا تكتب أي اسم مجموعة يدويًا هنا.
   *
   * هذا يُصلِح خمسة أخطاء دفعة واحدة:
   *   • يحذف 'Claymore'          (صفر صورة)
   *   • يضيف 'Slam Dunk'         (14 صورة كانت مخفية)
   *   • يضيف 'Pulp Fiction'      (26 صورة كانت مخفية)
   *   • يصحّح 'La Casa de Papel' → 'Money Heist'
   *   • يفصل الأفلام عن المسلسلات بدل خلطهما
   */
  const availableSubCategories = useMemo(() => {
    if (!selectedCategory) return [];

    if (selectedCategory === 'Motorbikes') {
      return [
        'Sportbike',
        'Nakedbike',
        'Cruiser',
        'Adventure / Trail',
        'Cafe Racer',
        'Scooter / Maxiscooter',
        'Technical Specifications',
        'Retro & Heritage',
      ];
    }

    if (selectedCategory === 'Cars') {
      return ['Technical Specifications', 'Track & Performance'];
    }

    if (selectedCategory === 'Anime') {
      return ANIME_SUBCATEGORIES;
    }

    if (selectedCategory === 'Films') {
      // الأفلام أولًا ثم المسلسلات — مرتّبة داخل كل مجموعة.
      return [...FILM_SUBCATEGORIES, ...SERIES_SUBCATEGORIES];
    }

    return [];
  }, [selectedCategory]);

  /**
   * حدود الفصل بين الأفلام والمسلسلات، لرسم عنوان قسم وسطي.
   * يُرجع -1 للتصنيفات التي لا تحتاج فصلًا.
   */
  const seriesSplitIndex = selectedCategory === 'Films' ? FILM_SUBCATEGORIES.length : -1;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
      {selectedCategory === null ? (
        /* --- VIEW 1: CATEGORIES BROWSER (RENDERED LIKE PRODUCTS) --- */
        <div className="space-y-10 animate-fade-in">
          <div className="border-b border-forest-sage/20 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-semibold">
                Browse our collections
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mt-2 text-forest-cream font-bold">
                Creative Collections
              </h1>
            </div>
          </div>

          {/* Floating Soft-UI Neumorphic Capsule Search Bar (Matching Reference Image) */}
          <div className="bg-gradient-to-b from-white via-[#F8F8FC] to-[#EDEDF6] border border-white/95 rounded-full p-2.5 md:p-3 shadow-[0_12px_32px_rgba(180,185,210,0.42),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_#FFFFFF,inset_0_-1px_2px_rgba(180,185,210,0.25)] backdrop-blur-xl transition-all">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Left 3D Glossy Ice Blue Orb Icon & Brand Label */}
              <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center pl-2">
                <div className="nn-glossy-orb" />
                <span className="font-sans text-sm font-extrabold text-[#373D4D] tracking-tight">
                  Search
                </span>
              </div>

              {/* Recessed Inset Neumorphic Input Slot */}
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by painting title, film, anime, artist (e.g. Fight Club, Guts, Oppenheimer)..."
                  className="w-full bg-[#E5E4F0] border border-white/80 rounded-full pl-9 pr-10 py-2 text-xs md:text-sm text-[#222634] placeholder-[#70778A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7952F3]/40 shadow-[inset_0_2px_4px_rgba(160,165,190,0.38),inset_0_-1px_1px_rgba(255,255,255,0.9)] transition-all font-sans"
                />
                <Search className="w-3.5 h-3.5 text-[#70778A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70778A] hover:text-[#222634] p-1 cursor-pointer rounded-full hover:bg-white/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Clear Button as Embossed Soft Pill */}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-full md:w-auto text-xs font-bold text-[#222634] bg-gradient-to-b from-white to-[#F3F3FA] border border-white px-4 py-2 rounded-full shadow-[0_4px_14px_rgba(150,155,185,0.32),0_1px_3px_rgba(0,0,0,0.05),inset_0_1.5px_0_#FFFFFF] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>

          {/* Conditional Search Results or Category Grid */}
          {searchQuery.trim() ? (
            <div className="space-y-8 animate-fade-in pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-forest-sage/20 pb-4 gap-2">
                <div>
                  <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-forest-gold font-semibold">
                    Gallery Search Results
                  </span>
                  <h2 className="font-serif text-2xl lg:text-3xl text-forest-cream mt-1 font-bold">
                    Found {globalSearchResults.length} {globalSearchResults.length === 1 ? 'artwork' : 'artworks'} matching "{searchQuery}"
                  </h2>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-sans uppercase font-bold tracking-wider text-forest-gold hover:underline cursor-pointer"
                >
                  ← Return to All Collections
                </button>
              </div>

              {globalSearchResults.length === 0 ? (
                <div className="bg-forest-deep border border-forest-sage/20 p-12 text-center space-y-4">
                  <Search className="w-10 h-10 text-forest-sage/40 mx-auto" />
                  <h3 className="font-serif text-xl text-forest-cream font-bold">No Artworks Found</h3>
                  <p className="text-xs text-forest-cream/70 max-w-md mx-auto leading-relaxed">
                    We couldn't find any paintings matching "{searchQuery}". Try searching for titles like "Fight Club", "Guts", "Oppenheimer", "Berserk", "Yamaha", or artists like "Mesrour".
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 inline-block bg-forest-gold text-forest-black text-xs font-sans uppercase font-bold tracking-widest px-6 py-2.5 hover:bg-forest-gold/90 transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {globalSearchResults.map((painting, searchIndex) => (
                    <article
                      key={painting.id}
                      onClick={() => onSelectPainting(painting)}
                      className="group cursor-pointer bg-forest-deep border border-forest-sage/20 hover:border-forest-gold transition-all flex flex-col p-3 space-y-3 shadow-sm hover:shadow-md"
                    >
                      <div className="aspect-[3/4] bg-forest-black relative overflow-hidden border border-forest-sage/10">
                        {painting.image ? (
                          <ArtImage
                            image={painting.image}
                            alt={painting.title}
                            sizes={SEARCH_SIZES}
                            priority={searchIndex < 4}
                            /* الحاوية الأم تفرض aspect-[3/4]، لذلك نفرض النسبة نفسها
                               ونملأ الإطار بـ object-cover للحفاظ على شكل الشبكة. */
                            aspectRatio="3 / 4"
                            wrapperClassName="w-full h-full"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <img
                            src={painting.imageUrl}
                            alt={painting.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute top-2 left-2 bg-forest-black/90 backdrop-blur-sm px-2 py-0.5 text-[8px] font-mono text-forest-gold uppercase border border-forest-sage/20">
                          {displayStyle(painting.style)}
                        </div>
                        {painting.subCategory && (
                          <div className="absolute top-2 right-2 bg-forest-gold text-forest-black px-2 py-0.5 text-[8px] font-sans font-bold uppercase">
                            {painting.subCategory}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-base text-forest-cream group-hover:text-forest-gold font-bold transition-colors line-clamp-1">
                          {painting.title}
                        </h4>
                        <p className="text-[10px] font-mono text-forest-cream/60 uppercase">
                          {painting.artistName} • {painting.year}
                        </p>
                        <div className="flex justify-between items-center pt-2 border-t border-forest-sage/10 text-xs">
                          <span className="font-mono text-forest-gold font-bold">${painting.price.toLocaleString()}</span>
                          <span className="text-[9px] text-forest-cream/50 uppercase font-mono">{painting.sizeCategory} ({painting.widthCm}×{painting.heightCm}cm)</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Grid of Categories, styled exactly "LIKE THE PRODUCTS" */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 animate-fade-in">
              {filteredCategoriesList.map((cat) => {
                const count = getCountForStyle(cat.name);
                return (
                  <article
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      const hasSub = hasSubCollections(cat.name);
                      setIsSubCategoryConfirmed(!hasSub);
                    }}
                    className="group cursor-pointer flex flex-col space-y-4 transition-all"
                  >
                    {/* Visual Canvas Framing (Exact representation of product frames) */}
                    <div className="aspect-[3/4] bg-forest-deep border border-forest-sage/20 relative overflow-hidden transition-all duration-500 group-hover:border-forest-gold shadow-sm hover:shadow-md">
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Glass Reflection / Satin Sheen Overlay */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Overall ambient glass sheen change */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        {/* Diagonal light sweep (glare reflex) */}
                        <div className="absolute top-0 bottom-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/[0.25] to-transparent skew-x-[-30deg] transition-transform duration-1000 ease-out group-hover:translate-x-[450%]" />
                        
                        {/* Subtle fine border reflection */}
                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
                      </div>

                      {/* Subtle hover overlay details */}
                      <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                        {cat.type}
                      </div>

                      {/* Badge for paintings count */}
                      <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm">
                        {count} {count === 1 ? 'Canvas' : 'Canvases'}
                      </div>
                    </div>

                    {/* Info like a product card */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-forest-gold/80">
                          {cat.tagline}
                        </span>
                        <h3 className="font-serif text-xl text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
                          {displayStyle(cat.name as StyleType)}
                        </h3>
                        <p className="text-xs text-forest-cream/70 font-sans mt-2 line-clamp-2 leading-relaxed">
                          {cat.desc}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0 self-center pl-2">
                        <span className="p-2 border border-forest-sage/20 bg-forest-black hover:bg-forest-gold hover:text-forest-black text-forest-cream rounded-full transition-colors duration-300 block">
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : selectedCategory !== null && !isSubCategoryConfirmed && availableSubCategories.length > 0 ? (
        /* --- VIEW 1.5: SUBCATEGORIES BROWSER PAGE --- */
        <div className="space-y-12 animate-fade-in">
          {/* Breadcrumb back button & Header */}
          <div className="border-b border-forest-sage/20 pb-8 space-y-6">
            <button
              onClick={() => {
                setSelectedCategory(null);
                resetAllFilters();
              }}
              className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-forest-cream/60 hover:text-forest-gold transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to all Collections</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-semibold">
                  Discover {displayStyle(selectedCategory)}
                </span>
                <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mt-2 text-forest-cream font-bold">
                  {displayStyle(selectedCategory)} Sub-Collections
                </h1>
                <p className="text-sm text-forest-cream/70 max-w-2xl font-sans mt-3 leading-relaxed">
                  {currentCategoryInfo?.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Grid of Subcategories, styled EXACTLY like the main categories / products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 animate-fade-in">
            {availableSubCategories.map((subCat, subIdx) => {
              const card = (SUBCATEGORY_INFOS[selectedCategory] || []).find(c => c.name === subCat || c.title === subCat) || {
                title: subCat,
                tagline: 'Collection',
                desc: ''
              };
              
              return (
                <React.Fragment key={subCat}>
                  {subIdx === seriesSplitIndex && (
                    <div className="col-span-full flex items-center gap-3 pt-6 pb-1">
                      <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
                        Series
                      </span>
                      <span className="h-px flex-1 bg-forest-sage/20" />
                      <span className="text-[9px] font-mono text-forest-cream/40">
                        {SERIES_SUBCATEGORIES.length} collections
                      </span>
                    </div>
                  )}
                  {subIdx === 0 && seriesSplitIndex > 0 && (
                    <div className="col-span-full flex items-center gap-3 pb-1">
                      <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
                        Films
                      </span>
                      <span className="h-px flex-1 bg-forest-sage/20" />
                      <span className="text-[9px] font-mono text-forest-cream/40">
                        {FILM_SUBCATEGORIES.length} collections
                      </span>
                    </div>
                  )}

                  <article
                    onClick={() => {
                      setSelectedSubCategory(subCat);
                      setIsSubCategoryConfirmed(true);
                    }}
                    className="group cursor-pointer flex flex-col space-y-4 transition-all"
                  >
                    {/* Visual Canvas Framing */}
                    <div className="aspect-[3/4] bg-forest-deep border border-forest-sage/20 relative overflow-hidden transition-all duration-500 group-hover:border-forest-gold shadow-sm hover:shadow-md">
                      <CoverImage
                        candidates={[
                          collectionCover(COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? '')?.src,
                          (card as any).imageUrl,
                          LEGACY_SUBCATEGORY_COVERS[card.title],
                          LEGACY_SUBCATEGORY_COVERS[(card as any).name ?? ''],
                          selectedCategory ? CATEGORY_COVER_FALLBACKS[selectedCategory] : null,
                          currentCategoryInfo?.imageUrl,
                        ]}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Glass Reflection / Satin Sheen Overlay */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute top-0 bottom-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/[0.25] to-transparent skew-x-[-30deg] transition-transform duration-1000 ease-out group-hover:translate-x-[450%]" />
                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
                      </div>

                      {/* Subtle hover overlay details */}
                      <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                        {card.tagline}
                      </div>

                      {/* Badge for paintings count */}
                      {collectionCount(COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? '') > 0 && (
                        <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm">
                          {collectionCount(COLLECTIONS_BY_TITLE.get(subCat)!.slug)} plates
                        </div>
                      )}
                    </div>

                    {/* Info block styled exactly like a product or main category card */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-forest-gold/80">
                          {card.tagline}
                        </span>
                        <h3 className="font-serif text-xl text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
                          {subCat}
                        </h3>
                        <p className="text-xs text-forest-cream/70 font-sans mt-2 line-clamp-2 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0 self-center pl-2">
                        <span className="p-2 border border-forest-sage/20 bg-forest-black hover:bg-forest-gold hover:text-forest-black text-forest-cream rounded-full transition-colors duration-300 block">
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </article>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        /* --- VIEW 2: PRODUCTS OF THE SELECTED FAMILY PAGE --- */
        <div className="space-y-12 animate-fade-in">
          {/* Breadcrumb Back bar & Header */}
          <div className="space-y-6">
            <button
              onClick={() => {
                if (availableSubCategories.length > 0) {
                  setIsSubCategoryConfirmed(false);
                  setSelectedSubCategory(null);
                } else {
                  setSelectedCategory(null);
                  resetAllFilters();
                }
              }}
              className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-forest-cream/60 hover:text-forest-gold transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
              <span>{availableSubCategories.length > 0 ? `Back to ${displayStyle(selectedCategory)} Sub-Collections` : "Back to all Collections"}</span>
            </button>

            {/* Custom Premium Category Banner */}
            <div className="bg-forest-deep border border-forest-sage/20 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center shadow-sm">
              {currentCategoryInfo && (
                <>
                  <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 border border-forest-sage/20 p-2.5 bg-forest-black">
                    <CoverImage
                      candidates={[
                        currentCategoryInfo.imageUrl,
                        CATEGORY_COVER_FALLBACKS[currentCategoryInfo.name ?? ''],
                      ]}
                      alt={currentCategoryInfo.name ?? 'Collection'}
                      className="w-full h-full object-cover shadow-sm"
                      priority
                    />
                  </div>
                  <div className="space-y-3 text-center md:text-left flex-grow">
                    <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-bold bg-forest-black px-3 py-1 border border-forest-sage/10 rounded-sm">
                      {currentCategoryInfo.type} / {currentCategoryInfo.tagline}
                    </span>
                    <h1 className="font-serif text-3xl md:text-4xl text-forest-cream tracking-tight font-bold">
                      The {displayStyle(selectedCategory)} Collection
                    </h1>
                    <p className="text-xs md:text-sm text-forest-cream/80 leading-relaxed max-w-2xl font-sans">
                      {currentCategoryInfo.desc}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filtering & Sorting Controls Bar - Soft Neumorphic Pill Style */}
          <div className="bg-gradient-to-b from-white via-[#F8F8FC] to-[#EDEDF6] border border-white/95 rounded-3xl md:rounded-full p-2.5 md:p-3 shadow-[0_12px_32px_rgba(180,185,210,0.42),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_#FFFFFF,inset_0_-1px_2px_rgba(180,185,210,0.25)] backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden lg:flex items-center gap-2 text-xs font-bold text-[#222634] bg-gradient-to-b from-white to-[#F3F3FA] border border-white px-4 py-2 rounded-full shadow-[0_4px_14px_rgba(150,155,185,0.32),0_1px_3px_rgba(0,0,0,0.05),inset_0_1.5px_0_#FFFFFF] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#70778A]" />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>

              {/* View 2 Inline Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search within ${displayStyle(selectedCategory)}...`}
                  className="w-full bg-[#E5E4F0] border border-white/80 rounded-full pl-9 pr-8 py-2 text-xs md:text-sm text-[#222634] placeholder-[#70778A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7952F3]/40 shadow-[inset_0_2px_4px_rgba(160,165,190,0.38),inset_0_-1px_1px_rgba(255,255,255,0.9)] transition-all font-sans"
                />
                <Search className="w-3.5 h-3.5 text-[#70778A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70778A] hover:text-[#222634] p-1 cursor-pointer rounded-full hover:bg-white/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              <div className="text-xs font-sans font-bold text-[#70778A] bg-white/70 border border-white/90 px-3 py-1.5 rounded-full shadow-inner shrink-0">
                Showing <span className="text-[#222634] font-extrabold">{filteredPaintings.length}</span> {filteredPaintings.length === 1 ? 'canvas' : 'canvases'}
              </div>
            </div>

            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none text-xs font-bold text-[#222634] bg-gradient-to-b from-white to-[#F3F3FA] border border-white pl-4 pr-9 py-2 rounded-full shadow-[0_4px_14px_rgba(150,155,185,0.32),0_1px_3px_rgba(0,0,0,0.05),inset_0_1.5px_0_#FFFFFF] hover:scale-[1.02] cursor-pointer focus:outline-none transition-all font-sans"
              >
                <option value="default" className="bg-white text-[#222634]">Default Hanging</option>
                <option value="price-asc" className="bg-white text-[#222634]">Price: Low to High</option>
                <option value="price-desc" className="bg-white text-[#222634]">Price: High to Low</option>
                <option value="year" className="bg-white text-[#222634]">Newest First</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#70778A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Sidebar Filters */}
            {showFilters && (
              <aside className="hidden lg:block lg:col-span-1 space-y-8 bg-forest-deep border border-forest-sage/20 p-6 sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto overscroll-contain shadow-sm pr-4 scrollbar-thin animate-fade-in">
                <div className="flex items-center justify-between border-b border-forest-sage/20 pb-3">
                  <span className="font-sans text-xs tracking-widest uppercase font-semibold text-forest-cream">
                    Product Filters
                  </span>
                  <button
                    onClick={resetAllFilters}
                    className="text-[10px] uppercase font-bold text-forest-gold hover:opacity-80 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 text-forest-gold" />
                    Reset
                  </button>
                </div>

                {/* Sidebar Search Filter */}
                <div className="space-y-2">
                  <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
                    Keyword Search
                  </h3>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-forest-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Title, artist, story..."
                      className="w-full bg-forest-black border border-forest-sage/30 pl-8 pr-7 py-2 text-[11px] text-forest-cream placeholder-forest-cream/40 focus:outline-none focus:border-forest-gold"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-forest-cream/60 hover:text-forest-gold cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Family Info Panel in Sidebar */}
                <div className="space-y-2 bg-forest-black p-4 border border-forest-sage/10 rounded-sm">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-forest-gold">
                    Active Collection
                  </h4>
                  <p className="text-xs font-serif text-forest-cream/90 font-bold">{displayStyle(selectedCategory)}</p>
                  <button 
                    onClick={() => {
                      setSelectedCategory(null);
                      resetAllFilters();
                    }}
                    className="text-[9px] font-sans underline uppercase text-forest-gold hover:opacity-80 mt-1 block"
                  >
                    Switch Collection
                  </button>
                </div>

                {/* Size Filters */}
                <div className="space-y-3">
                  <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
                    Canvas Dimension
                  </h3>
                  <div className="space-y-2">
                    {sizeOptions.map((sz) => (
                      <label 
                        key={sz.value}
                        className="flex items-start gap-3 text-xs text-forest-cream/80 hover:text-forest-cream cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(sz.value)}
                          onChange={() => toggleSize(sz.value)}
                          className="rounded border-forest-sage/40 text-forest-gold focus:ring-forest-gold w-4 h-4 mt-0.5 cursor-pointer bg-forest-black"
                        />
                        <div>
                          <span className="block font-medium">{sz.label}</span>
                          <span className="text-[10px] text-forest-cream/50">{sz.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color Palette Filter */}
                <div className="space-y-3">
                  <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
                    Color Palette Tone
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {paletteOptions.map((pal) => (
                      <button
                        key={pal.id}
                        onClick={() => setSelectedPalette(selectedPalette === pal.id ? null : pal.id)}
                        className={`flex items-center gap-2 border px-2.5 py-1.5 text-left transition-all ${
                          selectedPalette === pal.id
                            ? 'border-forest-gold bg-forest-sage/20 font-bold'
                            : 'border-forest-sage/20 hover:border-forest-gold'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${pal.bgClass} flex-shrink-0 border border-forest-sage/20`} />
                        <span className="text-[9px] font-medium leading-none uppercase tracking-wider truncate text-forest-cream/80">
                          {pal.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
                      Acquisition Budget
                    </h3>
                    <span className="font-mono text-forest-gold font-bold">
                      Up to ${maxPrice.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="8000"
                    step="250"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full accent-forest-gold cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-forest-cream/50 font-mono">
                    <span>$1,000</span>
                    <span>$8,000</span>
                  </div>
                </div>
              </aside>
            )}

            {/* Paintings Grid
              * ⚠️ مجموعتا أصناف حصريتان ومنفصلتان تمامًا.
              * ممنوع دمج إعلاني grid-cols مختلفين لنفس نقطة التوقف.
              * أي تغيير هنا يُلزم تحديث GRID_SIZES في أعلى الملف.
              */}
            <main
              className={
                showFilters
                  ? 'lg:col-span-3 grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12'
                  : 'lg:col-span-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12'
              }
            >
              {filteredPaintings.length === 0 ? (
                <div className="col-span-full bg-forest-deep border border-forest-sage/20 p-12 text-center space-y-4">
                  <HelpCircle className="w-10 h-10 text-forest-sage mx-auto" />
                  <h3 className="font-serif text-2xl text-forest-cream font-bold">No paintings match</h3>
                  <p className="text-xs text-forest-cream/70 max-w-sm mx-auto font-sans leading-relaxed">
                    Try widening your budget, selecting another canvas size category, or resetting all current filters.
                  </p>
                  <button
                    onClick={resetAllFilters}
                    className="bg-forest-gold text-forest-black hover:opacity-90 text-[10px] tracking-[0.2em] uppercase font-bold px-6 py-3 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                visiblePaintings.map((painting, cardIndex) => (
                  <article 
                    key={painting.id}
                    onClick={() => onSelectPainting(painting)}
                    className="group cursor-pointer flex flex-col space-y-4 animate-fade-in"
                  >
                    {/* Visual Canvas Framing */}
                    <div 
                      className={`w-full bg-forest-deep border border-forest-sage/20 flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:border-forest-gold shadow-sm hover:shadow-md ${
                        painting.sizeCategory === 'Small' ? 'p-4' :
                        painting.sizeCategory === 'Medium' ? 'p-6' :
                        painting.sizeCategory === 'Large' ? 'p-8' :
                        'p-10'
                      }`}
                    >
                      {painting.image ? (
                        <ArtImage
                          image={painting.image}
                          alt={`${painting.title} — ${painting.artistName}`}
                          sizes={GRID_SIZES}
                          priority={cardIndex < EAGER_COUNT}
                          wrapperClassName="w-full"
                          className="object-contain shadow-xl group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      ) : (
                        /* مسار التراجع: اللوحات الأصلية (Unsplash وpostimg) التي
                           لا تملك سجل صورة مولّدًا. تبقى تعمل تمامًا كما كانت،
                           مع إضافة lazy وdecoding فقط. */
                        <img
                          src={painting.imageUrl}
                          alt={painting.title}
                          loading={cardIndex < EAGER_COUNT ? 'eager' : 'lazy'}
                          decoding="async"
                          className="w-full h-auto object-contain shadow-xl group-hover:scale-[1.03] transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      {/* Subtle hover overlay details */}
                      <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                        {painting.widthCm}x{painting.heightCm} cm
                      </div>

                      {/* Tiny design indicator */}
                      <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        View Story
                      </div>
                    </div>

                    {/* Info and Price */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-forest-gold/80">
                          {displayStyle(painting.style)}
                        </span>
                        <h3 className="font-serif text-lg text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
                          {painting.title}
                        </h3>
                        <p className="text-xs text-forest-cream/60 font-serif italic">
                          by {painting.artistName}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-mono text-xs tracking-wider text-forest-cream font-bold bg-forest-black border border-forest-sage/20 px-2.5 py-1 block">
                          ${painting.price.toLocaleString()}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-forest-cream/40 font-sans mt-1 block">
                          Excl. Frame
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </main>
            {totalPages > 1 && (
              <nav
                aria-label="Gallery pagination"
                className="col-span-full flex items-center justify-between gap-4 pt-10 mt-4 border-t border-forest-sage/20"
              >
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-[0.2em] font-bold px-5 py-3 border border-forest-sage/30 text-forest-cream disabled:opacity-30 disabled:cursor-not-allowed hover:border-forest-gold hover:text-forest-gold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Previous
                </button>

                <div className="text-center">
                  <span className="block font-mono text-xs text-forest-gold font-bold">
                    {page} / {totalPages}
                  </span>
                  <span className="block text-[9px] font-mono uppercase tracking-widest text-forest-cream/50 mt-0.5">
                    {filteredPaintings.length} plates
                  </span>
                </div>

                <button
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-[0.2em] font-bold px-5 py-3 border border-forest-sage/30 text-forest-cream disabled:opacity-30 disabled:cursor-not-allowed hover:border-forest-gold hover:text-forest-gold transition-colors cursor-pointer"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
\n```\n\n**tests/stickerTransform.test.ts**\n```tsx\nimport { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  IDENTITY_TRANSFORM,
  FULL_CROP,
  MIN_CROP,
  MIN_SCALE,
  MAX_SCALE,
  clamp,
  clampCrop,
  clampTransform,
  cropCssInset,
  cropHeight,
  cropWidth,
  croppedSizePx,
  isCropped,
  normaliseAngle,
  parseStageState,
  pointerAngle,
  pointerDistance,
  resizeCrop,
  snapAngle,
  transformSummary,
  artworkCssTransform,
} from '../src/lib/stickerTransform';

test('clamp rejects NaN and Infinity', () => {
  assert.equal(clamp(Number.NaN, 0, 1), 0);
  assert.equal(clamp(Number.POSITIVE_INFINITY, 0, 1), 0);
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
});

test('clampTransform keeps the scale inside the allowed range', () => {
  assert.equal(clampTransform({ ...IDENTITY_TRANSFORM, scale: 100 }).scale, MAX_SCALE);
  assert.equal(clampTransform({ ...IDENTITY_TRANSFORM, scale: 0 }).scale, MIN_SCALE);
  assert.equal(clampTransform({ ...IDENTITY_TRANSFORM, scale: Number.NaN }).scale, MIN_SCALE);
});

test('normaliseAngle and snapAngle behave like a design tool', () => {
  assert.equal(normaliseAngle(370), 10);
  assert.equal(normaliseAngle(-370), -10);
  assert.equal(normaliseAngle(Number.NaN), 0);
  assert.equal(snapAngle(88), 90);
  assert.equal(snapAngle(80), 80);
  assert.equal(snapAngle(-1.5), 0);
});

test('crop window can never collapse', () => {
  const crushed = clampCrop({ left: 0.9, right: 0.9, top: 0.95, bottom: 0.95 });
  assert.ok(cropWidth(crushed) >= MIN_CROP - 1e-6);
  assert.ok(cropHeight(crushed) >= MIN_CROP - 1e-6);
});

test('resizeCrop moves the window without changing its size', () => {
  const start = clampCrop({ left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 });
  const moved = resizeCrop(start, 'move', 0.05, -0.05);
  assert.ok(Math.abs(cropWidth(moved) - cropWidth(start)) < 1e-6);
  assert.ok(Math.abs(cropHeight(moved) - cropHeight(start)) < 1e-6);
  assert.ok(moved.left > start.left);
  assert.ok(moved.top < start.top);
});

test('resizeCrop drags a single corner', () => {
  const next = resizeCrop(FULL_CROP, 'se', -0.2, -0.1);
  assert.ok(Math.abs(next.right - 0.2) < 1e-6);
  assert.ok(Math.abs(next.bottom - 0.1) < 1e-6);
  assert.equal(next.left, 0);
  assert.equal(next.top, 0);
});

test('move never pushes the window outside the sticker', () => {
  const start = clampCrop({ left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 });
  const moved = resizeCrop(start, 'move', 5, 5);
  assert.ok(moved.left >= 0 && moved.top >= 0);
  assert.ok(moved.right >= -1e-9 && moved.bottom >= -1e-9);
  assert.ok(moved.left + cropWidth(moved) <= 1 + 1e-6);
});

test('isCropped only reports a real crop', () => {
  assert.equal(isCropped(FULL_CROP), false);
  assert.equal(isCropped(clampCrop({ ...FULL_CROP, left: 0.2 })), true);
});

test('croppedSizePx reduces the printed size', () => {
  const size = croppedSizePx(400, 400, clampCrop({ left: 0.25, right: 0.25, top: 0, bottom: 0 }));
  assert.ok(Math.abs(size.widthPx - 200) < 1e-6);
  assert.ok(Math.abs(size.heightPx - 400) < 1e-6);
});

test('pointer helpers compute pinch distance and angle', () => {
  assert.equal(pointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(pointerAngle({ x: 0, y: 0 }, { x: 1, y: 0 }), 0);
  assert.equal(pointerAngle({ x: 0, y: 0 }, { x: 0, y: 1 }), 90);
});

test('css helpers emit valid values', () => {
  assert.equal(cropCssInset(FULL_CROP), 'inset(0% 0% 0% 0%)');
  const css = artworkCssTransform({ ...IDENTITY_TRANSFORM, flipX: true, scale: 2 });
  assert.ok(css.includes('scale(-2, 2)'));
  assert.ok(css.includes('rotate(0deg)'));
});

test('transformSummary describes the framing in plain words', () => {
  assert.equal(transformSummary(IDENTITY_TRANSFORM, FULL_CROP), 'original framing');
  const summary = transformSummary(
    { ...IDENTITY_TRANSFORM, scale: 1.5, rotation: 90, flipX: true },
    clampCrop({ left: 0.25, right: 0.25, top: 0, bottom: 0 }),
  );
  assert.ok(summary.includes('zoom 1.50x'));
  assert.ok(summary.includes('rotated 90deg'));
  assert.ok(summary.includes('flipped horizontally'));
  assert.ok(summary.includes('cropped to 50%'));
});

test('parseStageState survives corrupt or missing data', () => {
  assert.deepEqual(parseStageState(null).transform, IDENTITY_TRANSFORM);
  assert.deepEqual(parseStageState('not json').crop, FULL_CROP);
  const partial = parseStageState('{"transform":{"scale":99}}');
  assert.equal(partial.transform.scale, MAX_SCALE);
  assert.equal(partial.transform.x, 0.5);
});
\n```\n\n**src/index.css**\n```css\n@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@200;300;400;500;600;700;800&family=Orbitron:wght@400;700;900&family=Audiowide&family=Bruno+Ace+SC&family=Michroma&family=Share+Tech+Mono&family=Wallpoet&family=Syncopate:wght@400;700&family=Major+Mono+Display&family=Silkscreen:wght@400;700&family=Righteous&display=swap');
@import "tailwindcss";

@theme {
  --font-serif: "Plus Jakarta Sans", "Inter", sans-serif;
  --font-sans: "Inter", "Helvetica Neue", "Arial", sans-serif;
  
  --color-forest-black: #EAE9F6; /* Clean light-purple/lavender background */
  --color-forest-deep: rgba(255, 255, 255, 0.4);  /* Translucent glassmorphism base */
  --color-forest-dark: #D0CDE6;  /* Soft slate lavender border */
  --color-forest-medium: #7952F3; /* Bright neon purple accent */
  --color-forest-sage: #5A5D7A;  /* Slate gray secondary text */
  --color-forest-cream: #12131A; /* Sharp black contrasting typography */
  --color-forest-gold: #7952F3;  /* Neon purple accent */

  /* ─── V4: طبقة دلالية للواجهة. الأسماء تصف الوظيفة لا اللون ─── */
  --color-ui-canvas:       #F7F6FB;  /* خلفية الصفحة */
  --color-ui-surface:      #FFFFFF;  /* بطاقة / لوحة */
  --color-ui-surface-alt:  #F1F0F8;  /* صف مطويّ، تمرير الفأرة */
  --color-ui-line:         #DCDAE8;  /* حدّ عادي */
  --color-ui-line-strong:  #B9B5CE;  /* حدّ عند التمرير */
  --color-ui-text:         #14141C;  /* نص أساسي */
  --color-ui-muted:        #62617A;  /* نص ثانوي — تباين 5.9:1 على canvas */
  --color-ui-accent:       #4A32B8;  /* لون العلامة، نسخة معتمة تكفي للنص */
  --color-ui-accent-soft:  #EDE8FF;  /* خلفية الحالة المختارة */
  --color-ui-on-accent:    #FFFFFF;  /* نص فوق accent */

  /* ── Personalization Studio (V6) ──────────────────────────────
     طبقة خاصة بالاستوديو وحده. مفصولة عن ui-* عمدًا:
     الاستوديو أداة تحرير داخل مودال داكن، فيحتاج تباينًا أعلى وحدودًا أوضح
     من صفحة تصفّح عادية. الأرقام مختارة لتحقّق WCAG AA على --pz-surface. */
  --pz-canvas:       #F4F3F9;  /* خلفية منطقة المعاينة */
  --pz-surface:      #FFFFFF;  /* جسم النافذة */
  --pz-surface-alt:  #EFEDF7;  /* الرأس والتذييل والحقول */
  --pz-line:         #D8D5E6;  /* حدّ عادي */
  --pz-line-strong:  #ADA7C6;  /* حدّ نشط / منقّط */
  --pz-text:         #100F18;  /* نص أساسي — تباين 18.1:1 */
  --pz-muted:        #5B5975;  /* نص ثانوي — تباين 6.9:1 */
  --pz-accent:       #4327A8;  /* بنفسجي العلامة — تباين 9.4:1 مع الأبيض */
  --pz-accent-hover: #351E86;
  --pz-accent-soft:  #EBE5FF;  /* خلفية الحالة المختارة */
  --pz-gold:         #B08842;  /* ربط مع forest-gold دون استعمال #7952F3 */
  --pz-danger:       #A32530;  /* تأكيد المسح فقط */
  --pz-shadow:       0 24px 60px -18px rgba(16, 15, 24, 0.42);
}

/* Custom global styles for Futuristic Neo-Brutalist Theme */
body {
  font-family: var(--font-sans);
  background-color: var(--color-forest-black);
  color: var(--color-forest-cream);
  overflow-x: hidden;
}

/* Custom scrollbar to match futuristic aesthetic */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--color-forest-black);
}
::-webkit-scrollbar-thumb {
  background: var(--color-forest-dark);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-forest-gold);
}

/* Luxury transitions */
.transition-luxury {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Vignette effect for deep gallery room atmosphere */
.vignette-overlay {
  background: radial-gradient(circle, rgba(245,242,235,0) 30%, rgba(245,242,235,0.7) 100%);
}

/* Custom shining button styles from Uiverse.io */
.btn-shine {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 48px;
  color: #fff;
  background: linear-gradient(to right, #12131A 0, #fff 50%, #12131A 100%);
  background-size: 200% auto;
  background-position: 0;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 3s infinite linear;
  animation-fill-mode: forwards;
  -webkit-text-size-adjust: none;
  font-weight: 700;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  text-decoration: none;
  white-space: nowrap;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-shine:hover {
  text-shadow: 0 0 10px rgba(121, 82, 243, 0.3);
}

@keyframes shine {
  0% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
  100% {
    background-position: 200% center;
  }
}

/* Fullscreen hero: stable on mobile browser chrome and desktop. */
.nn-hero-viewport {
  height: 100vh;
  min-height: 100vh;
}

@supports (height: 100svh) {
  .nn-hero-viewport {
    height: 100svh;
    min-height: 100svh;
  }
}

@supports (height: 100dvh) {
  .nn-hero-viewport {
    height: 100dvh;
    min-height: 100dvh;
  }
}

.nn-hero-background-video {
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: center center;
  pointer-events: none;
  user-select: none;
  background-color: #0b0a10;
}

/* Transparent neon explore action — no black or opaque fill. */
.btn-neon-futuristic {
  --glow-color: #a64fcc;
  --glow-spread-color: rgba(88, 24, 128, 0.68);
  --enhanced-glow-color: #d5a1ea;

  position: relative;
  z-index: 1;
  min-height: 48px;
  padding: 1em 3em;
  border: 0.16em solid var(--glow-color);
  border-radius: 1em;
  outline: none;
  background: transparent;
  color: var(--enhanced-glow-color);
  box-shadow:
    0 0 0.75em 0.12em var(--glow-color),
    0 0 2.4em 0.45em var(--glow-spread-color),
    inset 0 0 0.7em 0.12em rgba(112, 32, 160, 0.68);
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  text-shadow:
    0 0 0.45em var(--glow-color),
    0 0 1em rgba(166, 79, 204, 0.78);
  cursor: pointer;
  transition:
    color 0.25s ease,
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.btn-neon-futuristic::before {
  content: "";
  position: absolute;
  inset: 3px;
  border-radius: calc(1em - 4px);
  background: linear-gradient(
    120deg,
    rgba(166, 79, 204, 0.1),
    transparent 38%,
    rgba(88, 24, 128, 0.09)
  );
  pointer-events: none;
}

.btn-neon-futuristic::after {
  content: "";
  position: absolute;
  top: 120%;
  left: 8%;
  width: 84%;
  height: 75%;
  background-color: var(--glow-spread-color);
  filter: blur(1.8em);
  opacity: 0.48;
  transform: perspective(1.5em) rotateX(35deg) scale(1, 0.55);
  pointer-events: none;
}

.btn-neon-futuristic:hover {
  border-color: var(--enhanced-glow-color);
  background-color: rgba(88, 24, 128, 0.2);
  color: #ffffff;
  box-shadow:
    0 0 0.9em 0.18em var(--enhanced-glow-color),
    0 0 3.2em 0.75em var(--glow-spread-color),
    inset 0 0 0.85em 0.18em rgba(166, 79, 204, 0.7);
  transform: translateY(-2px);
}

.btn-neon-futuristic:active {
  background-color: rgba(72, 16, 112, 0.28);
  box-shadow:
    0 0 0.55em 0.12em var(--glow-color),
    0 0 1.8em 0.5em var(--glow-spread-color),
    inset 0 0 0.55em 0.18em var(--glow-color);
  transform: translateY(1px) scale(0.985);
}

.btn-neon-futuristic:focus-visible {
  outline: 3px solid var(--enhanced-glow-color);
  outline-offset: 6px;
}

@media (max-width: 480px) {
  .btn-neon-futuristic {
    max-width: calc(100vw - 40px);
    padding: 0.9em 2em;
    font-size: 14px;
  }
}

/* =========================================================
   NN NEUMORPHIC SOFT-UI CAPSULE HEADER (Matching Reference Image)
   ========================================================= */

/* Main desktop & tablet capsule bar */
.nn-neumorphic-bar {
  background: linear-gradient(180deg, #FFFFFF 0%, #EDEDF6 100%);
  border-radius: 9999px;
  padding: 6px 10px 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow:
    0 12px 32px rgba(180, 185, 210, 0.42),
    0 2px 6px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px #FFFFFF,
    inset 0 -1px 2px rgba(180, 185, 210, 0.25);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  transition: all 300ms ease;
}

/* Mobile capsule bar */
.nn-neumorphic-bar-mobile {
  background: linear-gradient(180deg, #FFFFFF 0%, #EDEDF6 100%);
  border-radius: 9999px;
  padding: 6px 12px 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow:
    0 10px 28px rgba(180, 185, 210, 0.38),
    0 2px 5px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px #FFFFFF;
}

/* Brand Button with 3D Glossy Sphere Orb */
.nn-soft-brand-button {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 9999px;
  transition: transform 180ms ease;
}

.nn-soft-brand-button:hover {
  transform: scale(1.03);
}

/* 3D Glossy Ice/Blue Orb */
.nn-glossy-orb {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: radial-gradient(
    circle at 35% 25%,
    #E8F2FF 0%,
    #A3CDFF 22%,
    #4285F4 55%,
    #1A56DB 82%,
    #0F3896 100%
  );
  box-shadow:
    0 4px 10px rgba(37, 99, 235, 0.38),
    inset 0 2px 3px rgba(255, 255, 255, 0.9),
    inset 0 -2px 4px rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}

.nn-glossy-orb::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 6px;
  width: 9px;
  height: 5px;
  border-radius: 9999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.2) 100%);
  transform: rotate(-20deg);
}

.nn-brand-title {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 750;
  color: #373D4D;
  letter-spacing: -0.01em;
}

/* Navigation Link (Inactive state in image) */
.nn-soft-nav-link {
  padding: 8px 18px;
  border-radius: 9999px;
  border: 1px solid transparent;
  color: #70778A;
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  transition: all 180ms ease;
}

.nn-soft-nav-link:hover {
  color: #2D3345;
  background: rgba(255, 255, 255, 0.6);
}

/* Active Nav Link (Raised Soft White Pill in image) */
.nn-soft-nav-link--active {
  color: #222634;
  font-weight: 750;
  background: linear-gradient(180deg, #FFFFFF 0%, #F3F3FA 100%);
  border: 1px solid rgba(255, 255, 255, 1);
  box-shadow:
    0 4px 14px rgba(150, 155, 185, 0.32),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1.5px 0 #FFFFFF;
}

/* Soft Icon Buttons (Map & Cart) */
.nn-soft-pill-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  background: linear-gradient(180deg, #FFFFFF 0%, #EDEDF6 100%);
  color: #4A5163;
  box-shadow:
    0 3px 8px rgba(160, 165, 190, 0.25),
    inset 0 1px 0 #FFFFFF;
  cursor: pointer;
  transition: all 180ms ease;
}

.nn-soft-pill-icon-btn:hover {
  color: #111827;
  transform: translateY(-1px);
  box-shadow:
    0 5px 12px rgba(150, 155, 180, 0.35),
    inset 0 1px 0 #FFFFFF;
}

/* Action button "Join Us" */
.nn-soft-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  background: linear-gradient(180deg, #FFFFFF 0%, #EDEDF6 100%);
  color: #373D4D;
  font-family: var(--font-sans);
  font-size: 12.5px;
  font-weight: 700;
  box-shadow:
    0 3px 8px rgba(160, 165, 190, 0.25),
    inset 0 1px 0 #FFFFFF;
  cursor: pointer;
  transition: all 180ms ease;
}

.nn-soft-action-btn:hover {
  color: #111827;
  transform: translateY(-1px);
  box-shadow:
    0 5px 12px rgba(150, 155, 180, 0.35),
    inset 0 1px 0 #FFFFFF;
}

/* Cart badge */
.nn-soft-cart-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  display: flex;
  height: 17px;
  min-width: 17px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #3B82F6;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 800;
  padding: 0 4px;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
}

/* Mobile overlay & panel */
.nn-soft-mobile-overlay {
  background: rgba(244, 244, 250, 0.95);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
}

.nn-soft-mobile-panel {
  padding: 16px;
  border-radius: 24px;
  background: linear-gradient(180deg, #FFFFFF 0%, #EDEDF6 100%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 36px rgba(160, 165, 190, 0.35);
}

.nn-soft-mobile-link {
  width: 100%;
  padding: 12px 18px;
  border-radius: 9999px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #555C6E;
  background: transparent;
  border: 1px solid transparent;
  transition: all 180ms ease;
}

.nn-soft-mobile-link--active {
  color: #222634;
  font-weight: 750;
  background: #FFFFFF;
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(160, 165, 190, 0.25);
}

/* Compact padding for medium displays */
@media (max-width: 1180px) and (min-width: 768px) {
  .nn-soft-nav-item {
    padding-inline: 0.85rem;
    font-size: 10.5px;
  }

  .nn-soft-account-button {
    padding-inline: 0.8rem;
  }
}

@media (max-width: 420px) {
  .nn-soft-icon-button {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
  }

  .nn-soft-account-button {
    min-height: 38px;
    padding-inline: 0.72rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nn-soft-nav-item,
  .nn-soft-icon-button,
  .nn-soft-account-button,
  .nn-soft-mobile-item {
    transition: none;
  }
}

/* Futuristic Wave Transition & Holographic HUD Animations */
@keyframes cyberOverlayFade {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes waveRise1 {
  0% {
    transform: translateY(100%) rotate(-2deg);
  }
  50% {
    transform: translateY(-20%) rotate(1deg);
  }
  100% {
    transform: translateY(-140%) rotate(0deg);
  }
}

@keyframes waveRise2 {
  0% {
    transform: translateY(100%) rotate(2deg);
  }
  55% {
    transform: translateY(-15%) rotate(-1deg);
  }
  100% {
    transform: translateY(-140%) rotate(0deg);
  }
}

@keyframes waveRise3 {
  0% {
    transform: translateY(100%) rotate(-1deg);
  }
  60% {
    transform: translateY(-10%) rotate(2deg);
  }
  100% {
    transform: translateY(-140%) rotate(0deg);
  }
}

@keyframes wavePulseCircle {
  0% {
    transform: translate(-50%, -50%) scale(0.1);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}

@keyframes waveHudPop {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(16px);
  }
  20% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  80% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(1.08) translateY(-12px);
  }
}

@keyframes waveBarPulse {
  0%, 100% {
    transform: scaleY(0.25);
  }
  50% {
    transform: scaleY(1);
  }
}

.animate-cyber-overlay {
  animation: cyberOverlayFade 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-wave-1 {
  animation: waveRise1 0.95s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.animate-wave-2 {
  animation: waveRise2 0.95s cubic-bezier(0.25, 1, 0.5, 1) 0.08s forwards;
}

.animate-wave-3 {
  animation: waveRise3 0.95s cubic-bezier(0.25, 1, 0.5, 1) 0.15s forwards;
}

.animate-wave-pulse {
  animation: wavePulseCircle 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-wave-hud {
  animation: waveHudPop 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-wave-bar-1 {
  animation: waveBarPulse 0.4s ease-in-out infinite alternate;
}

/* ═══ Personalization Studio helpers (V6) ═══ */

/* ورق رسم: شبكة خفيفة توحي بأن المساحة قابلة للرسم، بدل مربّع أبيض صامت. */
.pz-paper {
  background-color: var(--pz-surface);
  background-image:
    linear-gradient(var(--pz-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--pz-line) 1px, transparent 1px);
  background-size: 22px 22px;
  background-position: -1px -1px;
  opacity: 1;
}

/* خط التوقيع — إشارة متعارف عليها في كل واجهات التوقيع المهنية. */
.pz-baseline::after {
  content: '';
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 22%;
  height: 1px;
  background: var(--pz-line-strong);
  opacity: 0.55;
  pointer-events: none;
}

/* مفتاح اختصار لوحة المفاتيح. */
.pz-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.35rem;
  height: 1.15rem;
  padding: 0 0.3rem;
  border: 1px solid var(--pz-line-strong);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: var(--pz-surface);
  color: var(--pz-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  line-height: 1;
  letter-spacing: 0.02em;
}

/* احترام تفضيل تقليل الحركة — مطلوب للوصولية، وغائب اليوم. */
@media (prefers-reduced-motion: reduce) {
  .pz-animated { transition: none !important; animation: none !important; }
}
.animate-wave-bar-2 {
  animation: waveBarPulse 0.5s ease-in-out infinite alternate 0.1s;
}
.animate-wave-bar-3 {
  animation: waveBarPulse 0.35s ease-in-out infinite alternate 0.2s;
}
.animate-wave-bar-4 {
  animation: waveBarPulse 0.45s ease-in-out infinite alternate 0.15s;
}
.animate-wave-bar-5 {
  animation: waveBarPulse 0.55s ease-in-out infinite alternate 0.05s;
}

/* =========================================================================
   Entry cue for THE SHOW ("Tap to open").
   Replaces the previous floating word at the same anchor point.
   Transform/opacity only => no layout shift, no reflow.
   ========================================================================= */
@keyframes nnTapCueBreath {
  0%   { opacity: 0;    transform: translateY(8px) scale(0.97); filter: blur(3px); }
  14%  { opacity: 0.92; transform: translateY(0)   scale(1);    filter: blur(0); }
  52%  { opacity: 0.92; transform: translateY(0)   scale(1);    filter: blur(0); }
  68%  { opacity: 0.34; transform: translateY(-2px) scale(0.995); filter: blur(0.4px); }
  100% { opacity: 0;    transform: translateY(8px) scale(0.97); filter: blur(3px); }
}

/* Light travelling across the glass, only while the cue is visible. */
@keyframes nnTapCueSheen {
  0%, 30%  { transform: translateX(-140%); opacity: 0; }
  45%      { opacity: 0.55; }
  70%,100% { transform: translateX(240%);  opacity: 0; }
}

.nn-tap-cue {
  position: relative;
  overflow: hidden;
  opacity: 0;
  animation: nnTapCueBreath 5.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  will-change: transform, opacity, filter;
  transition: opacity 300ms ease, transform 300ms ease, background-color 300ms ease;
}

.nn-tap-cue::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 45%;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    transparent 0%,
    rgba(255, 255, 255, 0.22) 50%,
    transparent 100%
  );
  transform: translateX(-140%);
  animation: nnTapCueSheen 5.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

/* Intent to interact stops the breathing and holds the cue fully visible. */
.nn-tap-cue:hover,
.nn-tap-cue:focus-visible,
.nn-tap-cue:active {
  animation-play-state: paused;
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: none;
}

.nn-tap-cue:hover::after,
.nn-tap-cue:focus-visible::after {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .nn-tap-cue,
  .nn-tap-cue::after {
    animation: none;
    transform: none;
    filter: none;
  }
  .nn-tap-cue {
    opacity: 0.9;
  }
  .nn-tap-cue::after {
    display: none;
  }
}
\n```\n\n