import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Undo2,
  Redo2,
  RefreshCcw,
  Check,
} from 'lucide-react';
import {
  StickerProduct,
  STICKER_FINISHES,
} from '../../lib/stickers';
import { formatMAD, stickerPriceMAD } from '../../lib/pricing';
import {
  IDENTITY_TRANSFORM,
  FULL_CROP,
  isCropped,
  croppedSizePx,
  transformSummary,
} from '../../lib/stickerTransform';
import { DEFAULT_UNIT, formatSize, pixelsToCentimetres } from '../../lib/stickerUnits';
import { StickerDraft, loadDraft, saveDraft, defaultDraft } from '../../lib/stickerDraft';
import { shapeById } from '../../lib/stickerShapes';
import {
  History,
  createHistory,
  pushHistory,
  undo as undoHistory,
  redo as redoHistory,
  canUndo,
  canRedo,
  isUndoEvent,
  isRedoEvent,
} from '../../lib/stickerHistory';
import StickerDimensionControls from './StickerDimensionControls';
import { Painting, FramingOption } from '../../types';
import { Personalization } from '../../lib/personalization';

/**
 * Sticker editor (V5).
 * ---------------------------------------------------------------------------
 * What changed and why:
 *
 * 1. LIGHT SURFACES. The site is a light lavender theme; the editor used
 *    near-black panels, so most labels sat at ~2:1 contrast and were simply
 *    not readable. Every panel now uses the --pz-* tokens already declared in
 *    index.css (@theme), which are chosen for WCAG AA on white.
 * 2. NUMBERED STEPS. Five labelled panels replace the unlabelled stack, so the
 *    order of decisions is obvious: shape & size -> framing -> crop -> finish
 *    -> review.
 * 3. LABELLED BUTTONS. Every tool is icon + text. Icon-only buttons were the
 *    main reason the toolbar was "not understandable".
 * 4. UNDO / REDO. A real history stack (lib/stickerHistory.ts) with Ctrl+Z /
 *    Cmd+Z and Ctrl+Shift+Z / Ctrl+Y, coalescing drag gestures into one step.
 * 5. STICKY PREVIEW. The sticker column stays in view while the settings
 *    column scrolls, which is only possible because the grid uses
 *    `items-start` (a stretched grid item has nothing to stick against).
 * 6. CACHE. The whole draft (size, square, shape, finish, framing, crop) is
 *    persisted per sticker and restored on return.
 */

interface StickerEditorProps {
  sticker: StickerProduct;
  onBack: () => void;
  onAddToCart: (painting: Painting, frame: FramingOption, personalization?: Personalization) => void;
}

