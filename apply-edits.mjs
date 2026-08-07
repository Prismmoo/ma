import fs from 'fs';

let gallery = fs.readFileSync('src/components/GalleryView.tsx', 'utf-8');

// Edit 2.1
gallery = gallery.replace(
  `import {\n  LEGACY_SUBCATEGORY_COVERS,\n  CATEGORY_COVER_FALLBACKS,\n} from '../lib/legacyCovers';\nimport {`,
  `import {\n  LEGACY_SUBCATEGORY_COVERS,\n  CATEGORY_COVER_FALLBACKS,\n} from '../lib/legacyCovers';\nimport {\n  CATEGORIES,\n  SUBCATEGORY_INFOS,\n  displayStyle,\n  hasSubCollections,\n} from '../lib/galleryTaxonomy';\nimport {`
);

// Edit 2.2
const startMarker = `const CATEGORIES: {`;
const endMarker = `};\n\nexport default function GalleryView`;
const startIndex = gallery.indexOf(startMarker);
const endIndex = gallery.indexOf(endMarker);
if (startIndex !== -1 && endIndex !== -1) {
  gallery = gallery.substring(0, startIndex) + 
`/* Taxonomy (categories, display names, sub-collection cards) now lives in
 * \`src/lib/galleryTaxonomy.ts\` so that the sticker workshop reuses exactly the
 * same covers, taglines, descriptions and ordering as this gallery. */\n\nexport default function GalleryView` + 
  gallery.substring(endIndex + endMarker.length);
}

// Edit 2.3
gallery = gallery.replace(
  `const hasSub = initialStyleFilter === 'Motorbikes' || initialStyleFilter === 'Cars' || initialStyleFilter === 'Anime' || initialStyleFilter === 'Films';`,
  `const hasSub = hasSubCollections(initialStyleFilter);`
);

// Edit 2.4
gallery = gallery.replace(
  `const hasSub = cat.name === 'Motorbikes' || cat.name === 'Cars' || cat.name === 'Anime' || cat.name === 'Films';`,
  `const hasSub = hasSubCollections(cat.name);`
);

fs.writeFileSync('src/components/GalleryView.tsx', gallery);

let css = fs.readFileSync('src/index.css', 'utf-8');
const cssStart = `@keyframes nnTapCuePulse {`;
const cssStartIndex = css.indexOf(cssStart);
if (cssStartIndex !== -1) {
  css = css.substring(0, cssStartIndex) + 
`@keyframes nnTapCueBreath {
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
`;
}
fs.writeFileSync('src/index.css', css);

console.log("Edits applied.");
