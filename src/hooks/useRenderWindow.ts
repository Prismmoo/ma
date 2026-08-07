import { useCallback, useEffect, useRef, useState } from 'react';

const STEP = 24;

/**
 * Progressive reveal. `ArtImage` already sets loading="lazy", but lazy loading
 * only defers the network request — the DOM node, the React fiber, the price
 * computation and the srcSet parse all still happen for every item. Capping the
 * mounted count is what actually keeps the page light.
 */
export function useRenderWindow<T>(items: T[], step = STEP) {
  const [limit, setLimit] = useState(step);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Any change of list resets the window.
  useEffect(() => { setLimit(step); }, [items, step]);

  const setSentinel = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || limit >= items.length) return;
    if (typeof IntersectionObserver === 'undefined') { setLimit(items.length); return; }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLimit((current) => Math.min(current + step, items.length));
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [limit, items.length, step]);

  return {
    visible: items.slice(0, limit),
    hasMore: limit < items.length,
    remaining: Math.max(0, items.length - limit),
    setSentinel,
  };
}
