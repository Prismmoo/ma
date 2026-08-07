import React from 'react';
import { Check } from 'lucide-react';

export type OptionTileProps = {
  key?: string | number;
  /** المعاينة — عادةً MiniPreview */
  preview: React.ReactNode;
  label: string;
  /** نص صغير يمينًا: سعر، مقاس، أو فراغ */
  meta?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** نسبة المعاينة؛ افتراضيًّا 4/3 */
  aspect?: string;
};

/**
 * بطاقة خيار موحّدة لكل إعدادات المحاكي.
 * تطبّق ثلاث إشارات للحالة المختارة: حدّ ملوّن + خلفية خفيفة + علامة صح.
 */
export default function OptionTile({
  preview,
  label,
  meta,
  selected,
  disabled = false,
  onClick,
  aspect = 'aspect-[4/3]',
}: OptionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      title={meta ? `${label} — ${meta}` : label}
      className={`group relative w-full rounded-sm border text-left transition-colors overflow-hidden
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent
        disabled:opacity-40 disabled:cursor-not-allowed
        ${
          selected
            ? 'border-ui-accent ring-1 ring-ui-accent bg-ui-accent-soft'
            : 'border-ui-line bg-ui-surface hover:border-ui-line-strong hover:bg-ui-surface-alt cursor-pointer'
        }`}
    >
      <span className={`block w-full ${aspect} overflow-hidden`}>{preview}</span>

      {selected && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-ui-accent text-ui-on-accent flex items-center justify-center">
          <Check size={10} strokeWidth={3} />
        </span>
      )}

      <span className="flex items-center justify-between gap-1.5 px-2 py-1.5">
        <span className="text-[12px] text-ui-text truncate">{label}</span>
        {meta && (
          <span className="text-[11px] tabular-nums text-ui-muted shrink-0">{meta}</span>
        )}
      </span>
    </button>
  );
}
