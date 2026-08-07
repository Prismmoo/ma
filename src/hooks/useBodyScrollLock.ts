import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;
let savedStyles: Partial<CSSStyleDeclaration> = {};

/**
 * Reference-counted scroll lock. Safe when a modal opens on top of a drawer:
 * the body is only unlocked when the last consumer unmounts.
 * Restores the exact scroll position, which position:fixed alone does not do.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;

    if (lockCount === 0) {
      const body = document.body;
      savedScrollY = window.scrollY;
      savedStyles = {
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        overflow: body.style.overflow,
      };
      body.style.position = 'fixed';
      body.style.top = `-${savedScrollY}px`;
      body.style.width = '100%';
      body.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount > 0) return;
      const body = document.body;
      body.style.position = savedStyles.position ?? '';
      body.style.top = savedStyles.top ?? '';
      body.style.width = savedStyles.width ?? '';
      body.style.overflow = savedStyles.overflow ?? '';
      window.scrollTo(0, savedScrollY);
    };
  }, [active]);
}
