import { useCallback, useEffect, useRef } from 'react';

type Loader = () => Promise<unknown>;

export const ROUTE_LOADERS: Record<string, Loader> = {
  gallery:    () => import('../components/GalleryView'),
  visualizer: () => import('../components/VisualizerView'),
  artists:    () => import('../components/ArtistBioView'),
  stickers:   () => import('../components/StickersView'),
  packs:      () => import('../components/PacksView'),
  threed:     () => import('../components/ThreeDPaintingView'),
};

/** Routes warmed during idle time on a fast, unmetered connection. */
const IDLE_WARM: string[] = ['gallery', 'stickers'];

function connectionIsCheap(): boolean {
  const conn = (navigator as any).connection;
  if (!conn) return true;
  if (conn.saveData) return false;
  return !['slow-2g', '2g', '3g'].includes(conn.effectiveType);
}

/**
 * Warms a route chunk once. Safe to call on every hover, focus and touchstart:
 * repeated calls for the same route are ignored.
 */
export function useRoutePrefetch() {
  const warmed = useRef<Set<string>>(new Set());

  const prefetch = useCallback((route: string) => {
    if (warmed.current.has(route)) return;
    const loader = ROUTE_LOADERS[route];
    if (!loader) return;
    warmed.current.add(route);
    void loader().catch(() => warmed.current.delete(route));
  }, []);

  useEffect(() => {
    if (!connectionIsCheap()) return;
    const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2500));
    const cancel = (window as any).cancelIdleCallback ?? clearTimeout;
    const handle = idle(() => IDLE_WARM.forEach(prefetch));
    return () => cancel(handle);
  }, [prefetch]);

  return prefetch;
}
