import React, { useState } from 'react';
import { Lock, Unlock, Shapes, Check } from 'lucide-react';
import {
  MIN_STICKER_CM,
  MAX_STICKER_CM,
  centimetresToPixels,
  displayValue,
  parseDimension,
  formatSize,
} from '../../lib/stickerUnits';
import { STICKER_SHAPES, shapeById } from '../../lib/stickerShapes';

/**
 * Cut size + cut shape (V5).
 * ---------------------------------------------------------------------------
 * - Centimetres only. `px` and `mm` are still supported by the conversion
 *   helpers (the render pipeline and the price engine are pixel based at
 *   96 PPI) but they are no longer exposed: customers order in cm.
 * - The shape picker lives here, not in a separate step, because shape and
 *   size are one decision: picking "Rectangle" changes the ratio, picking
 *   "Circle" forces 1:1. Splitting them would let the two contradict.
 * - Every control is a real button/input with a visible text label. The
 *   previous icon-only, dark-on-dark version was unreadable.
 */

export const SQUARE_PRESETS_CM = [
  { label: 'Small', cm: 6 },
  { label: 'Standard', cm: 10 },
  { label: 'Large', cm: 15 },
  { label: 'XL', cm: 20 },
];

interface Props {
  widthPx: number;
  heightPx: number;
  square: boolean;
  shapeId: string;
  onChange: (next: { widthPx: number; heightPx: number }) => void;
  onSquareChange: (square: boolean) => void;
  onShapeChange: (shapeId: string) => void;
}

export default function StickerDimensionControls({
  widthPx,
  heightPx,
  square,
  shapeId,
  onChange,
  onSquareChange,
  onShapeChange,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [shapesOpen, setShapesOpen] = useState(false);

  const shape = shapeById(shapeId);
  const widthCm = displayValue(widthPx, 'cm');
  const heightCm = displayValue(heightPx, 'cm');

  const commit = (raw: string, axis: 'w' | 'h') => {
    const parsed = parseDimension(raw, 'cm');
    if (!parsed.ok) {
      setError(parsed.message ?? 'Enter a size between ' + MIN_STICKER_CM + ' and ' + MAX_STICKER_CM + ' cm.');
      return;
    }
    setError(null);

    if (square) {
      onChange({ widthPx: parsed.pixels, heightPx: parsed.pixels });
      return;
    }

    onChange(
      axis === 'w'
        ? { widthPx: parsed.pixels, heightPx }
        : { widthPx, heightPx: parsed.pixels },
    );
  };

  const applyPreset = (cm: number) => {
    setError(null);
    const px = centimetresToPixels(cm);
    onChange({ widthPx: px, heightPx: square ? px : heightPx });
  };

  /**
   * Picking a shape also applies its natural ratio, otherwise a "Banner"
   * printed at 1:1 would look nothing like its thumbnail. The longest side is
   * kept, so the sticker never silently shrinks.
   */
  const applyShape = (id: string) => {
    const next = shapeById(id);
    onShapeChange(id);
    setShapesOpen(false);

    if (next.locksSquare) {
      onSquareChange(true);
      const side = Math.max(widthPx, heightPx);
      onChange({ widthPx: side, heightPx: side });
      return;
    }

    onSquareChange(false);
    const longest = Math.max(widthPx, heightPx);
    if (next.aspect >= 1) {
      onChange({ widthPx: longest, heightPx: longest / next.aspect });
    } else {
      onChange({ widthPx: longest * next.aspect, heightPx: longest });
    }
  };

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------ cut shape */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs font-semibold text-[#5B5975]">Cut shape</span>
          <span className="text-xs text-[#5B5975]">{formatSize(widthPx, heightPx, 'cm')}</span>
        </div>

        <button
          type="button"
          onClick={() => setShapesOpen((v) => !v)}
          aria-expanded={shapesOpen}
          aria-controls="pz-shape-panel"
          className="pz-chip w-full flex items-center gap-3 px-3 py-2.5 text-left"
        >
          <span
            className="pz-shape-preview shrink-0"
            style={shape.clipPath ? { clipPath: shape.clipPath } : { borderRadius: '9999px' }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#100F18]">{shape.label}</span>
            <span className="block text-xs text-[#5B5975] truncate">{shape.hint}</span>
          </span>
          <Shapes className="w-4 h-4 text-[#4327A8] shrink-0" aria-hidden="true" />
        </button>

        {shapesOpen && (
          <div
            id="pz-shape-panel"
            className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2 rounded-2xl border border-[#D8D5E6] bg-[#F4F3F9] p-2"
          >
            {STICKER_SHAPES.map((s) => {
              const active = s.id === shapeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyShape(s.id)}
                  title={s.hint}
                  className="pz-chip flex flex-col items-center gap-1.5 px-2 py-2.5"
                >
                  <span className="relative grid place-items-center w-8 h-8">
                    <span
                      className="pz-shape-preview"
                      style={s.clipPath ? { clipPath: s.clipPath } : { borderRadius: '9999px', opacity: 0.55 }}
                      aria-hidden="true"
                    />
                    {active && (
                      <Check className="absolute -right-1 -top-1 w-3.5 h-3.5 text-[#4327A8]" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-[11px] font-medium text-[#100F18] leading-none">{s.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------- cut dimensions */}
      <div>
        <span className="block text-xs font-semibold text-[#5B5975] mb-2">Cut dimensions (cm)</span>

        <div className="flex items-end gap-2">
          <label className="flex-1">
            <span className="block text-[11px] text-[#5B5975] mb-1">Width</span>
            <input
              type="number"
              inputMode="decimal"
              className="pz-field"
              min={MIN_STICKER_CM}
              max={MAX_STICKER_CM}
              step={0.5}
              value={widthCm}
              onChange={(e) => commit(e.target.value, 'w')}
              aria-label="Sticker width in centimetres"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              const next = !square;
              onSquareChange(next);
              if (next) onChange({ widthPx, heightPx: widthPx });
            }}
            aria-pressed={square}
            title={square ? 'Square lock is on' : 'Square lock is off'}
            className="pz-tool mb-1"
          >
            {square ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>Square</span>
          </button>

          <label className="flex-1">
            <span className="block text-[11px] text-[#5B5975] mb-1">Height</span>
            <input
              type="number"
              inputMode="decimal"
              className="pz-field"
              min={MIN_STICKER_CM}
              max={MAX_STICKER_CM}
              step={0.5}
              value={heightCm}
              disabled={square}
              onChange={(e) => commit(e.target.value, 'h')}
              aria-label="Sticker height in centimetres"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs text-[#A32530]">
            {error}
          </p>
        )}

        <div className="mt-3 grid grid-cols-4 gap-2">
          {SQUARE_PRESETS_CM.map((preset) => {
            const active = square && Math.abs(widthCm - preset.cm) < 0.05;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={active}
                onClick={() => applyPreset(preset.cm)}
                className="pz-chip px-2 py-2 text-center"
              >
                <span className="block text-[11px] font-semibold text-[#100F18]">{preset.label}</span>
                <span className="block text-[10px] text-[#5B5975]">
                  {preset.cm} x {preset.cm} cm
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-[11px] text-[#5B5975]">
          Printed at 96 PPI. Minimum {MIN_STICKER_CM} cm, maximum {MAX_STICKER_CM} cm per side.
        </p>
      </div>
    </div>
  );
}
