import React, { useMemo, useState, useEffect } from 'react';
import { ChevronDown, Check, Lock, Unlock } from 'lucide-react';
import {
  SYSTEM_LABELS,
  type SizeMatch,
  type SizeSystem,
  type OrientationChoice,
  ORIENTATION_LABELS,
} from '../../lib/printSizes';
import {
  SHAPE_LABELS,
  FIT_LABELS,
  FIT_HINTS,
  shapeOf,
  MIN_SIDE_CM,
  MAX_SIDE_CM,
  type SizeShape,
  type FitMode,
} from '../../lib/sizeMath';

type Props = {
  matches: SizeMatch[];
  activeId: string | null;
  isCustom: boolean;
  customLabel: string;
  onPick: (id: string) => void;
  onClearCustom: () => void;
  /* ── جديد ── */
  widthCm: number;
  heightCm: number;
  onCustomSize: (size: { widthCm: number; heightCm: number }) => void;
  lockRatio: boolean;
  onToggleLockRatio: () => void;
  fitMode: FitMode;
  onFitMode: (m: FitMode) => void;
  orientation: OrientationChoice;
  onOrientation: (next: OrientationChoice) => void;
  fitNote: string;
  cropLossPct: number;
  dpi: number;
  ratio: string;
  shape: SizeShape;
  nearStandardLabel: string | null;
  atLimit: boolean;
  /* V36 — على الهاتف نخفي حقلَي العرض/الارتفاع الرقميين ومفتاح القفل:
     التحجيم يتم باللمس على المسرح مباشرة، بنسبة مقفلة. */
  compact?: boolean;
};

/** أكبر بُعد يُرسم به المستطيل المصغّر (px) */
const SWATCH_MAX = 34;

function SizeSwatch({
  widthCm,
  heightCm,
  maxCm,
  active,
}: {
  widthCm: number;
  heightCm: number;
  maxCm: number;
  active: boolean;
}) {
  const k = SWATCH_MAX / Math.max(1, maxCm);
  return (
    <span
      className="shrink-0 flex items-end justify-center"
      style={{ width: SWATCH_MAX, height: SWATCH_MAX }}
    >
      <span
        className={`block border rounded-xs ${active ? 'border-ui-accent bg-ui-accent-soft' : 'border-ui-line-strong bg-ui-surface-alt'}`}
        style={{
          width: Math.max(4, widthCm * k),
          height: Math.max(4, heightCm * k),
        }}
      />
    </span>
  );
}

/**
 * حقل سنتيمتر واحد.
 *
 * لماذا مسودة محلّية وليس ربطًا مباشرًا بالحالة؟ لأن الربط المباشر
 * يجعل كل ضغطة مفتاح تمرّ عبر التطبيع والتدوير، فيمتنع كتابة "4" قبل "40"
 * لأن 4 تُقصّ فورًا إلى 10. المسودة تُطبّق عند الخروج أو Enter.
 *
 * ولماذا replace(',', '.')؟ لأن لوحة المفاتيح الفرنسية والمغربية تكتب "40,5"،
 * و Number("40,5") يعطي NaN فيضيع ما كتبه الزبون بلا تفسير.
 */
function CmInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(Math.round(value * 10) / 10));

  useEffect(() => {
    setDraft(String(Math.round(value * 10) / 10));
  }, [value]);

  const apply = () => {
    const n = Number(draft.replace(',', '.'));
    if (!Number.isFinite(n)) {
      setDraft(String(Math.round(value * 10) / 10));
      return;
    }
    onCommit(n);
  };

  return (
    <label className="flex-1 min-w-0">
      <span className="block text-ui-muted text-[10px] uppercase tracking-wider mb-1">
        {label}
      </span>
      <span className="flex items-center gap-1 px-2 py-1.5 rounded-xs border border-ui-line bg-ui-surface focus-within:border-ui-accent">
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full bg-transparent text-ui-text text-[12px] tabular-nums outline-none"
          aria-label={`${label} in centimetres`}
        />
        <span className="shrink-0 text-ui-muted text-[10px]">cm</span>
      </span>
    </label>
  );
}

