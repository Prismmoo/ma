/**
 * رياضيات المقاسات — وحدة نقية بلا React وبلا DOM.
 *
 * كل ما هنا دالة من مدخلاتها إلى مخرجاتها، فيمكن اختباره بلا متصفح.
 * ممنوع منعًا باتًّا استيراد أي ثابت هندسي من الواجهة (مثل STAGE_ASPECT):
 * وحدات هذا الملف هي السنتيمتر والنِّسب المجرّدة فقط، وتحويل البكسل إلى
 * سنتيمتر مسؤولية المستدعي وحده.
 */

/* ─────────────────────────── الحدود ─────────────────────────── */

/** أصغر ضلع مسموح به. أقل من ذلك لا يُطبع بجودة معروضة. */
export const MIN_SIDE_CM = 10;
/** أكبر ضلع مسموح به — حدّ عرض آلة الطباعة العريضة. */
export const MAX_SIDE_CM = 300;
/** أكبر مساحة مسموح بها = 200×200. يمنع 300×300 المستحيلة إنتاجيًّا. */
export const MAX_AREA_CM2 = 40000;
/** خطوة التدوير: نصف سنتيمتر. أدق من ذلك وهمٌ لا تنتجه الطباعة. */
export const STEP_CM = 0.5;

/* ─────────────────────────── الشكل والنسبة ─────────────────────────── */

export type SizeShape = 'square' | 'classic' | 'tall' | 'panorama';

export const SHAPE_LABELS: Record<SizeShape, string> = {
  square: 'Square',
  classic: 'Classic rectangle',
  tall: 'Tall rectangle',
  panorama: 'Panoramic',
};

/**
 * يصنّف المقاس بحسب نسبته الطويلة/القصيرة، بغضّ النظر عن الاتجاه.
 * 30×40 و40×30 كلاهما 'classic' — لأن المشتري يفكّر بالشكل لا بالاتجاه.
 */
export function shapeOf(widthCm: number, heightCm: number): SizeShape {
  const w = Math.max(1e-6, Math.min(widthCm, heightCm));
  const h = Math.max(1e-6, Math.max(widthCm, heightCm));
  const r = h / w;
  if (r <= 1.03) return 'square';
  if (r <= 1.45) return 'classic';
  if (r <= 2.05) return 'tall';
  return 'panorama';
}

/** النِّسب المسمّاة، مرتّبة تصاعديًّا. */
const NAMED_RATIOS: Array<{ r: number; label: string }> = [
  { r: 1, label: '1:1' },
  { r: 5 / 4, label: '5:4' },
  { r: 4 / 3, label: '4:3' },
  { r: 7 / 5, label: '7:5' },
  { r: Math.SQRT2, label: 'ISO 1:1.41' },
  { r: 3 / 2, label: '3:2' },
  { r: 16 / 9, label: '16:9' },
  { r: 2, label: '2:1' },
  { r: 5 / 2, label: '5:2' },
  { r: 3, label: '3:1' },
];

/**
 * يسمّي النسبة إن كانت قريبة من نسبة مشهورة (٣٪)، وإلا يعرضها رقمًا.
 * لماذا التسامح ٣٪؟ لأن 30×40 نسبتها 1.3333 بينما 24×30 نسبتها 1.25،
 * والفارق بينهما ٦٪ — فتسامح ٣٪ يفصلهما ولا يخلط بينهما.
 */
export function ratioLabel(widthCm: number, heightCm: number): string {
  const w = Math.max(1e-6, Math.min(widthCm, heightCm));
  const h = Math.max(1e-6, Math.max(widthCm, heightCm));
  const r = h / w;
  let best = NAMED_RATIOS[0];
  let bestErr = Infinity;
  for (const c of NAMED_RATIOS) {
    const err = Math.abs(c.r - r) / r;
    if (err < bestErr) {
      bestErr = err;
      best = c;
    }
  }
  return bestErr <= 0.03 ? best.label : `${r.toFixed(2)}:1`;
}

/* ─────────────────────────── التطبيع ─────────────────────────── */

export type SizeCm = { widthCm: number; heightCm: number };

export const clampSide = (v: number) =>
  Math.min(MAX_SIDE_CM, Math.max(MIN_SIDE_CM, v));

export const snapStep = (v: number) => Math.round(v / STEP_CM) * STEP_CM;

