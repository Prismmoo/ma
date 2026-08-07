import React, { useEffect } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useNetworkQuality } from '../hooks/useNetworkQuality';

/**
 * الخلفية الحية للموقع كله.
 *
 * طبقة واحدة ثابتة تُركّب مرة واحدة في App، لا مرة لكل صفحة:
 * طبقتان متداخلتان تعنيان ضعف الرسم وتعارضًا في الألوان.
 *
 * لماذا aria-hidden و pointer-events: none:
 *   زخرفة بحتة — لا يجوز أن يراها قارئ الشاشة ولا أن تبتلع نقرة واحدة.
 *
 * لماذا قد تتوقف:
 *   prefers-reduced-motion — احترام إعداد النظام، وتجنُّب الدوار لدى من يتأثر به.
 *   Save-Data / شبكة بطيئة — blur(60px) على طبقة بحجم الشاشة مرتين
 *   تكلفة رسم دائمة. في الحالتين تبقى تدرّجًا ساكنًا لطيفًا لا لونًا مسطحًا.
 */
export default function AuroraBackground() {
  const reducedMotion = usePrefersReducedMotion();
  const { saveData, slow } = useNetworkQuality();
  const still = reducedMotion || saveData || slow;

  // مفتاح تشخيص — يقرأ القيم المحسوبة فعليًا، لا المكتوبة في الملف.
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__prismBg = () => {
      const root = document.querySelector('.pz-bg');
      const a = document.querySelector('.pz-bg__layer--a');
      if (!root || !a) return { mounted: false };
      const rs = getComputedStyle(root);
      const as = getComputedStyle(a);
      return {
        mounted: true,
        reducedMotion,
        saveData,
        slow,
        still,
        baseColor: rs.backgroundColor,
        layerA: as.animationName,
        layerDuration: as.animationDuration,
        blur: as.filter,
      };
    };
  }, [reducedMotion, saveData, slow, still]);

  return (
    <div
      className={`pz-bg ${still ? 'pz-bg--still' : ''}`}
      aria-hidden="true"
    >
      <span className="pz-bg__layer pz-bg__layer--a" />
      <span className="pz-bg__layer pz-bg__layer--b" />
      <span className="pz-bg__veil" />
    </div>
  );
}
