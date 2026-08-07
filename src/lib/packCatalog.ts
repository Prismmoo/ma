import type { Painting, StyleType } from '../types';
import { PAINTINGS } from '../data';
import { STICKERS_BY_PAINTING_ID } from './stickers';
import {
  CATEGORIES,
  displayStyle,
  subCategoryCard,
  categoryInfo,
  SUBCATEGORY_INFOS,
} from './galleryTaxonomy';
import { hasRenderableImage } from './artRef';
import type { PackKind } from './packBuilder';
import { COLLECTIONS_BY_TITLE, collectionCover } from './art';
import { CATEGORY_COVER_FALLBACKS, LEGACY_SUBCATEGORY_COVERS } from './legacyCovers';

export interface PackCollectionNode {
  slug: string;
  title: string;
  count: number;
  /** Ordered cover candidates for CoverImage. Never a raw painting. */
  coverCandidates: Array<string | null | undefined>;
}

export interface PackCategoryNode {
  slug: StyleType;
  label: string;
  count: number;
  coverCandidates: Array<string | null | undefined>;
  collections: PackCollectionNode[];
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * The pool for a pack kind. UNCHANGED from V16.
 */
export function poolFor(kind: PackKind): Painting[] {
  const base =
    kind === 'sticker'
      ? PAINTINGS.filter((p) => STICKERS_BY_PAINTING_ID.has(p.id))
      : PAINTINGS;
  return base.filter(hasRenderableImage);
}

/**
 * Build the category tree.
 *
 * V16 iterated the pool and created a node for every distinct `style` string it
 * found. That surfaced five retired Traditional styles (Abstract, Minimalist,
 * Textured, Contemporary, Impressionist) that still have a handful of paintings
 * in src/data.ts but were removed from the site's navigation long ago.
 *
 * V17 iterates CATEGORIES instead — the same curated allow-list StickersView
 * filters, in the same order — and consults the pool only for the count. An
 * unlisted style can no longer produce a shelf no matter what is in the data.
 *
 * This mirrors StickersView exactly:
 *   CATEGORIES.filter((cat) => countForStyle(cat.name) > 0)
 */
export function categoryTree(pool: Painting[]): PackCategoryNode[] {
  const nodes: PackCategoryNode[] = [];

  for (const category of CATEGORIES) {
    const style = category.name;
    const items = pool.filter((p) => p.style === style);
    if (items.length === 0) continue;   // empty families render no shelf

    // ---- collections inside this category -------------------------------
    const bySlug = new Map<string, { title: string; count: number }>();
    for (const painting of items) {
      const sub = typeof painting.subCategory === 'string' ? painting.subCategory.trim() : '';
      if (!sub) continue;
      const subSlug = slugify(sub);
      const existing = bySlug.get(subSlug);
      if (existing) existing.count += 1;
      else bySlug.set(subSlug, { title: sub, count: 1 });
    }

    const collections: PackCollectionNode[] = Array.from(bySlug.entries()).map(
      ([subSlug, value]) => ({
        slug: subSlug,
        title: value.title,
        count: value.count,
        coverCandidates: collectionCoverCandidates(style, value.title),
      })
    );

    // Preserve the taxonomy's own ordering where one exists, so the pack
    // browser lists collections in the same order as the Stickers page.
    const declaredOrder = (SUBCATEGORY_INFOS[style] ?? [])
      .map((info) => info.name ?? info.title)
      .filter((name): name is string => typeof name === 'string');

    collections.sort((a, b) => {
      const ai = declaredOrder.indexOf(a.title);
      const bi = declaredOrder.indexOf(b.title);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.title.localeCompare(b.title);
    });

    nodes.push({
      slug: style,
      label: displayStyle(style),
      count: items.length,
      coverCandidates: categoryCoverCandidates(style),
      collections,
    });
  }

  // NOTE: no re-sort. CATEGORIES order is the site's order; honour it.
  return nodes;
}

export function itemsInCategory(pool: Painting[], categorySlug: string): Painting[] {
  return pool.filter((p) => p.style === categorySlug);
}

export function itemsInCollection(
  pool: Painting[],
  categorySlug: string,
  collectionSlug: string
): Painting[] {
  return pool.filter(
    (p) =>
      p.style === categorySlug &&
      typeof p.subCategory === 'string' &&
      slugify(p.subCategory) === collectionSlug
  );
}

export function searchPool(pool: Painting[], query: string, limit = 40): Painting[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const out: Painting[] = [];
  for (const p of pool) {
    const haystack = `${p.title} ${p.subCategory ?? ''} ${p.artistName ?? ''}`.toLowerCase();
    if (haystack.includes(needle)) out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Cover resolution                                                    */
/* ------------------------------------------------------------------ */

/**
 * Category cover candidates.
 *
 * Identical to the chain StickersView line ~336 feeds to CoverImage:
 *     [cat.imageUrl, CATEGORY_COVER_FALLBACKS[cat.name]]
 *
 * cat.imageUrl is the curated room mock-up (coveranime.webp, gamingcover.webp,
 * moviescover.webp, momomtcover.webp, mobicover.webp). Those are the images the
 * owner sees on the Paintings page, so those are the images the pack browser
 * must show. Nothing is invented here.
 */
export function categoryCoverCandidates(style: StyleType): Array<string | null | undefined> {
  const info = categoryInfo(style);
  return [info?.imageUrl, CATEGORY_COVER_FALLBACKS[style]];
}

/**
 * Collection cover candidates.
 *
 * Identical to the chain StickersView line ~446 feeds to CoverImage, in the same
 * order. Six candidates, best first:
 *   1. the generated CDN collection cover, when the title maps to a collection
 *   2. the curated SUBCATEGORY_INFOS card image
 *   3. the legacy override keyed by display title
 *   4. the legacy override keyed by internal name
 *   5. the parent category's fallback
 *   6. the parent category's own cover
 *
 * CoverImage walks this list on error, so a dead CDN entry silently degrades
 * instead of leaving the grey "ASSET OFFLINE" plate visible in the screenshot.
 */
export function collectionCoverCandidates(
  style: StyleType,
  title: string
): Array<string | null | undefined> {
  const card = subCategoryCard(style, title);
  const generatedSlug = COLLECTIONS_BY_TITLE.get(title)?.slug ?? '';
  return [
    generatedSlug ? collectionCover(generatedSlug)?.src : null,
    card.imageUrl,
    LEGACY_SUBCATEGORY_COVERS[card.title],
    LEGACY_SUBCATEGORY_COVERS[card.name ?? ''],
    CATEGORY_COVER_FALLBACKS[style],
    categoryInfo(style)?.imageUrl,
  ];
}
