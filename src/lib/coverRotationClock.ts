/**
 * ساعة واحدة مشتركة لكل البطاقات.
 *
 * لماذا لا setInterval داخل كل بطاقة:
 *   صفحة Films فيها 26 بطاقة، وGAMES فيها 23. ذلك 26 موقّتًا يوقِظ المعالج
 *   في لحطات متفرقة ويمنع الهاتف من الخمود.
 *
 * لماذا 100ms وليس 500ms:
 *   الموجة المتسلسلة تحتاج دقة 100ms. والبديل — موقّت داخلي ثانٍ لكل بطاقة
 *   يرسم التأخير — يعيد بالتحديد المشكلة التي هربنا منها: 26 موقّتًا.
 *   موقّت واحد أسرع أرخص من ستة وعشرين موقّتًا أبطأ.
 *
 * الموقّت لا يعمل مطلقًا إلا إن وجد مشترِك واحد على الأقل، ويتوقف تمامًا
 * عند إخفاء اللسان — لا دوران في الخلفية ولا تنزيل لمن لا ينطر.
 */

export const TICK_MS = 100;

type Listener = (tick: number) => void;

const listeners = new Set<Listener>();
let timer: number | undefined;
let tick = 0;

function start(): void {
  if (timer !== undefined) return;
  timer = window.setInterval(() => {
    tick += 1;
    for (const l of listeners) l(tick);
  }, TICK_MS);
}

function stop(): void {
  if (timer === undefined) return;
  window.clearInterval(timer);
  timer = undefined;
}

function sync(): void {
  if (listeners.size === 0 || document.visibilityState === 'hidden') stop();
  else start();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', sync);
}

export function subscribeCoverClock(fn: Listener): () => void {
  listeners.add(fn);
  sync();
  return () => {
    listeners.delete(fn);
    sync();
  };
}