/**
 * يضبط مقاسًا خامًا داخل كل الحدود.
 *
 * ترتيب العمليات مقصود: نقصّ الأضلاع أولًا، ثم نعالج تجاوز المساحة
 * بتقليص **الضلعين معًا** بجذر النسبة — لا بقصّ ضلع واحد — كي تبقى
 * النسبة التي اختارها المستخدم كما هي عند بلوغ السقف.
 *
 * hitLimit يخبر الواجهة أن تُظهر أن هناك حدًّا قد بلغ، فلا يظنّ المستخدم
 * أن السحب تعطّل.
 */
export function normalizeSize(raw: SizeCm): { size: SizeCm; hitLimit: boolean } {
  let w = clampSide(raw.widthCm);
  let h = clampSide(raw.heightCm);
  let hitLimit =
    Math.abs(w - raw.widthCm) > 1e-6 || Math.abs(h - raw.heightCm) > 1e-6;

  const area = w * h;
  if (area > MAX_AREA_CM2) {
    const k = Math.sqrt(MAX_AREA_CM2 / area);
    w = clampSide(w * k);
    h = clampSide(h * k);
    hitLimit = true;
  }

  return {
    size: { widthCm: snapStep(w), heightCm: snapStep(h) },
    hitLimit,
  };
}

/* ─────────────────────────── التحجيم بالمقابض ─────────────────────────── */

export type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';

/** اتجاه تأثير المقبض على العرض: شرق +1، غرب −1، وإلا لا أثر. */
export const SIGN_X: Record<ResizeHandle, number> = {
  nw: -1, ne: 1, se: 1, sw: -1, n: 0, s: 0, e: 1, w: -1,
};

/** اتجاه تأثير المقبض على الارتفاع: جنوب +1، شمال −1، وإلا لا أثر. */
export const SIGN_Y: Record<ResizeHandle, number> = {
  nw: -1, ne: -1, se: 1, sw: 1, n: -1, s: 1, e: 0, w: 0,
};

export type ResizeResult = {
  size: SizeCm;
  hitLimit: boolean;
  /**
   * كم يجب أن يزحف مركز اللوحة (بالسنتيمتر) كي تبقى الحافة المقابلة
   * مثبّتة في مكانها. هذا ما يجعل السحب يبدو طبيعيًّا: الحافة التي
   * لا يمسكها الإصبع لا تتحرك أبدًا.
   */
  centerShiftXCm: number;
  centerShiftYCm: number;
};

/**
 * يحسب المقاس الجديد من إزاحة المؤشّر.
 *
 * dxCm و dyCm هما ما قطعه المؤشّر منذ الضغط، **بعد** أن يكون المستدعي قد
 * حوّلهما إلى سنتيمترات وأزال عنهما دوران اللوحة.
 *
 * ثلاث خصائص تميّز هذا الحساب عمّا كان في الموقع:
 *  • الحافة المقابلة ثابتة (لا مضاعفة من المركز).
 *  • مقابض الأركان تحرّك البعدين معًا.
 *  • عند قفل النسبة يقود المحور الأكبر إزاحةً، فلا ترتجف اللوحة.
 */
export function resizeFromHandle(args: {
  handle: ResizeHandle;
  startW: number;
  startH: number;
  dxCm: number;
  dyCm: number;
  lockRatio: boolean;
}): ResizeResult {
  const { handle, startW, startH, dxCm, dyCm, lockRatio } = args;
  const sx = SIGN_X[handle];
  const sy = SIGN_Y[handle];

  const growW = sx * dxCm;
  const growH = sy * dyCm;

  let rawW = startW + growW;
  let rawH = startH + growH;

  if (lockRatio) {
    const ratio = startH / Math.max(1e-6, startW);
    // المحور صاحب الإزاحة الأكبر يقود، والآخر يتبعه — وإلا اهتزّ المقاس
    // بين حسابين متنافسين في كل إطار.
    if (sx !== 0 && (sy === 0 || Math.abs(growW) >= Math.abs(growH))) {
      rawH = rawW * ratio;
    } else if (sy !== 0) {
      rawW = rawH / Math.max(1e-6, ratio);
    }
  }

  const { size, hitLimit } = normalizeSize({ widthCm: rawW, heightCm: rawH });

  return {
    size,
    hitLimit,
    centerShiftXCm: (sx * (size.widthCm - startW)) / 2,
    centerShiftYCm: (sy * (size.heightCm - startH)) / 2,
  };
}

