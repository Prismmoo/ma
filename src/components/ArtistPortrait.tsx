import React from 'react';
import { Award } from 'lucide-react';
import type { Artist } from '../types';
import { artistTrack } from '../lib/artistAudio';
import { useHoverAudio } from '../hooks/useHoverAudio';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useNetworkQuality } from '../hooks/useNetworkQuality';

interface Props {
  artist: Artist;
  reversed: boolean;
}

export default function ArtistPortrait({ artist, reversed }: Props) {
  const track = artistTrack(artist.id);
  const { isFinePointer } = useBreakpoint();
  const reducedMotion = usePrefersReducedMotion();
  const { saveData } = useNetworkQuality();

  // Hover audio needs a real hover. On touch there is no hover state, and the
  // Tailwind hover: class latches after a tap, which would strand the track
  // playing. So the feature is fine-pointer only.
  const enabled = Boolean(track) && isFinePointer && !reducedMotion && !saveData;

  const audio = useHoverAudio({ track, enabled });

  return (
    <div className={`lg:col-span-4 ${reversed ? 'lg:order-last' : ''}`}>
      <div
        className="aspect-square bg-forest-black border border-forest-sage/20 p-6 relative overflow-hidden group shadow-sm"
        onPointerEnter={audio.start}
        onPointerLeave={audio.stop}
        onFocus={audio.start}
        onBlur={audio.stop}
        onPointerMove={audio.warm}
      >
        <img
          src={artist.avatarUrl}
          alt={artist.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700 shadow-md"
          referrerPolicy="no-referrer"
        />

        <div className="absolute top-4 right-4 bg-forest-deep border border-forest-sage/20 p-1.5 rounded-full shadow-sm text-xs text-forest-cream">
          <Award className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
