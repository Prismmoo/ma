/**
 * ذاكرة تنقّل قصيرة الأجل.
 *
 * لماذا sessionStorage وليس localStorage:
 *   موضع التمرير والمجموعة المفتوحة معنى لهما داخل جلسة التصفّح فقط.
 *   localStorage كان سيُعيد موقع تمرير عمره ثلاثة أيام، ويتسرّب بين الألسنة
 *   فيتقاتل لسانان مفتوحان على نفس المفتاح. sessionStorage يموت مع اللسان — وهو المطلوب.
 *
 * لماذا طبقة Map في الذاكرة فوقه:
 *   القراءة والكتابة في sessionStorage متزامنتان وتوقِفان الخيط الرئيسي،
 *   وحدث التمرير ينطلق عشرات المرات في الثانية.
 *
 * لماذا قيم قياسية فقط:
 *   ممنوع تمامًا تخزين أي dataURL أو صورة أو كائن لوحة كامل.
 *   حصة sessionStorage حوالي 5MB، ولوحة واحدة مشفّرة base64 تأكلها.
 */

/*
 * v2 يضيف أربعة أشياء لم تكن في v1:
 *   ١. دفتر زيارات (visit ledger) يميز الرجوع من الدخول الجديد.
 *   ٢. حراسة قيم تنفّذ قاعدة «قياسية فقط» بدل أن ترجوها.
 *   ٣. إخراج تدريجي عند امتلاء الحصة بدل تدمير كل شيء.
 *   ٤. مرساة عنصر (anchor) بجانب الإزاحة البكسلية.
 *
 * لماذا مفتاح تخزين جديد وليس ترقية في المكان:
 *   مدخلات v1 لا تحمل دفتر زيارات، ومحاولة ترقيتها تعني كتابة كود مُهاجرة
 *   لمدة صلاحية 30 دقيقة. مفتاح جديد يجعل الموروث يموت وحده.
 */
const STORAGE_KEY = 'pz-nav-memory-v2';
const LEGACY_KEYS = ['pz-nav-memory-v1'];
const TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 60;          // رُفع من 40: مفاتيح المستويات والمراسي أكثر عددًا
const MAX_VALUE_CHARS = 512;     // أي قيمة أطول من هذا ليست حالة تنقّل
const WRITE_DEBOUNCE_MS = 250;

type Entry = { v: unknown; t: number };

let mem: Map<string, Entry> | null = null;
let flushTimer: number | undefined;

/*
 * دفتر الزيارات. يعيش في الذاكرة فقط ولا يُحفظ:
 * معناه «هل زرت هذا المفتاح من قبل في هذه الجلسة؟»، وإعادة تحميل الصفحة
 * يجب أن تُقرأ دخولًا جديدًا لا رجوعًا — وإلا قفز بك الموقع لموضع قديم
 * عند كل إنعاش، وهو أسوأ ما يمكن أن تفعله ذاكرة تنقل.
 */
const visited = new Set<string>();

function now(): number {
  return Date.now();
}

function load(): Map<string, Entry> {
  if (mem) return mem;
  mem = new Map();
  try {
    for (const k of LEGACY_KEYS) window.sessionStorage.removeItem(k);
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, Entry>;
      const t = now();
      for (const [k, e] of Object.entries(parsed)) {
        if (e && typeof e.t === 'number' && t - e.t < TTL_MS) mem.set(k, e);
      }
    }
  } catch {
    /* وضع التصفّح الخاص يرمي عند الوصول. الذاكرة وحدها تكفي. */
  }
  return mem;
}

function prune(map: Map<string, Entry>): void {
  const t = now();
  for (const [k, e] of map) {
    if (t - e.t >= TTL_MS) map.delete(k);
  }
  if (map.size <= MAX_ENTRIES) return;
  const byAge = [...map.entries()].sort((a, b) => a[1].t - b[1].t);
  for (let i = 0; i < byAge.length - MAX_ENTRIES; i += 1) map.delete(byAge[i][0]);
}

function scheduleFlush(): void {
  window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(flush, WRITE_DEBOUNCE_MS);
}

