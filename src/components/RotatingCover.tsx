import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CoverImage from './CoverImage';
import { subscribeCoverClock, TICK_MS } from '../lib/coverRotationClock';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useNetworkQuality } from '../hooks/useNetworkQuality';

/** الدورة الكاملة لكل بطاقة. */
const CYCLE_MS = 3000;
/** زمن التلاشي المتقاطع. يجب أن يطابق --pz-rotc-fade في index.css. */
const FADE_MS = 900;
/** فارق التعاقب بين بطاقة وجارتها. مساوٍ للنبضة قصدًا. */
const STAGGER_TICKS = 1;
/**
 * طول الموجة قبل أن تعيد من البداية.
 * 12 × 100ms = 1.2s، أقل من الدورة (3s) فلا تتراكب موجتان.
 * بلا سقف، البطاقة 26 كانت ستتأخر 2.6s وتلحق بالدورة التالية.
 */
const WAVE_LENGTH = 12;

const TICKS_PER_CYCLE = Math.round(CYCLE_MS / TICK_MS);

/**
 * سقف عدد الصور الداخلة في الدوران لكل بطاقة.
 * Better Call Saul وحدها 35 لوحة؛ 26 بطاقة × 35 = أكثر من 900 طلب صورة.
 */
const POOL_MAX = 6;

/** FNV-1a: بذرة حتمية من المفتاح، لا Math.random. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * خلط حتمي (Fisher-Yates بمولّد مبذور).
 * الخلط العشوائي الحقيقي يُعاد حسابه عند كل رندر فتقفز الصور.
 */
