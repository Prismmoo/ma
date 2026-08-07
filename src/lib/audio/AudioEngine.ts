import { fetchAudioBytes, isAudioWarm, lastFetchReport } from './mediaCache';

export type TrackState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'blocked'        // autoplay policy; needs a gesture
  | 'unsupported'    // the browser cannot decode this container
  | 'network-error';

export interface TrackStatus {
  state: TrackState;
  url: string;
  detail?: string;
}

type Listener = (status: TrackStatus) => void;

/* ------------------------------------------------------------------ */
/* Shared AudioContext                                                 */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** Browsers start the context suspended until a gesture. This resumes it. */
async function ensureRunning(): Promise<boolean> {
  const audio = context();
  if (!audio) return false;
  if ((audio.state as string) === 'running') return true;
  try {
    await audio.resume();
    return (audio.state as string) === 'running';
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Gesture latch                                                       */
/* ------------------------------------------------------------------ */

let gestureSeen = false;

function onFirstGesture() {
  gestureSeen = true;
  void ensureRunning();
  ['pointerdown', 'keydown', 'touchstart'].forEach((event) =>
    document.removeEventListener(event, onFirstGesture)
  );
}

if (typeof document !== 'undefined') {
  ['pointerdown', 'keydown', 'touchstart'].forEach((event) =>
    document.addEventListener(event, onFirstGesture, { once: true, passive: true })
  );
}

export function hasGesture(): boolean {
  return gestureSeen;
}

/* ------------------------------------------------------------------ */
/* Track                                                               */
/* ------------------------------------------------------------------ */

interface Track {
  url: string;
  status: TrackStatus;
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  gain: GainNode | null;
  element: HTMLAudioElement | null; // fallback path
  listeners: Set<Listener>;
  wanted: boolean;
}

const tracks = new Map<string, Track>();

/** Only one hover track may be audible at a time, app-wide. */
let audible: string | null = null;

function getTrack(url: string): Track {
  let track = tracks.get(url);
  if (!track) {
    track = {
      url,
      status: { state: 'idle', url },
      buffer: null,
      source: null,
      gain: null,
      element: null,
      listeners: new Set(),
      wanted: false,
    };
    tracks.set(url, track);
  }
  return track;
}

function setStatus(track: Track, state: TrackState, detail?: string) {
  track.status = { state, url: track.url, detail };
  track.listeners.forEach((listener) => listener(track.status));
}

export function subscribe(url: string, listener: Listener): () => void {
  const track = getTrack(url);
  track.listeners.add(listener);
  listener(track.status);
  return () => track.listeners.delete(listener);
}

export function statusOf(url: string): TrackStatus {
  return getTrack(url).status;
}

/* ------------------------------------------------------------------ */
/* Decode                                                              */
/* ------------------------------------------------------------------ */

async function decode(track: Track): Promise<boolean> {
  if (track.buffer) return true;

  const audio = context();
  if (!audio) {
    setStatus(track, 'unsupported', 'no AudioContext');
    return false;
  }

  setStatus(track, 'loading');
  const bytes = await fetchAudioBytes(track.url);
  if (!bytes) {
    const report = lastFetchReport(track.url);
    setStatus(track, 'network-error', report?.error ?? `HTTP ${report?.status ?? '?'}`);
    return false;
  }

  try {
    // slice() because decodeAudioData detaches the buffer, and the cache
    // must keep its copy for the next hover.
    track.buffer = await audio.decodeAudioData(bytes.slice(0));
    setStatus(track, 'ready');
    return true;
  } catch (error) {
    // Safari commonly lands here for WebM. Fall back to the element path.
    setStatus(
      track,
      'unsupported',
      error instanceof Error ? error.message : 'decodeAudioData failed'
    );
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Element fallback                                                    */
/* ------------------------------------------------------------------ */

function elementFallback(track: Track): HTMLAudioElement {
  if (!track.element) {
    const element = new Audio(track.url);
    element.loop = true;
    element.preload = 'auto';
    element.crossOrigin = 'anonymous';
    element.volume = 0;
    track.element = element;
  }
  return track.element;
}

function fadeElement(
  element: HTMLAudioElement,
  target: number,
  ms: number,
  done?: () => void
) {
  const from = element.volume;
  const delta = target - from;
  const startedAt = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - startedAt) / ms);
    const eased = 0.5 - Math.cos(Math.PI * t) / 2;
    element.volume = Math.max(0, Math.min(1, from + delta * eased));
    if (t < 1) requestAnimationFrame(step);
    else done?.();
  };
  requestAnimationFrame(step);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface PlayOptions {
  volume?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  loop?: boolean;
}

/** Download and decode without playing. Safe to call on pointer intent. */
export function warm(url: string): void {
  const track = getTrack(url);
  if (track.buffer || track.status.state === 'loading') return;
  void decode(track);
}

export function isWarm(url: string): boolean {
  return isAudioWarm(url);
}

export async function play(url: string, options: PlayOptions = {}): Promise<TrackState> {
  const { volume = 0.55, fadeInMs = 180, loop = true } = options;
  const track = getTrack(url);
  track.wanted = true;

  // Yield the floor.
  if (audible && audible !== url) stop(audible);
  audible = url;

  const running = await ensureRunning();
  if (!running) {
    setStatus(track, 'blocked', 'AudioContext suspended; waiting for a gesture');
    return 'blocked';
  }

  const decoded = await decode(track);
  if (!track.wanted) return track.status.state;

  const audio = context();

  if (decoded && track.buffer && audio) {
    // Preferred path: WebAudio.
    stopNodes(track);
    const source = audio.createBufferSource();
    source.buffer = track.buffer;
    source.loop = loop;

    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume),
      audio.currentTime + fadeInMs / 1000
    );

    source.connect(gain).connect(audio.destination);
    source.start(0);

    track.source = source;
    track.gain = gain;
    setStatus(track, 'playing');
    return 'playing';
  }

  // Fallback path: element.
  const element = elementFallback(track);
  try {
    element.volume = 0;
    await element.play();
  } catch (error) {
    setStatus(
      track,
      hasGesture() ? 'unsupported' : 'blocked',
      error instanceof Error ? error.message : 'play() rejected'
    );
    return track.status.state;
  }
  if (!track.wanted) {
    element.pause();
    return track.status.state;
  }
  fadeElement(element, volume, fadeInMs);
  setStatus(track, 'playing');
  return 'playing';
}

