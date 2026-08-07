/**
 * Pure geometry for the Canva-style sticker stage.
 *
 * Everything here is framework free and unit free: values are normalised to the
 * cut area (0..1 on both axes) so a transform survives a size change, a unit
 * change and a reload. No DOM, no React: this file is fully testable.
 */

export interface ArtTransform {
  /** Centre of the artwork inside the cut area, 0..1 (0.5 = centred). */
  x: number;
  y: number;
  /** Uniform zoom. 1 = the artwork exactly fits the cut area (contain). */
  scale: number;
  /** Rotation in degrees, -180..180. */
  rotation: number;
  /** Mirroring. */
  flipX: boolean;
  flipY: boolean;
}

/** Crop window expressed as insets of the cut area, 0..1 from each edge. */
export interface CropRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type CropHandle =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se'
  | 'move';

export const MIN_SCALE = 0.2;
export const MAX_SCALE = 6;
/** The crop window can never become smaller than this share of the cut area. */
export const MIN_CROP = 0.12;

export const IDENTITY_TRANSFORM: ArtTransform = {
  x: 0.5,
  y: 0.5,
  scale: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
};

export const FULL_CROP: CropRect = { left: 0, top: 0, right: 0, bottom: 0 };

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Rounds to 4 decimals so stored state stays small and comparable. */
export function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function clampTransform(t: ArtTransform): ArtTransform {
  return {
    x: round4(clamp(t.x, -1, 2)),
    y: round4(clamp(t.y, -1, 2)),
    scale: round4(clamp(t.scale, MIN_SCALE, MAX_SCALE)),
    rotation: round4(normaliseAngle(t.rotation)),
    flipX: !!t.flipX,
    flipY: !!t.flipY,
  };
}

/** Keeps an angle inside -180..180. */
export function normaliseAngle(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a + 0; /* turns -0 into 0 so stored values stay comparable */
}

/** Snaps to the nearest multiple of `step` when within `tolerance` degrees. */
export function snapAngle(deg: number, step = 90, tolerance = 4): number {
  const nearest = Math.round(deg / step) * step;
  return Math.abs(deg - nearest) <= tolerance ? normaliseAngle(nearest) : normaliseAngle(deg);
}

export function isCropped(crop: CropRect): boolean {
  return crop.left > 0.001 || crop.top > 0.001 || crop.right > 0.001 || crop.bottom > 0.001;
}

export function cropWidth(crop: CropRect): number {
  return 1 - crop.left - crop.right;
}

export function cropHeight(crop: CropRect): number {
  return 1 - crop.top - crop.bottom;
}

/** Guarantees a usable window: never inverted, never below MIN_CROP. */
export function clampCrop(crop: CropRect): CropRect {
  let left = clamp(crop.left, 0, 1 - MIN_CROP);
  let right = clamp(crop.right, 0, 1 - MIN_CROP);
  if (left + right > 1 - MIN_CROP) {
    const excess = left + right - (1 - MIN_CROP);
    right = Math.max(0, right - excess);
    if (left + right > 1 - MIN_CROP) left = Math.max(0, 1 - MIN_CROP - right);
  }

  let top = clamp(crop.top, 0, 1 - MIN_CROP);
  let bottom = clamp(crop.bottom, 0, 1 - MIN_CROP);
  if (top + bottom > 1 - MIN_CROP) {
    const excess = top + bottom - (1 - MIN_CROP);
    bottom = Math.max(0, bottom - excess);
    if (top + bottom > 1 - MIN_CROP) top = Math.max(0, 1 - MIN_CROP - bottom);
  }

  return { left: round4(left), top: round4(top), right: round4(right), bottom: round4(bottom) };
}

/**
 * Applies a pointer drag to one crop handle.
 * `dx`/`dy` are normalised deltas (pixels / stage size).
 */
export function resizeCrop(crop: CropRect, handle: CropHandle, dx: number, dy: number): CropRect {
  const next: CropRect = { ...crop };

  if (handle === 'move') {
    const w = cropWidth(crop);
    const h = cropHeight(crop);
    const left = clamp(crop.left + dx, 0, 1 - w);
    const top = clamp(crop.top + dy, 0, 1 - h);
    return clampCrop({ left, top, right: 1 - left - w, bottom: 1 - top - h });
  }

  if (handle.includes('w')) next.left = crop.left + dx;
  if (handle.includes('e')) next.right = crop.right - dx;
  if (handle.includes('n')) next.top = crop.top + dy;
  if (handle.includes('s')) next.bottom = crop.bottom - dy;

  return clampCrop(next);
}

