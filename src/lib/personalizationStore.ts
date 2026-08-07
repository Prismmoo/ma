import { Personalization, isPersonalized, storageKeyFor } from './personalization';

/** يجب أن يطابق STORAGE_PREFIX داخل lib/personalization.ts (storageKeyFor).
 *  التطابق يضمن أن أي تخصيص حفظه زبون في V5 يُقرأ في V6 بلا فقدان. */
const STORAGE_PREFIX = 'prism.personalization.v1.';

/**
 * ذاكرة العملية — "الحقيقة" أثناء الجلسة.
 * localStorage نسخة احتياطية للجلسات القادمة فقط، ولا تُقرأ في كل رندر:
 * JSON.parse لـ 50 ضربة فرشاة × مئات النقاط عملية محسوسة على هاتف متوسط.
 */
const cache = new Map<string, Personalization>();

/** مشتركون مفهرسون بمعرّف اللوحة. */
const listeners = new Map<string, Set<() => void>>();

let hydrated = false;

/** ترطيب كسول: قراءة واحدة عند أول استعلام، لا عند تحميل التطبيق. */
function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      cache.set(key.slice(STORAGE_PREFIX.length), JSON.parse(raw) as Personalization);
    }
  } catch {
    /* التصفح الخاص في Safari يرمي على مجرد القراءة.
       الميزة تبقى تعمل في الذاكرة — لا نُسقط الميزة لأجل التخزين. */
  }
}

function emit(paintingId: string): void {
  listeners.get(paintingId)?.forEach((fn) => fn());
}

/* كتابة مؤجّلة لكل مفتاح — الكتابة في localStorage متزامنة وتوقِف الخيط الرئيسي. */
const writeTimers = new Map<string, number>();

function scheduleWrite(paintingId: string, value: Personalization | null): void {
  const existing = writeTimers.get(paintingId);
  if (existing) window.clearTimeout(existing);

  const timer = window.setTimeout(() => {
    writeTimers.delete(paintingId);
    try {
      const key = storageKeyFor(paintingId);
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* QuotaExceededError: توقيع طويل جدًا أو تخزين ممتلئ.
         الذاكرة والسلة تبقيان صحيحين. */
    }
  }, 350);

  writeTimers.set(paintingId, timer);
}

/* ════════ الواجهة العامة ════════ */

export function getPersonalization(paintingId: string): Personalization | undefined {
  hydrate();
  return cache.get(paintingId);
}

export function setPersonalization(paintingId: string, value: Personalization): void {
  hydrate();

  /* تخصيص فارغ = لا تخصيص. لا نلوّث المخزن بكائنات صفرية
     تجعل زر القلم يبدو نشطًا والسلة تعرض "Personalized" بلا سبب. */
  if (!isPersonalized(value)) {
    removePersonalization(paintingId);
    return;
  }

  cache.set(paintingId, value);
  scheduleWrite(paintingId, value);
  emit(paintingId);
}

export function removePersonalization(paintingId: string): void {
  hydrate();
  if (!cache.has(paintingId)) return;
  cache.delete(paintingId);
  scheduleWrite(paintingId, null);
  emit(paintingId);
}

export function subscribePersonalization(paintingId: string, fn: () => void): () => void {
  let set = listeners.get(paintingId);
  if (!set) {
    set = new Set();
    listeners.set(paintingId, set);
  }
  set.add(fn);

  return () => {
    set.delete(fn);
    if (set.size === 0) listeners.delete(paintingId);
  };
}

/** للفحص اليدوي من كونسول المتصفح أثناء القبول. */
export function debugDumpPersonalizations(): Record<string, Personalization> {
  hydrate();
  return Object.fromEntries(cache);
}
