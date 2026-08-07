import React, { useState } from 'react';
import { ArrowLeft, X, Sparkles, ShieldCheck, ChevronRight, Palette, Frame as FrameIcon, ShoppingBag } from 'lucide-react';
import { Painting, FramingOption, StyleType } from '../types';
import { FRAMING_OPTIONS } from '../data';
import ArtImage from './ArtImage';
import { PersonalizationStudio } from './personalization/PersonalizationStudio';
import PersonalizeButton from './personalization/PersonalizeButton';
import PersonalizationPreviewLayer from './personalization/PersonalizationPreviewLayer';
import { usePersonalizationEntry } from '../hooks/usePersonalizationEntry';
import { Personalization, personalizationPrice, personalizationSummary } from '../lib/personalization';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { imageRefOf } from '../lib/artRef';
import { formatMAD, formatAddOn } from '../lib/pricing';

const CATEGORY_DISPLAY_NAMES: Partial<Record<StyleType, string>> = {
  Anime: 'Anime & Manga',
  Films: 'Films & Series',
};
const displayStyle = (style: StyleType): string => CATEGORY_DISPLAY_NAMES[style] ?? style;

interface ProductDetailModalProps {
  painting: Painting | null;
  isOpen: boolean;
  onClose: () => void;
  selectedFrame: FramingOption;
  setSelectedFrame: (frame: FramingOption) => void;
  onAddToCart: (painting: Painting, frame: FramingOption, personalization?: Personalization) => void;
  onSimulateInRoom: (painting: Painting) => void;
}

export default function ProductDetailModal({
  painting,
  isOpen,
  onClose,
  selectedFrame,
  setSelectedFrame,
  onAddToCart,
  onSimulateInRoom
}: ProductDetailModalProps) {
  const [studioOpen, setStudioOpen] = useState(false);
  const entry = usePersonalizationEntry(painting?.id ?? null);
  
  useBodyScrollLock(isOpen);

  if (!isOpen || !painting) return null;

  const total = painting.price + selectedFrame.price + (entry ? personalizationPrice(entry) : 0);

  return (
    <div className="fixed inset-0 z-[100] bg-[#E4E0F7] text-slate-900 flex flex-col overflow-y-auto select-none animate-fadeIn">
      {/* Top Standalone Page Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#E4E0F7]/90 backdrop-blur-xl border-b border-purple-200/80 shadow-sm">
        <button
          onClick={onClose}
          type="button"
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-purple-950 text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer border border-purple-200/80 shadow-sm"
          aria-label="Back to Gallery"
        >
          <ArrowLeft size={18} className="text-purple-700" />
          <span>Back to Gallery</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs uppercase font-bold tracking-widest text-purple-700">Artwork Page</span>
          <h1 className="text-sm md:text-base font-serif font-bold text-slate-900 max-w-md truncate text-center">
            {painting.title}
          </h1>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="p-2 hover:bg-purple-200/50 rounded-full transition-colors cursor-pointer text-slate-600 hover:text-slate-900"
          aria-label="Close page"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Main Page Layout Grid */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Artwork Showcase (7 cols) */}
          <div className="lg:col-span-7 bg-white/80 border border-purple-200/80 rounded-3xl p-6 md:p-10 shadow-xl shadow-purple-950/5 flex flex-col items-center justify-center relative backdrop-blur-md">
            <div className="relative w-full flex items-center justify-center max-w-2xl mx-auto">
              <div className="relative w-full">
                <ArtImage
                  image={imageRefOf(painting)}
                  alt={painting.title}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority={true}
                  wrapperClassName="w-full h-auto max-h-[65vh]"
                  className="w-full h-auto max-h-[65vh] object-contain rounded-xl shadow-2xl drop-shadow-[0_15px_35px_rgba(0,0,0,0.15)]"
                />

                {entry && <PersonalizationPreviewLayer personalization={entry} />}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between w-full pt-4 border-t border-purple-200/60 gap-3">
              <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-mono text-purple-800 uppercase tracking-widest font-semibold">
                {painting.widthCm} x {painting.heightCm} cm &bull; {painting.sizeCategory} Scale
              </div>

              <PersonalizeButton
                onClick={() => setStudioOpen(true)}
                active={personalizationPrice(entry) > 0}
                summary={entry ? personalizationSummary(entry) : undefined}
              />
            </div>

            <div className="mt-6 flex items-center gap-2.5 text-xs text-purple-800 uppercase tracking-widest font-mono font-medium">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>Double-Milled Archival Pigments on Siberian Heavy Linen Canvas</span>
            </div>
          </div>

          {/* Right Column: Narrative & Bespoke Customizer (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Header info */}
            <div className="space-y-2 bg-white/80 border border-purple-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
              <span className="text-xs font-mono tracking-widest uppercase text-purple-700 font-bold">
                {displayStyle(painting.style as StyleType)} Canvas &bull; Collection {painting.year}
              </span>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight text-slate-900 font-bold leading-tight">
                {painting.title}
              </h2>
              <p className="text-sm text-slate-600 font-serif italic">
                crafted by <span className="text-purple-900 font-semibold">{painting.artistName}</span>
              </p>

              {painting.story && (
                <div className="pt-4 border-t border-purple-200/60 space-y-2 mt-4">
                  <span className="text-xs uppercase font-bold tracking-widest text-purple-800 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <span>The Provenance & Story</span>
                  </span>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-sans">
                    {painting.story}
                  </p>
                </div>
              )}
            </div>

            {/* Custom Color Palette Showcase */}
            {painting.colorPalette && painting.colorPalette.length > 0 && (
              <div className="bg-white/80 border border-purple-200/80 rounded-3xl p-6 space-y-3 shadow-sm">
                <span className="text-xs uppercase font-bold tracking-widest text-purple-700 font-sans block">
                  Curated Chemical Palette
                </span>
                <div className="flex flex-wrap gap-4">
                  {painting.colorPalette.map((hex, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span 
                        className="w-5 h-5 rounded-full border border-slate-300 flex-shrink-0 shadow-sm" 
                        style={{ backgroundColor: hex }} 
                      />
                      <div className="text-[10px] font-mono leading-none">
                        <span className="block text-slate-800 font-semibold">{painting.paletteNames[idx]}</span>
                        <span className="text-slate-500">{hex}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-center text-slate-500 font-serif italic px-2">
              *Orders processed through secure escrow. Hand-framed and packaged in Siberian timber containers.
            </p>
          </div>

        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#E4E0F7]/95 backdrop-blur-2xl border-t border-purple-200/80 p-4 md:p-6 shadow-[0_-10px_30px_rgba(121,82,243,0.08)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-6">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Total Price</span>
              <span className="font-mono text-2xl md:text-3xl font-extrabold text-purple-800">
                {formatMAD(total)}
              </span>
            </div>
            {personalizationPrice(entry) > 0 && (
              <p className="text-xs text-purple-700 font-medium">
                Includes {formatAddOn(personalizationPrice(entry))} customization
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => onSimulateInRoom(painting)}
              type="button"
              className="flex-1 md:flex-initial px-6 py-4 bg-white hover:bg-purple-50 text-slate-800 border border-purple-200/90 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Simulate on Wall</span>
            </button>
            
            <button
              onClick={() => onAddToCart(painting, selectedFrame, entry)}
              type="button"
              className="flex-1 md:flex-initial px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
              <ChevronRight className="w-4 h-4" />
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
