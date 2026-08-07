import { useEffect, useState } from 'react';

export interface ViewportSize {
  width: number;
  height: number;
  /** Height of the visible area, excluding an open on-screen keyboard. */
  visualHeight: number;
  keyboardOpen: boolean;
}

function read(): ViewportSize {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800, visualHeight: 800, keyboardOpen: false };
  }
  const visual = window.visualViewport;
  const height = window.innerHeight;
  const visualHeight = visual?.height ?? height;
  return {
    width: window.innerWidth,
    height,
    visualHeight,
    keyboardOpen: height - visualHeight > 140,
  };
}

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(read);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSize(read()));
    };
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return size;
}
