import React from 'react';
import { Check, Maximize2, Minus, Plus, Search } from 'lucide-react';
import type { Painting } from '../../types';
import { formatMAD } from '../../lib/pricing';
import { unitPrice, type PackKind } from '../../lib/packBuilder';
import { imageRefOf } from '../../lib/artRef';
import { usePackBrowser } from '../../hooks/packs/usePackBrowser';
import { useRenderWindow } from '../../hooks/useRenderWindow';
import { useLightbox } from '../../hooks/useLightbox';
import PackBrowserCrumbs from './PackBrowserCrumbs';
import PackShelfCard from './PackShelfCard';
import PackLightbox from './PackLightbox';
import ArtImage from '../ArtImage';

interface Props {
  kind: PackKind;
  finishId: string;
  quantityOf: (id: string) => number;
  onAdd: (painting: Painting) => void;
  onRemove: (paintingId: string) => void;
  atMaximum: boolean;
}

const PICKER_SIZES = '(max-width: 479px) 30vw, (max-width: 767px) 22vw, 132px';

export default function PackGalleryPicker({
  kind, finishId, quantityOf, onAdd, onRemove, atMaximum,
}: Props) {
  const browser = usePackBrowser(kind);
  const renderWindow = useRenderWindow(browser.items);
  const lightbox = useLightbox<Painting>();

  const crumbs = [
    { key: 'root', label: 'All categories', onClick: browser.category || browser.query ? browser.reset : undefined },
    ...(browser.category
      ? [{
          key: browser.category.slug,
          label: browser.category.label,
          onClick: browser.collection ? () => browser.openCategory(browser.category!.slug) : undefined,
        }]
      : []),
    ...(browser.collection ? [{ key: browser.collection.slug, label: browser.collection.title }] : []),
    ...(browser.level === 'search' ? [{ key: 'search', label: `Search: ${browser.query}` }] : []),
  ];

  return (
    <div className="pz-picker">
      <div className="pz-picker__top">
        <PackBrowserCrumbs
          crumbs={crumbs}
          onBack={browser.category || browser.query ? browser.back : null}
        />
        <label className="pz-picker__search">
          <Search className="w-3.5 h-3.5" aria-hidden="true" />
          <input
            value={browser.query}
            onChange={(event) => browser.setQuery(event.target.value)}
            placeholder={kind === 'sticker' ? 'Search stickers' : 'Search artworks'}
            aria-label="Search artworks"
          />
        </label>
      </div>

      {/* LEVEL 0 — categories. One image each. */}
      {browser.level === 'categories' && (
        <div className="pz-shelf-grid">
          {browser.tree.map((node) => (
            <PackShelfCard
              key={node.slug}
              label={node.label}
              count={node.count}
              coverCandidates={node.coverCandidates}
              onOpen={() => browser.openCategory(node.slug)}
            />
          ))}
        </div>
      )}

      {/* LEVEL 1 — collections inside one category. */}
      {browser.level === 'collections' && browser.category && (
        <div className="pz-shelf-grid">
          {browser.category.collections.map((node) => (
            <PackShelfCard
              key={node.slug}
              label={node.title}
              count={node.count}
              coverCandidates={node.coverCandidates}
              onOpen={() => browser.openCollection(node.slug)}
            />
          ))}
        </div>
      )}

      {/* LEVEL 2 / SEARCH — the only place artwork thumbnails mount. */}
      {(browser.level === 'items' || browser.level === 'search') && (
        <>
          <div className="pz-picker__grid">
            {renderWindow.visible.map((painting) => {
              const quantity = quantityOf(painting.id);
              const chosen = quantity > 0;
              const blocked = atMaximum && !chosen;
              const price = unitPrice(kind, painting, finishId);
              return (
                <div
                  key={painting.id}
                  className={`pz-picker__cell ${chosen ? 'is-chosen' : ''} ${blocked ? 'is-blocked' : ''}`}
                >
                  <button
                    type="button"
                    className="pz-picker__thumb"
                    onClick={() => (chosen ? onRemove(painting.id) : onAdd(painting))}
                    disabled={blocked}
                    aria-pressed={chosen}
                    aria-label={`${painting.title}, ${formatMAD(price)}`}
                  >
                    <ArtImage
                      image={imageRefOf(painting)}
                      alt={painting.title}
                      sizes={PICKER_SIZES}
                      aspectRatio="1 / 1"
                      wrapperClassName="pz-picker__frame"
                      className="pz-picker__img object-cover"
                    />
                    {chosen && (
                      <span className="pz-picker__badge">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
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

                  <div className="pz-picker__meta">
                    <span className="pz-picker__title" title={painting.title}>{painting.title}</span>
                    <span className="pz-picker__price">{formatMAD(price)}</span>
                  </div>

                  {chosen && (
                    <div className="pz-picker__stepper">
                      <button type="button" onClick={() => onRemove(painting.id)} aria-label="Remove one">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span aria-live="polite">{quantity}</span>
                      <button type="button" onClick={() => onAdd(painting)} disabled={atMaximum} aria-label="Add one">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {renderWindow.hasMore && (
            <div ref={renderWindow.setSentinel} className="pz-picker__sentinel" aria-hidden="true">
              Loading {renderWindow.remaining} more…
            </div>
          )}
        </>
      )}

      {browser.level === 'search' && browser.items.length === 0 && (
        <p className="pz-picker__empty">No artworks match that search.</p>
      )}
      {browser.level === 'categories' && browser.tree.length === 0 && (
        <p className="pz-picker__empty">No artworks available for this pack type yet.</p>
      )}

      {lightbox.state && (
        <PackLightbox
          painting={lightbox.state.item}
          origin={lightbox.state.origin}
          kind={kind}
          finishId={finishId}
          quantity={quantityOf(lightbox.state.item.id)}
          atMaximum={atMaximum}
          onAdd={() => onAdd(lightbox.state!.item)}
          onRemove={() => onRemove(lightbox.state!.item.id)}
          onClose={lightbox.close}
        />
      )}
    </div>
  );
}