/** Distance between two pointers - used for pinch zoom. */
export function pointerDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Angle in degrees between two pointers - used for two-finger rotation. */
export function pointerAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/**
 * CSS transform for the artwork layer.
 * Order matters: translate, then rotate, then scale, then mirror.
 */
export function artworkCssTransform(t: ArtTransform): string {
  const tx = (t.x - 0.5) * 100;
  const ty = (t.y - 0.5) * 100;
  const sx = t.flipX ? -t.scale : t.scale;
  const sy = t.flipY ? -t.scale : t.scale;
  return `translate(-50%, -50%) translate(${round4(tx)}%, ${round4(ty)}%) rotate(${round4(t.rotation)}deg) scale(${round4(sx)}, ${round4(sy)})`;
}

/** `clip-path: inset(...)` for the crop window. */
export function cropCssInset(crop: CropRect): string {
  return `inset(${round4(crop.top * 100)}% ${round4(crop.right * 100)}% ${round4(crop.bottom * 100)}% ${round4(crop.left * 100)}%)`;
}

/**
 * After a crop, the visible cut is smaller than the requested sheet.
 * This returns the real printed size in pixels.
 */
export function croppedSizePx(
  widthPx: number,
  heightPx: number,
  crop: CropRect,
): { widthPx: number; heightPx: number } {
  return {
    widthPx: widthPx * cropWidth(crop),
    heightPx: heightPx * cropHeight(crop),
  };
}

/** Human readable summary stored with the order. */
export function transformSummary(t: ArtTransform, crop: CropRect): string {
  const parts: string[] = [];
  if (Math.abs(t.scale - 1) > 0.01) parts.push(`zoom ${t.scale.toFixed(2)}x`);
  if (Math.abs(t.rotation) > 0.5) parts.push(`rotated ${Math.round(t.rotation)}deg`);
  if (t.flipX) parts.push('flipped horizontally');
  if (t.flipY) parts.push('flipped vertically');
  if (Math.abs(t.x - 0.5) > 0.01 || Math.abs(t.y - 0.5) > 0.01) parts.push('repositioned');
  if (isCropped(crop)) {
    parts.push(
      `cropped to ${Math.round(cropWidth(crop) * 100)}% x ${Math.round(cropHeight(crop) * 100)}%`,
    );
  }
  return parts.length ? parts.join(', ') : 'original framing';
}

/* ---------------------------------------------------------------------------
 * Persistence of the stage state (separate from the personalization store so
 * nothing about the existing poster flow changes).
 * ------------------------------------------------------------------------- */

export interface StageState {
  transform: ArtTransform;
  crop: CropRect;
}

export const STAGE_STORAGE_PREFIX = 'prism.sticker.stage.v1.';

export function defaultStageState(): StageState {
  return { transform: { ...IDENTITY_TRANSFORM }, crop: { ...FULL_CROP } };
}

/** Defensive parsing: a corrupt record must never break the editor. */
export function parseStageState(raw: string | null): StageState {
  if (!raw) return defaultStageState();
  try {
    const parsed = JSON.parse(raw) as Partial<StageState>;
    return {
      transform: clampTransform({ ...IDENTITY_TRANSFORM, ...(parsed.transform ?? {}) }),
      crop: clampCrop({ ...FULL_CROP, ...(parsed.crop ?? {}) }),
    };
  } catch {
    return defaultStageState();
  }
}

export function loadStageState(stickerId: string): StageState {
  if (typeof window === 'undefined') return defaultStageState();
  try {
    return parseStageState(window.localStorage.getItem(STAGE_STORAGE_PREFIX + stickerId));
  } catch {
    return defaultStageState();
  }
}

export function saveStageState(stickerId: string, state: StageState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STAGE_STORAGE_PREFIX + stickerId, JSON.stringify(state));
  } catch {
    /* quota or private mode: the editor keeps working in memory */
  }
}