export function flush(): void {
  const map = load();
  prune(map);
  const write = () =>
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Object.fromEntries(map)),
    );
  try {
    write();
  } catch {
    /*
     * الحصة ممتلئة. النسخة الأولى كانت تمسح كل شيء — عقاب جماعي
     * على مدخل واحد مُسيء. نتخلّص من أقدم نصف ونعيد المحاولة مرة واحدة،
     * فيبقى موضع الصفحة الحالية — وهو الأغلى قيمة والأحدث دائمًا.
     */
    const byAge = [...map.entries()].sort((a, b) => a[1].t - b[1].t);
    for (let i = 0; i < Math.ceil(byAge.length / 2); i += 1) map.delete(byAge[i][0]);
    try {
      write();
    } catch {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* لا شيء أكبر نستطيع فعله. */
      }
    }
  }
}

/**
 * حراسة القيم: ترفض كل ما ليس حالة تنقّل.
 * هذا ليس دفاعًا عن المجهول؛ إنه دفاع عن خطأ متوقّع جدًا:
 * موقع فيه previewDataUrl وsignatureDataUrl وorderProofCache، وأول من يمرّر
 * أحدها هنا سيقتل الذاكرة كلها دفعة واحدة وبلا رسالة خطأ مفهومة.
 */
function isStorableValue(value: unknown): boolean {
  if (value === null) return true;
  const t = typeof value;
  if (t === 'string') return (value as string).length <= MAX_VALUE_CHARS;
  if (t === 'number' || t === 'boolean') return true;
  if (Array.isArray(value)) {
    return (
      value.length <= 32 &&
      value.every((v) => ['string', 'number', 'boolean'].includes(typeof v))
    );
  }
  return false;
}

export function remember(key: string, value: unknown): void {
  if (!isStorableValue(value)) {
    // eslint-disable-next-line no-console
    console.warn(
      '[nav-memory] قيمة مرفوضة — المسموح فقط أوليّات قصيرة. المفتاح:',
      key,
    );
    return;
  }
  const map = load();
  map.set(key, { v: value, t: now() });
  scheduleFlush();
}

export function recall<T>(key: string): T | undefined {
  const map = load();
  const e = map.get(key);
  if (!e) return undefined;
  if (now() - e.t >= TTL_MS) {
    map.delete(key);
    return undefined;
  }
  e.t = now();
  scheduleFlush();
  return e.v as T;
}

export function forget(prefix: string): void {
  const map = load();
  for (const k of [...map.keys()]) {
    if (k.startsWith(prefix)) map.delete(k);
  }
  scheduleFlush();
}

/**
 * هل هذا رجوع أم دخول جديد؟ تُستدعى مرة واحدة عند تركيب المستوى.
 * أول نداء لمفتاح ما يرجّع false ثم يسجّله؛ وكل نداء بعده يرجّع true.
 */
export function isReturnVisit(key: string): boolean {
  if (visited.has(key)) return true;
  visited.add(key);
  return false;
}

/** مسح دفتر الزيارات لمستوى معيّن: يستخدم عند إعادة التعيين الصريحة. */
export function resetVisit(prefix: string): void {
  for (const k of [...visited]) if (k.startsWith(prefix)) visited.delete(k);
}

export function installNavMemoryJanitor(): () => void {
  const onHide = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  const onPageHide = () => flush();
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', onPageHide);

  /*
   * تشخيص متاح في وحدة التحكم. بلا هذا تصير الذاكرة صندوقًا أسود
   * ويصبح تشخيص «لماذا رجعت لموضع غريب» تخمينًا محضًا.
   */
  (window as any).__prismNav = () => {
    const map = load();
    const t = now();
    return {
      entries: [...map.entries()]
        .sort((a, b) => b[1].t - a[1].t)
        .map(([k, e]) => ({ key: k, value: e.v, ageSec: Math.round((t - e.t) / 1000) })),
      count: map.size,
      maxEntries: MAX_ENTRIES,
      ttlMin: TTL_MS / 60000,
      visited: [...visited],
      bytes: (() => {
        try {
          return (window.sessionStorage.getItem(STORAGE_KEY) ?? '').length;
        } catch {
          return -1;
        }
      })(),
    };
  };

  return () => {
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', onPageHide);
  };
}
