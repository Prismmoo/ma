import React, { useState, memo } from 'react';
import type { ArtImageRef } from '../types';
import { artSizesAttr } from '../lib/art';

interface ArtImageProps {
  /** مرجع من toImageRef(). مرر null لعرض الهيكل فقط. */
  image: ArtImageRef | null;
  alt: string;
  /**
   * تلميح CSS لعرض الصورة الفعلي على الشاشة.
   * أمثلة من هذا المشروع:
   *   شبكة المعرض (3 أعمدة، أقصى 7xl):  '(min-width:1280px) 400px, (min-width:768px) 45vw, 48vw'
   *   بطاقة مجموعة:                    '(min-width:768px) 33vw, 90vw'
   *   مودال التفاصيل:                   '(min-width:1024px) 50vw, 92vw'
   */
  sizes: string;
  /** true فقط للصور فوق الطيّة (أول 6 بطاقات، صورة المودال). افتراضيًا false. */
  priority?: boolean;
  /** أصناف على عنصر <img> نفسه. */
  className?: string;
  /** أصناف على الحاوية التي تحجز المساحة. */
  wrapperClassName?: string;
  /** تجاوز نسبة الأبعاد (مثلًا '1 / 1' لشبكة مربّعة). افتراضيًا النسبة الحقيقية. */
  aspectRatio?: string;
  onClick?: () => void;
}

function ArtImageBase({
  image,
  alt,
  sizes,
  priority = false,
  className = '',
  wrapperClassName = '',
  aspectRatio,
  onClick,
}: ArtImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  // نسبة الأبعاد تُحجز قبل وصول أي بايت → CLS = 0
  const ratio = aspectRatio ?? (image ? `${image.width} / ${image.height}` : '4 / 5');

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-forest-deep ${wrapperClassName}`}
      style={{ aspectRatio: ratio }}
    >
      {/* طبقة الإنابة: تدرّج من الثيم بدل LQIP base64.
          السبب في القسم 2 — LQIP لـ695 صورة = 243KB غير قابلة للضغط. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-500 bg-gradient-to-br from-forest-sage/10 via-forest-deep to-forest-sage/5 ${
          state === 'loaded' ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-forest-sage">
          <span className="text-[9px] font-mono uppercase tracking-widest">Asset offline</span>
          <span className="text-[8px] font-mono opacity-60">{image?.id}</span>
        </div>
      )}

      {image && (
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={artSizesAttr(image, sizes)}
          alt={alt}
          width={image.width}
          height={image.height}
          loading={priority ? 'eager' : 'lazy'}
          // fetchPriority تُمرّر كـ DOM attribute في React 19
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          draggable={false}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
            state === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      )}
    </div>
  );
}

const ArtImage = memo(ArtImageBase);
export default ArtImage;
