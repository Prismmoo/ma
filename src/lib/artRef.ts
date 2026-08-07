import type { Painting, ArtImageRef } from '../types';

/**
 * A Painting may carry EITHER a generated responsive ref (`image`) OR a flat
 * `imageUrl`, never guaranteed both. See isStickerEligible() in lib/stickers.ts,
 * which already encodes that reality.
 *
 * Every display surface must go through this function. Reading `painting.image`
 * directly is how the V15 pack picker rendered a grid of empty rectangles.
 */

/** Cheap stable hash so synthetic refs get a deterministic id. */
function refId(painting: Pick<Painting, 'id'>): string {
  return `ref-${painting.id}`;
}

/**
 * Build a single-candidate ArtImageRef from a flat URL.
 */
export function refFromUrl(
  painting: Pick<Painting, 'id' | 'widthCm' | 'heightCm'>,
  url: string
): ArtImageRef {
  const w = typeof painting.widthCm === 'number' && painting.widthCm > 0 ? painting.widthCm : 4;
  const h = typeof painting.heightCm === 'number' && painting.heightCm > 0 ? painting.heightCm : 5;
  // Scale to a plausible pixel box; only the RATIO is consumed by ArtImage.
  const scale = 100;
  return {
    id: refId(painting),
    src: url,
    srcSet: '',
    width: Math.round(w * scale),
    height: Math.round(h * scale),
    maxWidth: Math.round(w * scale),
  };
}

/**
 * THE function. Returns a renderable ref for any painting, or null when the
 * painting genuinely has no image at all (in which case ArtImage draws its
 * placeholder, which is the correct outcome).
 */
export function imageRefOf(painting: Painting | null | undefined): ArtImageRef | null {
  if (!painting) return null;

  const ref = painting.image;
  if (ref && typeof ref.src === 'string' && ref.src.length > 0) return ref;

  const url = painting.imageUrl;
  if (typeof url === 'string' && url.trim().length > 0) return refFromUrl(painting, url.trim());

  return null;
}

/** True when something will actually paint. Use for filtering, not for display. */
export function hasRenderableImage(painting: Painting | null | undefined): boolean {
  return imageRefOf(painting) !== null;
}
