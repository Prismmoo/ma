import React, { memo } from 'react';
import CoverImage from '../CoverImage';

export type MiniPreviewProps = {
  /** صورة الجدار/الغرفة */
  roomUrl: string;
  roomLabel: string;
  /** العمل الفني المختار فعليًا */
  artUrl: string;
  /** نسبة الارتفاع/العرض */
  artAspect: number;
  /** عرض اللوحة داخل المصغّرة بالمئة */
  artWidthPct?: number;
  wallColor?: string;
  frame?: { borderHex: string; materialWidthCm: number } | null;
  lighting?: 'daylight' | 'evening' | 'spotlight';
  rotate?: { x?: number; y?: number; z?: number };
  flip?: { h?: boolean; v?: boolean };
  className?: string;
};

/**
 * معاينة حيّة مصغّرة للمشهد.
 *
 * لماذا مكوّن مشترك وليس أيقونة لكل خيار؟
 * لأن مربّع اللون لا يخبر المشتري شيئًا عن شكل لوحته على ذلك الجدار.
 * هذا المكوّن يعيد استعمال نفس طبقات المسرح الكبير، فما يراه في المصغّرة
 * هو حرفيًا ما سيحصل عليه عند النقر.
 *
 * الأداء: المصغّرة تعيد استعمال **نفس روابط الصور** المحمّلة أصلًا في المسرح،
 * فلا طلب شبكي إضافي — المتصفح يقرأ من الذاكرة المؤقتة.
 */
function MiniPreview({
  roomUrl,
  roomLabel,
  artUrl,
  artAspect,
  artWidthPct = 34,
  wallColor = 'transparent',
  frame = null,
  lighting = 'daylight',
  rotate,
  flip,
  className = '',
}: MiniPreviewProps) {
  const borderPx = frame && frame.materialWidthCm > 0
    ? Math.max(1, Math.round(frame.materialWidthCm * 0.5))
    : 0;

  return (
    <div
      className={`relative overflow-hidden bg-[#1a1b23] ${className}`}
      aria-hidden="true"
    >
      <CoverImage
        candidates={[roomUrl]}
        alt={roomLabel}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {wallColor !== 'transparent' && (
        <div
          className="absolute inset-0 mix-blend-multiply opacity-80"
          style={{ backgroundColor: wallColor }}
        />
      )}

      {lighting === 'evening' && (
        <div className="absolute inset-0 bg-amber-500/15 mix-blend-color-burn" />
      )}
      {lighting === 'spotlight' && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 38%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 78%)',
          }}
        />
      )}

      <div
        className="absolute left-1/2 top-[38%]"
        style={{
          width: `${artWidthPct}%`,
          aspectRatio: `1 / ${artAspect}`,
          transform: `translate(-50%, -50%) perspective(600px) rotateX(${rotate?.x ?? 0}deg) rotateY(${rotate?.y ?? 0}deg) rotateZ(${rotate?.z ?? 0}deg) scaleX(${flip?.h ? -1 : 1}) scaleY(${flip?.v ? -1 : 1})`,
          border: borderPx > 0 ? `${borderPx}px solid ${frame?.borderHex}` : 'none',
          boxShadow: '0 3px 8px rgba(0,0,0,0.4)',
        }}
      >
        <img
          src={artUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}

export default memo(MiniPreview);
