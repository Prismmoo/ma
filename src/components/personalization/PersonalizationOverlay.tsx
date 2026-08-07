import React, { useCallback, useEffect, useRef } from 'react';
import {
  Stroke,
  TextConfig,
  LayerPlacement,
  fontById,
  fontFamilyCss,
  renderStrokes,
} from '../../lib/personalization';

interface PersonalizationOverlayProps {
  imageUrl?: string;
  aspect?: number;
  strokes?: Stroke[];
  text?: TextConfig;
  drawPlacement?: LayerPlacement;
  textPlacement?: LayerPlacement;
  value?: {
    strokes: Stroke[];
    text: TextConfig;
    drawPlacement: LayerPlacement;
    textPlacement: LayerPlacement;
    uploadedSignatureUrl?: string;
  };
  interactive?: boolean;
  onMovePlacement?: (layer: 'draw' | 'text', patch: Partial<LayerPlacement>) => void;
  uploadedSignatureUrlProp?: string;
  onPlacementChange?: (layer: 'draw' | 'text', patch: Partial<LayerPlacement>) => void;
  activeLayer?: 'draw' | 'text';
  showSafeArea?: boolean;
  fontsReady?: boolean;
}

export function PersonalizationOverlay({
  imageUrl,
  aspect = 1,
  strokes: strokesProp,
  text: textProp,
  drawPlacement: drawPlacementProp,
  textPlacement: textPlacementProp,
  value,
  interactive = true,
  onMovePlacement,
  uploadedSignatureUrlProp,
  onPlacementChange,
  activeLayer = 'draw',
  showSafeArea = false,
}: PersonalizationOverlayProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ layer: 'draw' | 'text'; dx: number; dy: number } | null>(null);

  const notifyChange = onMovePlacement || onPlacementChange;

  const currentStrokes = strokesProp ?? value?.strokes ?? [];
  const currentText = textProp ?? value?.text ?? {
    value: '', fontId: 'great-vibes', color: '#111111', sizeRatio: 0.09, rotation: 0, letterSpacing: 0, align: 'center' as const, shadow: true,
  };
  const currentDrawPl = drawPlacementProp ?? value?.drawPlacement ?? { x: 0.5, y: 0.78, scale: 1, rotation: 0 };
  const currentTextPl = textPlacementProp ?? value?.textPlacement ?? { x: 0.5, y: 0.78, scale: 1, rotation: 0 };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w === 0 || h === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const pl = currentDrawPl;

    ctx.save();
    ctx.translate(pl.x * w, pl.y * h);
    ctx.rotate((pl.rotation * Math.PI) / 180);
    ctx.scale(pl.scale, pl.scale);
    ctx.translate(-w / 2, -h / 2);
    renderStrokes(ctx, currentStrokes, w, h);
    ctx.restore();
  }, [currentStrokes, currentDrawPl]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || !notifyChange) return;
      const wrap = wrapRef.current;
      if (!wrap) return;

      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const current = activeLayer === 'draw' ? currentDrawPl : currentTextPl;

      dragRef.current = { layer: activeLayer, dx: px - current.x, dy: py - current.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [interactive, notifyChange, activeLayer, currentDrawPl, currentTextPl],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      const wrap = wrapRef.current;
      if (!drag || !wrap || !notifyChange) return;

      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - drag.dx;
      const py = (e.clientY - rect.top) / rect.height - drag.dy;

      notifyChange(drag.layer, {
        x: Math.min(0.95, Math.max(0.05, px)),
        y: Math.min(0.95, Math.max(0.05, py)),
      });
    },
    [notifyChange],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const font = fontById(currentText.fontId);
  const tp = currentTextPl;
  const hasText = currentText.value.trim().length > 0;

  return (
    <div
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ containerType: 'inline-size', aspectRatio: aspect }}
      className={`relative w-full overflow-hidden rounded-xl bg-[var(--pz-surface-alt)] shadow-inner ${
        interactive ? 'cursor-move touch-none' : 'pointer-events-none'
      }`}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Artwork preview"
          className="pointer-events-none h-full w-full object-contain select-none"
        />
      )}

      {showSafeArea && (
        <div className="pointer-events-none absolute inset-[6%] rounded-sm border border-dashed border-white/45" />
      )}

      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />

      {(uploadedSignatureUrlProp ?? value?.uploadedSignatureUrl) && (
        <img
          src={uploadedSignatureUrlProp ?? value?.uploadedSignatureUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 max-h-[38%] max-w-[58%] object-contain"
          style={{
            left: `${currentDrawPl.x * 100}%`,
            top: `${currentDrawPl.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${currentDrawPl.rotation}deg) scale(${currentDrawPl.scale})`,
            transformOrigin: 'center',
          }}
        />
      )}

      {hasText && (
        <span
          className="pointer-events-none absolute select-none whitespace-pre-wrap"
          style={{
            left: `${tp.x * 100}%`,
            top: `${tp.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${tp.rotation + currentText.rotation}deg) scale(${tp.scale})`,
            fontSize: `${currentText.sizeRatio * 100}cqw`,
            fontFamily: fontFamilyCss(font),
            fontWeight: font.weight ?? 400,
            color: currentText.color,
            letterSpacing: `${currentText.letterSpacing}em`,
            textAlign: currentText.align,
            textShadow: currentText.shadow ? '0 1px 6px rgba(0,0,0,0.35)' : 'none',
            lineHeight: 1.1,
            maxWidth: '86%',
          }}
        >
          {currentText.value}
        </span>
      )}
    </div>
  );
}

export default PersonalizationOverlay;
