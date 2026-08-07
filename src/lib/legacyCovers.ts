/**
 * أغلفة الأقسام والأقسام الفرعية التي لا تملك صورًا في كتالوج الـ CDN
 * (Motorbikes / Cars / Gaming والفئات التقليدية).
 *
 * لماذا يوجد هذا الملف؟
 * كتالوج CDN يغطي anime-manga و films-series فقط. أي بطاقة خارج هذين
 * القسمين تحتاج غلافًا صريحًا، وإلا رُسمت فارغة. هذا الملف هو المصدر
 * الوحيد للحقيقة لتلك الأغلفة.
 *
 * المفتاح = card.title بالحرف كما في SUBCATEGORY_INFOS.
 */
export const LEGACY_SUBCATEGORY_COVERS: Record<string, string> = {
  // ── Motorbikes ────────────────────────────────────────────────
  'Full Motorbikes Collection':
    'https://i.postimg.cc/Jhm15xJ2/SUZUKI-HAYABUSA.jpg',
  'BMW':
    'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/6.webp',
  'KAWASAKI':
    'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/1.webp',
  'YAMAHA':
    'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/3.webp',
  'DUCATI':
    'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/4.webp',
  'Royal enfield':
    'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/royal.webp',
  'honda':
    'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/2.webp',
  'Suzuki':
    'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/5.webp',
  'KTM':
    'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/7.webp',
  'Harley-Davidson':
    'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/8.webp',

  // ── Cars ──────────────────────────────────────────────────────
  'Full Cars Collection':
    'https://i.postimg.cc/R09HJc0r/Untitled-design-34.png',
  'mercedes':
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600',
  'Mercedes':
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=600',
  'AUDI':
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=600',
  'Audi':
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=600',
  'Supra':
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600',
  'supra':
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600',
  'Nissan':
    'https://images.unsplash.com/photo-1611245141705-021e03a9484b?auto=format&fit=crop&q=80&w=600',
  'nissan':
    'https://images.unsplash.com/photo-1611245141705-021e03a9484b?auto=format&fit=crop&q=80&w=600',
  'Porsche':
    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=600',
  'porsche':
    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=600',
  'porsch':
    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=600',
  'another cars':
    'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&q=80&w=600',
  'Another Cars':
    'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&q=80&w=600',
};

/** غلاف لكل عائلة/فئة عليا — آخر خط دفاع قبل الفراغ. */
export const CATEGORY_COVER_FALLBACKS: Record<string, string> = {
  Motorbikes: 'https://i.postimg.cc/Jhm15xJ2/SUZUKI-HAYABUSA.jpg',
  Cars: 'https://i.postimg.cc/R09HJc0r/Untitled-design-34.png',
  Gaming:
    'https://i.postimg.cc/sXLp22L0/Image-for-website-cover-2K-202607230109.jpg',
};

/** بكسل شفاف 1×1 — يُستخدم فقط كقيمة src أخيرة حتى لا يطلب المتصفح "" */
export const BLANK_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * سلسلة السقوط: أول قيمة غير فارغة تفوز.
 * لا تُعيد هذه الدالة أبدًا سلسلة فارغة.
 */
export function resolveCover(
  candidates: Array<string | null | undefined>,
): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) return c;
  }
  return BLANK_PIXEL;
}
