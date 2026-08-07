import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { CustomerArtworkError, readCustomerArtwork } from '../lib/customerArtwork';
import {
  deleteCustomerArtworkDraft,
  loadLatestCustomerArtworkDraft,
  saveCustomerArtworkDraft,
  type CustomerArtworkContext,
} from '../lib/customerArtworkStore';
import type { CustomerArtworkUpload } from '../types';

interface Props {
  context: CustomerArtworkContext;
  onEdit: (asset: CustomerArtworkUpload) => void;
  onRemove?: (assetId: string) => void;
}

export default function CustomerArtworkUpload({ context, onEdit, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [asset, setAsset] = useState<CustomerArtworkUpload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [persistenceNotice, setPersistenceNotice] = useState('');
  const [dragging, setDragging] = useState(false);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void choose(event.dataTransfer.files?.[0]);
  };

  useEffect(() => {
    let active = true;
    loadLatestCustomerArtworkDraft(context)
      .then((saved) => { if (active && saved) setAsset(saved); })
      .catch(() => { if (active) setPersistenceNotice('Draft recovery is unavailable in this browser.'); });
    return () => { active = false; };
  }, [context]);

  const choose = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const next = await readCustomerArtwork(file);
      if (asset) await deleteCustomerArtworkDraft(asset.id).catch(() => undefined);
      setAsset(next);
      await saveCustomerArtworkDraft(context, next).catch(() => {
        setPersistenceNotice('Your image works now, but this draft will not survive a page refresh.');
      });
      onEdit(next);
    } catch (cause) {
      setError(cause instanceof CustomerArtworkError ? cause.message : 'Could not open this image.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!asset) return;
    const id = asset.id;
    setAsset(null);
    setError('');
    await deleteCustomerArtworkDraft(id).catch(() => undefined);
    onRemove?.(id);
  };

  return (
    <section
      className={
        asset
          ? 'rounded-[18px] border border-[var(--pz-line)] bg-[var(--pz-surface)] p-4 sm:p-5 shadow-sm'
          : 'py-4 sm:py-6'
      }
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(event) => void choose(event.target.files?.[0])}
      />

      {!asset ? (
        <div
          className={`pz-upload ${dragging ? 'is-dragging' : ''} ${busy ? 'is-busy' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <button
            type="button"
            className="pz-upload__card"
            aria-label="Upload your photo"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <span className="pz-upload__rings" aria-hidden="true">
              <span className="pz-upload__ring pz-upload__ring--1" />
              <span className="pz-upload__ring pz-upload__ring--2" />
              <span className="pz-upload__ring pz-upload__ring--3" />
              <span className="pz-upload__ring pz-upload__ring--4" />
              <span className="pz-upload__ring pz-upload__ring--5">
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16V4" />
                    <path d="m7 9 5-5 5 5" />
                    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  </svg>
                )}
              </span>
            </span>

            <span className="pz-upload__glass" aria-hidden="true" />

            <span className="pz-upload__content">
              <span className="pz-upload__title">
                {busy ? 'Reading your image…' : 'Upload your photo'}
              </span>
              <span className="pz-upload__text">
                {dragging ? 'Release to upload' : 'Drag an image here, or click to browse'}
              </span>
            </span>

            <span className="pz-upload__bottom">
              <span className="pz-upload__formats">JPG · PNG · WebP · up to 20 MB</span>
              <span className="pz-upload__action">
                {busy ? 'Please wait' : 'Choose image'}
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                     strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3">
          <img src={asset.dataUrl} alt="Your uploaded artwork" className="h-[72px] w-[72px] sm:h-[88px] sm:w-[88px] rounded-xl border border-[var(--pz-line)] bg-white object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--pz-text)]">{asset.originalName}</p>
            <p className="mt-1 text-[11px] text-[var(--pz-muted)]">
              {asset.widthPx} × {asset.heightPx}px · {(asset.sizeBytes / 1048576).toFixed(1)} MB
            </p>
            <p className="mt-1 text-[10px] text-[var(--pz-muted)]">Saved as an editing draft. Uploaded permanently only when you approve the order.</p>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-wrap gap-2">
            <button type="button" className="pz-tool" onClick={() => onEdit(asset)}><Pencil className="h-4 w-4" /><span>Edit</span></button>
            <button type="button" className="pz-tool" onClick={() => inputRef.current?.click()}><RefreshCw className="h-4 w-4" /><span>Replace</span></button>
            <button type="button" className="pz-tool" onClick={() => void remove()}><Trash2 className="h-4 w-4" /><span>Remove</span></button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-xs text-[var(--pz-danger)]">{error}</p>}
      {persistenceNotice && <p className="mt-3 text-[10px] text-[var(--pz-muted)]">{persistenceNotice}</p>}
    </section>
  );
}
