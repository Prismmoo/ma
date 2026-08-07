import type { Variants, Transition } from 'motion/react';

/**
 * One shared motion vocabulary for the whole site.
 *
 * Timing is asymmetric on purpose: the outgoing view leaves faster than the
 * incoming view arrives. That reads as "responsive" rather than "slow",
 * because perceived latency is dominated by how quickly the old content
 * clears the screen.
 */

export const DURATION = {
  enter: 0.30,
  exit: 0.18,
  enterMobile: 0.22,
  exitMobile: 0.14,
  reduced: 0.12,
} as const;

/** Material-style decelerate curve. Fast start, gentle settle. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** Accelerate curve for exits. */
export const EASE_IN = [0.4, 0, 1, 1] as const;

export interface TransitionProfile {
  distance: number;
  enter: number;
  exit: number;
  blur: number;
}

export function transitionProfile(opts: {
  isMobile: boolean;
  reducedMotion: boolean;
  saveData: boolean;
}): TransitionProfile {
  if (opts.reducedMotion) {
    return { distance: 0, enter: DURATION.reduced, exit: DURATION.reduced, blur: 0 };
  }
  if (opts.isMobile || opts.saveData) {
    return { distance: 8, enter: DURATION.enterMobile, exit: DURATION.exitMobile, blur: 0 };
  }
  return { distance: 16, enter: DURATION.enter, exit: DURATION.exit, blur: 4 };
}

export function pageVariants(profile: TransitionProfile): Variants {
  const filterFrom = profile.blur ? `blur(${profile.blur}px)` : 'blur(0px)';
  return {
    initial: {
      opacity: 0,
      y: profile.distance,
      filter: filterFrom,
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: profile.enter,
        ease: EASE_OUT,
        // Opacity resolves slightly ahead of the movement, which removes the
        // "sliding ghost" look you get when both finish together.
        opacity: { duration: profile.enter * 0.7, ease: 'linear' },
      } as Transition,
    },
    exit: {
      opacity: 0,
      y: -Math.round(profile.distance * 0.4),
      filter: filterFrom,
      transition: { duration: profile.exit, ease: EASE_IN } as Transition,
    },
  };
}

/** For lists and cards inside a page that has just arrived. */
export function staggerChildren(profile: TransitionProfile, count: number): Variants {
  // Cap the total stagger so a 40-card grid never takes longer than 240 ms.
  const per = Math.min(0.04, 0.24 / Math.max(1, count));
  return {
    initial: {},
    animate: { transition: { staggerChildren: per, delayChildren: profile.enter * 0.35 } },
    exit: {},
  };
}
