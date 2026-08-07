/* =========================================================================
 *  PRISM — كتالوج الملصقات المُشتق من اللوحات.
 *
 *  قاعدة أساسية: لا توجد أي قائمة ملصقات مكتوبة يدويًا في هذا الملف
 *  ولا في أي مكان آخر. كل ملصق هو عرض مشتق (derived view) للوحة
 *  موجودة في PAINTINGS. إضافة لوحة أو تعديل عنوانها أو تصنيفها
 *  ينعكس تلقائيًا على الملصقات دون أي تعديل هنا.
 * ========================================================================= */

import { Painting, FramingOption, StyleType, STYLE_LABELS, ArtImageRef } from '../types';
import { PAINTINGS } from '../data';
import {
  LengthUnit,
  areaCm2,
  formatSize,
  pixelsToCentimetres,
} from './stickerUnits';

/* ════════ الأنواع ════════ */

export type StickerFinishId = 'matte-vinyl' | 'holographic-prism' | 'chrome-silver' | 'high-gloss';

export interface StickerFinish {
  id: StickerFinishId;
  /** الاسم المعروض — مطابق حرفيًا للأسماء السابقة حفاظًا على التوافق. */
  name: string;
  desc: string;
  priceModifier: number;
  effectClass: string;
  borderHex: string;
}

/** ملصق مُشتق من لوحة واحدة. لا يُخزّن ولا يُكتب يدويًا. */
export interface StickerProduct {
  /** معرّف الملصق الثابت: stk-<paintingId>. */
  id: string;
  slug: string;
  /** مرجع العمل الفني الأصلي — إلزامي للسلة وللطلب. */
  paintingId: string;
  title: string;
  artistId: string;
  artistName: string;
  style: StyleType;
  categorySlug: string;
  categoryLabel: string;
  /** المجموعة = subCategory للوحة (عنوان السلسلة أو العائلة). */
  collection: string | null;
  collectionSlug: string | null;
  imageUrl: string;
  image?: ArtImageRef;
  /** نسبة الأبعاد الحقيقية للعمل الفني (عرض ÷ ارتفاع). */
  aspect: number;
  story: string;
  colorPalette: string[];
  paletteNames: string[];
  /** ترتيب العرض الموروث من ترتيب PAINTINGS. */
  order: number;
  /** اللوحة المصدر كما هي — بلا نسخ. */
  source: Painting;
}

export interface StickerCollectionNode {
  slug: string;
  title: string;
  count: number;
  coverImageUrl: string;
}

export interface StickerCategory {
  slug: string;
  label: string;
  style: StyleType;
  count: number;
  coverImageUrl: string;
  order: number;
  collections: StickerCollectionNode[];
}

/* ════════ أدوات ════════ */

/** معرّف URL مستقر: أحرف صغيرة وشرطات. يدعم الأحرف غير اللاتينية بإسقاطها. */
export function slugify(value: string): string {
  const base = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base : 'untitled';
}

/**
 * معيار الأهلية: لوحة حقيقية لها معرّف وعنوان وصورة صالحة،
 * وليست هي نفسها منتج ملصق مولّد سابقًا (سجلات قديمة في السلة).
 */
export function isStickerEligible(painting: Painting): boolean {
  if (!painting || typeof painting.id !== 'string' || painting.id.length === 0) return false;
  if (painting.id.startsWith('sticker-') || painting.id.startsWith('stk-')) return false;
  if (typeof painting.title !== 'string' || painting.title.trim().length === 0) return false;
  const hasUrl = typeof painting.imageUrl === 'string' && painting.imageUrl.trim().length > 0;
  const hasRef = !!painting.image && typeof painting.image.src === 'string' && painting.image.src.length > 0;
  return hasUrl || hasRef;
}

function aspectOf(painting: Painting): number {
  if (painting.image && painting.image.width > 0 && painting.image.height > 0) {
    return painting.image.width / painting.image.height;
  }
  if (painting.widthCm > 0 && painting.heightCm > 0) {
    return painting.widthCm / painting.heightCm;
  }
  return 1;
}

