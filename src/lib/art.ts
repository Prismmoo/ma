import {
  ART_COLLECTIONS,
  CDN_ART_ROOT,
} from '../generated/artCatalog.gen';
import { isHidden } from './hiddenArtworks';
import type {
  ArtImageRef,
  ArtCategorySlug,
  GeneratedCollection,
  GeneratedImage,
} from '../types';

/* ===========================================================================
 *  1. اشتقاق الروابط — الدالة الوحيدة التي تبني URL في المشروع كله.
 *     لا تكتب رابط صورة يدويًا في أي ملف آخر. أبدًا.
 * ======================================================================== */

/** المعرّف القانوني: `anm-berserk-01` */
export function artId(pfx: string, slug: string, index: number): string {
  return `${pfx}-${slug}-${String(index).padStart(2, '0')}`;
}

/** رابط متغيّر واحد. `width` يجب أن يكون عضوًا في `img.z`. */
export function artUrl(
  cat: ArtCategorySlug,
  slug: string,
  pfx: string,
  index: number,
  width: number,
): string {
  return `${CDN_ART_ROOT}/${cat}/${slug}/${artId(pfx, slug, index)}-${width}.webp`;
}

/**
 * يحوّل سجلًا مولّدًا إلى مرجع جاهز للعرض.
 *
 * المبدأ الحاكم: `srcSet` يُبنى **حصرًا** من `img.z`، و`src` هو
 * أكبر مقاس متوفر فعليًا — لذلك يستحيل رياضيًا أن ينتج 404.
 */
export function toImageRef(c: GeneratedCollection, im: GeneratedImage): ArtImageRef {
  const sizes = im.z;
  const largest = sizes[sizes.length - 1];
  return {
    id: artId(c.pfx, c.slug, im.i),
    src: artUrl(c.cat, c.slug, c.pfx, im.i, largest),
    srcSet: sizes
      .map((w) => `${artUrl(c.cat, c.slug, c.pfx, im.i, w)} ${w}w`)
      .join(', '),
    width: im.w,
    height: im.h,
    maxWidth: largest,
  };
}

/* ===========================================================================
 *  2. فهارس جاهزة — تُبنى مرة واحدة عند تحميل الوحدة (O(n) مرة واحدة).
 * ======================================================================== */

export const COLLECTIONS_BY_SLUG: ReadonlyMap<string, GeneratedCollection> =
  new Map(ART_COLLECTIONS.map((c) => [c.slug, c]));

/** العنوان المعروض → المجموعة. مفتاح الربط مع `Painting.subCategory`. */
export const COLLECTIONS_BY_TITLE: ReadonlyMap<string, GeneratedCollection> =
  new Map(ART_COLLECTIONS.map((c) => [c.title, c]));

export const ANIME_COLLECTIONS = ART_COLLECTIONS.filter((c) => c.cat === 'anime-manga');
export const FILM_COLLECTIONS   = ART_COLLECTIONS.filter((c) => c.type === 'film');
export const SERIES_COLLECTIONS = ART_COLLECTIONS.filter((c) => c.type === 'series');
export const GAME_COLLECTIONS   = ART_COLLECTIONS.filter((c) => c.cat === 'games');
export const CARS_COLLECTIONS   = ART_COLLECTIONS.filter((c) => c.cat === 'cars');

/** العناوين المعروضة مرتبة أبجديًا — تحلّ محل availableSubCategories اليدوية. */
export const ANIME_SUBCATEGORIES  = ANIME_COLLECTIONS.map((c) => c.title);
export const FILM_SUBCATEGORIES   = FILM_COLLECTIONS.map((c) => c.title);
export const SERIES_SUBCATEGORIES = SERIES_COLLECTIONS.map((c) => c.title);
export const GAME_SUBCATEGORIES   = GAME_COLLECTIONS.map((c) => c.title);
/** أسماء مراجع السيارات كما تظهر للمستخدم — مشتقة من الكتالوج المولَّد. */
export const CARS_SUBCATEGORIES = CARS_COLLECTIONS.map((c) => c.title);
export const FILMS_SERIES_SUBCATEGORIES = [...FILM_SUBCATEGORIES, ...SERIES_SUBCATEGORIES];

/* ===========================================================================
 *  3. مُساعدات العرض
 * ======================================================================== */

/**
 * كل صور مجموعة كمراجع جاهزة، بعد استثناء المخفيّ.
 * هذه هي نقطة الخنق للطبقة المولّدة: الغلاف والعدّاد يُبنيان عليها،
 * فلا يمكن أن يتناقض عدّاد مع محتوى.
 */
export function collectionImages(slug: string): ArtImageRef[] {
  const c = COLLECTIONS_BY_SLUG.get(slug);
  if (!c) return [];
  return c.imgs.map((im) => toImageRef(c, im)).filter((ref) => !isHidden(ref.id));
}

/**
 * صورة الغلاف — أول صورة ظاهرة.
 * ملاحظة: لم تكن الصورة 01 مخفيّة في أي مجموعة عند كتابة هذا،
 * لكننا لا نعتمد على ذلك؛ لو أُخفيت لاحقًا يتقدّم الغلاف للتالية
 * بدل أن يصبح فراغًا.
 */
export function collectionCover(slug: string): ArtImageRef | null {
  return collectionImages(slug)[0] ?? null;
}

/** عدد الصور الظاهرة في مجموعة — للشارات والعدّادات. */
export function collectionCount(slug: string): number {
  return collectionImages(slug).length;
}

/**
 * يبني سمة `sizes` لـ <img>.
 * مهم: لا تطلب من المتصفح عرضًا أكبر ممّا نملك. إن كان أكبر
 * مقاس متوفر هو 400px، فإن إعلان `100vw` يجعل المتصفح يمدد الصورة
 * ويظهرها ضبابية. نقفل السقف عند maxWidth.
 */
export function artSizesAttr(ref: ArtImageRef, cssHint: string): string {
  return `(min-width: 1px) min(${cssHint}, ${ref.maxWidth}px)`;
}