function shuffled<T>(list: T[], seed: number): T[] {
  const out = [...list];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Props = {
  /** مفتاح ثابت للبطاقة (slug المجموعة أو عنوانها). يحدد ترتيب الصور. */
  seedKey: string;
  /**
   * رتبة البطاقة في الشبكة. يحدد موقعها في الموجة.
   *
   * لماذا الرتبة وليس الـhash: الـhash يعطي تفرقًا عشوائيًا لا تتابعًا.
   * الإحساس «كأنها مرتبطة ببعض» يأتي من ترتيب مرئي فقط.
   */
  index?: number;
  /** مجموعة الدوران من collectionImages(slug). مصفّاة من المخفي مسبقًا. */
  pool: string[];
  /** سلسلة المرشّحات الأصلية للحالة الساكنة وللأعطال. */
  candidates: Array<string | null | undefined>;
  alt: string;
  className?: string;
  priority?: boolean;
};

/**
 * غلاف يتبدّل كل 3 ثوانٍ بتلاشٍ متقاطع حقيقي، في موجة متسلسلة.
 *
 * قواعد السلامة المبنية داخله:
 *   ١. مجموعة أقل من صورتين → CoverImage ساكنة ولا موقّت إطلاقًا.
 *   ٢. reducedMotion أو saveData → تجميد على الصورة الأولى.
 *   ٣. لا دوران قبل أن تدخل البطاقة الشاشة (IntersectionObserver).
 *   ٤. لا يبدأ التلاشي قبل تحميل الصورة القادمة — وإلا تلاشٍ إلى فراغ أبيض.
 *   ٥. دورة جديدة تُرفض ما دام واحدة جارية (التلاشي 900ms داخل دورة 3000ms).
 */
function RotatingCoverBase({
  seedKey,
  index = 0,
  pool,
  candidates,
  alt,
  className,
  priority,
}: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const { saveData } = useNetworkQuality();

  const seed = useMemo(() => hash(seedKey), [seedKey]);
  const order = useMemo(() => shuffled(pool, seed).slice(0, POOL_MAX), [pool, seed]);

  const rotates = order.length > 1 && !reducedMotion && !saveData;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  /** الطبقة المستقرة تحت. */
  const [front, setFront] = useState(0);
  /** الطبقة الداخلة فوق، أو null إن لا تحول جارٍ. */
  const [incoming, setIncoming] = useState<number | null>(null);
  /** هل وُلِدت الطبقة الداخلة ثم سُلّحت للتحول؟ */
  const [armed, setArmed] = useState(false);

  /*
   * مراجع للقراءة داخل ردّ الساعة.
   * لو قرأنا front وincoming من الإغلاق لوجب وضعهما في التبعيات،
   * فإنفكّ الاشتراك ويُعاد ربطه عند كل تبديل — 26 اشتراكًا يُلغى وُيبنى كل 3 ثوانٍ.
   */
  const frontRef = useRef(0);
  const busyRef = useRef(false);
  useEffect(() => {
    frontRef.current = front;
  }, [front]);

  /* موقع البطاقة في الموجة، بالنبضات. */
  const offsetTicks = useMemo(
    () => (index % WAVE_LENGTH) * STAGGER_TICKS,
    [index],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { rootMargin: '100px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* الساعة: تفتح دورة جديدة عند موقع البطاقة من الموجة. */
  useEffect(() => {
    if (!rotates || !visible) return;

    return subscribeCoverClock((tick) => {
      const slot = ((tick - offsetTicks) % TICKS_PER_CYCLE + TICKS_PER_CYCLE) % TICKS_PER_CYCLE;
      if (slot !== 0) return;
      if (busyRef.current) return;   // تحول جارٍ: تجاوز هذه الدورة
      busyRef.current = true;
      setIncoming((frontRef.current + 1) % order.length);
    });
  }, [rotates, visible, offsetTicks, order.length]);

  /* تمهيد الصورة التالية فقط، لتكون في الكاش قبل لحطة التحول. */
  useEffect(() => {
    if (!rotates || !visible) return;
    const upcoming = order[(front + 1) % order.length];
    if (!upcoming) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = upcoming;
  }, [rotates, visible, front, order]);

  /*
   * الارتكاب: تصير الطبقة الداخلة هي المستقرة وتُفكّ طبقة التحول.
   * لا وميض عند الارتكاب: الصورة معروضة قبل لحطة واحدة فهي في كاش
   * المتصفّح وتُرسم في نفس الإطار.
   */
  const commit = useCallback(() => {
    setIncoming((cur) => {
      if (cur === null) return null;
      setFront(cur);
      return null;
    });
    setArmed(false);
    busyRef.current = false;
  }, []);

  /*
   * مهلة احتياط مربوطة بدورة الحياة لا بـref.
   *
   * لماذا إلزامية: transitionend لا ينطلق إن أُخفيت البطاقة أو خرجت من
   * الشاشة أو ألغى المتصفّح التحول. وبلا ارتكاب يبقى busyRef مرفوعًا
   * فتتجمّد البطاقة إلى الأبد — وهذا عطب يظهر عند الزائر وحده.
   *
   * لماذا ليس في ref: ردّ ref يُنادى في كل رندر، فموقّت داخله يتراكم
   * بلا من يمسحه. ولماذا ليس بعد الـreturn المشروط: أي hook بعد خروج
   * مشروط يكسر ترتيب الـhooks ويرمي "Rendered more hooks than during the
   * previous render" — وهو بالتحديد الخطأ الذي أوقف السلة سابقًا.
   */
  useEffect(() => {
    if (incoming === null) return;
    const t = window.setTimeout(commit, FADE_MS + 400);
    return () => window.clearTimeout(t);
  }, [incoming, commit]);

  if (!rotates) {
    return (
      <CoverImage
        candidates={[order[0], ...candidates]}
        alt={alt}
        className={className}
        priority={priority}
      />
    );
  }

  return (
    /*
     * ملاحظة حاسمة: className القادم من موقع النداء يحمل
     * "group-hover:scale-105 transition-transform duration-500"، وهي تدوس على
     * transform وtransition الخاصين بالتلاشي لو وُضعت على الطبقات.
     * لذلك توضع على الحاوية — فيبقى تأثير hover كما هو حرفيًا
     * بلا أي تعارض مع حركة التعاقب.
     */
    <div ref={wrapRef} className={`pz-rotc ${className ?? ''}`}>
      <img
        key={`base-${order[front]}`}
        src={order[front]}
        alt={alt}
        className="pz-rotc__layer pz-rotc__layer--base"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
      {incoming !== null && (
        <img
          key={`in-${order[incoming]}`}
          src={order[incoming]}
          alt=""
          aria-hidden="true"
          className={`pz-rotc__layer pz-rotc__layer--enter ${
            armed ? 'pz-rotc__layer--enter-active' : ''
          }`}
          decoding="async"
          draggable={false}
          /*
           * التسليح يحدث في إطار تالٍ لا في onLoad مباشرة.
           * لو قلبنا الصف في نفس الإطار لما رأى المتصفّح حالة بداية قطّ،
           * ولا يوجد تحول بين حالتين لم تُرسم أولاهما. هذا بالتحديد
           * السبب الجذري للقطع المباشر الذي رأيته.
           */
          onLoad={() => {
            requestAnimationFrame(() => requestAnimationFrame(() => setArmed(true)));
          }}
          /*
           * الارتكاب عند انتهاء التحول. ومعه مهلة احتياط لأن transitionend
           * لا ينطلق إن أُخفي العنصر أو أُلغي التحول — وبلا المهلة
           * تتجمّد البطاقة إلى الأبد لأن busyRef يبقى مرفوعًا.
           */
          onTransitionEnd={(e) => {
            if (e.propertyName === 'opacity') commit();
          }}
          /* أصل ميت: ألغِ الدورة وابقَ على الحالية. */
          onError={() => {
            setIncoming(null);
            setArmed(false);
            busyRef.current = false;
          }}
        />
      )}
    </div>
  );
}

export default memo(RotatingCoverBase);