/** تحويل لوحة واحدة إلى ملصق. دالة خالصة قابلة للاختبار. */
export function toStickerProduct(painting: Painting, order: number): StickerProduct {
  const style = (STYLE_LABELS[painting.style as StyleType] ? painting.style : 'Contemporary') as StyleType;
  if (!STYLE_LABELS[painting.style as StyleType] && (import.meta as any).env?.DEV) {
    console.warn(
      `[stickers] painting ${painting.id} has unknown style '${painting.style}' — ` +
      `filed under Contemporary. Run: npm run audit:catalog`
    );
  }
  const collection = typeof painting.subCategory === 'string' && painting.subCategory.trim().length > 0
    ? painting.subCategory.trim()
    : null;

  return {
    id: 'stk-' + painting.id,
    slug: slugify(painting.id + '-' + painting.title),
    paintingId: painting.id,
    title: painting.title,
    artistId: painting.artistId,
    artistName: painting.artistName,
    style,
    categorySlug: slugify(style),
    categoryLabel: STYLE_LABELS[style] ?? style,
    collection,
    collectionSlug: collection ? slugify(collection) : null,
    imageUrl: painting.imageUrl,
    image: painting.image,
    aspect: aspectOf(painting),
    story: painting.story,
    colorPalette: painting.colorPalette,
    paletteNames: painting.paletteNames,
    order,
    source: painting,
  };
}

/** اشتقاق الكتالوج الكامل من أي قائمة لوحات (تُستعمل في الاختبارات أيضًا). */
export function deriveStickerCatalog(paintings: Painting[]): StickerProduct[] {
  const seen = new Set<string>();
  const out: StickerProduct[] = [];

  paintings.forEach((painting, index) => {
    if (!isStickerEligible(painting)) return;
    const sticker = toStickerProduct(painting, index);
    /* هويات مكررة: أول ظهور يفوز، مثل ما تفعل مفاتيح React. */
    if (seen.has(sticker.id)) return;
    seen.add(sticker.id);
    out.push(sticker);
  });

  return out;
}

/** الكتالوج الحي — يُحسب مرة واحدة عند تحميل الوحدة. */
export const STICKER_PRODUCTS: StickerProduct[] = deriveStickerCatalog(PAINTINGS);

export const STICKERS_BY_ID: Map<string, StickerProduct> = new Map(
  STICKER_PRODUCTS.map((s) => [s.id, s]),
);

export const STICKERS_BY_PAINTING_ID: Map<string, StickerProduct> = new Map(
  STICKER_PRODUCTS.map((s) => [s.paintingId, s]),
);

export const STICKERS_BY_SLUG: Map<string, StickerProduct> = new Map(
  STICKER_PRODUCTS.map((s) => [s.slug, s]),
);

/** رابط من اللوحة إلى ملصقها — يُستعمل من صفحة اللوحة. */
export function stickerForPainting(paintingId: string): StickerProduct | undefined {
  return STICKERS_BY_PAINTING_ID.get(paintingId);
}

/* ════════ مرآة التصنيفات ════════ */

/**
 * تُبنى التصنيفات من الملصقات نفسها لا من قائمة مكتوبة:
 * تصنيف بلا ملصقات لا يظهر، وتصنيف جديد يظهر وحده.
 * الترتيب = ترتيب أول ظهور في PAINTINGS (نفس ترتيب المعرض).
 */
export function deriveStickerCategories(stickers: StickerProduct[]): StickerCategory[] {
  const byCategory = new Map<string, StickerCategory>();

  for (const sticker of stickers) {
    let category = byCategory.get(sticker.categorySlug);

    if (!category) {
      category = {
        slug: sticker.categorySlug,
        label: sticker.categoryLabel,
        style: sticker.style,
        count: 0,
        coverImageUrl: sticker.imageUrl,
        order: sticker.order,
        collections: [],
      };
      byCategory.set(sticker.categorySlug, category);
    }

    category.count += 1;

    if (sticker.collection && sticker.collectionSlug) {
      const existing = category.collections.find((c) => c.slug === sticker.collectionSlug);
      if (existing) {
        existing.count += 1;
      } else {
        category.collections.push({
          slug: sticker.collectionSlug,
          title: sticker.collection,
          count: 1,
          coverImageUrl: sticker.imageUrl,
        });
      }
    }
  }

  return Array.from(byCategory.values()).sort((a, b) => a.order - b.order);
}

