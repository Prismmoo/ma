import { MEDIA } from '../lib/responsive';
import { useMediaQuery } from './useMediaQuery';

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(MEDIA.reducedMotion);
}
