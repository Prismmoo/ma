/* =========================================================================
 *  PRISM — وحدات قياس الملصقات (px · cm · mm)
 *  مصدر الحقيقة الوحيد للتحويل بين الوحدات.
 *  لا يعتمد على React — منطق خالص قابل للاختبار.
 *
 *  لماذا ملف جديد وليس printSizes.ts؟
 *  printSizes.ts يعرف cm ↔ inch فقط (cmToIn) ولا يعرف أي ثابت PPI،
 *  وهو مخصص لمقاسات الطباعة الجاهزة للوحات. الملصقات تحتاج
 *  محور px حقيقيًا. نفس الثابت 2.54 مستعمل في الملفين حتى لا يتعارضا.
 * ========================================================================= */

export type LengthUnit = 'px' | 'cm' | 'mm';

/**
 * معيار CSS: 1in = 96px. لا يوجد في المشروع أي ثابت PPI سابق
 * (printSizes.ts يحسب DPI من بيانات الصورة ولا يثبته)،
 * فاعتمدنا 96 PPI ووثّقناه هنا كمصدر وحيد.
 */
export const STICKER_PPI = 96;

export const CM_PER_INCH = 2.54;
export const MM_PER_CM = 10;

/* Only centimetres are exposed in the product UI. Millimetres and pixels
 * remain in the type and in the conversion helpers because the rendering
 * pipeline and the price engine still think in pixels at STICKER_PPI. */
export const UNITS: LengthUnit[] = ['cm'];
export const DEFAULT_UNIT: LengthUnit = 'cm';

/** تسميات لا لبس فيها — تُستعمل في aria-label وفي الواجهة. */
export const UNIT_LABELS: Record<LengthUnit, string> = {
  px: 'Pixels (px)',
  cm: 'Centimetres (cm)',
  mm: 'Millimetres (mm)',
};

export const UNIT_SUFFIX: Record<LengthUnit, string> = { px: 'px', cm: 'cm', mm: 'mm' };

/** دقة العرض فقط — التخزين يبقى غير مدوّر. */
export const UNIT_DECIMALS: Record<LengthUnit, number> = { px: 0, cm: 2, mm: 1 };

/** خطوة حقل الإدخال وأزرار لوحة المفاتيح. */
export const UNIT_STEP: Record<LengthUnit, number> = { px: 1, cm: 0.1, mm: 1 };

/* ════════ الصيغ الأساسية ════════ */

export function pixelsToInches(pixels: number, ppi: number = STICKER_PPI): number {
  return pixels / ppi;
}

export function inchesToPixels(inches: number, ppi: number = STICKER_PPI): number {
  return inches * ppi;
}

export function inchesToCentimetres(inches: number): number {
  return inches * CM_PER_INCH;
}

export function centimetresToInches(cm: number): number {
  return cm / CM_PER_INCH;
}

export function centimetresToMillimetres(cm: number): number {
  return cm * MM_PER_CM;
}

export function millimetresToCentimetres(mm: number): number {
  return mm / MM_PER_CM;
}

export function pixelsToCentimetres(pixels: number, ppi: number = STICKER_PPI): number {
  return inchesToCentimetres(pixelsToInches(pixels, ppi));
}

export function centimetresToPixels(cm: number, ppi: number = STICKER_PPI): number {
  return inchesToPixels(centimetresToInches(cm), ppi);
}

export function pixelsToMillimetres(pixels: number, ppi: number = STICKER_PPI): number {
  return centimetresToMillimetres(pixelsToCentimetres(pixels, ppi));
}

export function millimetresToPixels(mm: number, ppi: number = STICKER_PPI): number {
  return centimetresToPixels(millimetresToCentimetres(mm), ppi);
}

/**
 * النظام الداخلي الوحيد للإحداثيات هو px عند STICKER_PPI.
 * كل تحويل يمر من هنا — لا تكتب تحويلًا يدويًا في المكوّنات.
 */
export function fromPixels(pixels: number, unit: LengthUnit, ppi: number = STICKER_PPI): number {
  if (unit === 'px') return pixels;
  if (unit === 'cm') return pixelsToCentimetres(pixels, ppi);
  return pixelsToMillimetres(pixels, ppi);
}

export function toPixels(value: number, unit: LengthUnit, ppi: number = STICKER_PPI): number {
  if (unit === 'px') return value;
  if (unit === 'cm') return centimetresToPixels(value, ppi);
  return millimetresToPixels(value, ppi);
}

/** تحويل مباشر بين وحدتين عبر المحور الداخلي. */
export function convertLength(
  value: number,
  from: LengthUnit,
  to: LengthUnit,
  ppi: number = STICKER_PPI,
): number {
  if (from === to) return value;
  return fromPixels(toPixels(value, from, ppi), to, ppi);
}

