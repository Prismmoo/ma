/**
 * توليد مقاسات الصور عند الطلب (on-demand) داخل المتصفح.
 *
 * لا يُستدعى إلا من المحاكي، ولا يُنفّذ أي عمل إلا إذا كان مفيدًا فعلًا.
 * لا يُستورد في أي ملف آخر حتى لا يدخل في حزمة الصفحة الرئيسية.
 */

export type SrcSetEntry = { url: string; width: number };

/** يفكّ srcSet إلى قائمة مرتّبة تصاعديًا. مقاوم للمدخلات الرديئة. */
export function parseSrcSet(srcSet?: string | null): SrcSetEntry[] {
  if (!srcSet) return [];
  return srcSet
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, w] = part.split(/\s+/);
      const width = w && w.endsWith('w') ? parseInt(w.slice(0, -1), 10) : NaN;
      return { url, width };
    })
    .filter((e) => !!e.url && Number.isFinite(e.width))
    .sort((a, b) => a.width - b.width);
}

/**
 * L1 — أفضل مصدر متاح من الـ CDN لعرض مطلوب.
 * يختار أصغر عرض يساوي أو يتجاوز المطلوب؛ وإلا فأكبر متاح.
 * لا يخترع روابط أبدًا.
 */
export function pickCdnSource(
  fallbackSrc: string,
  srcSet: string | null | undefined,
  neededPx: number,
): { url: string; width: number } {
  const entries = parseSrcSet(srcSet);
  if (entries.length === 0) return { url: fallbackSrc, width: 0 };
  const hit = entries.find((e) => e.width >= neededPx);
  const chosen = hit ?? entries[entries.length - 1];
  return { url: chosen.url, width: chosen.width };
}

/* ────────── L3: ذاكرة LRU مع تحرير صريح ──────── */
const MAX_CACHE = 16;
const cache = new Map<string, string>(); // key -> objectURL
const inFlight = new Map<string, Promise<string>>();

function remember(key: string, objectUrl: string) {
  cache.set(key, objectUrl);
  while (cache.size > MAX_CACHE) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    const oldUrl = cache.get(oldestKey);
    cache.delete(oldestKey);
    if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
  }
}

/** تنظيف كامل — استدعِها عند unmount للمحاكي. */
export function clearVariantCache() {
  for (const url of cache.values()) {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
  cache.clear();
  inFlight.clear();
}

function canGenerate(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof createImageBitmap === 'function' &&
    typeof OffscreenCanvas !== 'undefined'
  );
}

export type LiveVariant = {
  /** الرابط الذي يجب وضعه في src */
  url: string;
  /** العرض الفعلي بالبكسل للرابط المُعاد */
  width: number;
  /** هل نتج عن تكبير تركيبي؟ (لإظهار شارة صريحة للمستخدم) */
  synthetic: boolean;
  /** العرض الأقصى الحقيقي المتاح من المصدر */
  sourceWidth: number;
};

/**
 * L2 — يولّد مقاسًا محدّدًا لحظيًا.
 *
 * القواعد:
 *  - إن كان المصدر يكفي (±2%) → لا عمل إطلاقًا، أعِد رابط الـ CDN.
 *  - التكبير محدود بـ 3× المصدر وبسقف 2400px و 8 مليون بكسل.
 *  - التكبير تدريجي (×1.6 في كل خطوة) لأن الخطوة الواحدة الكبيرة تعطي تشوّشًا.
 *  - أي فشل → الرجوع لرابط الـ CDN. لا يُرمى خطأ للواجهة أبدًا.
 */
export async function getLiveVariant(args: {
  src: string;
  srcSet?: string | null;
  targetWidth: number;
  dpr?: number;
  quality?: number;
}): Promise<LiveVariant> {
  const dpr = Math.min(args.dpr ?? (window.devicePixelRatio || 1), 3);
  const wanted = Math.round(args.targetWidth * dpr);
  const base = pickCdnSource(args.src, args.srcSet, wanted);

  const sourceWidth = base.width || 0;

  // المصدر يكفي → لا عمل
  if (!sourceWidth || wanted <= sourceWidth * 1.02 || !canGenerate()) {
    return { url: base.url, width: sourceWidth || wanted, synthetic: false, sourceWidth };
  }

  const capped = Math.min(wanted, sourceWidth * 3, 2400);
  if (capped <= sourceWidth * 1.02) {
    return { url: base.url, width: sourceWidth, synthetic: false, sourceWidth };
  }

  const key = `${base.url}@${Math.round(capped)}`;
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached); // تحديث ترتيب LRU
    return { url: cached, width: capped, synthetic: true, sourceWidth };
  }

  const pending = inFlight.get(key);
  if (pending) {
    const url = await pending;
    return { url, width: capped, synthetic: url.startsWith('blob:'), sourceWidth };
  }

  const job = (async () => {
    try {
      const res = await fetch(base.url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const bitmap = await createImageBitmap(blob);

      let curW = bitmap.width;
      let curH = bitmap.height;
      let canvas = new OffscreenCanvas(curW, curH);
      let ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close?.();

      const ratio = curH / curW;

      // تكبير تدريجي ×1.6 حتى الهدف
      while (curW < capped) {
        const nextW = Math.min(capped, Math.round(curW * 1.6));
        const nextH = Math.round(nextW * ratio);
        if (nextW * nextH > 8_000_000) break;
        const next = new OffscreenCanvas(nextW, nextH);
        const nctx = next.getContext('2d');
        if (!nctx) break;
        nctx.imageSmoothingEnabled = true;
        nctx.imageSmoothingQuality = 'high';
        nctx.drawImage(canvas, 0, 0, nextW, nextH);
        canvas = next;
        ctx = nctx;
        curW = nextW;
        curH = nextH;
      }

      const out = await canvas.convertToBlob({
        type: 'image/webp',
        quality: args.quality ?? 0.9,
      });
      const objectUrl = URL.createObjectURL(out);
      remember(key, objectUrl);
      return objectUrl;
    } catch {
      // أي فشل (CORS ، ذاكرة ، متصفح قديم) → الرجوع للرابط الأصلي
      return base.url;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, job);
  const url = await job;
  return {
    url,
    width: url.startsWith('blob:') ? capped : sourceWidth,
    synthetic: url.startsWith('blob:'),
    sourceWidth,
  };
}
