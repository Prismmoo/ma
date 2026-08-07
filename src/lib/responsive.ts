/**
 * Breakpoints mirror Tailwind's defaults so a hook and a class name can never
 * disagree. Changing a number here must be mirrored in the Tailwind config.
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

export const MEDIA = {
  mobile:         `(max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet:         `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop:        `(min-width: ${BREAKPOINTS.lg}px)`,
  touch:          '(hover: none) and (pointer: coarse)',
  finePointer:    '(hover: hover) and (pointer: fine)',
  reducedMotion:  '(prefers-reduced-motion: reduce)',
  shortViewport:  '(max-height: 700px)',
  landscapePhone: '(max-height: 500px) and (orientation: landscape)',
} as const;

/** Minimum comfortable tap target, per WCAG 2.5.5 and the iOS HIG. */
export const MIN_TAP_TARGET_PX = 44;
