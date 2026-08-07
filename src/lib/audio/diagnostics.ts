import { snapshot, hasGesture, warm, play, stop } from './AudioEngine';
import { ARTIST_HOVER_AUDIO } from '../artistAudio';

export interface Diagnosis {
  verdict: 'ok' | 'needs-gesture' | 'unsupported-format' | 'network' | 'no-webaudio' | 'unknown';
  message: string;
  details: ReturnType<typeof snapshot> & {
    canPlayWebmOpus: string;
    canPlayWebmVorbis: string;
    secureContext: boolean;
    cacheStorage: boolean;
  };
}

/**
 * @param url مسار محدّد للحكم عليه. بدونه تُختار أحدث مسار مسموع، ثم أول
 *            مسار جرى تمرير المؤشر عليه. مع وجود أكثر من فنان، الحكم على
 *            details.tracks[0] وحده يعطي نتيجة عن المسار الخطأ.
 */
export function diagnose(url?: string): Diagnosis {
  const probe = document.createElement('audio');
  const details = {
    ...snapshot(),
    canPlayWebmOpus: probe.canPlayType('audio/webm; codecs="opus"') || 'no',
    canPlayWebmVorbis: probe.canPlayType('audio/webm; codecs="vorbis"') || 'no',
    secureContext: typeof window !== 'undefined' && window.isSecureContext,
    cacheStorage: typeof caches !== 'undefined',
  };

  const track = url
    ? details.tracks.find((t) => t.url === url)
    : details.tracks.find((t) => t.url === details.audible) ??
      details.tracks.find((t) => t.state === 'playing') ??
      details.tracks[0];

  if (!details.contextState || details.contextState === 'none') {
    return { verdict: 'no-webaudio', message: 'This browser has no AudioContext.', details };
  }
  if (!hasGesture() || details.contextState === 'suspended') {
    return {
      verdict: 'needs-gesture',
      message: 'Click anywhere on the page once, then hover the portrait again.',
      details,
    };
  }
  if (track?.state === 'network-error') {
    return {
      verdict: 'network',
      message: `The track could not be downloaded: ${track.detail ?? 'unknown'}. Check CORS on the CDN.`,
      details,
    };
  }
  if (track?.state === 'unsupported') {
    return {
      verdict: 'unsupported-format',
      message:
        'This browser cannot decode the WebM container. Add an .mp3 or .m4a fallback next to it on the CDN.',
      details,
    };
  }
  if (track?.state === 'playing' || track?.state === 'ready') {
    return { verdict: 'ok', message: 'Audio pipeline is healthy.', details };
  }
  return { verdict: 'unknown', message: 'No hover has been attempted yet.', details };
}

/** Exposed on window so the owner can debug from any browser, on any device. */
if (typeof window !== 'undefined') {
  (window as any).__prismAudio = {
    diagnose,
    snapshot,
    warm,
    play,
    stop,
    tracks: ARTIST_HOVER_AUDIO,
    test: async (artistId?: string) => {
      const id = artistId ?? Object.keys(ARTIST_HOVER_AUDIO)[0];
      const entry = ARTIST_HOVER_AUDIO[id];
      if (!entry) {
        console.warn(
          `لا مسار للفنان "${id}". المتاح: ${Object.keys(ARTIST_HOVER_AUDIO).join(', ')}`
        );
        return diagnose();
      }
      console.log('warming', id, entry.primary);
      warm(entry.primary);
      const state = await play(entry.primary);
      console.log('play() =>', state);
      setTimeout(() => stop(entry.primary), 3000);
      return diagnose(entry.primary);
    },
  };
}