export const STICKER_CATEGORIES: StickerCategory[] = deriveStickerCategories(STICKER_PRODUCTS);

export function stickersInCategory(categorySlug: string | null): StickerProduct[] {
  if (!categorySlug) return STICKER_PRODUCTS;
  return STICKER_PRODUCTS.filter((s) => s.categorySlug === categorySlug);
}

export function stickersInCollection(categorySlug: string, collectionSlug: string | null): StickerProduct[] {
  const base = stickersInCategory(categorySlug);
  if (!collectionSlug) return base;
  return base.filter((s) => s.collectionSlug === collectionSlug);
}

export interface StickerQuery {
  category?: string | null;
  collection?: string | null;
  search?: string;
  sort?: 'catalog' | 'title-asc' | 'title-desc';
}

/** بحث وتصفية وترتيب في مكان واحد — دالة خالصة. */
export function queryStickers(query: StickerQuery, source: StickerProduct[] = STICKER_PRODUCTS): StickerProduct[] {
  const term = (query.search ?? '').trim().toLowerCase();

  let rows = source.filter((sticker) => {
    if (query.category && sticker.categorySlug !== query.category) return false;
    if (query.collection && sticker.collectionSlug !== query.collection) return false;
    if (term.length === 0) return true;
    return (
      sticker.title.toLowerCase().includes(term) ||
      sticker.artistName.toLowerCase().includes(term) ||
      sticker.categoryLabel.toLowerCase().includes(term) ||
      (sticker.collection ?? '').toLowerCase().includes(term)
    );
  });

  if (query.sort === 'title-asc') {
    rows = [...rows].sort((a, b) => a.title.localeCompare(b.title));
  } else if (query.sort === 'title-desc') {
    rows = [...rows].sort((a, b) => b.title.localeCompare(a.title));
  }

  return rows;
}

/* ════════ التشطيبات والتسعير ════════ */

export const STICKER_FINISHES: StickerFinish[] = [
  {
    id: 'matte-vinyl',
    name: 'Matte Vinyl',
    desc: 'Non-reflective tactile flat finish. Classy & understated.',
    priceModifier: 0,
    effectClass: 'brightness-100 contrast-100',
    borderHex: '#12131A',
  },
  {
    id: 'holographic-prism',
    name: 'Holographic Prism',
    desc: 'Rainbow metal reflection shifting with direct light. Futuristic.',
    priceModifier: 2.5,
    effectClass: 'hue-rotate-15 saturate-125 brightness-110',
    borderHex: '#C084FC',
  },
  {
    id: 'chrome-silver',
    name: 'Chrome Silver',
    desc: 'High-polish mirror silver edges and reflections. Premium.',
    priceModifier: 2.0,
    effectClass: 'contrast-125 saturate-50 brightness-125',
    borderHex: '#E2E8F0',
  },
  {
    id: 'high-gloss',
    name: 'High Gloss',
    desc: 'Deep wet-look shine with robust UV protection.',
    priceModifier: 1.0,
    effectClass: 'contrast-110 saturate-105 brightness-105',
    borderHex: '#12131A',
  },
];

export const DEFAULT_FINISH_ID: StickerFinishId = 'holographic-prism';

export function finishById(id: string): StickerFinish {
  return STICKER_FINISHES.find((f) => f.id === id) ?? STICKER_FINISHES[0];
}

export const STICKER_BASE_PRICE = 8.5;

/**
 * رسوم المقاس محسوبة من المساحة بالسم² بتدرج خطّي بين نقاط مرساة.
 * النقاط مختارة لتُعيد بالضبط أسعار المقاسات الثلاثة القديمة:
 *   6×6 = 36سم² → +0، 10×10 = 100سم² → +4، 15×15 = 225سم² → +8.
 */
const SIZE_PRICE_ANCHORS: Array<[number, number]> = [
  [36, 0],
  [100, 4],
  [225, 8],
];

