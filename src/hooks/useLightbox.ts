import { useCallback, useEffect, useState } from 'react';

export interface LightboxOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface LightboxState<T> {
  item: T;
  origin: LightboxOrigin | null;
}

/**
 * Open/close state plus the origin rect for the FLIP animation.
 *
 * The rect is captured at click time from the element that was clicked, so the
 * panel can be made to appear to grow out of that exact thumbnail rather than
 * from the centre of the screen.
 */
export function useLightbox<T>() {
  const [state, setState] = useState<LightboxState<T> | null>(null);

  const open = useCallback((item: T, element: HTMLElement | null) => {
    const rect = element?.getBoundingClientRect() ?? null;
    setState({
      item,
      origin: rect
        ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        : null,
    });
  }, []);

  const close = useCallback(() => setState(null), []);

  // Escape closes. Registered only while open, so no idle listener.
  useEffect(() => {
    if (!state) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state, close]);

  // Lock body scroll while open. Restore the exact previous value, never a
  // hardcoded 'auto' — that would clobber a scroll lock set by another modal.
  useEffect(() => {
    if (!state) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [state]);

  return { state, open, close, isOpen: state !== null };
}
