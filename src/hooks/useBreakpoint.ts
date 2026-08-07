import { MEDIA } from '../lib/responsive';
import { useMediaQuery } from './useMediaQuery';

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  isFinePointer: boolean;
  isShort: boolean;
  isLandscapePhone: boolean;
}

/** The only hook components should use for layout decisions. */
export function useBreakpoint(): BreakpointState {
  const isMobile = useMediaQuery(MEDIA.mobile);
  const isTablet = useMediaQuery(MEDIA.tablet);
  const isDesktop = useMediaQuery(MEDIA.desktop, true);
  const isTouch = useMediaQuery(MEDIA.touch);
  const isFinePointer = useMediaQuery(MEDIA.finePointer, true);
  const isShort = useMediaQuery(MEDIA.shortViewport);
  const isLandscapePhone = useMediaQuery(MEDIA.landscapePhone);

  return { isMobile, isTablet, isDesktop, isTouch, isFinePointer, isShort, isLandscapePhone };
}
