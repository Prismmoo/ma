/**
 * قائمة الإخفاء — المصدر الوحيد للحقيقة.
 *
 * لماذا الإخفاء بالمعرّف وليس بالعنوان:
 *   العنوان نصّ معروض، قابل للتعديل والترجمة، ويحتوي محارف خاصة
 *   (— و É و &). المطابقة النصّية ستنكسر بصمت عند أول تعديل تحريري.
 *   المعرّف عقد ثابت: pt-* مكتوب يدويًا، و anm-<slug>-NN مشتق حتميًا
 *   من مسار الملف على CDN.
 *
 * لماذا لا نحذف الملفات من المستودع:
 *   الملفات تبقى مرفوعة وروابطها سليمة، فلا انكسار لأي رابط قديم،
 *   ولا حاجة لإعادة رفع أي شيء. الموقع فقط يتوقف عن قراءتها.
 *   وأي `npm run art:sync` لاحق سيعيد توليد المانيفست كاملًا —
 *   لذلك أي حذف من الملف المولَّد كان سيُمحى تلقائيًا، بخلاف هذه القائمة.
 *
 * لإرجاع لوحة إلى الظهور: احذف سطرها من هنا. لا شيء آخر.
 */
export const HIDDEN_PAINTING_IDS: ReadonlySet<string> = new Set([
  // ---- لوحات الاستوديو (data.ts) — 18 ----
  'pt-ani-17', // Eren: Freedom Beyond the Walls
  'pt-ani-01', // Guts: The Black Swordsman
  'pt-ani-13', // Asta: Demon Destroyer Grimoire
  'pt-ani-14', // Light & Ryuk: Moonlight Judgment
  'pt-ani-10', // Tanjiro: Hinokami Kagura
  'pt-ani-05', // Goku: Super Saiyan Limitless
  'pt-ani-07', // Kintaro Oe: Study of Life
  'pt-ani-06', // Ippo: Dempsey Roll Motion
  'pt-ani-18', // Gon & Killua: Aura of Friendship
  'pt-09',     // Rêverie Étoilée
  'pt-ani-08', // Gojo Satoru: Infinite Void
  'pt-ani-09', // Naruto & Kurama: Sage Will
  'pt-ani-11', // Luffy: Gear 5 Sun God
  'pt-ani-12', // Saitama: Serious Series Punch
  'pt-ani-04', // Sung Jin-Woo: Arise
  'pt-ani-16', // Mori Buntarou: Solitary Ridge Ascent
  'pt-ani-02', // Musashi: Path of the Blade
  'pt-ani-03', // Thorfinn: Shore of Vinland

  // ---- لوحات مولّدة من CDN — 7 ----
  'anm-black-clover-05',
  'anm-black-clover-09',
  'anm-black-clover-12',
  'anm-dragon-ball-09',
  'anm-naruto-03',
  'anm-vagabond-04',
  'anm-vinland-saga-02',

  // ---- Films & Series — لوحات الاستوديو (data.ts) — 25 ----
  'pt-flm-21', // 2001: Monolith & Stargate
  'pt-flm-26', // Captain Phillips: Ocean Rescue
  'pt-flm-24', // City of God: Favela Sunburst
  'pt-flm-02', // Fight Club: Chemical Burn
  'pt-flm-23', // Interstellar: Gargantua Singularity
  'pt-flm-17', // Joker: Stairway Dance
  'pt-flm-03', // Memento: Fragmented Memory
  'pt-flm-22', // Oppenheimer: Trinity Fireball
  'pt-flm-25', // Paul: Area 51 Highway
  'pt-11',     // Cinéma Noir No. 7
  'pt-flm-01', // Se7en: Rain of Sins
  'pt-flm-19', // The Dark Knight: Watchful Protector
  'pt-flm-08', // Better Call Saul: Justice in Neon
  'pt-flm-06', // Breaking Bad: Blue Sky Empire
  'pt-flm-12', // Dark: Winden Time Loop
  'pt-flm-16', // The Wire: West Baltimore
  'pt-flm-11', // From: The Talisman Town
  'pt-flm-07', // Game of Thrones: Winter & Fire
  'pt-flm-13', // Lost: The Mysterious Island
  'pt-flm-15', // The Walking Dead: Atlanta Highway
  'pt-flm-05', // Peaky Blinders: By Order of the Shelby
  'pt-flm-10', // Six Feet Under: Eternal Departure
  'pt-flm-18', // The Boys: Compound V Overdrive
  'pt-flm-14', // The Last Kingdom: Destiny Is All
  'pt-flm-09', // The Sopranos: Jersey Family

  // ---- Films & Series — مولَّدة من CDN — 1 ----
  'srs-better-call-saul-12', // Better Call Saul — Plate 12

  // ---- لوحات السيارات المؤقتة (Unsplash) — 11 — استُبدلت بـ 68 لوحة حقيقية من CDN ----
  'pt-14',      // Nostalgie Rétro
  'pt-15',      // Neon Horizon
  'pt-24',      // Porsche 911 Blueprint Spec
  'pt-25',      // Ferrari F40 Aerodynamics
  'pt-26',      // Audi R8 V10 Performance
  'pt-car-01',  // Mercedes-AMG GT Black Series
  'pt-car-02',  // BMW M4 Competition Spec
  'pt-car-03',  // Nissan GT-R Nismo R35
  'pt-car-04',  // Porsche 911 GT3 RS
  'pt-car-05',  // Porsche 911 GT3 RS Stuttgart Spec
  'pt-car-06',  // Custom Cyberpunk Hypercar Concept
]);

/** هل هذا المعرّف مخفيّ؟ O(1). */
export function isHidden(id: string): boolean {
  return HIDDEN_PAINTING_IDS.has(id);
}

/**
 * بوّابة سلامة: تُستدعى مرة واحدة عند بناء PAINTINGS.
 * معرّف في القائمة لا يطابق أي لوحة = خطأ مطبعي = لوحة تبقى ظاهرة بصمت.
 * نرفض ذلك بصوت عالٍ بدل أن نكتشفه من شكوى زائر.
 */
export function assertHiddenIdsResolve(allIds: readonly string[]): void {
  const present = new Set(allIds);
  const unmatched = [...HIDDEN_PAINTING_IDS].filter((id) => !present.has(id));
  if (unmatched.length > 0) {
    throw new Error(
      'hiddenArtworks: معرّفات لا تطابق أي لوحة موجودة -> ' +
        unmatched.join(', ') +
        '. صحّح المعرّف أو احذفه من HIDDEN_PAINTING_IDS.',
    );
  }
}
