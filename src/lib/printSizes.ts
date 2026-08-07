/**
 * كتالوج مقاسات الطباعة المعتمدة دوليًا + منطق مطابقة النسبة.
 * لا واجهة هنا: بيانات + دوال نقية فقط (قابلة للاختبار).
 */

export type SizeSystem = 'US' | 'ISO' | 'EU' | 'SQUARE' | 'PANO' | 'CINE';
export type Orientation = 'portrait' | 'landscape' | 'square';

/**
 * ما يختاره المستخدم، لا ما تفرضه نسبة اللوحة.
 * 'auto' = السلوك القديم بالضبط: اتبع اتجاه العمل الفني.
 */
export type OrientationChoice = 'auto' | 'portrait' | 'landscape';

export const ORIENTATION_LABELS: Record<OrientationChoice, string> = {
  auto: 'Match the artwork',
  portrait: 'Portrait',
  landscape: 'Landscape',
};

export type PrintSize = {
  id: string;
  /** الاسم المعروض (إنجليزي فقط — قرار المالك). */
  label: string;
  system: SizeSystem;
  /** دائمًا بالوضع العمودي: widthCm <= heightCm */
  widthCm: number;
  heightCm: number;
  /** المكافئ بالإنش للعرض فقط. */
  inches: string;
  /** 1 = الأكثر طلبًا → 5 = متخصص. يُستخدم للترتيب. */
  popularity: 1 | 2 | 3 | 4 | 5;
};

