import React, { memo, useEffect, useState } from 'react';
import { resolveCover, BLANK_PIXEL } from '../lib/legacyCovers';

type Props = {
  /** مرشّحات الغلاف بالترتيب: الأفضل أولًا. */
  candidates: Array<string | null | undefined>;
  alt: string;
  className?: string;
  /** أول شاشة؟ اجعلها false لتُحمَّل بتأجيل. */
  priority?: boolean;
};

/**
 * غلاف بطاقة لا يُنتج فراغًا:
 * 1) يجرّب المرشّحات بالترتيب
 * 2) عند onError ينتقل تلقائيًا للمرشّح التالي
 * 3) عند استهلاك كل المرشّحات يرسم لوحة رمادية أنيقة + نص بديل
 */
function CoverImage({ candidates, alt, className, priority = false }: Props) {
  const list = candidates.filter(
    (c): c is string => typeof c === 'string' && c.trim().length > 0,
  );
  const [idx, setIdx] = useState(0);
  const [dead, setDead] = useState(list.length === 0);

  // إعادة الضبط عند تغيّر البطاقة
  useEffect(() => {
    setIdx(0);
    setDead(list.length === 0);
  }, [list.join('|')]);

  if (dead) {
    return (
      <div
        className={`flex items-center justify-center bg-forest-black/40 ${className ?? ''}`}
        role="img"
        aria-label={alt}
      >
        <span className="px-3 text-center text-[9px] font-mono uppercase tracking-widest text-forest-cream/40">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolveCover([list[idx]])}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (idx + 1 < list.length) setIdx(idx + 1);
        else setDead(true);
      }}
    />
  );
}

export default memo(CoverImage);
