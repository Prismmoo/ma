import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, X, AlertTriangle, Maximize2 } from 'lucide-react';
import type { Painting } from '../../types';
import { filesToPaintings, MAX_PACK_UPLOADS, ACCEPTED_TYPES } from '../../lib/packUploads';
import { imageRefOf } from '../../lib/artRef';
import { useLightbox } from '../../hooks/useLightbox';
import PackLightbox from './PackLightbox';
import ArtImage from '../ArtImage';

interface Props {
  uploads: Painting[];
  onAddUploads: (paintings: Painting[]) => void;
  onRemoveUpload: (id: string) => void;
  quantityOf: (id: string) => number;
  onAdd: (painting: Painting) => void;
  atMaximum: boolean;
}

export default function PackUploadZone({
  uploads, onAddUploads, onRemoveUpload, quantityOf, onAdd, atMaximum,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<{ errors: string[]; warnings: string[] }>({
    errors: [], warnings: [],
  });
  const lightbox = useLightbox<Painting>();

  const ingest = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const room = MAX_PACK_UPLOADS - uploads.length;
      if (room <= 0) {
        setMessages({ errors: [`Upload limit reached (${MAX_PACK_UPLOADS} images).`], warnings: [] });
        return;
      }
      setBusy(true);
      const files = Array.from(fileList).slice(0, room);
      const { paintings, errors, warnings } = await filesToPaintings(files);
      if (paintings.length) {
        onAddUploads(paintings);
        // Uploading is intent to include. Add each one to the pack immediately.
        if (!atMaximum) paintings.forEach((p) => onAdd(p));
      }
      setMessages({ errors, warnings });
      setBusy(false);
    },
    [uploads.length, onAddUploads, onAdd, atMaximum]
  );

  return (
    <section className="pz-packup">
      <div
        className={`pz-packup__zone ${dragging ? 'is-dragging' : ''} ${busy ? 'is-busy' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void ingest(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        aria-label="Upload your own images"
      >
        <span className="pz-packup__arrow"><UploadCloud className="w-6 h-6" /></span>
        <span className="pz-packup__title">
          {busy ? 'Reading your images…' : 'Add your own images'}
        </span>
        <span className="pz-packup__hint">
          Drag several files here, or click to browse · JPG, PNG, WEBP, HEIC · up to 20 MB each
        </span>
        <span className="pz-packup__meta">{uploads.length} / {MAX_PACK_UPLOADS} uploaded</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className="sr-only"
          onChange={(e) => { void ingest(e.target.files); e.target.value = ''; }}
        />
      </div>

      {messages.warnings.map((warning) => (
        <p key={warning} className="pz-packup__warn">
          <AlertTriangle className="w-3 h-3 shrink-0" /> {warning}
        </p>
      ))}
      {messages.errors.map((error) => (
        <p key={error} className="pz-packup__error">{error}</p>
      ))}

      {uploads.length > 0 && (
        <div className="pz-picker__grid">
          {uploads.map((painting) => {
            const chosen = quantityOf(painting.id) > 0;
            return (
              <div key={painting.id} className={`pz-picker__cell ${chosen ? 'is-chosen' : ''}`}>
                <button
                  type="button"
                  className="pz-picker__thumb"
                  onClick={() => onAdd(painting)}
                  disabled={atMaximum && !chosen}
                  aria-label={`Add ${painting.title}`}
                >
                  <ArtImage
                    image={imageRefOf(painting)}
                    alt={painting.title}
                    sizes="132px"
                    aspectRatio="1 / 1"
                    wrapperClassName="pz-picker__frame"
                    className="object-cover"
                  />
                </button>
                <button
                  type="button"
                  className="pz-picker__zoom"
                  onClick={(event) => {
                    event.stopPropagation();
                    const cell = event.currentTarget.parentElement;
                    lightbox.open(painting, cell?.querySelector('.pz-picker__thumb') ?? null);
                  }}
                  aria-label={`Enlarge ${painting.title}`}
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="pz-packup__remove"
                  onClick={() => onRemoveUpload(painting.id)}
                  aria-label={`Remove ${painting.title}`}
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="pz-picker__meta">
                  <span className="pz-picker__title" title={painting.title}>{painting.title}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightbox.state && (
        <PackLightbox
          painting={lightbox.state.item}
          origin={lightbox.state.origin}
          kind="sticker"
          finishId="holographic-prism"
          quantity={quantityOf(lightbox.state.item.id)}
          atMaximum={atMaximum}
          onAdd={() => onAdd(lightbox.state!.item)}
          onRemove={() => onRemoveUpload(lightbox.state!.item.id)}
          onClose={lightbox.close}
        />
      )}
    </section>
  );
}
