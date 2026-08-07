import React, { useState } from 'react';
import { Upload, Sparkles, Frame, ShoppingBag, Check, Eye } from 'lucide-react';
import CustomerArtworkUpload from './CustomerArtworkUpload';
import type { CustomerArtworkUpload as CustomerArtworkType, Painting, FramingOption } from '../types';
import { buildCustomerPainting } from '../lib/customerArtwork';
import { PAINTINGS, FRAMING_OPTIONS } from '../data';

interface UploadViewProps {
  onAddToCart: (painting: Painting, frame: FramingOption) => void;
  onSimulateInRoom?: (painting: Painting) => void;
  onExploreGallery?: () => void;
}

export default function UploadView({ onAddToCart, onSimulateInRoom }: UploadViewProps) {
  const [currentAsset, setCurrentAsset] = useState<CustomerArtworkType | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'painting' | 'sticker'>('painting');
  const [selectedFrame] = useState<FramingOption>(FRAMING_OPTIONS[0]);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const customerPainting = currentAsset ? buildCustomerPainting(currentAsset, PAINTINGS) : null;

  const handleAddToCartClick = () => {
    if (!customerPainting) return;
    onAddToCart(customerPainting, selectedFrame);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  };

  const handleSimulateClick = () => {
    if (!customerPainting || !onSimulateInRoom) return;
    onSimulateInRoom(customerPainting);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-gold/10 border border-forest-gold/30 text-forest-gold text-xs font-mono font-medium tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Custom Studio</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-forest-cream font-bold">
          Upload Your Image
        </h1>
        <p className="text-forest-cream/70 text-sm leading-relaxed">
          Upload your image to print as a custom Framed Canvas or Vinyl Sticker.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-forest-deep border border-forest-sage/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl max-w-xl mx-auto">
        {/* Upload Button Component */}
        <CustomerArtworkUpload
          context={selectedFormat}
          onEdit={(asset) => setCurrentAsset(asset)}
          onRemove={() => setCurrentAsset(null)}
        />

        {/* Format Selection & Action Buttons (Shown once an image is selected) */}
        {currentAsset && (
          <div className="space-y-6 pt-4 border-t border-forest-sage/20 animate-fade-in">
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase text-forest-gold font-bold tracking-wider block">
                Select Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('painting')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    selectedFormat === 'painting'
                      ? 'border-forest-gold bg-forest-gold/15 text-forest-cream font-bold ring-1 ring-forest-gold/50'
                      : 'border-forest-sage/20 bg-forest-black/40 text-forest-cream/60 hover:border-forest-sage/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-forest-gold">
                    <Frame className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-forest-cream">Framed Canvas</span>
                  </div>
                  <span className="text-[11px] text-forest-cream/60 font-normal">Gallery wood frame</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat('sticker')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    selectedFormat === 'sticker'
                      ? 'border-forest-gold bg-forest-gold/15 text-forest-cream font-bold ring-1 ring-forest-gold/50'
                      : 'border-forest-sage/20 bg-forest-black/40 text-forest-cream/60 hover:border-forest-sage/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-forest-gold">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-forest-cream">Vinyl Sticker</span>
                  </div>
                  <span className="text-[11px] text-forest-cream/60 font-normal">Waterproof sticker</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCartClick}
                className="w-full py-3.5 px-6 rounded-xl bg-forest-gold text-forest-black font-bold text-sm tracking-wide uppercase hover:bg-forest-gold/90 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add {selectedFormat === 'painting' ? 'Framed Canvas' : 'Sticker'} to Cart</span>
                  </>
                )}
              </button>

              {onSimulateInRoom && selectedFormat === 'painting' && (
                <button
                  type="button"
                  onClick={handleSimulateClick}
                  className="w-full py-3 px-6 rounded-xl bg-forest-black border border-forest-sage/30 text-forest-cream text-xs font-bold uppercase tracking-wider hover:border-forest-gold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-forest-gold" />
                  <span>Preview in 3D Room</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
