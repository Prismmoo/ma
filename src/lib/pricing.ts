import type { Painting, SizeCategory } from '../types';

export const CURRENCY = 'dh' as const;

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/**
 * 1590 -> "1 590 dh"
 * Uses a narrow no-break space, the Moroccan and French thousands separator.
 * Never a decimal: nobody quotes centimes for artwork.
 */
export function formatMAD(amount: number): string {
  const rounded = Math.round(amount);
  const grouped = rounded.toLocaleString('fr-MA', { maximumFractionDigits: 0 });
  // fr-MA emits U+202F; normalise it so it never renders as a tofu box.
  return `${grouped.replace(/\u202f|\u00a0/g, '\u2009')} ${CURRENCY}`;
}

/** "+290 dh" for add-ons, "Included" for zero. */
export function formatAddOn(amount: number, includedLabel = 'Included'): string {
  return amount === 0 ? includedLabel : `+${formatMAD(amount)}`;
}

/* ------------------------------------------------------------------ */
/* Artwork                                                             */
/* ------------------------------------------------------------------ */

export const SIZE_PRICE_MAD: Record<string, number> = {
  xs: 390,
  s: 590,
  m: 990,
  l: 1590,
  xl: 2490,
  xxl: 3490,
};

export type FinishId = 'matte' | 'resin' | 'oil';

export const FINISH_MULTIPLIER: Record<FinishId, number> = {
  matte: 1.0,
  resin: 1.35,
  oil: 1.6,
};

export const FINISH_LABEL: Record<FinishId, string> = {
  matte: 'Matte Giclée Print',
  resin: 'Epoxy Resin Glass Coat',
  oil: 'Hand-Retouched Oil Varnish',
};

/** Maps real centimetres onto the ladder, so a new size never crashes. */
export function sizeCodeFor(widthCm: number, heightCm: number): string {
  const area = widthCm * heightCm;
  if (area <= 700) return 'xs';    //  21×30 = 630
  if (area <= 1300) return 's';    //  30×40 = 1200
  if (area <= 2600) return 'm';    //  40×60 = 2400
  if (area <= 5000) return 'l';    //  60×80 = 4800
  if (area <= 10000) return 'xl';  //  80×120 = 9600
  return 'xxl';
}

export function paintingPriceMAD(
  painting: Pick<Painting, 'widthCm' | 'heightCm'>,
  finish: FinishId = 'resin'
): number {
  const base = SIZE_PRICE_MAD[sizeCodeFor(painting.widthCm, painting.heightCm)] ?? 990;
  return roundTo(base * FINISH_MULTIPLIER[finish], 10);
}

/**
 * مراسي السعر بالمساحة: [سم², درهم قبل معامل التشطيب].
 *
 * القيم مأخوذة حرفيًا من SIZE_PRICE_MAD عند المساحة التي تمثّلها كل درجة،
 * فلا يتغيّر مستوى الأسعار — يتغيّر فقط ما يحدث **بين** الدرجات.
 * الدرجات الستّ كانت مقبولة حين كانت المقاسات معدودة؛ مع مقاس متصل بالسحب
 * تصبح قفزة ٥٧٪ في السعر مقابل ١٦٪ في المساحة خطأً يراه الزبون بعينيه.
 */
export const AREA_PRICE_ANCHORS: Array<[number, number]> = [
  [100, 190],
  [630, 390],
  [1200, 590],
  [2400, 990],
  [4800, 1590],
  [9600, 2490],
  [20000, 3490],
  [40000, 5900],
];

/**
 * سعر متصل بالمساحة بالتداخل الخطّي بين المراسي.
 * تحت أول مرساة: سعر أول مرساة. فوق آخر مرساة: امتداد بآخر ميل، فلا
 * يصير السعر مستوٍ أفقيًا عند المقاسات الضخمة كما كان مع 'xxl'.
 */
export function areaPriceMAD(areaCm2: number): number {
  const a = Math.max(1, areaCm2);
  const A = AREA_PRICE_ANCHORS;

  if (a <= A[0][0]) return A[0][1];

  for (let i = 0; i < A.length - 1; i += 1) {
    const [a0, p0] = A[i];
    const [a1, p1] = A[i + 1];
    if (a <= a1) {
      const t = (a - a0) / (a1 - a0);
      return p0 + t * (p1 - p0);
    }
  }

  const [aN1, pN1] = A[A.length - 2];
  const [aN, pN] = A[A.length - 1];
  const slope = (pN - pN1) / (aN - aN1);
  return pN + (a - aN) * slope;
}

/**
 * سعر اللوحة بمقاس حرّ.
 * يُستعمل في المحاكي وحده، حيث يملك المستخدم أن يختار أي مقاس.
 */
export function paintingPriceContinuousMAD(
  size: { widthCm: number; heightCm: number },
  finish: FinishId = 'resin',
): number {
  const base = areaPriceMAD(size.widthCm * size.heightCm);
  return roundTo(base * FINISH_MULTIPLIER[finish], 10);
}

/* ------------------------------------------------------------------ */
/* Stickers                                                            */
/* ------------------------------------------------------------------ */

export const STICKER_BASE_MAD = 29;
export const STICKER_FLOOR_MAD = 25;
const STICKER_REFERENCE_AREA = 64; // 8×8 cm

export const STICKER_FINISH_MULTIPLIER: Record<string, number> = {
  'matte-vinyl': 1.0,
  'high-gloss': 1.1,
  'chrome-silver': 1.25,
  'holographic-prism': 1.35,
};

export function stickerPriceMAD(widthCm: number, heightCm: number, finishId: string): number {
  const areaFactor = Math.min(1.6, (widthCm * heightCm) / STICKER_REFERENCE_AREA);
  const finish = STICKER_FINISH_MULTIPLIER[finishId] ?? 1;
  return Math.max(STICKER_FLOOR_MAD, roundTo(STICKER_BASE_MAD * areaFactor * finish, 1));
}

/* ------------------------------------------------------------------ */
/* Framing and personalization                                         */
/* ------------------------------------------------------------------ */

export const FRAME_PRICE_MAD: Record<string, number> = {
  'fr-00': 0,
  'fr-02': 240,
  'fr-01': 290,
  'fr-03': 420,
};

export const PERSONALIZATION_MAD = {
  text: 90,
  drawing: 130,
  signature: 70,
} as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Prices ending in 90 read as considered rather than arbitrary. */
export function charmPrice(value: number): number {
  if (value < 100) return roundTo(value, 1);
  const base = Math.floor(value / 100) * 100;
  return base + 90 >= value - 40 ? base + 90 : base + 190;
}
