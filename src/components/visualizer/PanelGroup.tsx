import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export type PanelGroupProps = {
  index: number;
  title: string;
  /** ملخص الاختيار الحالي — يُرى والمجموعة مغلقة */
  summary: string;
  open: boolean;
  onToggle: () => void;
  /** معاينة مصغّرة اختيارية */
  thumb?: React.ReactNode;
  children: React.ReactNode;
};

export default function PanelGroup({
  index,
  title,
  summary,
  open,
  onToggle,
  thumb,
  children,
}: PanelGroupProps) {
  const bodyId = useId();

  return (
    <section
      className={`relative rounded-sm border transition-colors ${
        open ? 'border-ui-line-strong bg-ui-surface' : 'border-ui-line bg-ui-surface'
      }`}
    >
      {/* شريط جانبي يدلّ على المجموعة المفتوحة */}
      {open && (
        <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-ui-accent" aria-hidden="true" />
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer
                   hover:bg-ui-surface-alt focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-ui-accent focus-visible:ring-inset"
      >
        {/* قرص الرقم */}
        <span
          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] tabular-nums ${
            open ? 'bg-ui-accent text-ui-on-accent' : 'bg-ui-surface-alt text-ui-muted'
          }`}
        >
          {index}
        </span>

        {thumb && (
          <span className="shrink-0 w-12 h-9 rounded-sm overflow-hidden border border-ui-line">
            {thumb}
          </span>
        )}

        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-medium text-ui-text">{title}</span>
          <span className="block text-[12px] text-ui-muted truncate mt-0.5">{summary}</span>
        </span>

        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-ui-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div id={bodyId} role="region" className="px-4 pb-5 pt-1">
          {children}
        </div>
      )}
    </section>
  );
}
