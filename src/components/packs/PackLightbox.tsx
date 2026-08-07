import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import type { Painting } from '../../types';
import { imageRefOf } from '../../lib/artRef';
import { formatMAD } from '../../lib/pricing';
import { unitPrice, type PackKind } from '../../lib/packBuilder';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import ArtImage from '../ArtImage';
import type { LightboxOrigin } from '../../hooks/useLightbox';

interface Props {
  painting: Painting;
  origin: LightboxOrigin | null;
  kind: PackKind;
  finishId: string;
  quantity: number;
  atMaximum: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export default function PackLightbox({
  painting, origin, kind, finishId, quantity, atMaximum, onAdd, onRemove, onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [entered, setEntered] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  /**
   * FLIP. useLayoutEffect, not useEffect: the inverted transform must be on the
   * element BEFORE the browser paints, otherwise the panel flashes at full size
   * for one frame and the animation looks broken.
   */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (!origin || reducedMotion) {
      setEntered(true);
      return;
    }

    const target = panel.getBoundingClientRect();
    if (target.width === 0) { setEntered(true); return; }

    // One uniform factor from width. Separate X/Y factors distort the artwork.
    const scale = origin.width / target.width;
    const dx = origin.left + origin.width / 2 - (target.left + target.width / 2);
    const dy = origin.top + origin.height / 2 - (target.top + target.height / 2);

    panel.style.transition = 'none';
    panel.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
    panel.style.opacity = '0.4';

    // Force a reflow so the inverted state is committed before we clear it.
    void panel.offsetWidth;

    const raf = requestAnimationFrame(() => {
      panel.style.transition =
        'transform 340ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease-out';
      panel.style.transform = 'translate3d(0, 0, 0) scale(1)';
      panel.style.opacity = '1';
      setEntered(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [origin, reducedMotion]);

  // Clear will-change once settled so the layer is released.
  useEffect(() => {
    if (!entered) return;
    const panel = panelRef.current;
    const timer = window.setTimeout(() => {
      if (panel) panel.style.willChange = 'auto';
    }, 400);
    return () => window.clearTimeout(timer);
  }, [entered]);

  // Focus the close button so Escape and Tab behave for keyboard users.
  useEffect(() => { closeRef.current?.focus(); }, []);

  const chosen = quantity > 0;
  const price = unitPrice(kind, painting, finishId);

  // The ArtImage wrapper is an absolutely-positioned shell: its children do not
  // contribute intrinsic size, so as a flex item it would collapse to 0x0.
  // Publishing the ratio lets CSS cap max-width by height and give the box a
  // definite size in both axes. Fallback 0.8 = 4/5, the site's default plate.
  const imageRef = imageRefOf(painting);
  const ratio =
    imageRef && imageRef.width > 0 && imageRef.height > 0
      ? imageRef.width / imageRef.height
      : 0.8;

  return (
    <div
      className="pz-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={painting.title}
      // Clicking the backdrop closes. The check keeps clicks INSIDE the panel
      // from bubbling up and closing it — no stopPropagation needed on children.
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className="pz-lightbox__panel"
        style={{ willChange: 'transform, opacity' }}
      >
        <button
          ref={closeRef}
          type="button"
          className="pz-lightbox__close"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="pz-lightbox__stage"
          style={{ ['--pz-lb-ratio' as string]: String(ratio) }}
        >
          <ArtImage
            image={imageRef}
            alt={painting.title}
            sizes="(max-width: 767px) 92vw, min(80vw, 900px)"
            priority
            className="object-contain"
            wrapperClassName="pz-lightbox__frame"
          />
        </div>

        <div className="pz-lightbox__bar">
          <div className="pz-lightbox__info">
            <span className="pz-lightbox__title">{painting.title}</span>
            <span className="pz-lightbox__sub">
              {painting.subCategory ? `${painting.subCategory} · ` : ''}{formatMAD(price)}
            </span>
          </div>

          {chosen ? (
            <div className="pz-lightbox__stepper">
              <button type="button" onClick={onRemove} aria-label="Remove one">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" onClick={onAdd} disabled={atMaximum} aria-label="Add one">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pz-lightbox__add"
              onClick={onAdd}
              disabled={atMaximum}
            >
              <Check className="w-3.5 h-3.5" />
              Add to pack
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