export default function SizeField({
  matches,
  activeId,
  isCustom,
  customLabel,
  onPick,
  onClearCustom,
  widthCm,
  heightCm,
  onCustomSize,
  lockRatio,
  onToggleLockRatio,
  compact = false,
  fitMode,
  onFitMode,
  orientation,
  onOrientation,
  fitNote,
  cropLossPct,
  dpi,
  ratio,
  shape,
  nearStandardLabel,
  atLimit,
}: Props) {
  const [open, setOpen] = useState(false);
  const [system, setSystem] = useState<SizeSystem | 'ALL'>('ALL');
  const [shapeFilter, setShapeFilter] = useState<SizeShape | 'ALL'>('ALL');

  /* مرشّحان متعامدان: المعيار (من أين جاء المقاس) والشكل (كيف يبدو).
     المشتري يفكّر بالثاني، والمطبعة تفكّر بالأول. */
  const visible = useMemo(
    () =>
      matches.filter(
        (m) =>
          (system === 'ALL' || m.size.system === system) &&
          (shapeFilter === 'ALL' || shapeOf(m.widthCm, m.heightCm) === shapeFilter),
      ),
    [matches, system, shapeFilter],
  );

  const maxCm = useMemo(
    () => visible.reduce((mx, m) => Math.max(mx, m.widthCm, m.heightCm), 1),
    [visible],
  );

  const active = matches.find((m) => m.size.id === activeId) ?? null;

  const summary = isCustom
    ? customLabel
    : active
      ? `${active.size.label} · ${Math.round(active.widthCm)}×${Math.round(active.heightCm)} cm`
      : 'Studio original size';

  const ratioOf = heightCm / Math.max(1e-6, widthCm);

  return (
    <div className="relative">
      {/* الخانة المطوية — كما كانت تمامًا */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm border border-ui-line bg-ui-surface hover:border-ui-line-strong hover:bg-ui-surface-alt transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent"
      >
        {active && (
          <SizeSwatch
            widthCm={active.widthCm}
            heightCm={active.heightCm}
            maxCm={maxCm}
            active
          />
        )}
        <span className="flex-1 text-left min-w-0">
          <span className="block text-[12px] font-medium text-ui-text truncate">{summary}</span>
          {active && (
            <span className="block text-ui-muted text-[11px] mt-0.5">
              {active.size.inches} ·{' '}
              {active.fit === 'perfect' ? 'Exact ratio' : 'Adapted ratio'}
            </span>
          )}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-ui-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {isCustom && (
        <button
          type="button"
          onClick={onClearCustom}
          className="mt-1.5 text-[10px] uppercase tracking-wider text-ui-accent cursor-pointer hover:underline"
        >
          Clear custom size
        </button>
      )}

      {/* ══ المقاس اليدوي ══ */}
      {!compact && (
        <div className="mt-3 rounded-sm border border-ui-line bg-ui-surface-alt p-3">
          <div className="flex items-end gap-2">
            <CmInput
              label="Width"
              value={widthCm}
              onCommit={(w) =>
                onCustomSize({
                  widthCm: w,
                  heightCm: lockRatio ? w * ratioOf : heightCm,
                })
              }
            />
            <span className="pb-2 text-ui-muted text-[12px]">×</span>
            <CmInput
              label="Height"
              value={heightCm}
              onCommit={(h) =>
                onCustomSize({
                  widthCm: lockRatio ? h / Math.max(1e-6, ratioOf) : widthCm,
                  heightCm: h,
                })
              }
            />
            <button
              type="button"
              onClick={onToggleLockRatio}
              aria-pressed={lockRatio}
              title={lockRatio ? 'Ratio locked — click to free both sides' : 'Ratio free — click to lock'}
              className={`shrink-0 mb-0.5 w-8 h-8 flex items-center justify-center rounded-xs border transition-colors cursor-pointer ${
                lockRatio
                  ? 'border-ui-accent bg-ui-accent-soft text-ui-accent'
                  : 'border-ui-line bg-ui-surface text-ui-muted hover:border-ui-line-strong'
              }`}
            >
              {lockRatio ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          </div>

          <p className="mt-2 text-ui-muted text-[10px] leading-relaxed">
            {lockRatio
              ? 'Ratio locked. Drag any handle on the artwork, or type one side and the other follows.'
              : 'Ratio free. Drag the side handles to set width and height independently.'}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] tabular-nums">
            <span className="text-ui-muted">
              {SHAPE_LABELS[shape]} · {ratio}
            </span>
            {nearStandardLabel && (
              <span className="text-ui-accent">≈ {nearStandardLabel}</span>
            )}
            {dpi > 0 && <span className="text-ui-muted">{dpi} DPI</span>}
            {atLimit && (
              <span className="text-ui-text">
                Limit reached · {MIN_SIDE_CM}–{MAX_SIDE_CM} cm per side
              </span>
            )}
          </div>
        </div>
      )}

      {/* ══ كيف يملأ العمل المقاس ══ */}
      <div className="mt-3">
        <span className="block text-ui-muted text-[10px] uppercase tracking-wider mb-1.5">
          Artwork inside the format
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {(['cover', 'contain', 'extend'] as FitMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onFitMode(m)}
              aria-pressed={fitMode === m}
              title={FIT_HINTS[m]}
              className={`px-2 py-2 rounded-xs border text-[10px] leading-tight transition-colors cursor-pointer ${
                fitMode === m
                  ? 'border-ui-accent bg-ui-accent-soft text-ui-text'
                  : 'border-ui-line bg-ui-surface text-ui-muted hover:border-ui-line-strong'
              }`}
            >
              {FIT_LABELS[m]}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-ui-muted text-[10px] leading-relaxed">{fitNote}</p>
      </div>

      {/* اختيار الاتجاه: يفتح الـ 64 مقاسًا على اتجاهيهما فيصيرون 128 خيارًا.
          يستعمل رموز الموقع (ui-*) حصرًا — لا لون جديد ولا فئة جديدة. */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] ui-muted">
            Orientation
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Print orientation"
          className="grid grid-cols-3 gap-1 p-1 rounded-md ui-surface-alt ui-line border"
        >
          {(['auto', 'portrait', 'landscape'] as const).map((opt) => {
            const active = orientation === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onOrientation(opt)}
                className={[
                  'px-2 py-1.5 rounded text-[11px] font-medium transition-colors',
                  active ? 'ui-accent ui-on-accent' : 'ui-text hover:ui-surface',
                ].join(' ')}
              >
                {opt === 'auto' ? 'Auto' : ORIENTATION_LABELS[opt]}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] ui-muted leading-snug">
          {orientation === 'auto'
            ? 'Formats follow the shape of the artwork.'
            : `Every format is shown ${ORIENTATION_LABELS[orientation].toLowerCase()}. Use "Whole artwork" or "Whole artwork, extended" below if you do not want the artwork cropped.`}
        </p>
      </div>

      {/* القائمة المتوسّعة */}
      {open && (
        <div className="mt-2 rounded-sm border border-ui-line-strong bg-ui-surface shadow-md overflow-hidden">
          <div className="p-2 border-b border-ui-line bg-ui-surface-alt grid grid-cols-2 gap-2">
            <select
              value={shapeFilter}
              onChange={(e) => setShapeFilter(e.target.value as SizeShape | 'ALL')}
              aria-label="Filter by shape"
              className="w-full bg-ui-surface text-ui-text text-[11px] px-2.5 py-1.5 rounded-xs border border-ui-line cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent"
            >
              <option value="ALL">All shapes</option>
              {(Object.keys(SHAPE_LABELS) as SizeShape[]).map((s) => (
                <option key={s} value={s}>
                  {SHAPE_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={system}
              onChange={(e) => setSystem(e.target.value as SizeSystem | 'ALL')}
              aria-label="Filter by standard"
              className="w-full bg-ui-surface text-ui-text text-[11px] px-2.5 py-1.5 rounded-xs border border-ui-line cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent"
            >
              <option value="ALL">All standards ({matches.length})</option>
              {(Object.keys(SYSTEM_LABELS) as SizeSystem[]).map((s) => (
                <option key={s} value={s}>
                  {SYSTEM_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-ui-line/40">
            {visible.length === 0 && (
              <p className="px-3.5 py-4 text-ui-muted text-[11px]">
                No size matches both filters.
              </p>
            )}
            {visible.map((m) => {
              const isActive = !isCustom && activeId === m.size.id;
              return (
                <button
                  key={m.size.id}
                  type="button"
                  onClick={() => {
                    onPick(m.size.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                    isActive ? 'bg-ui-accent-soft' : 'hover:bg-ui-surface-alt'
                  }`}
                >
                  <SizeSwatch
                    widthCm={m.widthCm}
                    heightCm={m.heightCm}
                    maxCm={maxCm}
                    active={isActive}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] font-medium text-ui-text truncate">
                      {m.size.label}
                    </span>
                    <span className="block text-ui-muted text-[11px]">
                      {Math.round(m.widthCm)}×{Math.round(m.heightCm)} cm · {m.size.inches}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[10px] font-medium ${
                      m.fit === 'perfect' ? 'text-ui-accent' : 'text-ui-muted'
                    }`}
                  >
                    {m.fit === 'perfect'
                      ? 'Exact'
                      : fitMode === 'cover'
                        ? `−${Math.round(m.cropLossPct)}%`
                        : 'Adapted'}
                  </span>
                  {isActive && <Check size={14} className="shrink-0 text-ui-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