/* ════════ الحدود والتحقق ════════ */

/** حدود إنتاجية واقعية للقطع بالليزر: من 1سم إلى 60سم. */
export const MIN_STICKER_CM = 1;
export const MAX_STICKER_CM = 60;

export const MIN_STICKER_PX = centimetresToPixels(MIN_STICKER_CM);
export const MAX_STICKER_PX = centimetresToPixels(MAX_STICKER_CM);

export type DimensionErrorCode =
  | 'empty'
  | 'not-a-number'
  | 'not-finite'
  | 'too-small'
  | 'too-large';

export interface DimensionParseResult {
  ok: boolean;
  /** القيمة القانونية غير المدوّرة بالبكسل. محدّدة دائمًا عند ok. */
  pixels: number | null;
  code: DimensionErrorCode | null;
  message: string | null;
}

export function clampPixels(pixels: number): number {
  if (pixels < MIN_STICKER_PX) return MIN_STICKER_PX;
  if (pixels > MAX_STICKER_PX) return MAX_STICKER_PX;
  return pixels;
}

/**
 * يحوّل مدخل نصي خام إلى بكسلات مع رسالة خطأ مفهومة للإنسان.
 * يغطي: فارغ، نص غير رقمي، صفر، سالب، Infinity، NaN، خارج المدى.
 */
export function parseDimension(raw: string | number, unit: LengthUnit): DimensionParseResult {
  const text = typeof raw === 'number' ? String(raw) : raw.trim();

  if (text.length === 0) {
    return { ok: false, pixels: null, code: 'empty', message: 'Enter a size.' };
  }

  const normalised = text.replace(',', '.');
  const value = Number(normalised);

  if (Number.isNaN(value)) {
    return { ok: false, pixels: null, code: 'not-a-number', message: 'Use digits only, for example 10.5.' };
  }

  if (!Number.isFinite(value)) {
    return { ok: false, pixels: null, code: 'not-finite', message: 'That size is not a finite number.' };
  }

  const pixels = toPixels(value, unit);

  if (pixels < MIN_STICKER_PX) {
    return {
      ok: false,
      pixels: null,
      code: 'too-small',
      message: 'Minimum size is ' + formatLength(MIN_STICKER_PX, unit) + '.',
    };
  }

  if (pixels > MAX_STICKER_PX) {
    return {
      ok: false,
      pixels: null,
      code: 'too-large',
      message: 'Maximum size is ' + formatLength(MAX_STICKER_PX, unit) + '.',
    };
  }

  return { ok: true, pixels, code: null, message: null };
}

/** تدوير للعرض فقط. لا تستعمل الناتج في أي حساب لاحق. */
export function displayValue(pixels: number, unit: LengthUnit): number {
  const value = fromPixels(pixels, unit);
  const decimals = UNIT_DECIMALS[unit];
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** نص مقروء مثل "10.16 cm". */
export function formatLength(pixels: number, unit: LengthUnit): string {
  return displayValue(pixels, unit).toFixed(UNIT_DECIMALS[unit]) + ' ' + UNIT_SUFFIX[unit];
}

/** "10.16 × 10.16 cm" — يُستعمل في السلة وفي رسالة الطلب. */
export function formatSize(widthPx: number, heightPx: number, unit: LengthUnit): string {
  return (
    displayValue(widthPx, unit).toFixed(UNIT_DECIMALS[unit]) +
    ' × ' +
    displayValue(heightPx, unit).toFixed(UNIT_DECIMALS[unit]) +
    ' ' +
    UNIT_SUFFIX[unit]
  );
}

/** مساحة بالسنتيمتر المربع — أساس تسعير المقاس. */
export function areaCm2(widthPx: number, heightPx: number): number {
  return pixelsToCentimetres(widthPx) * pixelsToCentimetres(heightPx);
}

/** مقاسات جاهزة تطابق المقاسات الثلاثة التي كانت معروضة قبل هذا التغيير. */
export const STICKER_PRESETS_CM: Array<{ id: string; label: string; widthCm: number; heightCm: number }> = [
  { id: 'standard',  label: 'Standard',  widthCm: 6,  heightCm: 6 },
  { id: 'large',     label: 'Large',     widthCm: 10, heightCm: 10 },
  { id: 'collector', label: 'Collector', widthCm: 15, heightCm: 15 },
];

export const DEFAULT_STICKER_WIDTH_PX = centimetresToPixels(6);
export const DEFAULT_STICKER_HEIGHT_PX = centimetresToPixels(6);
