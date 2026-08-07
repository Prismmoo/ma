/* Pure-logic tests. No DOM, no React: they run with the TypeScript loader only.
   Run with:  npx tsx --test tests/stickers.test.ts   */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STICKER_PPI, CM_PER_INCH,
  pixelsToCentimetres, centimetresToPixels,
  pixelsToMillimetres, millimetresToPixels,
  convertLength, parseDimension, displayValue, formatSize,
  MIN_STICKER_CM, MAX_STICKER_CM,
} from '../src/lib/stickerUnits';

import {
  slugify, isStickerEligible, toStickerProduct,
  deriveStickerCatalog, deriveStickerCategories,
  sizeSurcharge, stickerPrice, STICKER_BASE_PRICE,
  buildStickerCartPainting, buildStickerFinishOption,
} from '../src/lib/stickers';

import { Painting } from '../src/types';

const artwork = (over: Partial<Painting> = {}): Painting => ({
  id: 'pt-test-1', title: 'Test Piece', artistId: 'art-01', artistName: 'TESTER',
  year: 2026, style: 'Anime', sizeCategory: 'Medium', widthCm: 60, heightCm: 90,
  price: 100, story: 'story', imageUrl: 'https://example.com/a.jpg',
  colorPalette: ['#000000'], paletteNames: ['Black'], ...over,
});

/* ---------------- unit conversion ---------------- */

test('96 PPI conversion matches the documented formulas', () => {
  assert.equal(pixelsToCentimetres(STICKER_PPI), CM_PER_INCH);
  assert.equal(centimetresToPixels(CM_PER_INCH), STICKER_PPI);
  assert.equal(pixelsToMillimetres(STICKER_PPI), CM_PER_INCH * 10);
});

test('px -> cm -> px and px -> mm -> px round-trip without drift', () => {
  for (const px of [1, 37, 226.77, 1000.5]) {
    assert.ok(Math.abs(centimetresToPixels(pixelsToCentimetres(px)) - px) < 1e-9);
    assert.ok(Math.abs(millimetresToPixels(pixelsToMillimetres(px)) - px) < 1e-9);
  }
});

test('convertLength is identity for the same unit', () => {
  assert.equal(convertLength(12.34, 'cm', 'cm'), 12.34);
});

test('rounding happens only for display', () => {
  const px = centimetresToPixels(6.005);
  assert.equal(displayValue(px, 'cm'), 6.01);
  assert.notEqual(pixelsToCentimetres(px), 6.01);
});

test('formatSize labels the unit unambiguously', () => {
  assert.equal(formatSize(centimetresToPixels(6), centimetresToPixels(6), 'cm'), '6.00 \u00d7 6.00 cm');
});

test('parseDimension rejects empty, non-numeric, infinite and out-of-range values', () => {
  assert.equal(parseDimension('', 'cm').ok, false);
  assert.equal(parseDimension('abc', 'cm').ok, false);
  assert.equal(parseDimension('Infinity', 'cm').ok, false);
  assert.equal(parseDimension('-4', 'cm').ok, false);
  assert.equal(parseDimension('0', 'cm').ok, false);
  assert.equal(parseDimension(String(MIN_STICKER_CM / 2), 'cm').ok, false);
  assert.equal(parseDimension(String(MAX_STICKER_CM * 2), 'cm').ok, false);
});

test('parseDimension accepts a comma decimal separator', () => {
  const a = parseDimension('6,5', 'cm');
  const b = parseDimension('6.5', 'cm');
  assert.equal(a.ok, true);
  assert.equal(a.pixels, b.pixels);
});

/* ---------------- derived catalogue ---------------- */

test('slugify is stable and URL safe', () => {
  assert.equal(slugify('Berserk: Guts & Dragonslayer'), 'berserk-guts-dragonslayer');
  assert.equal(slugify('***'), 'untitled');
});

