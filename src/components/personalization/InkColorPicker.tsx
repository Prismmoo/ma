import React, { useMemo, useState } from 'react';
import { Check, Pipette } from 'lucide-react';
import { INK_PRESETS } from '../../lib/personalization';

interface InkColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function InkColorPicker({ value, onChange, label = 'Ink' }: InkColorPickerProps) {
  const [hue, setHue] = useState(265);
  const [lightness, setLightness] = useState(45);

  const hueGradient = useMemo(
    () =>
      'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
    [],
  );

  const applyHsl = (h: number, l: number) => {
    setHue(h);
    setLightness(l);
    onChange(hslToHex(h, 85, l));
  };

  const supportsEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  const pickFromScreen = async () => {
    try {
      const Ctor = (window as unknown as {
        EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
      }).EyeDropper;
      const result = await new Ctor().open();
      onChange(result.sRGBHex);
    } catch {
      /* user canceled */
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--pz-muted)]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[var(--pz-muted)]">{value.toUpperCase()}</span>
          <span
            className="h-5 w-5 rounded-full border border-[var(--pz-line-strong)]"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {INK_PRESETS.map((preset) => {
          const selected = preset.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => onChange(preset.hex)}
              title={preset.name}
              aria-label={preset.name}
              aria-pressed={selected}
              className={`relative h-8 w-8 rounded-full border transition-transform hover:scale-110 cursor-pointer ${
                selected ? 'border-[var(--pz-accent)] ring-2 ring-[var(--pz-accent)]/30' : 'border-[var(--pz-line)]'
              }`}
              style={{ backgroundColor: preset.hex }}
            >
              {selected && (
                <Check
                  className="absolute inset-0 m-auto h-4 w-4"
                  style={{ color: preset.hex === '#FFFFFF' ? '#111111' : '#FFFFFF' }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--pz-line)] bg-[var(--pz-surface-alt)] p-3">
        <input
          type="range"
          min={0}
          max={360}
          value={hue}
          onChange={(e) => applyHsl(Number(e.target.value), lightness)}
          aria-label="Hue"
          className="h-3 w-full cursor-pointer appearance-none rounded-full"
          style={{ background: hueGradient }}
        />
        <input
          type="range"
          min={8}
          max={92}
          value={lightness}
          onChange={(e) => applyHsl(hue, Number(e.target.value))}
          aria-label="Lightness"
          className="h-3 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: `linear-gradient(to right, #000000, ${hslToHex(hue, 85, 50)}, #ffffff)`,
          }}
        />

        <div className="flex items-center gap-2 pt-1">
          <label className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--pz-line)] bg-[var(--pz-surface)] text-[11px] font-semibold text-[var(--pz-text)] transition-colors hover:border-[var(--pz-line-strong)]">
            <span
              className="h-4 w-4 rounded-sm border border-[var(--pz-line)]"
              style={{ backgroundColor: value }}
            />
            Full spectrum
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#111111'}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
          </label>

          <input
            type="text"
            value={value}
            onChange={(e) => {
              const next = e.target.value.trim();
              if (/^#?[0-9a-fA-F]{0,6}$/.test(next)) {
                const withHash = next.startsWith('#') ? next : `#${next}`;
                if (/^#[0-9a-fA-F]{6}$/.test(withHash)) onChange(withHash);
              }
            }}
            aria-label="Hex colour"
            className="h-9 w-24 rounded-md border border-[var(--pz-line)] bg-[var(--pz-surface)] px-2 font-mono text-[11px] text-[var(--pz-text)] outline-none focus:border-[var(--pz-accent)]"
          />

          {supportsEyeDropper && (
            <button
              type="button"
              onClick={pickFromScreen}
              title="Pick a colour from the artwork"
              aria-label="Pick a colour from the artwork"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--pz-line)] bg-[var(--pz-surface)] text-[var(--pz-muted)] transition-colors hover:border-[var(--pz-line-strong)] hover:text-[var(--pz-text)] cursor-pointer"
            >
              <Pipette className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InkColorPicker;
