import {
  ArtTransform,
  CropRect,
  defaultStageState,
  clampTransform,
  clampCrop,
} from './stickerTransform';
import {
  DEFAULT_STICKER_WIDTH_PX,
  DEFAULT_STICKER_HEIGHT_PX,
  clampPixels,
} from './stickerUnits';
import { STICKER_FINISHES } from './stickers';
import { DEFAULT_SHAPE_ID, isKnownShapeId } from './stickerShapes';

/**
 * One cached draft per sticker.
 * ---------------------------------------------------------------------------
 * V5 adds `shapeId` (the die-cut shape). The storage key is versioned, so an
 * old V2 payload is simply ignored instead of being half-read: a schema change
 * must never resurrect a half-valid editor state.
 */
export interface StickerDraft {
  widthPx: number;
  heightPx: number;
  square: boolean;
  shapeId: string;
  finishId: string;
  transform: ArtTransform;
  crop: CropRect;
}

export const DRAFT_PREFIX = 'prism.sticker.draft.v3.';

export function defaultDraft(): StickerDraft {
  return {
    widthPx: DEFAULT_STICKER_WIDTH_PX,
    heightPx: DEFAULT_STICKER_HEIGHT_PX,
    square: true,
    shapeId: DEFAULT_SHAPE_ID,
    finishId: STICKER_FINISHES[0].id,
    ...defaultStageState(),
  };
}

function isFinishId(id: unknown): id is string {
  return typeof id === 'string' && STICKER_FINISHES.some((f) => f.id === id);
}

/**
 * Defensive parser: hand-edited or truncated localStorage must produce a
 * usable editor, never a crash and never an out-of-range value. Every numeric
 * field is re-clamped through the same helpers the UI uses.
 */
export function parseDraft(raw: string | null): StickerDraft {
  const def = defaultDraft();
  if (!raw) return def;

  try {
    const parsed = JSON.parse(raw) as Partial<StickerDraft>;

    return {
      widthPx: typeof parsed.widthPx === 'number' && Number.isFinite(parsed.widthPx)
        ? clampPixels(parsed.widthPx)
        : def.widthPx,
      heightPx: typeof parsed.heightPx === 'number' && Number.isFinite(parsed.heightPx)
        ? clampPixels(parsed.heightPx)
        : def.heightPx,
      square: typeof parsed.square === 'boolean' ? parsed.square : def.square,
      shapeId: isKnownShapeId(parsed.shapeId) ? (parsed.shapeId as string) : def.shapeId,
      finishId: isFinishId(parsed.finishId) ? parsed.finishId : def.finishId,
      transform: parsed.transform ? clampTransform({ ...def.transform, ...parsed.transform }) : def.transform,
      crop: parsed.crop ? clampCrop({ ...def.crop, ...parsed.crop }) : def.crop,
    };
  } catch {
    return def;
  }
}

export function loadDraft(stickerId: string): StickerDraft {
  if (typeof window === 'undefined') return defaultDraft();
  try {
    return parseDraft(window.localStorage.getItem(DRAFT_PREFIX + stickerId));
  } catch {
    return defaultDraft();
  }
}

export function saveDraft(stickerId: string, draft: StickerDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DRAFT_PREFIX + stickerId, JSON.stringify(draft));
  } catch {
    /* quota exceeded or Safari private mode: losing the cache must never
       break the editor, so the failure is intentionally swallowed. */
  }
}

export function clearDraft(stickerId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DRAFT_PREFIX + stickerId);
  } catch {
    /* ignore */
  }
}
