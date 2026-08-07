/**
 * Byte-level cache for audio assets.
 *
 *   Tier 1  Cache Storage  — survives reload; the browser evicts under pressure.
 *   Tier 2  in-memory Map  — decoded ArrayBuffers, so a repeat hover is instant.
 *
 * Every failure path resolves to null, and the caller falls back to streaming.
 * Nothing here ever throws into React.
 */

const CACHE_NAME = 'nl-audio-v1';

const buffers = new Map<string, ArrayBuffer>();
const inflight = new Map<string, Promise<ArrayBuffer | null>>();

export interface FetchReport {
  ok: boolean;
  fromCache: boolean;
  status?: number;
  bytes?: number;
  error?: string;
}

const reports = new Map<string, FetchReport>();

export function lastFetchReport(url: string): FetchReport | undefined {
  return reports.get(url);
}

function cacheStorageAvailable(): boolean {
  return (
    typeof caches !== 'undefined' &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  );
}

async function load(url: string): Promise<ArrayBuffer | null> {
  // 1. Cache Storage
  if (cacheStorageAvailable()) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(url);
      if (hit) {
        const bytes = await hit.arrayBuffer();
        reports.set(url, { ok: true, fromCache: true, bytes: bytes.byteLength });
        return bytes;
      }
    } catch {
      /* fall through to network */
    }
  }

  // 2. Network
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) {
      reports.set(url, { ok: false, fromCache: false, status: response.status });
      return null;
    }
    if (cacheStorageAvailable()) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(url, response.clone());
      } catch {
        /* quota or opaque response; not fatal */
      }
    }
    const bytes = await response.arrayBuffer();
    reports.set(url, {
      ok: true,
      fromCache: false,
      status: response.status,
      bytes: bytes.byteLength,
    });
    return bytes;
  } catch (error) {
    reports.set(url, {
      ok: false,
      fromCache: false,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/** Returns the raw bytes, or null when the asset could not be retrieved. */
export function fetchAudioBytes(url: string): Promise<ArrayBuffer | null> {
  const memo = buffers.get(url);
  if (memo) return Promise.resolve(memo);

  const pending = inflight.get(url);
  if (pending) return pending;

  const task = load(url)
    .then((bytes) => {
      if (bytes) buffers.set(url, bytes);
      return bytes;
    })
    .finally(() => inflight.delete(url));

  inflight.set(url, task);
  return task;
}

export function isAudioWarm(url: string): boolean {
  return buffers.has(url);
}

/** Tests and hot reload only. */
export function clearAudioCache(): void {
  buffers.clear();
  reports.clear();
}
