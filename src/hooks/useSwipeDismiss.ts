import React, { useRef, useState } from 'react';

interface Options {
  enabled: boolean;
  onDismiss: () => void;
  /** Pixels the user must drag before the sheet closes. */
  threshold?: number;
}

/**
 * Downward swipe-to-close for bottom sheets. Pointer events only, so touch,
 * pen and mouse share one code path.
 */
export function useSwipeDismiss({ enabled, onDismiss, threshold = 110 }: Options) {
  const startY = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);

  if (!enabled) {
    return { offset: 0, handlers: {} as Record<string, never> };
  }

  return {
    offset,
    handlers: {
      onPointerDown: (event: React.PointerEvent) => {
        startY.current = event.clientY;
      },
      onPointerMove: (event: React.PointerEvent) => {
        if (startY.current === null) return;
        const delta = event.clientY - startY.current;
        setOffset(delta > 0 ? delta : 0);
      },
      onPointerUp: () => {
        if (offset > threshold) onDismiss();
        startY.current = null;
        setOffset(0);
      },
      onPointerCancel: () => {
        startY.current = null;
        setOffset(0);
      },
    },
  };
}