/**
 * قرص بإصبعين: يحافظ على النسبة دائمًا، لأن إصبعين لا يعبّران عن نيّة
 * تغيير بُعد واحد دون الآخر.
 */
export function resizeFromPinch(start: SizeCm, factor: number): ResizeResult {
  const k = Math.min(10, Math.max(0.1, factor));
  const { size, hitLimit } = normalizeSize({
    widthCm: start.widthCm * k,
    heightCm: start.heightCm * k,
  });
  return { size, hitLimit, centerShiftXCm: 0, centerShiftYCm: 0 };
}

/* ─────────────────────────── الملاءمة ─────────────────────────── */

export type FitMode = 'cover' | 'contain' | 'extend';

export const FIT_LABELS: Record<FitMode, string> = {
  cover: 'Fill the format',
  contain: 'Whole artwork',
  extend: 'Whole artwork, extended',
};

export const FIT_HINTS: Record<FitMode, string> = {
  cover: 'The print is filled edge to edge. Part of the artwork is cropped away.',
  contain: 'Nothing is cropped. Plain margins appear on two sides.',
  extend: 'Nothing is cropped. The studio extends the background to fill the format.',
};

export type FitResult = {
  /** ما يُمرَّر فعلًا إلى CSS. 'extend' يُرسم بـ contain فوق خلفية ممتدّة. */
  objectFit: 'cover' | 'contain';
  /** نسبة ما سيُقتطع من العمل عند الملء. */
  cropLossPct: number;
  /** نسبة الهامش الفارغ عند الاحتواء. */
  padPct: number;
  note: string;
};

/**
 * artAspect = ارتفاع العمل ÷ عرضه (كما يحسبها VisualizerView من naturalWidth/Height).
 */
export function fitFor(
  artAspect: number,
  targetWidthCm: number,
  targetHeightCm: number,
  mode: FitMode,
): FitResult {
  const target = targetHeightCm / Math.max(1e-6, targetWidthCm);
  const art = Math.max(1e-6, artAspect);
  const k = Math.max(target / art, art / target);
  const lossPct = (1 - 1 / k) * 100;

  if (mode === 'cover') {
    return {
      objectFit: 'cover',
      cropLossPct: lossPct,
      padPct: 0,
      note:
        lossPct < 0.5
          ? 'Exact ratio — nothing is cropped.'
          : `About ${lossPct.toFixed(0)}% of the artwork is cropped.`,
    };
  }

  return {
    objectFit: 'contain',
    cropLossPct: 0,
    padPct: lossPct,
    note:
      lossPct < 0.5
        ? 'Exact ratio — no margin needed.'
        : mode === 'extend'
          ? `The background is extended over about ${lossPct.toFixed(0)}% of the format.`
          : `About ${lossPct.toFixed(0)}% of the format is plain margin.`,
  };
}

/* ─────────────────────────── الجودة والمطابقة ─────────────────────────── */

/** دقّة الطباعة الفعلية. 0 حين لا نعرف عرض الملف بالبكسل. */
export function dpiFor(pixelWidth: number, widthCm: number): number {
  if (!pixelWidth || !widthCm) return 0;
  return Math.round(pixelWidth / (widthCm / 2.54));
}

export type NearestStandard<T> = { entry: T; deltaPct: number } | null;

/**
 * أقرب مقاس معياري لمقاس حرّ، مع تجربة الاتجاهين.
 * تُستعمل لإخبار المستخدم «هذا تقريبًا A2» بدل تركه أمام رقمين مجرّدين.
 */
export function nearestStandard<
  T extends { widthCm: number; heightCm: number },
>(entries: T[], widthCm: number, heightCm: number, tolerancePct = 6): NearestStandard<T> {
  let best: NearestStandard<T> = null;
  for (const e of entries) {
    for (const [w, h] of [
      [e.widthCm, e.heightCm],
      [e.heightCm, e.widthCm],
    ]) {
      const d =
        (Math.abs(w - widthCm) / Math.max(1e-6, widthCm) +
          Math.abs(h - heightCm) / Math.max(1e-6, heightCm)) *
        50;
      if (d <= tolerancePct && (best === null || d < best.deltaPct)) {
        best = { entry: e, deltaPct: d };
      }
    }
  }
  return best;
}