/* ──────────────────── الكتالوج ────────────────── */
export const PRINT_SIZES: PrintSize[] = [
  // ── US / inches ──
  { id: 'us-8x10',   label: '8 × 10 in',   system: 'US', widthCm: 20.3, heightCm: 25.4,  inches: '8\u2033 × 10\u2033',  popularity: 2 },
  { id: 'us-11x14',  label: '11 × 14 in',  system: 'US', widthCm: 27.9, heightCm: 35.6,  inches: '11\u2033 × 14\u2033', popularity: 2 },
  { id: 'us-11x17',  label: '11 × 17 in',  system: 'US', widthCm: 27.9, heightCm: 43.2,  inches: '11\u2033 × 17\u2033', popularity: 2 },
  { id: 'us-12x18',  label: '12 × 18 in',  system: 'US', widthCm: 30.5, heightCm: 45.7,  inches: '12\u2033 × 18\u2033', popularity: 2 },
  { id: 'us-16x20',  label: '16 × 20 in',  system: 'US', widthCm: 40.6, heightCm: 50.8,  inches: '16\u2033 × 20\u2033', popularity: 2 },
  { id: 'us-18x24',  label: '18 × 24 in',  system: 'US', widthCm: 45.7, heightCm: 61.0,  inches: '18\u2033 × 24\u2033', popularity: 1 },
  { id: 'us-20x30',  label: '20 × 30 in',  system: 'US', widthCm: 50.8, heightCm: 76.2,  inches: '20\u2033 × 30\u2033', popularity: 3 },
  { id: 'us-24x30',  label: '24 × 30 in',  system: 'US', widthCm: 61.0, heightCm: 76.2,  inches: '24\u2033 × 30\u2033', popularity: 3 },
  { id: 'us-24x36',  label: '24 × 36 in',  system: 'US', widthCm: 61.0, heightCm: 91.4,  inches: '24\u2033 × 36\u2033', popularity: 1 },
  { id: 'us-27x40',  label: '27 × 40 in',  system: 'US', widthCm: 68.6, heightCm: 101.6, inches: '27\u2033 × 40\u2033', popularity: 2 },
  { id: 'us-30x40',  label: '30 × 40 in',  system: 'US', widthCm: 76.2, heightCm: 101.6, inches: '30\u2033 × 40\u2033', popularity: 3 },
  { id: 'us-36x48',  label: '36 × 48 in',  system: 'US', widthCm: 91.4, heightCm: 121.9, inches: '36\u2033 × 48\u2033', popularity: 4 },

  // ── ISO 216 ── (نسبة ثابتة 1:1.414)
  { id: 'iso-a4', label: 'A4',  system: 'ISO', widthCm: 21.0, heightCm: 29.7,  inches: '8.3\u2033 × 11.7\u2033', popularity: 2 },
  { id: 'iso-a3', label: 'A3',  system: 'ISO', widthCm: 29.7, heightCm: 42.0,  inches: '11.7\u2033 × 16.5\u2033', popularity: 1 },
  { id: 'iso-a2', label: 'A2',  system: 'ISO', widthCm: 42.0, heightCm: 59.4,  inches: '16.5\u2033 × 23.4\u2033', popularity: 1 },
  { id: 'iso-a1', label: 'A1',  system: 'ISO', widthCm: 59.4, heightCm: 84.1,  inches: '23.4\u2033 × 33.1\u2033', popularity: 2 },
  { id: 'iso-a0', label: 'A0',  system: 'ISO', widthCm: 84.1, heightCm: 118.9, inches: '33.1\u2033 × 46.8\u2033', popularity: 4 },

  // ── EU metric ──
  { id: 'eu-30x40',  label: '30 × 40 cm',  system: 'EU', widthCm: 30,  heightCm: 40,  inches: '11.8\u2033 × 15.7\u2033', popularity: 1 },
  { id: 'eu-40x50',  label: '40 × 50 cm',  system: 'EU', widthCm: 40,  heightCm: 50,  inches: '15.7\u2033 × 19.7\u2033', popularity: 1 },
  { id: 'eu-50x70',  label: '50 × 70 cm',  system: 'EU', widthCm: 50,  heightCm: 70,  inches: '19.7\u2033 × 27.6\u2033', popularity: 1 },
  { id: 'eu-60x80',  label: '60 × 80 cm',  system: 'EU', widthCm: 60,  heightCm: 80,  inches: '23.6\u2033 × 31.5\u2033', popularity: 2 },
  { id: 'eu-70x100', label: '70 × 100 cm', system: 'EU', widthCm: 70,  heightCm: 100, inches: '27.6\u2033 × 39.4\u2033', popularity: 2 },

  // ── Square ──
  { id: 'sq-30',  label: '30 × 30 cm',   system: 'SQUARE', widthCm: 30,  heightCm: 30,  inches: '11.8\u2033 × 11.8\u2033', popularity: 3 },
  { id: 'sq-50',  label: '50 × 50 cm',   system: 'SQUARE', widthCm: 50,  heightCm: 50,  inches: '19.7\u2033 × 19.7\u2033', popularity: 3 },
  { id: 'sq-100', label: '100 × 100 cm', system: 'SQUARE', widthCm: 100, heightCm: 100, inches: '39.4\u2033 × 39.4\u2033', popularity: 4 },

  // ── Panoramic ──
  { id: 'pn-30x90',  label: '30 × 90 cm',  system: 'PANO', widthCm: 30, heightCm: 90,  inches: '11.8\u2033 × 35.4\u2033', popularity: 4 },
  { id: 'pn-40x120', label: '40 × 120 cm', system: 'PANO', widthCm: 40, heightCm: 120, inches: '15.7\u2033 × 47.2\u2033', popularity: 5 },

  // ── Squares — metric ──
  { id: 'sq-20',  label: '20 × 20 cm',  system: 'SQUARE', widthCm: 20,   heightCm: 20,   inches: '7.9\u2033 × 7.9\u2033',   popularity: 2 },
  { id: 'sq-25',  label: '25 × 25 cm',  system: 'SQUARE', widthCm: 25,   heightCm: 25,   inches: '9.8\u2033 × 9.8\u2033',   popularity: 2 },
  { id: 'sq-40',  label: '40 × 40 cm',  system: 'SQUARE', widthCm: 40,   heightCm: 40,   inches: '15.7\u2033 × 15.7\u2033', popularity: 1 },
  { id: 'sq-60',  label: '60 × 60 cm',  system: 'SQUARE', widthCm: 60,   heightCm: 60,   inches: '23.6\u2033 × 23.6\u2033', popularity: 2 },
  { id: 'sq-70',  label: '70 × 70 cm',  system: 'SQUARE', widthCm: 70,   heightCm: 70,   inches: '27.6\u2033 × 27.6\u2033', popularity: 3 },
  { id: 'sq-80',  label: '80 × 80 cm',  system: 'SQUARE', widthCm: 80,   heightCm: 80,   inches: '31.5\u2033 × 31.5\u2033', popularity: 3 },

  // ── Squares — inch-native ──
  { id: 'sq-8in',  label: '8 × 8 in',   system: 'SQUARE', widthCm: 20.3, heightCm: 20.3, inches: '8\u2033 × 8\u2033',   popularity: 3 },
  { id: 'sq-12in', label: '12 × 12 in', system: 'SQUARE', widthCm: 30.5, heightCm: 30.5, inches: '12\u2033 × 12\u2033', popularity: 2 },
  { id: 'sq-16in', label: '16 × 16 in', system: 'SQUARE', widthCm: 40.6, heightCm: 40.6, inches: '16\u2033 × 16\u2033', popularity: 3 },

  // ── 4:5 — the dominant modern poster ratio ──
  { id: 'r45-16x20', label: '16 × 20 cm', system: 'EU', widthCm: 16, heightCm: 20, inches: '6.3\u2033 × 7.9\u2033',   popularity: 3 },
  { id: 'r45-24x30', label: '24 × 30 cm', system: 'EU', widthCm: 24, heightCm: 30, inches: '9.4\u2033 × 11.8\u2033',  popularity: 1 },
  { id: 'r45-32x40', label: '32 × 40 cm', system: 'EU', widthCm: 32, heightCm: 40, inches: '12.6\u2033 × 15.7\u2033', popularity: 1 },
  { id: 'r45-48x60', label: '48 × 60 cm', system: 'EU', widthCm: 48, heightCm: 60, inches: '18.9\u2033 × 23.6\u2033', popularity: 2 },
  { id: 'r45-64x80', label: '64 × 80 cm', system: 'EU', widthCm: 64, heightCm: 80, inches: '25.2\u2033 × 31.5\u2033', popularity: 3 },

  // ── 2:3 — the classic photographic ratio ──
  { id: 'r23-20x30',  label: '20 × 30 cm',  system: 'EU', widthCm: 20, heightCm: 30,  inches: '7.9\u2033 × 11.8\u2033',  popularity: 2 },
  { id: 'r23-40x60',  label: '40 × 60 cm',  system: 'EU', widthCm: 40, heightCm: 60,  inches: '15.7\u2033 × 23.6\u2033', popularity: 1 },
  { id: 'r23-60x90',  label: '60 × 90 cm',  system: 'EU', widthCm: 60, heightCm: 90,  inches: '23.6\u2033 × 35.4\u2033', popularity: 2 },
  { id: 'r23-80x120', label: '80 × 120 cm', system: 'EU', widthCm: 80, heightCm: 120, inches: '31.5\u2033 × 47.2\u2033', popularity: 3 },

  // ── Small formats — the first purchase a hesitant buyer makes ──
  { id: 'iso-a5',   label: 'A5',          system: 'ISO', widthCm: 14.8, heightCm: 21.0, inches: '5.8\u2033 × 8.3\u2033',  popularity: 3 },
  { id: 'eu-13x18', label: '13 × 18 cm',  system: 'EU',  widthCm: 13,   heightCm: 18,   inches: '5.1\u2033 × 7.1\u2033',  popularity: 3 },
  { id: 'eu-15x21', label: '15 × 21 cm',  system: 'EU',  widthCm: 15,   heightCm: 21,   inches: '5.9\u2033 × 8.3\u2033',  popularity: 3 },
  { id: 'us-5x7',   label: '5 × 7 in',    system: 'US',  widthCm: 12.7, heightCm: 17.8, inches: '5\u2033 × 7\u2033',      popularity: 3 },
  { id: 'us-9x12',  label: '9 × 12 in',   system: 'US',  widthCm: 22.9, heightCm: 30.5, inches: '9\u2033 × 12\u2033',     popularity: 3 },

  // ── Additional US gallery formats ──
  { id: 'us-12x16', label: '12 × 16 in', system: 'US', widthCm: 30.5, heightCm: 40.6, inches: '12\u2033 × 16\u2033', popularity: 2 },
  { id: 'us-20x24', label: '20 × 24 in', system: 'US', widthCm: 50.8, heightCm: 61.0, inches: '20\u2033 × 24\u2033', popularity: 3 },
  { id: 'us-22x28', label: '22 × 28 in', system: 'US', widthCm: 55.9, heightCm: 71.1, inches: '22\u2033 × 28\u2033', popularity: 4 },
  { id: 'us-32x48', label: '32 × 48 in', system: 'US', widthCm: 81.3, heightCm: 121.9, inches: '32\u2033 × 48\u2033', popularity: 4 },

  // ── 16:9 — this catalogue is made of film, series and game frames ──
  { id: 'r169-30x53',  label: '30 × 53 cm',  system: 'CINE', widthCm: 30, heightCm: 53.3,  inches: '11.8\u2033 × 21\u2033',   popularity: 2 },
  { id: 'r169-40x71',  label: '40 × 71 cm',  system: 'CINE', widthCm: 40, heightCm: 71.1,  inches: '15.7\u2033 × 28\u2033',   popularity: 1 },
  { id: 'r169-50x89',  label: '50 × 89 cm',  system: 'CINE', widthCm: 50, heightCm: 88.9,  inches: '19.7\u2033 × 35\u2033',   popularity: 2 },
  { id: 'r169-60x107', label: '60 × 107 cm', system: 'CINE', widthCm: 60, heightCm: 106.7, inches: '23.6\u2033 × 42\u2033',   popularity: 3 },

  // ── Panoramic ──
  { id: 'pn-20x40',  label: '20 × 40 cm',  system: 'PANO', widthCm: 20, heightCm: 40,  inches: '7.9\u2033 × 15.7\u2033',  popularity: 3 },
  { id: 'pn-30x60',  label: '30 × 60 cm',  system: 'PANO', widthCm: 30, heightCm: 60,  inches: '11.8\u2033 × 23.6\u2033', popularity: 2 },
  { id: 'pn-40x80',  label: '40 × 80 cm',  system: 'PANO', widthCm: 40, heightCm: 80,  inches: '15.7\u2033 × 31.5\u2033', popularity: 2 },
  { id: 'pn-50x100', label: '50 × 100 cm', system: 'PANO', widthCm: 50, heightCm: 100, inches: '19.7\u2033 × 39.4\u2033', popularity: 3 },
  { id: 'pn-25x75',  label: '25 × 75 cm',  system: 'PANO', widthCm: 25, heightCm: 75,  inches: '9.8\u2033 × 29.5\u2033',  popularity: 4 },
  { id: 'pn-50x150', label: '50 × 150 cm', system: 'PANO', widthCm: 50, heightCm: 150, inches: '19.7\u2033 × 59.1\u2033', popularity: 4 },
];

