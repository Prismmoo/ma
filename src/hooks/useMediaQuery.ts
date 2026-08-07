import { useSyncExternalStore } from 'react';

const lists = new Map<string, MediaQueryList>();

function getList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  let list = lists.get(query);
  if (!list) {
    list = window.matchMedia(query);
    lists.set(query, list);
  }
  return list;
}

/**
 * SSR-safe, tear-free media query subscription.
 * useSyncExternalStore is used deliberately: with useState + useEffect the
 * first paint can flash the wrong layout on mobile.
 * The MediaQueryList objects are cached per query, so ten components asking
 * the same question share one native listener.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = getList(query);
      if (!list) return () => undefined;
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => getList(query)?.matches ?? serverValue,
    () => serverValue
  );
}