function stopNodes(track: Track) {
  if (track.source) {
    try {
      track.source.stop();
    } catch {
      /* already stopped */
    }
    track.source.disconnect();
    track.source = null;
  }
  if (track.gain) {
    track.gain.disconnect();
    track.gain = null;
  }
}

export function stop(url: string, fadeOutMs = 220): void {
  const track = tracks.get(url);
  if (!track) return;
  track.wanted = false;
  if (audible === url) audible = null;

  const audio = context();

  if (track.gain && audio) {
    const end = audio.currentTime + fadeOutMs / 1000;
    try {
      track.gain.gain.cancelScheduledValues(audio.currentTime);
      track.gain.gain.setValueAtTime(track.gain.gain.value, audio.currentTime);
      track.gain.gain.exponentialRampToValueAtTime(0.0001, end);
    } catch {
      /* node already detached */
    }
    const source = track.source;
    window.setTimeout(() => {
      // Guard: the pointer may have returned during the fade.
      if (track.wanted) return;
      if (track.source === source) stopNodes(track);
      if (track.status.state === 'playing') setStatus(track, 'ready');
    }, fadeOutMs + 30);
    return;
  }

  if (track.element) {
    const element = track.element;
    fadeElement(element, 0, fadeOutMs, () => {
      if (track.wanted) return;
      element.pause();
      element.currentTime = 0;
      if (track.status.state === 'playing') setStatus(track, 'ready');
    });
  }
}

/** Hard stop with no fade. Used on unmount, tab hide and window blur. */
export function stopAll(): void {
  tracks.forEach((track) => {
    track.wanted = false;
    stopNodes(track);
    if (track.element) {
      track.element.pause();
      track.element.currentTime = 0;
    }
    if (track.status.state === 'playing') setStatus(track, 'ready');
  });
  audible = null;
}

/* Global safety net: nothing survives a hidden tab or a lost window. */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') stopAll();
  });
  window.addEventListener('blur', stopAll);
  window.addEventListener('pagehide', stopAll);
}

export function snapshot() {
  return {
    contextState: ctx?.state ?? 'none',
    gesture: gestureSeen,
    audible,
    tracks: [...tracks.values()].map((track) => ({
      url: track.url,
      state: track.status.state,
      detail: track.status.detail,
      decoded: Boolean(track.buffer),
      usingFallback: Boolean(track.element && !track.buffer),
      fetch: lastFetchReport(track.url),
    })),
  };
}