export const SYSTEM_LABELS: Record<SizeSystem, string> = {
  US: 'US Inches',
  ISO: 'ISO A-Series',
  EU: 'European cm',
  SQUARE: 'Square',
  PANO: 'Panoramic',
  CINE: 'Cinematic 16:9',
};

/* ──────────────────── المنطق ────────────────── */

export const cmToIn = (cm: number) => cm / 2.54;

/** نسبة الارتفاع/العرض. 1.5 يعني عموديًا بزيادة 50%. */
export const ratioOf = (w: number, h: number) => h / w;

export function orientationOf(aspect: number): Orientation {
  if (aspect > 1.03) return 'portrait';
  if (aspect < 0.97) return 'landscape';
  return 'square';
}

/**
 * يقلب المقاس ليطابق اتجاه العمل الفني.
 * كل المقاسات مخزّنة عموديًا، فلا داعي لتكرارها أفقيًا في البيانات.
 */
export function orientSize(size: PrintSize, target: Orientation) {
  if (target === 'landscape') {
    return { widthCm: size.heightCm, heightCm: size.widthCm };
  }
  return { widthCm: size.widthCm, heightCm: size.heightCm };
}

export type SizeMatch = {
  size: PrintSize;
  widthCm: number;
  heightCm: number;
  /** انحراف النسبة بالمئة (0 = مطابق تمامًا) */
  deltaPct: number;
  fit: 'perfect' | 'good' | 'crop';
  /** كم من الصورة سيُقصّ بالمئة عند الملء */
  cropLossPct: number;
};