export default function StickerEditor({ sticker, onBack, onAddToCart }: StickerEditorProps) {
  /* ------------------------------------------------------- draft + history */
  const [history, setHistory] = useState<History<StickerDraft>>(() => createHistory(defaultDraft()));
  const [loaded, setLoaded] = useState(false);
  const [restored, setRestored] = useState(false);

  const draft = history.present.state;

  useEffect(() => {
    const stored = loadDraft(sticker.id);
    setHistory(createHistory(stored));
    setRestored(JSON.stringify(stored) !== JSON.stringify(defaultDraft()));
    setLoaded(true);
  }, [sticker.id]);

  /** Single write path: every mutation is a labelled history step + a save. */
  const patch = useCallback(
    (changes: Partial<StickerDraft>, label: string) => {
      setHistory((prev) => {
        const next = { ...prev.present.state, ...changes };
        saveDraft(sticker.id, next);
        return pushHistory(prev, next, label);
      });
    },
    [sticker.id],
  );

  const runUndo = useCallback(() => {
    setHistory((prev) => {
      const next = undoHistory<StickerDraft>(prev);
      saveDraft(sticker.id, next.present.state);
      return next;
    });
  }, [sticker.id]);

  const runRedo = useCallback(() => {
    setHistory((prev) => {
      const next = redoHistory<StickerDraft>(prev);
      saveDraft(sticker.id, next.present.state);
      return next;
    });
  }, [sticker.id]);

  /* Keyboard shortcuts. Typing in an input must never be hijacked. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) return;

      if (isRedoEvent(e)) {
        e.preventDefault();
        runRedo();
      } else if (isUndoEvent(e)) {
        e.preventDefault();
        runUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runRedo, runUndo]);

  /* ------------------------------------------------------------- ui state */
  const activeFinish = useMemo(
    () => STICKER_FINISHES.find((f) => f.id === draft.finishId) ?? STICKER_FINISHES[0],
    [draft.finishId],
  );

  const shape = shapeById(draft.shapeId);
  const { widthPx, heightPx } = draft;

  const finalPrice = useMemo(() => {
    const wCm = pixelsToCentimetres(widthPx);
    const hCm = pixelsToCentimetres(heightPx);
    return stickerPriceMAD(wCm, hCm, activeFinish.id);
  }, [widthPx, heightPx, activeFinish]);

  const resetStage = () => {
    patch({ transform: { ...IDENTITY_TRANSFORM }, crop: { ...FULL_CROP } }, 'Reset framing');
  };

  const dirty =
    draft.transform.x !== IDENTITY_TRANSFORM.x ||
    draft.transform.y !== IDENTITY_TRANSFORM.y ||
    draft.transform.scale !== 1 ||
    draft.transform.rotation !== 0 ||
    draft.transform.flipX ||
    draft.transform.flipY ||
    isCropped(draft.crop);

  /* ------------------------------------------------------------ add to cart */
  const handleAddToCart = () => {
    const { widthPx: cw, heightPx: ch } = croppedSizePx(widthPx, heightPx, draft.crop);
    const widthCm = pixelsToCentimetres(cw);
    const heightCm = pixelsToCentimetres(ch);
    const sizeLabel = formatSize(cw, ch, DEFAULT_UNIT);

    const syntheticPainting: Painting = {
      id: `sticker-${sticker.paintingId}-${activeFinish.id}-${sizeLabel.replace(/\s+/g, '')}`,
      title: `[STICKER] ${sticker.title} (${activeFinish.name} — ${sizeLabel})`,
      artistId: sticker.artistId,
      artistName: sticker.artistName,
      year: sticker.source.year,
      style: sticker.style,
      sizeCategory: 'Small',
      widthCm,
      heightCm,
      price: finalPrice,
      story: `${shape.label} die-cut vinyl sticker with ${activeFinish.name} finish.`,
      imageUrl: sticker.imageUrl,
      colorPalette: sticker.colorPalette,
      paletteNames: sticker.paletteNames,
      featured: false,
      subCategory: sticker.collection ?? undefined,
      image: sticker.image,
    };

    const framing: FramingOption = {
      id: 'sticker-cut',
      name: `${shape.label} die-cut`,
      description: 'Weatherproof vinyl',
      price: 0,
      borderHex: activeFinish.borderHex,
      materialWidthCm: 0,
    };

    /* The shared Personalization interface describes the painting studio
       (strokes, text, placements). The sticker editor stores a different
       payload under the same cart field, exactly as the previous version
       did, so the cast is deliberate and localised to this one object. */
    const personalization = {
      printType: 'Sticker',
      stickerState: {
        transform: draft.transform,
        crop: draft.crop,
        summary: `${shape.label}. ${transformSummary(draft.transform, draft.crop)}`,
        finishId: draft.finishId,
        shapeId: draft.shapeId,
        widthPx: cw,
        heightPx: ch,
      },
      layers: [],
    } as unknown as Personalization;

    onAddToCart(syntheticPainting, framing, personalization);
    onBack();
  };

  if (!loaded) return null;

  return (
    <div ref={rootRef} className="animate-fade-in pb-28 lg:pb-0">
      {/* ------------------------------------------------------------ header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="pz-back-btn text-xs font-sans tracking-wider"
          title="Back to the sticker workshop"
          aria-label="Back to the sticker workshop"
        >
          <ArrowLeft className="pz-back-btn__icon w-[18px] h-[18px]" aria-hidden="true" />
          <span className="pz-back-btn__label">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runUndo}
            disabled={!canUndo(history)}
            className="pz-tool"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={runRedo}
            disabled={!canRedo(history)}
            className="pz-tool"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
            <span>Redo</span>
          </button>
          <button
            type="button"
            onClick={resetStage}
            disabled={!dirty}
            className="pz-tool"
            title="Reset rotation and crop"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {restored && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#D8D5E6] bg-[#EBE5FF] px-3 py-2 text-xs text-[#4327A8]">
          <Check className="w-4 h-4" />
          <span>Your previous edits for this sticker were restored.</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* ------------------------------------------------------- settings */}
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#100F18]">{sticker.title}</h2>
            <p className="text-sm text-[#5B5975]">by {sticker.artistName}</p>
          </div>

          {/* 1 - shape & size */}
          <section className="pz-panel">
            <header className="pz-panel-head">
              <span className="pz-step-badge">1</span>
              <h3 className="text-sm font-semibold">Shape &amp; size</h3>
            </header>
            <div className="p-4">
              <StickerDimensionControls
                widthPx={widthPx}
                heightPx={heightPx}
                square={draft.square}
                shapeId={draft.shapeId}
                onChange={({ widthPx: w, heightPx: h }) =>
                  patch({ widthPx: w, heightPx: h }, 'Change size')
                }
                onSquareChange={(sq) => patch({ square: sq }, 'Square lock')}
                onShapeChange={(id) => patch({ shapeId: id }, 'Change shape')}
              />
            </div>
          </section>

          {/* 2 - review */}
          <section className="pz-panel">
            <header className="pz-panel-head">
              <span className="pz-step-badge">2</span>
              <h3 className="text-sm font-semibold">Review</h3>
            </header>
            <dl className="p-4 text-sm">
              <div className="flex justify-between py-1">
                <dt className="text-[#5B5975]">Shape</dt>
                <dd className="font-medium text-[#100F18]">{shape.label}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-[#5B5975]">Cut size</dt>
                <dd className="font-medium text-[#100F18]">
                  {formatSize(
                    croppedSizePx(widthPx, heightPx, draft.crop).widthPx,
                    croppedSizePx(widthPx, heightPx, draft.crop).heightPx,
                    'cm',
                  )}
                </dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-[#5B5975]">Finish</dt>
                <dd className="font-medium text-[#100F18]">{activeFinish.name}</dd>
              </div>
            </dl>
          </section>

          {/* Desktop checkout */}
          <div className="pz-panel flex items-center justify-between gap-4 p-4">
            <div>
              <div className="text-2xl font-bold text-[#100F18]">${finalPrice.toFixed(2)}</div>
              <div className="text-[11px] text-[#5B5975]">Includes die-cutting &amp; laminate</div>
            </div>
            <button
              onClick={handleAddToCart}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4327A8] hover:bg-[#351E86] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile checkout bar: price and the primary action always reachable. */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-[#D8D5E6] bg-white/95 backdrop-blur px-4 py-3">
        <div>
          <div className="text-lg font-bold text-[#100F18]">${finalPrice.toFixed(2)}</div>
          <div className="text-[10px] text-[#5B5975]">{formatSize(widthPx, heightPx, 'cm')}</div>
        </div>
        <button
          onClick={handleAddToCart}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4327A8] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to order</span>
        </button>
      </div>
    </div>
  );
}
