import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { pageVariants, transitionProfile } from '../lib/transitions';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useNetworkQuality } from '../hooks/useNetworkQuality';
import { useScrollMemory } from '../hooks/useNavMemory';

interface Props {
  routeKey: string;
  children: React.ReactNode;
  /** هل تُدير هذه الصفحة تمريرها بنفسها؟ */
  resetScroll?: boolean;
  /**
   * لاحقة تميّز مستوى داخلي داخل نفس المسار.
   * بدونها تتشارك المستويات الثلاثة للمعرض مفتاح تمريرًا واحدًا،
   * فيُستعاد موضع شبكة اللوحات فوق قائمة اختيار المجموعات.
   */
  scrollScope?: string;
  className?: string;
}

export default function PageTransition({
  routeKey,
  children,
  resetScroll = true,
  scrollScope,
  className = '',
}: Props) {
  const { isMobile } = useBreakpoint();
  const reducedMotion = usePrefersReducedMotion();
  const { saveData } = useNetworkQuality();
  const ref = useRef<HTMLDivElement>(null);

  const profile = transitionProfile({ isMobile, reducedMotion, saveData });
  const variants = pageVariants(profile);

  // Scroll restoration. Without this the new page inherits the old page's
  // scroll offset, which is the single most common "broken transition" bug
  // in single-page sites.
  // موضع التمرير: الذاكرة أولًا، والأعلى عند أول زيارة.
  useScrollMemory(
    `scroll:${routeKey}${scrollScope ? `:${scrollScope}` : ''}`,
    resetScroll,
  );

  return (
    <motion.div
      ref={ref}
      key={routeKey}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`pz-page ${className}`}
      // will-change is applied only while animating, then dropped. Leaving it
      // on permanently pins a compositor layer per route and costs memory on
      // low-end phones.
      onAnimationStart={() => {
        if (ref.current) ref.current.style.willChange = 'opacity, transform';
      }}
      onAnimationComplete={() => {
        if (ref.current) ref.current.style.willChange = 'auto';
      }}
    >
      {children}
    </motion.div>
  );
}