/**
 * يرتّب كل المقاسات حسب مدى مطابقتها لنسبة العمل الفني الحقيقية.
 * artAspect = ارتفاع الصورة / عرضها (من naturalWidth/Height أو من المانيفست).
 */
/**
 * @param artAspect      نسبة العمل الفني (الارتفاع ÷ العرض).
 * @param orientation    تجاوز صريح. 'auto' يُبقي السلوك السابق حرفيًا.
 *
 * لماذا وسيط اختياري وليس دالة ثانية؟ لأن دالة ثانية تعني مساري مطابقة
 * يجب إبقاؤهما متزامنين، وهذا بالضبط نمط العطب الذي أوقعنا في محرّكي إيماءات.
 *
 * ملاحظة توافق: الوسيط اختياري وقيمته الافتراضية 'auto'، فكلّ مستدعٍ
 * قائم يعمل بلا تعديل.
 */
export function matchSizes(
  artAspect: number,
  orientation: OrientationChoice = 'auto',
): SizeMatch[] {
  const target: Orientation =
    orientation === 'auto' ? orientationOf(artAspect) : orientation;
  return PRINT_SIZES.map((size) => {
    const { widthCm, heightCm } = orientSize(size, target);
    const sizeAspect = heightCm / widthCm;
    const deltaPct = Math.abs(sizeAspect - artAspect) / artAspect * 100;

    // نسبة الفقد عند الملء (cover): نسبة المساحة الخارجة عن الإطار
    const scale = Math.max(1, sizeAspect / artAspect, artAspect / sizeAspect);
    const cropLossPct = (1 - 1 / scale) * 100;

    const fit: SizeMatch['fit'] =
      deltaPct <= 1.5 ? 'perfect' : deltaPct <= 8 ? 'good' : 'crop';

    return { size, widthCm, heightCm, deltaPct, fit, cropLossPct };
  }).sort((a, b) => {
    // المطابقة أولًا، ثم الشهرة، ثم المساحة
    const fitRank = { perfect: 0, good: 1, crop: 2 } as const;
    if (fitRank[a.fit] !== fitRank[b.fit]) return fitRank[a.fit] - fitRank[b.fit];
    if (a.size.popularity !== b.size.popularity)
      return a.size.popularity - b.size.popularity;
    return a.widthCm * a.heightCm - b.widthCm * b.heightCm;
  });
}

