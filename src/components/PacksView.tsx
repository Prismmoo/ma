import React, { useState, useCallback } from 'react';
import { Check, ShieldCheck, Truck, Percent, Package } from 'lucide-react';
import type { Painting, FramingOption } from '../types';
import { PAINTINGS } from '../data';
import {
  buildPackComposition,
  toStickerComponent,
  toCanvasComponent,
  type StickerFinishName,
} from '../lib/packComposition';
import {
  PACK_RULES,
  type PackKind,
} from '../lib/packBuilder';
import { usePackSelection } from '../hooks/packs/usePackSelection';
import PackTypeChooser from './packs/PackTypeChooser';
import PackGalleryPicker from './packs/PackGalleryPicker';
import PackSelectionTray from './packs/PackSelectionTray';
import PackUploadZone from './packs/PackUploadZone';

interface PacksViewProps {
  onAddToCart: (painting: Painting, frame: FramingOption) => void;
}

const STICKER_FINISHES = [
  { id: 'holographic-prism', label: 'Holographic', name: 'Holographic Prism' },
  { id: 'chrome-silver', label: 'Chrome', name: 'Chrome Silver' },
  { id: 'matte-vinyl', label: 'Matte', name: 'Matte Vinyl' },
] as const;

function mapFinishName(finishId: string): StickerFinishName {
  if (finishId === 'chrome-silver') return 'Chrome';
  if (finishId === 'matte-vinyl') return 'Matte';
  return 'Holographic';
}

