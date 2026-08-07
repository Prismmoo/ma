import React, { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { ART_FONTS, FONT_GROUPS, FontGroupId, fontFamilyCss } from '../../lib/personalization';

interface FontCarouselProps {
  value: string;
  onChange: (fontId: string) => void;
  sampleText: string;
  fontsReady: boolean;
}

export function FontCarousel({ value, onChange, sampleText, fontsReady }: FontCarouselProps) {
  const [group, setGroup] = useState<FontGroupId>('signature');
  const [query, setQuery] = useState('');

  const preview = sampleText.trim() || 'Your Signature';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return ART_FONTS.filter((f) => f.family.toLowerCase().includes(q));
    return ART_FONTS.filter((f) => f.group === group);
  }, [group, query]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--pz-muted)]">Typeface</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--pz-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fonts"
            aria-label="Search fonts"
            className="h-8 w-36 rounded-md border border-[var(--pz-line)] bg-[var(--pz-surface)] pl-7 pr-2 text-[11px] text-[var(--pz-text)] outline-none placeholder:text-[var(--pz-muted)] focus:border-[var(--pz-accent)]"
          />
        </div>
      </div>

      {!query && (
        <div className="flex flex-wrap gap-1.5">
          {FONT_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(g.id)}
              aria-pressed={group === g.id}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                group === g.id
                  ? 'bg-[var(--pz-accent)] text-white'
                  : 'border border-[var(--pz-line)] bg-[var(--pz-surface)] text-[var(--pz-muted)] hover:border-[var(--pz-line-strong)] hover:text-[var(--pz-text)]'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
        {visible.map((font) => {
          const selected = font.id === value;
          return (
            <button
              key={font.id}
              type="button"
              onClick={() => onChange(font.id)}
              aria-pressed={selected}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                selected
                  ? 'border-[var(--pz-accent)] bg-[var(--pz-accent-soft)]'
                  : 'border-[var(--pz-line)] bg-[var(--pz-surface)] hover:border-[var(--pz-line-strong)] hover:bg-[var(--pz-surface-alt)]'
              }`}
            >
              <span
                className="truncate text-[22px] leading-tight text-[var(--pz-text)]"
                style={{
                  fontFamily: fontFamilyCss(font),
                  fontWeight: font.weight ?? 400,
                  opacity: fontsReady ? 1 : 0.35,
                  transition: 'opacity 240ms ease',
                }}
              >
                {preview}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[9px] uppercase tracking-wider text-[var(--pz-muted)]">{font.family}</span>
                {selected && <Check className="h-4 w-4 text-[var(--pz-accent)]" />}
              </span>
            </button>
          );
        })}

        {visible.length === 0 && (
          <p className="px-1 py-6 text-center text-[11px] text-[var(--pz-muted)]">No typeface matches that search.</p>
        )}
      </div>
    </div>
  );
}

export default FontCarousel;
