import React, { useState } from 'react';
import { ArrowLeft, Sparkles, ShieldCheck, Palette, ShoppingBag, Frame as FrameIcon } from 'lucide-react';
import { Painting, FramingOption, StyleType } from '../../types';
import { FRAMING_OPTIONS } from '../../data';
import { formatMAD, formatAddOn } from '../../lib/pricing';
import { imageRefOf } from '../../lib/artRef';
import ArtImage from '../ArtImage';
import PersonalizationPreviewLayer from '../personalization/PersonalizationPreviewLayer';
import { PersonalizeButton } from '../personalization/PersonalizeButton';
import { PersonalizationStudio } from '../personalization/PersonalizationStudio';
import { usePersonalizationEntry } from '../../hooks/usePersonalizationEntry';
import { Personalization, personalizationPrice, personalizationSummary } from '../../lib/personalization';

interface Props {
  painting: Painting;
  onClose: () => void;
  selectedFrame: FramingOption;
  onAddToCart: (
    painting: Painting,
    frame: FramingOption,
    personalization?: Personalization,
  ) => void;
  onSimulateInRoom: (painting: Painting) => void;
}

const CATEGORY_DISPLAY_NAMES: Partial<Record<StyleType, string>> = {
  Anime: 'Anime & Manga',
  Films: 'Films & Series',
};
const displayStyle = (style: StyleType): string => CATEGORY_DISPLAY_NAMES[style] ?? style;

export default function MobileProductDetail({
  painting,
  onClose,
  selectedFrame: initialFrame,
  onAddToCart,
  onSimulateInRoom,
}: Props) {
  const [currentFrame, setCurrentFrame] = useState<FramingOption>(initialFrame);
  const [studioOpen, setStudioOpen] = useState(false);
  const entry = usePersonalizationEntry(painting.id);
  const total = painting.price + currentFrame.price + (entry ? personalizationPrice(entry) : 0);

  return (
    <div className="fixed inset-0 z-[100] bg-[#E4E0F7] text-slate-900 flex flex-col overflow-y-auto animate-fadeIn select-none">
      {/* Top Standalone Page Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#E4E0F7]/90 backdrop-blur-xl border-b border-purple-200/80 shadow-sm">
        <button
          onClick={onClose}
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-purple-950 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer border border-purple-200/80 shadow-sm"
          aria-label="Back to Gallery"
        >
          <ArrowLeft size={16} className="text-purple-700" />
          <span>Back</span>
        </button>

        <div className="flex flex-col items-center max-w-[180px]">
          <span className="text-[10px] uppercase font-bold tracking-widest text-purple-700">Artwork Details</span>
          <h1 className="text-xs font-serif font-bold text-slate-900 truncate w-full text-center">{painting.title}</h1>
        </div>

        <div className="w-16 flex justify-end">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-semibold">
            {painting.widthCm}×{painting.heightCm}cm
          </span>
        </div>
      </header>

      {/* Main Full Page Scrollable Body */}
      <main className="flex-grow p-4 pb-32 max-w-2xl mx-auto w-full space-y-6">
        {/* Artwork Showcase Canvas Box */}
        <div className="relative w-full rounded-2xl bg-white/80 border border-purple-200/80 p-4 shadow-xl shadow-purple-950/5 flex flex-col items-center justify-center">
          <div className="relative w-full flex items-center justify-center">
            <ArtImage
              image={imageRefOf(painting)}
              alt={painting.title}
              sizes="100vw"
              priority
              wrapperClassName="w-full h-auto max-h-[55vh]"
              className="w-full h-auto max-h-[55vh] object-contain rounded-lg drop-shadow-[0_10px_25px_rgba(0,0,0,0.12)]"
            />
            {entry && <PersonalizationPreviewLayer personalization={entry} />}
          </div>

          <div className="mt-4 flex items-center justify-between w-full pt-3 border-t border-purple-200/60">
            <div className="text-[10px] font-mono text-purple-800 uppercase tracking-widest font-semibold">
              {painting.widthCm} x {painting.heightCm} cm &bull; {painting.sizeCategory} Scale
            </div>

            <PersonalizeButton
              onClick={() => setStudioOpen(true)}
              active={personalizationPrice(entry) > 0}
              summary={entry ? personalizationSummary(entry) : undefined}
            />
          </div>
        </div>

        {/* Artwork Copy & Metadata */}
        <div className="space-y-3 bg-white/80 border border-purple-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-widest uppercase text-purple-700 font-bold">
              {displayStyle(painting.style as StyleType)} &bull; {painting.year}
            </span>
            <span className="text-[10px] text-purple-800 uppercase font-bold tracking-wider bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Hand Crafted
            </span>
          </div>

          <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            {painting.title}
          </h2>
          <p className="text-sm text-slate-600 font-serif italic">
            by <span className="text-purple-900 font-semibold">{painting.artistName}</span>
          </p>

          {painting.story && (
            <div className="pt-3 border-t border-purple-200/60 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-800 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-600" />
                <span>The Story & Provenance</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {painting.story}
              </p>
            </div>
          )}
        </div>

        {/* Quality Certificate Notice */}
        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-medium">
          <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
          <span>Double-Milled Archival Pigments on Siberian Heavy Linen Canvas</span>
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#E4E0F7]/95 backdrop-blur-2xl border-t border-purple-200/80 p-4 shadow-[0_-10px_30px_rgba(121,82,243,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-[90px]">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Total Price</span>
            <span className="font-mono text-xl font-extrabold text-purple-800 leading-tight">
              {formatMAD(total)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-grow">
            <button
              onClick={() => onSimulateInRoom(painting)}
              type="button"
              className="flex-1 bg-white hover:bg-purple-50 text-slate-800 border border-purple-200/90 text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Room 3D</span>
            </button>

            <button
              onClick={() => onAddToCart(painting, currentFrame, entry || undefined)}
              type="button"
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </footer>

      <PersonalizationStudio
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        painting={painting}
        imageUrl={painting.imageUrl}
        onSave={() => undefined}
      />
    </div>
  );
}
