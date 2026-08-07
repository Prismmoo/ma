import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Undo2, Redo2, Trash2, Check, AlertTriangle, RotateCcw, Upload as UploadIcon,
} from 'lucide-react';
import { Painting } from '../../types';
import {
  Personalization, fontById, fontFamilyCss, personalizationPrice, LayerPlacement, Stroke,
} from '../../lib/personalization';
import { usePersonalization } from '../../hooks/usePersonalization';
import { useLazyFonts } from '../../hooks/useLazyFonts';
import { SIGNATURE_IMAGE_MAX_BYTES, validateCustomerFile } from '../../lib/customerArtwork';
import {
  useStudioHistory, HISTORY_LABEL_TEXT, type StudioSnapshot, type HistoryLabel,
} from '../../hooks/useStudioHistory';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useSwipeDismiss } from '../../hooks/useSwipeDismiss';
import PersonalizationOverlay from './PersonalizationOverlay';

interface PersonalizationStudioProps {
  isOpen: boolean;
  onClose: () => void;
  painting: Painting;
  imageUrl: string;
  onSave: (p: Personalization) => void;
}

export const PersonalizationStudio: React.FC<PersonalizationStudioProps> = ({
  isOpen, onClose, painting, imageUrl, onSave,
}) => {
  const aspect = useMemo(
    () => (painting.widthCm > 0 && painting.heightCm > 0 ? painting.widthCm / painting.heightCm : 1),
    [painting.widthCm, painting.heightCm],
  );

  const p = usePersonalization(painting.id, isOpen);
  const { ready: fontsReady } = useLazyFonts(isOpen);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const history = useStudioHistory();
  const applyingRef = useRef(false);

  const { isMobile, isShort } = useBreakpoint();
  useBodyScrollLock(isOpen);
  const { offset, handlers } = useSwipeDismiss({ enabled: isMobile && isOpen, onDismiss: onClose });

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1600);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  const snapshotNow = useCallback((): StudioSnapshot => ({
    strokes: p.value.strokes,
    text: p.value.text,
    drawPlacement: p.value.drawPlacement,
    textPlacement: p.value.textPlacement,
    uploadedSignatureUrl: p.value.uploadedSignatureUrl,
  }), [p.value]);

  const record = useCallback(
    (patch: Partial<StudioSnapshot>, label: HistoryLabel) => {
      history.push({ ...snapshotNow(), ...patch }, label);
    },
    [history, snapshotNow],
  );

  const processFile = useCallback((file: File) => {
    try {
      validateCustomerFile(file, SIGNATURE_IMAGE_MAX_BYTES);
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : 'Use a JPG, PNG or WebP image up to 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => showToast('Could not read this signature image.');
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      p.setUploadedSignatureUrl(base64);
      record({ uploadedSignatureUrl: base64 }, 'upload');
      showToast('Signature uploaded successfully');
    };
    reader.readAsDataURL(file);
  }, [p, record, showToast]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const seededRef = useRef(false);
  useEffect(() => {
    if (!isOpen) { seededRef.current = false; return; }
    if (seededRef.current) return;
    seededRef.current = true;

    history.reset({
      strokes: p.value.strokes,
      text: p.value.text,
      drawPlacement: p.value.drawPlacement,
      textPlacement: p.value.textPlacement,
      uploadedSignatureUrl: p.value.uploadedSignatureUrl,
    });
  }, [isOpen, p.value, history]);

  const applySnapshot = useCallback(
    (snapshot: StudioSnapshot) => {
      applyingRef.current = true;
      p.applySnapshot(snapshot);
      window.setTimeout(() => { applyingRef.current = false; }, 0);
    },
    [p],
  );

  const handleUndo = useCallback(() => {
    const result = history.undo();
    if (!result) return;
    applySnapshot(result.snapshot);
    showToast(`Undone — ${HISTORY_LABEL_TEXT[result.label]}`);
  }, [history, applySnapshot, showToast]);

  const handleRedo = useCallback(() => {
    const result = history.redo();
    if (!result) return;
    applySnapshot(result.snapshot);
    showToast(`Redone — ${HISTORY_LABEL_TEXT[result.label]}`);
  }, [history, applySnapshot, showToast]);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
        return;
      }

      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, handleUndo, handleRedo]);

  const handleMovePlacement = useCallback(
    (layer: 'draw' | 'text', patch: Partial<LayerPlacement>) => {
      p.patchPlacement(layer, patch);
      record(
        layer === 'draw'
          ? { drawPlacement: { ...p.value.drawPlacement, ...patch } }
          : { textPlacement: { ...p.value.textPlacement, ...patch } },
        'move',
      );
    },
    [p, record],
  );

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setConfirmClear(false);

    applyingRef.current = true;
    record({ strokes: [], text: { ...p.value.text, value: '' }, uploadedSignatureUrl: '' }, 'clear');
    p.setUploadedSignatureUrl('');
    p.patchText({ value: '' });
    window.setTimeout(() => { applyingRef.current = false; }, 0);

    showToast('Cleared — press Ctrl+Z to restore');
  }, [confirmClear, record, p, showToast]);

  const handleSave = useCallback(() => {
    onSave(p.commit(aspect));
    onClose();
  }, [onSave, p, aspect, onClose]);

  const font = fontById(p.value.text.fontId);
  const livePrice = personalizationPrice(p.value);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-[#100F18]/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Personalize this artwork"
            className={isMobile ? 'pz-sheet w-full bg-[var(--pz-surface)] z-10' : 'pz-animated relative w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col bg-[var(--pz-surface)] border border-[var(--pz-line)] rounded-2xl z-10'}
            style={isMobile ? { transform: `translateY(${offset}px)` } : { transformOrigin: 'bottom right', boxShadow: 'var(--pz-shadow)' }}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.7 }}
          >
            {isMobile && <div className="pz-sheet__grip" {...handlers} aria-hidden="true" />}
            
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[var(--pz-line)] bg-[var(--pz-surface-alt)]">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {(['Compose', 'Position', 'Save'] as const).map((step, i) => (
                    <span key={step} className="flex items-center gap-1.5">
                      <span
                        className={[
                          'text-[9px] font-mono uppercase tracking-[0.14em] transition-colors',
                          i === 0 ? 'text-[var(--pz-accent)] font-bold' : 'text-[var(--pz-muted)]',
                        ].join(' ')}
                      >
                        {step}
                      </span>
                      {i < 2 && <span className="w-3 h-px bg-[var(--pz-line-strong)]" />}
                    </span>
                  ))}
                </div>
                <h3 className="text-sm font-semibold text-[var(--pz-text)] truncate mt-0.5">{painting.title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close personalization studio"
                className="p-2 rounded-full text-[var(--pz-muted)] hover:text-[var(--pz-text)] hover:bg-[var(--pz-line)]/45 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className={isMobile ? 'pz-sheet__body grid grid-cols-1' : 'flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]'}>
              {/* Preview */}
              <div className={`${isShort ? 'p-2' : 'p-4 sm:p-6'} bg-[var(--pz-canvas)] border-b lg:border-b-0 lg:border-r border-[var(--pz-line)] flex flex-col justify-center`}>
                <PersonalizationOverlay
                  imageUrl={imageUrl}
                  aspect={aspect}
                  value={p.value}
                  activeLayer="draw"
                  onMovePlacement={handleMovePlacement}
                />
                <p className="mt-3 text-[11px] text-[var(--pz-muted)] text-center">
                  {p.value.uploadedSignatureUrl ? "Drag your signature directly on the artwork to reposition it." : "Upload your signature to start personalizing."}
                </p>
              </div>

              {/* Controls */}
              <div className={isShort ? 'p-3 space-y-3' : 'p-4 sm:p-6 space-y-5'}>
                {/* Signature Upload Area */}
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-[var(--pz-text)] block">
                    Upload your signature
                  </label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={[
                      "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3.5 min-h-[180px]",
                      isDragging
                        ? "border-[var(--pz-accent)] bg-[var(--pz-accent-soft)]/20"
                        : p.value.uploadedSignatureUrl
                        ? "border-[var(--pz-accent)]/40 bg-[var(--pz-surface-alt)]"
                        : "border-[var(--pz-line-strong)] hover:border-[var(--pz-accent)] bg-[var(--pz-surface)]"
                    ].join(' ')}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {p.value.uploadedSignatureUrl ? (
                      <>
                        <div className="relative w-28 h-20 bg-white/80 rounded-lg border border-[var(--pz-line)] flex items-center justify-center overflow-hidden p-2 shadow-sm">
                          <img
                            src={p.value.uploadedSignatureUrl}
                            alt="Signature Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <p className="text-xs font-semibold text-[var(--pz-text)]">
                          Signature Uploaded
                        </p>
                        <p className="text-[11px] text-[var(--pz-muted)]">
                          Click or drag a new image to replace
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[var(--pz-accent-soft)] flex items-center justify-center text-[var(--pz-accent)]">
                          <UploadIcon size={18} />
                        </div>
                        <p className="text-xs font-semibold text-[var(--pz-text)]">
                          Upload your signature image
                        </p>
                        <p className="text-[11px] text-[var(--pz-muted)]">
                          Drag & drop here or click to browse
                        </p>
                        <p className="text-[10px] text-[var(--pz-muted)]/70">
                          JPG, PNG or WebP. Maximum 5 MB. Transparent PNG recommended.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {p.value.uploadedSignatureUrl && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="sig-size" className="text-[11px] font-semibold text-[var(--pz-muted)]">
                          Size
                        </label>
                        <input
                          id="sig-size"
                          type="range"
                          min={0.1}
                          max={2.5}
                          step={0.05}
                          value={p.value.drawPlacement.scale}
                          onChange={(e) => {
                            const scale = Number(e.target.value);
                            p.patchPlacement('draw', { scale });
                            record({ drawPlacement: { ...p.value.drawPlacement, scale } }, 'size');
                          }}
                          className="w-full accent-[var(--pz-accent)] cursor-pointer"
                        />
                      </div>
                      <div>
                        <label htmlFor="sig-rot" className="text-[11px] font-semibold text-[var(--pz-muted)]">
                          Tilt
                        </label>
                        <input
                          id="sig-rot"
                          type="range"
                          min={-180}
                          max={180}
                          step={2}
                          value={p.value.drawPlacement.rotation}
                          onChange={(e) => {
                            const rotation = Number(e.target.value);
                            p.patchPlacement('draw', { rotation });
                            record({ drawPlacement: { ...p.value.drawPlacement, rotation } }, 'tilt');
                          }}
                          className="w-full accent-[var(--pz-accent)] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={isMobile ? 'pz-sheet__footer flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--pz-line)] bg-[var(--pz-surface-alt)]' : 'flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--pz-line)] bg-[var(--pz-surface-alt)]'}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!history.canUndo}
                  title="Undo (Ctrl+Z)"
                  className="pz-animated flex items-center gap-1.5 pl-2.5 pr-2 py-2 rounded-lg border border-[var(--pz-line)] bg-[var(--pz-surface)] text-[var(--pz-text)] text-[11px] font-semibold hover:border-[var(--pz-line-strong)] hover:bg-[var(--pz-accent-soft)] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <Undo2 size={14} />
                  <span>Undo</span>
                  <kbd className="pz-kbd ml-0.5">⌘Z</kbd>
                </button>

                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!history.canRedo}
                  title="Redo (Ctrl+Shift+Z)"
                  aria-label="Redo"
                  className="pz-animated p-2 rounded-lg border border-[var(--pz-line)] bg-[var(--pz-surface)] text-[var(--pz-muted)] hover:text-[var(--pz-text)] hover:border-[var(--pz-line-strong)] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <Redo2 size={14} />
                </button>

                <span className="w-px h-5 bg-[var(--pz-line)]" />

                <button
                  type="button"
                  onClick={handleClear}
                  className={[
                    'pz-animated flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer',
                    confirmClear
                      ? 'border-[var(--pz-danger)] text-[var(--pz-danger)] bg-[var(--pz-danger)]/8'
                      : 'border-[var(--pz-line)] text-[var(--pz-muted)] hover:text-[var(--pz-text)] hover:border-[var(--pz-line-strong)] bg-[var(--pz-surface)]',
                  ].join(' ')}
                >
                  {confirmClear ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                  <span>{confirmClear ? 'Confirm clear' : 'Clear'}</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right leading-tight">
                  <p className="text-[9px] font-mono uppercase tracking-[0.14em] text-[var(--pz-muted)]">
                    Personalization
                  </p>
                  <p className="text-sm font-bold text-[var(--pz-text)] tabular-nums">
                    {livePrice > 0 ? `+$${livePrice}` : 'Free'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  className="pz-animated flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--pz-accent)] hover:bg-[var(--pz-accent-hover)] text-white text-xs font-bold tracking-wide shadow-sm transition-colors cursor-pointer"
                >
                  <Check size={15} strokeWidth={2.6} />
                  Save personalization
                </button>
              </div>
            </div>

            <AnimatePresence>
              {toast && (
                <motion.div
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16 }}
                  className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--pz-text)] text-white text-[11px] font-medium shadow-lg"
                >
                  <RotateCcw size={13} />
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PersonalizationStudio;