/** أفضل مقاس مقترح فورًا عند فتح المحاكي. */
export function bestSizeFor(artAspect: number): SizeMatch {
  return matchSizes(artAspect)[0];
}

/** قياس الإطار الخارجي المقترح (قاعدة +5–8 سم). */
export function outerFrameCm(widthCm: number, heightCm: number, matCm = 6) {
  return {
    widthCm: +(widthCm + matCm * 2).toFixed(1),
    heightCm: +(heightCm + matCm * 2).toFixed(1),
  };
}

/**
 * دقة الطباعة الفعلية عند مقاس معيّن.
 * مهمة جدًّا لموقعك: معظم الملفات عرضها 400px فقط،
 * فلا يجوز وعد الزبون بمقاس 100 سم بجودة متحفية.
 */
export function printDpi(pixelWidth: number, widthCm: number) {
  return Math.round(pixelWidth / cmToIn(widthCm));
}

export type PrintQuality = 'museum' | 'excellent' | 'good' | 'acceptable' | 'low';

export function qualityForDpi(dpi: number): PrintQuality {
  if (dpi >= 300) return 'museum';
  if (dpi >= 200) return 'excellent';
  if (dpi >= 150) return 'good';
  if (dpi >= 100) return 'acceptable';
  return 'low';
}

/**
 * ملاحظة V4: نبرة التحذير أُزيلت عمدًا.
 * أرقام الـDPI هنا تصف ملف المعاينة على الـCDN، لا ملف الطباعة النهائي،
 * لأن الاستوديو يرفع دقّة الملف الأصلي يدويًّا بعد تأكيد الطلب.
 * الحقول محفوظة كي لا ينكسر أي مستورد، والنبرة صارت محايدة دائمًا.
 */
export const QUALITY_META: Record<
  PrintQuality,
  { label: string; hint: string; tone: 'ok' | 'warn' | 'bad' }
> = {
  museum:     { label: 'Museum giclée',   hint: 'Printed from the archival master file.', tone: 'ok' },
  excellent:  { label: 'Museum giclée',   hint: 'Printed from the archival master file.', tone: 'ok' },
  good:       { label: 'Museum giclée',   hint: 'Printed from the archival master file.', tone: 'ok' },
  acceptable: { label: 'Museum giclée',   hint: 'Printed from the archival master file.', tone: 'ok' },
  low:        { label: 'Museum giclée',   hint: 'Printed from the archival master file.', tone: 'ok' },
};

/** تسعير خطّي بالمساحة مع حدّ أدنى/أقصى — متوافق مع منطق الأسعار الحالي. */
export function priceForSize(
  basePrice: number,
  baseWidthCm: number,
  baseHeightCm: number,
  widthCm: number,
  heightCm: number,
) {
  const baseArea = Math.max(1, baseWidthCm * baseHeightCm);
  const area = widthCm * heightCm;
  const raw = basePrice * (0.45 + 0.55 * (area / baseArea));
  return Math.min(9800, Math.max(950, Math.round(raw / 50) * 50));
}

/**
 * حارس تطويري: يعمل في وضع التطوير فقط ولا يدخل حزمة الإنتاج.
 *
 * الثابتان اللذان يحرسهما:
 *  1. المعرّفات فريدة — المعرّف المكرّر يجعل `find` يرجع الأول دائمًا فيتعذّر اختيار الثاني.
 *  2. كل مقاس مخزّن عموديًا — `orientSize` تفترض ذلك، ودخول مقاس أفقي يقلب المطابقة كلها.
 */
if (import.meta.env?.DEV) {
  const seen = new Set<string>();
  for (const s of PRINT_SIZES) {
    if (seen.has(s.id)) {
      throw new Error(`[printSizes] duplicate id: ${s.id}`);
    }
    seen.add(s.id);
    if (s.widthCm > s.heightCm) {
      throw new Error(
        `[printSizes] ${s.id} is stored landscape (${s.widthCm}×${s.heightCm}); ` +
          'every entry must be portrait — orientSize() flips it at read time.',
      );
    }
  }
}
