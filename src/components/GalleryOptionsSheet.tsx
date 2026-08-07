import React, { useState, useEffect } from 'react';
import { Settings2, X, Square, RectangleHorizontal, RectangleVertical, LayoutGrid, LayoutPanelLeft, Grip, Monitor } from 'lucide-react';

interface GalleryOptionsProps {
  aspectRatio: string | null;
  onAspectRatio: (a: string | null) => void;
  resolution: string | null;
  onResolution: (r: string) => void;
  palette: string | null;
  onPalette: (p: string | null) => void;
  mobileColumns: number;
  onMobileColumns: (cols: number) => void;
  sortBy: string;
  onSortBy: (s: any) => void;
  onReset: () => void;
  paletteOptions: { id: string; label: string; hex: string; bgClass: string }[];
}

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', icon: Square },
  { id: '4:5', label: '4:5', icon: RectangleVertical },
  { id: '3:4', label: '3:4', icon: RectangleVertical },
  { id: '16:9', label: '16:9', icon: RectangleHorizontal },
  { id: '9:16', label: '9:16', icon: Monitor }
];

const RESOLUTIONS = ['Standard', 'HD', 'Ultra'];

const SORT_OPTIONS = [
  { id: 'default', label: 'Newest' },
  { id: 'price-asc', label: 'Price: Low' },
  { id: 'price-desc', label: 'Price: High' },
  { id: 'year', label: 'Oldest' }
];

