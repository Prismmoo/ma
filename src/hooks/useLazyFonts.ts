import { useEffect, useState } from 'react';
import { buildGoogleFontsHref, ART_FONTS, fontFamilyCss } from '../lib/personalization';

const LINK_ID = 'prism-art-fonts';

let injected = false;

export interface LazyFontsState {
  requested: boolean;
  ready: boolean;
}

export function useLazyFonts(active: boolean): LazyFontsState {
  const [requested, setRequested] = useState<boolean>(injected);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    if (!active) return;

    if (!injected) {
      injected = true;

      const pre1 = document.createElement('link');
      pre1.rel = 'preconnect';
      pre1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(pre1);

      const pre2 = document.createElement('link');
      pre2.rel = 'preconnect';
      pre2.href = 'https://fonts.gstatic.com';
      pre2.crossOrigin = 'anonymous';
      document.head.appendChild(pre2);

      const link = document.createElement('link');
      link.id = LINK_ID;
      link.rel = 'stylesheet';
      link.href = buildGoogleFontsHref();
      document.head.appendChild(link);
    }
    setRequested(true);

    let cancelled = false;

    const jobs = ART_FONTS.map((f) =>
      document.fonts
        .load(`${f.weight ?? 400} 32px ${fontFamilyCss(f)}`)
        .catch(() => undefined),
    );

    Promise.all(jobs).then(() => {
      if (!cancelled) setReady(true);
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 4000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [active]);

  return { requested, ready };
}
