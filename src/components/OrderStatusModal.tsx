import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  PackageCheck,
  Printer,
  Sparkles,
  X,
  FileCheck2,
} from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useSwipeDismiss } from '../hooks/useSwipeDismiss';

export interface OrderStatusModalProps {
  orderId: string | null;
  folderUrl: string | null;
  whatsappUrl: string | null;
  customerName?: string;
  onClose: () => void;
}

interface Step {
  id: number;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  timeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'completed' | 'active' | 'pending';
}

export default function OrderStatusModal({
  orderId,
  folderUrl,
  whatsappUrl,
  customerName,
  onClose,
}: OrderStatusModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number>(3);

  const { isMobile, isShort } = useBreakpoint();
  useBodyScrollLock(!!orderId);
  const { offset, handlers } = useSwipeDismiss({ enabled: isMobile && !!orderId, onDismiss: onClose });

  if (!orderId) return null;

  const steps: Step[] = [
    {
      id: 1,
      titleEn: 'Order Received',
      titleAr: 'تم استلام الطلب',
      descEn: 'Order payload and customer specifications successfully logged to PRISM vault.',
      descAr: 'تم تسجيل مواصفات الطلب وبيانات العميل بنجاح في نظام بريزم.',
      timeLabel: 'Just now',
      icon: PackageCheck,
      status: 'completed',
    },
    {
      id: 2,
      titleEn: 'Render Recipes Generated',
      titleAr: 'معالجة صور الدقة العالية',
      descEn: 'High-res vector crop, color profile curves, and frame snapshots rendered.',
      descAr: 'تم إنشاء ملفات المعاينة عالية الدقة وقص الأبعاد ومطابقة الألوان.',
      timeLabel: 'Completed',
      icon: FileCheck2,
      status: 'completed',
    },
    {
      id: 3,
      titleEn: 'Quality Check & Proofing',
      titleAr: 'التدقيق وجودة الطباعة',
      descEn: 'Master printer verifying DPI density, bleed margins, and signature alignments.',
      descAr: 'فحص كثافة الطباعة والدقة وهوامش القص والتوقيع قبل بدء الطباعة.',
      timeLabel: 'In Progress',
      icon: Sparkles,
      status: 'active',
    },
    {
      id: 4,
      titleEn: 'Printing & Frame Assembly',
      titleAr: 'الطباعة وتجميع الإطار',
      descEn: 'Giclée archival printing on cotton canvas with Siberian Pine stretcher framing.',
      descAr: 'الطباعة الأرشيفية على قماش الكانفاس وتجميع الإطار الخشبي الفاخر.',
      timeLabel: 'Estimated 24-48 hrs',
      icon: Printer,
      status: 'pending',
    },
    {
      id: 5,
      titleEn: 'Ready for Dispatch',
      titleAr: 'جاهز للشحن والتسليم',
      descEn: 'Wax-sealed, white-glove boxed and dispatched to shipping courier.',
      descAr: 'التغليف الفاخر بختم الشمع وتسليم الشحنة لشركة الشحن.',
      timeLabel: 'Estimated 3-5 days',
      icon: Clock,
      status: 'pending',
    },
  ];

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round(((completedCount + 0.5) / steps.length) * 100);

  const handleCopyId = () => {
    void navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-status-title"
    >
      <div 
        className={isMobile ? 'pz-sheet w-full bg-[var(--pz-surface)]' : 'relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--pz-line-strong)] bg-[var(--pz-surface)] shadow-2xl transition-all'}
        style={isMobile ? { transform: `translateY(${offset}px)` } : undefined}
      >
        {isMobile && <div className="pz-sheet__grip" {...handlers} aria-hidden="true" />}
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[var(--pz-line)] bg-[var(--pz-surface-alt)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pz-accent-soft)] text-[var(--pz-accent)] font-bold">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="order-status-title" className="text-base font-extrabold text-[var(--pz-text)]">
                  Order Status Timeline
                </h2>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--pz-surface)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--pz-accent)] border border-[var(--pz-line)] hover:bg-[var(--pz-accent-soft)] transition-colors"
                  title="Click to copy Order ID"
                >
                  <span>#{orderId}</span>
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="text-xs text-[var(--pz-muted)]">
                {customerName ? `Collector: ${customerName} · ` : ''}Real-time tracking for your acquisition
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--pz-muted)] hover:bg-[var(--pz-surface)] hover:text-[var(--pz-text)] transition-colors"
            aria-label="Close status modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className={isMobile ? `pz-sheet__body ${isShort ? 'p-3 space-y-4' : 'p-5 space-y-6'}` : 'max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-6'}>
          {/* Progress bar card */}
          <div className="rounded-xl border border-[var(--pz-line)] bg-[var(--pz-surface-alt)] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[var(--pz-text)]">Production Pipeline Progress</span>
              <span className="text-[var(--pz-accent)] font-mono">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[var(--pz-line)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--pz-accent)] to-purple-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--pz-muted)]">
              Current status: <span className="font-semibold text-[var(--pz-text)]">Quality control & print review</span>
            </p>
          </div>

          {/* Timeline list */}
          <div className="relative space-y-4 pl-2">
            {/* Vertical connector line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-[var(--pz-line)]" />

            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';
              const isSelected = selectedStep === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedStep(step.id)}
                  className={`relative flex items-start gap-4 rounded-xl p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--pz-accent-soft)] border border-[var(--pz-accent)]'
                      : 'hover:bg-[var(--pz-surface-alt)] border border-transparent'
                  }`}
                >
                  {/* Step status node icon */}
                  <div
                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                        : isActive
                        ? 'border-[var(--pz-accent)] bg-[var(--pz-surface)] text-[var(--pz-accent)] shadow-md ring-4 ring-purple-100 dark:ring-purple-950/40'
                        : 'border-[var(--pz-line-strong)] bg-[var(--pz-surface)] text-[var(--pz-muted)]'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                  </div>

                  {/* Step text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--pz-text)]">{step.titleEn}</span>
                        <span className="text-xs font-medium text-[var(--pz-muted)]">/ {step.titleAr}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isActive
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 animate-pulse'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {step.timeLabel}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[var(--pz-muted)] leading-relaxed">{step.descEn}</p>
                    <p className="mt-0.5 text-xs text-[var(--pz-muted)]/80 leading-relaxed dir-rtl">{step.descAr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with action links */}
        <div className={isMobile ? 'pz-sheet__footer flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--pz-line)] bg-[var(--pz-surface-alt)] p-4 sm:px-6' : 'flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--pz-line)] bg-[var(--pz-surface-alt)] p-4 sm:px-6'}>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {folderUrl && (
              <a
                href={folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-[var(--pz-line)] bg-[var(--pz-surface)] px-3.5 py-2 text-xs font-bold text-[var(--pz-text)] hover:bg-[var(--pz-accent-soft)] hover:border-[var(--pz-accent)] transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[var(--pz-accent)]" />
                <span>Drive Assets</span>
              </a>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp Support</span>
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg bg-[var(--pz-accent)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--pz-accent-hover)] transition-all shadow-sm"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
