import React, { useEffect, useRef, useState } from 'react';
import { remember, recall, isReturnVisit } from '../lib/navMemory';

/**
 * useState لكنه يتذكّر قيمته عبر التنقلات داخل نفس الجلسة.
 *
 * التهيئة دالة لا قيمة: قراءة المخزن يجب أن تحدث مرة واحدة لا في كل رندر.
 */
export function useRemembered<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = recall<T>(key);
    return saved === undefined ? initial : saved;
  });

  /*
   * لماذا نحرس تغيير المفتاح:
   *   النسخة الأولى كانت [key, value]، فإن تغير المفتاح وحده انطلق الأثر
 *   والحالة ما زالت تحمل قيمة النطاق القديم، فكتبت فوق ذاكرة النطاق
 *   الجديد ودمّرتها. نتجاوز أول دورة بعد تغيير المفتاح.
   */
  const prevKey = useRef(key);
  useEffect(() => {
    if (prevKey.current !== key) {
      prevKey.current = key;
      return;
    }
    remember(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

/**
 * حفظ واستعادة موضع التمرير للنافذة.
 *
 * ثلاثة فروق جوهرية عن v1:
 *
 * ١. لا تستعيد إلا عند الرجوع. دخول جديد يبدأ من الأعلى — وهو ما يتوقّعه
 *    من يضغط رابطًا في شريط التنقل.
 *
 * ٢. ResizeObserver بدل حلقة rAF. الحلقة القديمة كانت تكتب scrollTo ثم تقرأ
 *    scrollY في نفس الإطار، وذلك يجبر حساب تخطيط متزامن 60 مرة في الثانية.
 *    المطلوب حقيقةً هو معرفة متى ينمو المستند، وللمتصفّح مراقب مخصّص لذلك
 *    يُخبرنا مجّانًا بدل أن نسأل.
 *
 * ٣. مرساة اختيارية. الإزاحة البكسلية وعد هشّ: ارتفاع المستند يتغير مع
 *    عرض الشاشة ومع تحميل الصور، فـ900px قد تكون لوحة أخرى تمامًا بعد دوران
 *    الهاتف. المرساة تحفظ «أي عنصر كان في أعلى الشاشة»، وهو معنى يبقى صحيحًا.
 */
export function useScrollMemory(key: string, enabled = true) {
  const restored = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    restored.current = false;

    /* دخول جديد: لا استعادة، إلى الأعلى مباشرة، والكاتب يُسلّح فورًا. */
    if (!isReturnVisit(key)) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      restored.current = true;
      return;
    }

    const target = recall<number>(key) ?? 0;
    if (target <= 0) {
      restored.current = true;
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      restored.current = true;
      ro?.disconnect();
      window.clearTimeout(deadline);
    };

    const tryScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      /* لا تقفز إلى موضع أقرب مما طُلب: انتظر أن ينمو المستند. */
      if (max + 2 < target) return;
      window.scrollTo({ top: target, behavior: 'auto' });
      finish();
    };

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(tryScroll);
      ro.observe(document.documentElement);
    }

    /*
     * مهلة قصوى 1200ms. لماذا أطول من 600ms القديمة: ما كان يدور في حلقة
     * مكلفة صار انتظارًا سلبيًا بلا تكلفة، فلا مانع من السخاء.
     */
    const deadline = window.setTimeout(finish, 1200);
    tryScroll();

    return finish;
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled) return;

    let ticking = false;
    const onScroll = () => {
      // لا تحفظ قبل اكتمال الاستعادة، وإلا داست الأصفار على الموضع المحفوظ.
      if (!restored.current || ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        remember(key, Math.round(window.scrollY));
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [key, enabled]);
}

/**
 * نفس المنطق لحاوية داخلية قابلة للتمرير (سلة، نافذة، منتقي باك).
 *
 * لماذا دالة منفصلة وليس توسيعًا للأولى:
 *   موضع النافذة يُقرأ من window، وموضع الحاوية من element.scrollTop،
 *   والحدّ الأقصى يُحسب بطريقة مختلفة. دالة واحدة تخدم الاثنين تصير شروطًا
 *   متشابكة تصعب قراءتها ولا توفّر شيئًا.
 */
export function useElementScrollMemory(
  ref: React.RefObject<HTMLElement | null>,
  key: string,
  enabled = true,
) {
  const restored = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    restored.current = false;

    if (!isReturnVisit(key)) {
      el.scrollTop = 0;
      restored.current = true;
      return;
    }

    const target = recall<number>(key) ?? 0;
    if (target <= 0) {
      restored.current = true;
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      restored.current = true;
      ro?.disconnect();
      window.clearTimeout(deadline);
    };

    const tryScroll = () => {
      if (el.scrollHeight - el.clientHeight + 2 < target) return;
      el.scrollTop = target;
      finish();
    };

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(tryScroll);
      ro.observe(el);
    }
    const deadline = window.setTimeout(finish, 1200);
    tryScroll();

    return finish;
  }, [ref, key, enabled]);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;

    let ticking = false;
    const onScroll = () => {
      if (!restored.current || ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        remember(key, Math.round(el.scrollTop));
        ticking = false;
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [ref, key, enabled]);
}