export default function PacksView({ onAddToCart }: PacksViewProps) {
  const [kind, setKind] = useState<PackKind | null>('sticker');
  const [finishId, setFinishId] = useState<string>('holographic-prism');
  const [addedNotification, setAddedNotification] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Painting[]>([]);

  const activeKind = kind ?? 'sticker';
  const selection = usePackSelection(activeKind, finishId);

  const addUploads = useCallback((next: Painting[]) => {
    setUploads((current) => [...current, ...next]);
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((current) => current.filter((p) => p.id !== id));
    selection.remove(id, Number.MAX_SAFE_INTEGER);
  }, [selection]);

  const handleAcquirePack = () => {
    if (!kind || !selection.totals.meetsMinimum) return;

    const rule = PACK_RULES[kind];
    const finishName = mapFinishName(finishId);

    let slotCounter = 1;
    const components = selection.entries.flatMap((entry) => {
      const copyComponents = [];
      for (let c = 0; c < entry.quantity; c++) {
        const slot = slotCounter++;
        if (kind === 'sticker') {
          copyComponents.push(
            toStickerComponent(
              entry.painting,
              slot,
              finishName,
              rule.fixedSizeCm ?? [10, 10]
            )
          );
        } else {
          copyComponents.push(toCanvasComponent(entry.painting, slot));
        }
      }
      return copyComponents;
    });

    const packComposition = buildPackComposition({
      packType: kind === 'sticker' ? 'sticker-box' : 'twin-canvas',
      packLabel: `${rule.label} (${selection.totals.count} pieces)`,
      components,
      packaging: {
        id: kind === 'sticker' ? 'pkg-metal-box' : 'frame-dual-wood',
        name: kind === 'sticker' ? 'Bespoke Metal Box Packaging' : 'Coordinated Siberian Pine Stretcher',
        description: kind === 'sticker'
          ? 'Delivered in a secure magnetic-seal collector case with wax seals.'
          : 'Custom-built heavy-gauge organic canvas stretchers with certified provenance.',
      },
      finish: kind === 'sticker' ? finishName : null,
      packagingPrice: 0,
      packPrice: selection.totals.total,
    });

    const firstImage = selection.entries[0]?.painting.imageUrl || PAINTINGS[0].imageUrl;

    const packPainting: Painting = {
      id: `pack-${kind}-${Date.now()}`,
      title: `[BUNDLE] ${rule.label} (${selection.totals.count} pieces)`,
      artistId: 'mixed',
      artistName: 'Mixed Artists',
      year: 2026,
      style: 'Minimalist',
      sizeCategory: kind === 'sticker' ? 'Small' : 'Collector',
      widthCm: kind === 'sticker' ? 10 : 60,
      heightCm: kind === 'sticker' ? 10 : 80,
      price: selection.totals.total,
      story: `Custom ${rule.label} containing ${selection.totals.count} curated items: ${selection.entries.map(e => `${e.painting.title} (x${e.quantity})`).join(', ')}.`,
      imageUrl: firstImage,
      colorPalette: ['#C084FC', '#E2E8F0', '#12131A'],
      paletteNames: ['Holographic', 'Silver Chrome', 'Core Shadow'],
      packComposition,
    };

    const packFrame: FramingOption = {
      id: kind === 'sticker' ? 'frame-none' : 'frame-dual-wood',
      name: kind === 'sticker' ? 'Bespoke Metal Box' : 'Siberian Pine Stretcher',
      description: 'Delivered in custom collector packaging.',
      price: 0,
      borderHex: '#12131A',
      materialWidthCm: 0,
    };

    onAddToCart(packPainting, packFrame);
    setAddedNotification(`${rule.label} · ${selection.totals.count} pieces added to cart`);
    setTimeout(() => setAddedNotification(null), 4000);
    selection.clear();
    setUploads([]);
  };

  return (
    <div id="packs-view" className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-12 select-none">
      {/* Editorial Header */}
      <section className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-bold">
          [ CURATED BUNDLES ]
        </span>
        <h1 className="font-serif text-4xl lg:text-5xl tracking-tight text-forest-cream font-bold">
          Collector Pack Builder
        </h1>
        <p className="font-serif italic text-lg text-forest-cream/80 max-w-2xl mx-auto leading-relaxed">
          Select your pack type, mix any artworks from our atelier, and unlock automatic volume discounts on custom sticker sets and canvas collections.
        </p>
        <div className="w-20 h-[1px] bg-forest-sage/20 mx-auto mt-6" />
      </section>

      {/* Added to cart notification */}
      {addedNotification && (
        <div className="max-w-xl mx-auto bg-green-500/20 border border-green-500 text-green-200 p-4 rounded-2xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2">
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <span>{addedNotification}</span>
        </div>
      )}

      {/* Step 1: Pack Type Chooser */}
      <PackTypeChooser
        value={kind}
        onChange={(nextKind) => {
          setKind(nextKind);
          selection.clear();
          setUploads([]);
        }}
      />

      {/* Step 2: Finish row (if sticker pack) */}
      {kind === 'sticker' && (
        <div className="flex flex-col items-center space-y-2 max-w-md mx-auto">
          <span className="text-[10px] font-mono tracking-widest text-forest-gold font-bold uppercase">
            Choose Foil Finish:
          </span>
          <div className="flex gap-2 bg-black/15 border border-white/10 p-1.5 rounded-2xl">
            {STICKER_FINISHES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFinishId(f.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  finishId === f.id
                    ? 'bg-white text-forest-cream shadow-md'
                    : 'text-forest-cream/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Gallery Picker, Multi-Upload Zone & Selection Tray */}
      {kind && (
        <div className="space-y-6">
          <PackGalleryPicker
            kind={kind}
            finishId={finishId}
            quantityOf={selection.quantityOf}
            onAdd={selection.add}
            onRemove={selection.remove}
            atMaximum={selection.totals.atMaximum}
          />

          <PackUploadZone
            uploads={uploads}
            onAddUploads={addUploads}
            onRemoveUpload={removeUpload}
            quantityOf={selection.quantityOf}
            onAdd={selection.add}
            atMaximum={selection.totals.atMaximum}
          />

          <PackSelectionTray
            kind={kind}
            entries={selection.entries}
            totals={selection.totals}
            onRemove={selection.remove}
            onClear={() => {
              selection.clear();
              setUploads([]);
            }}
            onOrder={handleAcquirePack}
          />
        </div>
      )}

      {/* Specifications Checklist */}
      <section className="bg-forest-deep border border-forest-sage/20 p-8 rounded-[36px] max-w-4xl mx-auto shadow-sm text-center grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-forest-gold text-xs font-mono tracking-wider uppercase font-bold">
            <Truck className="w-4 h-4" />
            <span>Express Courier Shipping</span>
          </div>
          <p className="text-[11px] text-forest-cream/70">
            Delivered in a single matched shipment via air courier, fully tracked and insured against transit forces.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-forest-gold text-xs font-mono tracking-wider uppercase font-bold">
            <Percent className="w-4 h-4" />
            <span>Volume Discounts</span>
          </div>
          <p className="text-[11px] text-forest-cream/70">
            Automatic tiered discounts from 5% to 20% on sticker sets (10+ pieces) and canvas sets (3+ pieces).
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-forest-gold text-xs font-mono tracking-wider uppercase font-bold">
            <Package className="w-4 h-4" />
            <span>Sealed Presentation</span>
          </div>
          <p className="text-[11px] text-forest-cream/70">
            Packaged inside beautiful heavy-board containers with matching catalog inserts and artist signed certificates.
          </p>
        </div>
      </section>
    </div>
  );
}