test('eligibility skips artworks without an image and already-generated stickers', () => {
  assert.equal(isStickerEligible(artwork()), true);
  assert.equal(isStickerEligible(artwork({ imageUrl: '' })), false);
  assert.equal(isStickerEligible(artwork({ id: 'sticker-pt-01-Matte-Vinyl-6x6cm' })), false);
  assert.equal(isStickerEligible(artwork({ title: '   ' })), false);
});

test('a sticker keeps the identity of its source artwork', () => {
  const s = toStickerProduct(artwork({ subCategory: 'Berserk' }), 3);
  assert.equal(s.paintingId, 'pt-test-1');
  assert.equal(s.id, 'stk-pt-test-1');
  assert.equal(s.title, 'Test Piece');
  assert.equal(s.categoryLabel, 'Anime & Manga');
  assert.equal(s.collection, 'Berserk');
  assert.equal(s.order, 3);
  assert.ok(Math.abs(s.aspect - 60 / 90) < 1e-9);
});

test('the catalogue is derived, deduplicated and auto-syncs with the artworks', () => {
  const list = deriveStickerCatalog([
    artwork({ id: 'a', title: 'A' }),
    artwork({ id: 'b', title: 'B', imageUrl: '' }),
    artwork({ id: 'a', title: 'A duplicate' }),
    artwork({ id: 'c', title: 'C', style: 'Cars' }),
  ]);
  assert.deepEqual(list.map((s) => s.paintingId), ['a', 'c']);
});

test('categories mirror the artworks: empty categories never appear', () => {
  const cats = deriveStickerCategories(
    deriveStickerCatalog([
      artwork({ id: 'a', title: 'A', style: 'Anime', subCategory: 'Berserk' }),
      artwork({ id: 'b', title: 'B', style: 'Anime', subCategory: 'Berserk' }),
      artwork({ id: 'c', title: 'C', style: 'Cars' }),
    ]),
  );
  assert.deepEqual(cats.map((c) => c.slug), ['anime', 'cars']);
  assert.equal(cats[0].count, 2);
  assert.equal(cats[0].collections[0].title, 'Berserk');
  assert.equal(cats[0].collections[0].count, 2);
  assert.equal(cats[1].collections.length, 0);
});

/* ---------------- pricing (legacy parity) ---------------- */

test('the three legacy sizes keep their exact legacy surcharge', () => {
  const px = (cm: number) => centimetresToPixels(cm);
  assert.equal(sizeSurcharge(px(6), px(6)), 0);    // Standard
  assert.equal(sizeSurcharge(px(10), px(10)), 4);  // Large
  assert.equal(sizeSurcharge(px(15), px(15)), 8);  // Collector
});

test('a free size interpolates between the legacy anchors', () => {
  const px = (cm: number) => centimetresToPixels(cm);
  const mid = sizeSurcharge(px(8), px(8));
  assert.ok(mid > 0 && mid < 4);
});

test('legacy total prices are reproduced exactly', () => {
  const px = (cm: number) => centimetresToPixels(cm);
  const total = stickerPrice({ widthPx: px(10), heightPx: px(10), unit: 'cm', finishId: 'holographic-prism' });
  assert.equal(total, STICKER_BASE_PRICE + 2.5 + 4);
});

/* ---------------- cart bridge (backward compatibility) ---------------- */

test('cart records keep the artwork reference and the legacy id scheme', () => {
  const sticker = toStickerProduct(artwork(), 0);
  const spec = { widthPx: centimetresToPixels(6), heightPx: centimetresToPixels(6), unit: 'cm' as const, finishId: 'matte-vinyl' as const };
  const cartPainting = buildStickerCartPainting(sticker, spec);
  const option = buildStickerFinishOption(spec);

  assert.equal(cartPainting.id, 'sticker-pt-test-1-Matte-Vinyl-6.00\u00d76.00cm');
  assert.ok(cartPainting.title.startsWith('[STICKER] '));
  assert.ok(cartPainting.story.includes('pt-test-1'));
  assert.equal(cartPainting.widthCm, 6);
  assert.equal(cartPainting.heightCm, 6);
  assert.equal(option.id, 'finish-matte-vinyl');
  assert.equal(option.price, 0);
});
