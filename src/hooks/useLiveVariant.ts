import { useEffect, useRef, useState } from 'react';
import { getLiveVariant, type LiveVariant } from '../lib/liveVariants';

/**
 * يطلب مقاسًا مناسبًا **بعد استقرار التفاعل فقط**.
 *
 * لماذا تأخير؟ لأن المستخدم أثناء السحب والتكبير يُنتج عشرات القياسات
 * في الثانية. التوليد أثناء الحركة = تقطيع. التوليد بعد السكون = مجّاني حسّيًا.
 */
export function useLiveVariant(args: {
  src: string;
  srcSet?: string | null;
  /** العرض المرئي بالبكسل (CSS px) */
  displayWidth: number;
  /** معطّل أثناء السحب/التدوير */
  active: boolean;
  delayMs?: number;
}): LiveVariant {
  const { src, srcSet, displayWidth, active, delayMs = 180 } = args;

  const [variant, setVariant] = useState<LiveVariant>({
    url: src,
    width: 0,
    synthetic: false,
    sourceWidth: 0,
  });

  const reqId = useRef(0);

  // إعادة الضبط عند تغيّر اللوحة
  useEffect(() => {
    setVariant({ url: src, width: 0, synthetic: false, sourceWidth: 0 });
  }, [src]);

  useEffect(() => {
    if (!active || displayWidth <= 0) return;

    // تجميع الطلبات في درجات 128px حتى لا نولّد لكل بكسل
    const bucket = Math.ceil(displayWidth / 128) * 128;

    const id = ++reqId.current;
    const timer = window.setTimeout(() => {
      getLiveVariant({ src, srcSet, targetWidth: bucket })
        .then((v) => {
          if (id === reqId.current) setVariant(v);
        })
        .catch(() => {
          /* متعمّد: الفشل لا يُعطّل الواجهة */
        });
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [src, srcSet, displayWidth, active, delayMs]);

  return variant;
}
