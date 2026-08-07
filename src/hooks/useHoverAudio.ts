import { useCallback, useEffect, useRef, useState } from 'react';
import { play, stop, warm, subscribe, isWarm, type TrackState } from '../lib/audio/AudioEngine';
import type { ArtistTrack } from '../lib/artistAudio';

interface Options {
  track: ArtistTrack | null;
  enabled: boolean;
  volume?: number;
}

export interface HoverAudio {
  state: TrackState;
  playing: boolean;
  ready: boolean;
  start: () => void;
  stop: () => void;
  warm: () => void;
}

export function useHoverAudio({ track, enabled, volume = 0.55 }: Options): HoverAudio {
  const url = track?.primary ?? null;
  const [state, setState] = useState<TrackState>('idle');
  const attempted = useRef(false);

  useEffect(() => {
    if (!url) return;
    return subscribe(url, (status) => setState(status.state));
  }, [url]);

  const doWarm = useCallback(() => {
    if (!enabled || !url) return;
    warm(url);
  }, [enabled, url]);

  const start = useCallback(() => {
    if (!enabled || !url) return;
    attempted.current = true;
    void play(url, { volume });
  }, [enabled, url, volume]);

  const doStop = useCallback(() => {
    if (!url) return;
    stop(url);
  }, [url]);

  // If the very first hover was blocked by autoplay policy, retry once as soon
  // as the visitor clicks anything. This is the difference between "it never
  // works" and "it works from the second interaction".
  useEffect(() => {
    if (!enabled || !url) return;
    if (state !== 'blocked') return;
    const retry = () => {
      if (attempted.current) warm(url);
    };
    document.addEventListener('pointerdown', retry, { once: true, passive: true });
    return () => document.removeEventListener('pointerdown', retry);
  }, [enabled, url, state]);

  useEffect(() => {
    return () => {
      if (url) stop(url, 0);
    };
  }, [url]);

  useEffect(() => {
    if (!enabled && url) stop(url, 0);
  }, [enabled, url]);

  return {
    state,
    playing: state === 'playing',
    ready: Boolean(url) && (state === 'ready' || state === 'playing' || isWarm(url!)),
    start,
    stop: doStop,
    warm: doWarm,
  };
}
