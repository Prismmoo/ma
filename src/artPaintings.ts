import type { Painting, SizeCategory, StyleType } from './types';
import { ART_COLLECTIONS } from './generated/artCatalog.gen';
import { toImageRef } from './lib/art';

/* ===========================================================================
 *  توليد لوحات PRISM من كتالوج الـ CDN.
 *
 *  مبدأ حاسم: الناتج حتمي (deterministic) تمامًا.
 *  لا Math.random() ولا Date.now() — وإلا تغيرت الأسعار والمقاسات
 *  عند كل إعادة تحميل للصفحة، وانكسرت السلة وروابط المشاركة.
 * ======================================================================== */

/** دالة تجزيء ثابتة (FNV-1a 32-bit) — نفس المدخل يعطي نفس المخرج دائمًا. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * تصنيف الـ CDN → مفتاح StyleType المعروض في CATEGORIES.
 *
 * جدول صريح لا تعبير ثلاثي: الصيغة السابقة
 * (`cat === 'anime-manga' ? 'Anime' : 'Films'`) كانت تُسقِط أي تصنيف جديد
 * في 'Films' بصمت، لأن 'Films' قيمة صحيحة النوع فلا يشتكي tsc.
 * بهذا الجدول، أي تصنيف غير مُدرج يصير خطأ ظاهرًا في الطرفية فورًا
 * بدل أن يتسرّب 514 عملًا إلى العائلة الخطأ.
 */
const STYLE_BY_CATEGORY: Record<string, StyleType> = {
  'anime-manga': 'Anime',
  'films-series': 'Films',
  'games': 'Gaming',
  'cars': 'Cars',
};

const styleFor = (cat: string): StyleType => {
  const style = STYLE_BY_CATEGORY[cat];
  if (!style) {
    throw new Error(
      `artPaintings: تصنيف CDN غير معروف "${cat}". أضِفه إلى STYLE_BY_CATEGORY.`,
    );
  }
  return style;
};

/**
 * لوحات الورشة منسوبة للفنانين بالتناوب الحتمي.
 * يجب أن تطابق معرّفات ARTISTS في data.ts حرفيًا.
 */
const ARTIST_POOL = [
  { id: 'art-01', name: 'MESROUR SALAH EDDINE' },
  { id: 'art-02', name: 'NOUREDDIN EL MOBARAKI' },
] as const;

/**
 * أربع لوحات ألوان تطابق **حرفيًا** قوائم hex الموجودة في مرشّح
 * الألوان داخل GalleryView (الأسطر 561–571).
 *
 * ⚠️ إن غيّرت حرفًا واحدًا من أي hex أدناه، تختفي كل اللوحات من
 *    مرشّح اللون المقابل دون أي خطأ في الطرفية.
 *    المرشّح يفحص: earth→#A18F7D · monochrome→#2A2A2A · lapis→#162C4E · ochre→#C68735
 */
const PALETTES: { colors: string[]; names: string[] }[] = [
  {
    // monochrome — يجب أن يحتوي #2A2A2A
    colors: ['#F5F5F5', '#B8B8B8', '#6E6E6E', '#2A2A2A', '#0D0D0D'],
    names: ['Paper White', 'Ash Gray', 'Graphite', 'Soot Charcoal', 'Ink Black'],
  },
  {
    // earth — يجب أن يحتوي #A18F7D
    colors: ['#EAE5DF', '#C5B9AD', '#A18F7D', '#6F5C4B', '#3E3123'],
    names: ['Chalky Clay', 'Dry Sand', 'Warm Sienna', 'Earth Umber', 'Roasted Cacao'],
  },
  {
    // lapis — يجب أن يحتوي #162C4E
    colors: ['#DCE4F0', '#8FA6C7', '#3F5C8A', '#162C4E', '#0A1526'],
    names: ['Frost Blue', 'Faded Denim', 'Deep Cobalt', 'Lapis Night', 'Abyss Navy'],
  },
  {
    // ochre — يجب أن يحتوي #C68735
    colors: ['#FBF0DC', '#E8C489', '#C68735', '#8A5A1C', '#4A2F0C'],
    names: ['Bone Cream', 'Pale Amber', 'Burnished Ochre', 'Toasted Bronze', 'Dark Molasses'],
  },
];

/**
 * المقاس الفيزيائي يُحسب من نسبة الأبعاد الحقيقية للصورة، ليطابق
 * الـ Visualizer ما يراه المستخدم فعلًا لا مقاسًا تعسفيًا.
 *
 * السقف 'Medium' مقصود: لا نبيع مقاسًا لا تسنده دقة الملف (انظر القسم 1.3).
 */
function physicalSize(w: number, h: number, seed: number): {
  sizeCategory: SizeCategory;
  widthCm: number;
  heightCm: number;
  price: number;
} {
  const ratio = h / w;

  // عرض قاعدي حتمي: 40cm أو 60cm
  const isMedium = seed % 2 === 0;
  const widthCm = isMedium ? 60 : 40;
  const heightCm = Math.round(widthCm * ratio);

  // السعر دالة من المساحة فقط، مقرّب لأقرب 50 درهمًا متساويًا.
  // يُضمن أن كل الأسعار داخل نطاق المرشّح [1000, 8000].
  const area = (widthCm * heightCm) / 100; // dm²
  const raw = 900 + area * 22;
  const price = Math.min(7800, Math.max(1050, Math.round(raw / 50) * 50));

  return {
    sizeCategory: isMedium ? 'Medium' : 'Small',
    widthCm,
    heightCm,
    price,
  };
}

/**
 * Public artwork title: collection name only.
 * The image index remains in `Painting.id`, so identity, cart keys, hidden-art
 * rules, CDN paths, and order uniqueness do not depend on the visible title.
 */
const publicArtworkTitle = (collectionTitle: string): string => collectionTitle;

/**
 * قائمة لوحات PRISM الكاملة (695 عنصرًا).
 * تُبنى مرة واحدة عند تحميل الوحدة.
 */
export const ART_PAINTINGS: Painting[] = ART_COLLECTIONS.flatMap((collection) =>
  collection.imgs.map((img) => {
    const ref = toImageRef(collection, img);
    const seed = hash(ref.id);

    const artist = ARTIST_POOL[seed % ARTIST_POOL.length];
    const palette = PALETTES[seed % PALETTES.length];
    const size = physicalSize(img.w, img.h, seed);

    return {
      id: ref.id,                       // معرّف فريد عالميًا: anm-berserk-01
      title: publicArtworkTitle(collection.title),
      artistId: artist.id,
      artistName: artist.name,
      year: 2025 + (seed % 2),          // 2025 أو 2026 — حتمي
      style: styleFor(collection.cat),
      sizeCategory: size.sizeCategory,
      widthCm: size.widthCm,
      heightCm: size.heightCm,
      price: size.price,
      story:
        `A PRISM studio plate from the ${collection.title} series. ` +
        `Hand-finished on textured canvas and archival-printed for the NN Cyberspace collection, ` +
        `this piece is part of a ${collection.imgs.length}-plate body of work exploring the ` +
        `visual language of ${collection.title}.`,
      imageUrl: ref.src,               // تراجع لأي مكوّن لم يُرقّ لـ ArtImage بعد
      colorPalette: palette.colors,
      paletteNames: palette.names,
      subCategory: collection.title,   // مفتاح الربط مع availableSubCategories
      image: ref,                      // مرجع srcset الكامل
      featured: false,                 // الـ Hero يبقى محجوزًا للورشة (انظر T7)
    } satisfies Painting;
  }),
);