export default function GalleryOptionsSheet({
  aspectRatio, onAspectRatio, resolution, onResolution,
  palette, onPalette, mobileColumns, onMobileColumns,
  sortBy, onSortBy, onReset, paletteOptions
}: GalleryOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleClose = () => setIsOpen(false);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isDesktop]);

  const summary = [
    aspectRatio,
    resolution,
    palette ? paletteOptions.find(p => p.id === palette)?.label : null
  ].filter(Boolean).join(' · ');

  const PanelContent = () => (
    <div className="space-y-8 p-6 lg:p-0">
      {/* Aspect Ratio */}
      <div className="space-y-3">
        <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
          Aspect Ratio
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-hide">
          {ASPECT_RATIOS.map(ar => {
            const Icon = ar.icon;
            const active = aspectRatio === ar.id;
            return (
              <button
                key={ar.id}
                onClick={() => onAspectRatio(active ? null : ar.id)}
                className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                  active 
                    ? 'bg-forest-gold text-forest-black border-forest-gold' 
                    : 'bg-forest-deep text-forest-cream/70 border-forest-sage/20 hover:border-forest-sage/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold font-mono">{ar.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resolution */}
      <div className="space-y-3">
        <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
          Resolution
        </h3>
        <div className="flex bg-forest-black/50 p-1 rounded-full border border-forest-sage/20">
          {RESOLUTIONS.map(res => {
            const active = resolution === res;
            return (
              <button
                key={res}
                onClick={() => onResolution(res)}
                className={`flex-1 text-xs py-2 rounded-full transition-colors font-bold uppercase tracking-wider ${
                  active 
                    ? 'bg-forest-gold text-forest-black shadow-sm' 
                    : 'text-forest-cream/60 hover:text-forest-cream'
                }`}
              >
                {res}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Style */}
      <div className="space-y-3">
        <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
          Color Style
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
          <button
            onClick={() => onPalette(null)}
            className={`snap-start shrink-0 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
              !palette ? 'border-forest-gold bg-forest-black' : 'border-forest-sage/20 bg-forest-black hover:border-forest-sage/50'
            }`}
          >
            <span className="text-[9px] font-mono uppercase font-bold text-forest-cream/70">None</span>
          </button>
          {paletteOptions.map((p) => (
            <button
              key={p.id}
              onClick={() => onPalette(p.id)}
              title={p.label}
              className={`snap-start shrink-0 w-10 h-10 rounded-full border-2 transition-all ${p.bgClass} ${
                palette === p.id ? 'border-forest-gold scale-110 shadow-lg' : 'border-transparent hover:scale-105'
              }`}
            />
          ))}
        </div>
      </div>

      {/* View (Density + Sort) */}
      <div className="space-y-3">
        <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
          Grid density
        </h3>
        <p className="text-[10px] text-forest-cream/50 font-mono -mt-1">
          Applies everywhere — collections, sub-collections, artworks and stickers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Mobile only columns toggle */}
          {!isDesktop && (
            <div className="flex bg-forest-black/50 p-1 rounded-full border border-forest-sage/20 shrink-0">
              <button
                type="button"
                onClick={() => onMobileColumns(2)}
                aria-pressed={mobileColumns === 2}
                className={`flex-1 flex justify-center items-center gap-2 py-2 px-4 min-h-[44px] rounded-full transition-colors ${
                  mobileColumns === 2 ? 'bg-forest-gold text-forest-black font-bold' : 'text-forest-cream/60'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-xs font-bold font-mono">2 Col</span>
              </button>
              <button
                type="button"
                onClick={() => onMobileColumns(3)}
                aria-pressed={mobileColumns === 3}
                className={`flex-1 flex justify-center items-center gap-2 py-2 px-4 min-h-[44px] rounded-full transition-colors ${
                  mobileColumns === 3 ? 'bg-forest-gold text-forest-black font-bold' : 'text-forest-cream/60'
                }`}
              >
                <Grip className="w-4 h-4" />
                <span className="text-xs font-bold font-mono">3 Col</span>
              </button>
            </div>
          )}

          {/* Sort */}
          <div className="flex-1 flex flex-wrap gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => onSortBy(opt.id)}
                className={`text-[11px] font-mono tracking-wider uppercase px-4 py-2 rounded-full border transition-colors ${
                  sortBy === opt.id 
                    ? 'bg-forest-gold text-forest-black border-forest-gold font-bold' 
                    : 'bg-forest-black text-forest-cream/70 border-forest-sage/20 hover:border-forest-sage/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-forest-sage/10">
        <button
          onClick={() => {
            onReset();
            if (!isDesktop) setIsOpen(false);
          }}
          className="w-full py-3 text-sm font-sans font-bold uppercase tracking-widest text-forest-cream/60 hover:text-forest-cream transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Toolbar */}
      <div className="hidden lg:flex items-center justify-between py-4 border-b border-forest-sage/20 mb-8 bg-forest-black/80 backdrop-blur-md sticky top-[72px] z-20 px-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono tracking-widest uppercase text-forest-gold font-bold flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Display
          </span>
          {/* Quick inline controls could go here, but prompt asks for popup for secondary */}
          <span className="text-xs text-forest-cream/50 font-sans pl-4 border-l border-forest-sage/20">
            {summary || 'Default View'}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-forest-deep hover:bg-forest-deep/80 border border-forest-sage/30 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-forest-cream transition-colors"
        >
          <Settings2 className="w-4 h-4" /> Filters & Options
        </button>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] bg-forest-black/90 backdrop-blur-xl border-t border-forest-sage/20 p-4">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-forest-gold hover:bg-forest-gold/90 text-forest-black py-3.5 rounded-full font-bold uppercase tracking-widest text-sm shadow-lg transition-transform active:scale-[0.98]"
        >
          <Settings2 className="w-5 h-5" />
          <span>Options</span>
          {summary && <span className="opacity-50 text-[10px] ml-2">({summary})</span>}
        </button>
      </div>

      {/* Unified Panel (Modal on Desktop, Bottom Sheet on Mobile) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={handleClose}
          />
          
          <div 
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl bg-forest-deep border-t lg:border border-forest-sage/20 lg:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-forest-sage/10 bg-forest-black/50">
              <h2 className="font-serif text-xl font-bold text-forest-cream flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-forest-gold" />
                Gallery Options
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-forest-black/50 hover:bg-forest-black text-forest-cream/60 hover:text-forest-cream transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-y-auto overscroll-contain">
              <PanelContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