export function sizeSurcharge(widthPx: number, heightPx: number): number {
  const area = areaCm2(widthPx, heightPx);

  if (area <= SIZE_PRICE_ANCHORS[0][0]) return 0;

  for (let i = 1; i < SIZE_PRICE_ANCHORS.length; i += 1) {
    const [prevArea, prevPrice] = SIZE_PRICE_ANCHORS[i - 1];
    const [curArea, curPrice] = SIZE_PRICE_ANCHORS[i];
    if (area <= curArea) {
      const t = (area - prevArea) / (curArea - prevArea);
      return round2(prevPrice + t * (curPrice - prevPrice));
    }
  }

  const [aArea, aPrice] = SIZE_PRICE_ANCHORS[SIZE_PRICE_ANCHORS.length - 2];
  const [bArea, bPrice] = SIZE_PRICE_ANCHORS[SIZE_PRICE_ANCHORS.length - 1];
  const slope = (bPrice - aPrice) / (bArea - aArea);
  return round2(bPrice + (area - bArea) * slope);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** مواصفات ملصق مُعدّ للطلب. الأبعاد تُحفظ بالبكسل غير مدوّرة. */
export interface StickerSpec {
  widthPx: number;
  heightPx: number;
  unit: LengthUnit;
  finishId: StickerFinishId;
}

export function stickerPrice(spec: StickerSpec): number {
  return round2(
    STICKER_BASE_PRICE + finishById(spec.finishId).priceModifier + sizeSurcharge(spec.widthPx, spec.heightPx),
  );
}

/* ════════ الجسر مع السلة القائمة ════════ */

/**
 * السلة القائمة تقبل (Painting, FramingOption, Personalization?) فقط.
 * لا نخترع نوع منتج جديدًا ولا نخترع خلفية لا وجود لها؛
 * نُسقِط الملصق على نفس الشكل مع الحفاظ على نفس نمط المعرّف
 * الذي كان مستعملًا قبل هذا التغيير (sticker-<paintingId>-<Finish>-<Size>)
 * حتى لا تنكسر أي سلة محفوظة في الجلسة.
 */
export function buildStickerCartPainting(sticker: StickerProduct, spec: StickerSpec): Painting {
  const finish = finishById(spec.finishId);
  const widthCm = pixelsToCentimetres(spec.widthPx);
  const heightCm = pixelsToCentimetres(spec.heightPx);
  const sizeLabel = formatSize(spec.widthPx, spec.heightPx, spec.unit);

  return {
    id: 'sticker-' + sticker.paintingId + '-' + finish.name.replace(/\s+/g, '-') + '-' + sizeLabel.replace(/\s+/g, ''),
    title: '[STICKER] ' + sticker.title + ' (' + finish.name + ' — ' + sizeLabel + ')',
    artistId: sticker.artistId,
    artistName: sticker.artistName,
    year: sticker.source.year,
    style: sticker.style,
    sizeCategory: 'Small',
    widthCm,
    heightCm,
    price: stickerPrice(spec),
    story:
      'Die-cut vinyl sticker derived from the original artwork "' +
      sticker.title +
      '" (' +
      sticker.paintingId +
      '). Finish: ' +
      finish.name +
      '. Cut size: ' +
      sizeLabel +
      '.',
    imageUrl: sticker.imageUrl,
    colorPalette: sticker.colorPalette,
    paletteNames: sticker.paletteNames,
    featured: false,
    subCategory: sticker.collection ?? undefined,
  };
}

/** التشطيب يُمثّل كـ FramingOption — نفس الأسلوب المستعمل قبل هذا التغيير. */
export function buildStickerFinishOption(spec: StickerSpec): FramingOption {
  const finish = finishById(spec.finishId);
  return {
    id: 'finish-' + finish.id,
    name: 'Die-cut Vinyl: ' + finish.name,
    description:
      formatSize(spec.widthPx, spec.heightPx, spec.unit) +
      ' cut size with weatherproof adhesive. ' +
      finish.desc,
    price: 0,
    borderHex: finish.borderHex,
    materialWidthCm: 0,
  };
}
