import React, { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, Check, HelpCircle, ChevronDown, RotateCcw, ArrowLeft, ArrowRight, Search, X, Heart, Download } from 'lucide-react';
import { Painting, StyleType, SizeCategory } from '../types';
import { PAINTINGS } from '../data';
import CustomerArtworkUpload from './CustomerArtworkUpload';
import { buildCustomerPainting } from '../lib/customerArtwork';
import ArtImage from './ArtImage';
import { imageRefOf } from '../lib/artRef';
import CoverImage from './CoverImage';
import { useGalleryFilters } from '../hooks/useGalleryFilters';
import {
  LEGACY_SUBCATEGORY_COVERS,
  CATEGORY_COVER_FALLBACKS,
} from '../lib/legacyCovers';
import {
  CATEGORIES,
  SUBCATEGORY_INFOS,
  displayStyle,
  hasSubCollections,
  MOTORBIKE_SUBCATEGORIES,
} from '../lib/galleryTaxonomy';
import {
  ANIME_SUBCATEGORIES,
  FILM_SUBCATEGORIES,
  SERIES_SUBCATEGORIES,
  COLLECTIONS_BY_TITLE,
  collectionCover,
  collectionCount,
  collectionImages,
} from '../lib/art';
import RotatingCover from './RotatingCover';
import { formatMAD } from '../lib/pricing';

/* ---------------------------------------------------------------------------
 * تلميحات مقاسات العرض (sizes)
 * مشتقة من التخطيط الفعلي للملف: الحاوية max-w-7xl (1280px)
 * مع px-6/px-12، والشبكة تصل إلى 4 أعمدة عند إخفاء الفلاتر.
 * لا تغيّر هذه القيم دون تغيير أصناف الشبكة معها.
 * ------------------------------------------------------------------------- */

/** شبكة اللوحات الرئيسية. */
/* V34: تحت 480px صارت الشبكة عمودين حقيقيين يملآن العرض.
   العرض الفعلي = (100vw - 48px pad - 10px gap) / 2 ≈ 46vw. */
const GRID_SIZES =
  '(max-width: 479px) 46vw, (max-width: 639px) 47vw, (max-width: 767px) 45vw, (max-width: 1023px) 30vw, 23vw';

/** شبكة نتائج البحث (4 أعمدة على lg). */
const SEARCH_SIZES = GRID_SIZES;

/** بطاقات المجموعات. */
const CARD_SIZES = '(min-width: 1024px) 380px, (min-width: 640px) 45vw, 92vw';

/**
 * عدد البطاقات التي تُحمّل بأولوية عالية (تقريبًا ملء الطية الأولى).
 * 6 = صفّان على سطح المكتب. ما بعدها lazy.
 */
const EAGER_COUNT = 6;

/**
 * حجم الصفحة الواحدة.
 * إلزامي: Better Call Saul وحدها 36 لوحة، والمجموع 695.
 * بلا ترقيم صفحات، اختيار «All» يرسم 695 بطاقة في DOM واحد.
 */
const PAGE_SIZE = 24;

interface GalleryViewProps {
  onSelectPainting: (painting: Painting) => void;
  initialStyleFilter?: StyleType | null;
  onClearInitialStyleFilter?: () => void;
}

/* Taxonomy (categories, display names, sub-collection cards) now lives in
 * `src/lib/galleryTaxonomy.ts` so that the sticker workshop reuses exactly the
 * same covers, taglines, descriptions and ordering as this gallery. */

export default function GalleryView({ 
  onSelectPainting,
  initialStyleFilter,
  onClearInitialStyleFilter
 }: GalleryViewProps) {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    isSubCategoryConfirmed,
    setIsSubCategoryConfirmed,
    selectedSizes,
    toggleSize,
    selectedPalette,
    setSelectedPalette,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    showFilters,
    setShowFilters,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    resetAllFilters,
    globalSearchResults,
    filteredPaintings,
    visiblePaintings,
    getCountForStyle,
    filteredCategoriesList,
    currentCategoryInfo,
    availableSubCategories,
    seriesSplitIndex,
    selectedAspectRatio,
    setSelectedAspectRatio,
    selectedResolution,
    setSelectedResolution,
    mobileColumns,
    setMobileColumns,
  } = useGalleryFilters({ initialStyleFilter, onClearInitialStyleFilter, memoryScope: 'gallery' });

  /* V35 — الجسر الوحيد بين حالة الأعمدة و CSS.
     كل شبكة بطاقات في هذه الشاشة تستهلك هذين الكائنين. لا تكرّر المنطق. */
  const gridCols = mobileColumns === 3 ? 3 : 2;
  const gridStyle = React.useMemo(
    () => ({ ['--pz-mobile-cols' as string]: String(gridCols) }) as React.CSSProperties,
    [gridCols],
  );
  const GRID_CLASS =
    'pz-art-grid grid gap-x-2 gap-y-6 sm:gap-3 lg:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

  const sizeOptions: { value: SizeCategory; label: string; desc: string }[] = [
    { value: 'Small', label: 'Small', desc: 'Up to 60cm' },
    { value: 'Medium', label: 'Medium', desc: '60cm – 90cm' },
    { value: 'Large', label: 'Large', desc: '90cm – 120cm' },
    { value: 'Collector', label: 'Collector Scale', desc: '120cm+' }
  ];

  const paletteOptions = [
    { id: 'earth', label: 'Warm Earth & Sienna', hex: '#A18F7D', bgClass: 'bg-[#A18F7D]' },
    { id: 'monochrome', label: 'Monochrome Slate', hex: '#2A2A2A', bgClass: 'bg-[#2A2A2A]' },
    { id: 'lapis', label: 'Prussian Navy & Indigo', hex: '#162C4E', bgClass: 'bg-[#162C4E]' },
    { id: 'ochre', label: 'Vibrant Ochre & Honey', hex: '#C68735', bgClass: 'bg-[#C68735]' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
      {selectedCategory === null ? (
        /* --- VIEW 1: CATEGORIES BROWSER (RENDERED LIKE PRODUCTS) --- */
        <div className="space-y-10 animate-fade-in">
          <div className="border-b border-forest-sage/20 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl lg:text-5xl tracking-tight text-forest-cream font-bold">
                Creative Collections
              </h1>
            </div>
          </div>

          {/* Simple & Elegant Site-Themed Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative flex items-center w-full bg-white/70 backdrop-blur-md border border-[#7952F3]/20 rounded-full px-3.5 py-2 shadow-sm focus-within:border-[#7952F3] focus-within:ring-2 focus-within:ring-[#7952F3]/20 transition-all">
              <Search className="w-4 h-4 text-[#7952F3] shrink-0 mr-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by painting title, film, anime, artist..."
                className="w-full bg-transparent text-sm text-[#2C2440] placeholder:text-[#7952F3]/50 focus:outline-none font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="p-1 text-[#7952F3]/60 hover:text-[#7952F3] hover:bg-[#7952F3]/10 rounded-full transition-colors shrink-0 ml-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conditional Search Results or Category Grid */}
          {searchQuery.trim() ? (
            <div className="space-y-8 animate-fade-in pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-forest-sage/20 pb-4 gap-2">
                <div>
                  <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-forest-gold font-semibold">
                    Gallery Search Results
                  </span>
                  <h2 className="font-serif text-2xl lg:text-3xl text-forest-cream mt-1 font-bold">
                    Found {globalSearchResults.length} {globalSearchResults.length === 1 ? 'artwork' : 'artworks'} matching "{searchQuery}"
                  </h2>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-sans uppercase font-bold tracking-wider text-forest-gold hover:underline cursor-pointer"
                >
                  ← Return to All Collections
                </button>
              </div>

              {globalSearchResults.length === 0 ? (
                <div className="bg-forest-deep border border-forest-sage/20 p-12 text-center space-y-4">
                  <Search className="w-10 h-10 text-forest-sage/40 mx-auto" />
                  <h3 className="font-serif text-xl text-forest-cream font-bold">No Artworks Found</h3>
                  <p className="text-xs text-forest-cream/70 max-w-md mx-auto leading-relaxed">
                    We couldn't find any paintings matching "{searchQuery}". Try searching for titles like "Fight Club", "Guts", "Oppenheimer", "Berserk", "Yamaha", or artists like "Mesrour".
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 inline-block bg-forest-gold text-forest-black text-xs font-sans uppercase font-bold tracking-widest px-6 py-2.5 hover:bg-forest-gold/90 transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className={`w-full ${GRID_CLASS}`} style={gridStyle} data-cols={gridCols}>
                  {globalSearchResults.map((painting, searchIndex) => (
                    <article
                      key={painting.id}
                      onClick={() => onSelectPainting(painting)}
                      className="group cursor-pointer bg-forest-deep border border-forest-sage/20 hover:border-forest-gold transition-all flex flex-col p-3 space-y-3 shadow-sm hover:shadow-md"
                    >
                      <div className="bg-forest-black relative overflow-hidden border border-forest-sage/10 rounded-[12px] lg:rounded-[16px] transition-transform active:scale-[0.98]" style={{ aspectRatio: painting.widthCm ? `${painting.widthCm}/${painting.heightCm}` : '3/4' }}>
                        <ArtImage
                          image={imageRefOf(painting)}
                          alt={painting.title}
                          sizes={SEARCH_SIZES}
                          priority={searchIndex < 4}
                          
                          wrapperClassName="w-full h-full"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-forest-black/90 backdrop-blur-sm px-2 py-0.5 text-[8px] font-mono text-forest-gold uppercase border border-forest-sage/20">
                          {displayStyle(painting.style)}
                        </div>
                        {painting.subCategory && (
                          <div className="absolute top-2 right-2 bg-forest-gold text-forest-black px-2 py-0.5 text-[8px] font-sans font-bold uppercase">
                            {painting.subCategory}
                          </div>
                        )}

                        {/* Overlay Actions */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 z-10">
                          <button className="w-7 h-7 rounded-full bg-forest-black/80 text-forest-cream hover:text-forest-gold flex items-center justify-center backdrop-blur-md" onClick={(e) => { e.stopPropagation(); }}>
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 rounded-full bg-forest-black/80 text-forest-cream hover:text-forest-gold flex items-center justify-center backdrop-blur-md" onClick={(e) => { e.stopPropagation(); }}>
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-base text-forest-cream group-hover:text-forest-gold font-bold transition-colors line-clamp-1">
                          {painting.title}
                        </h4>
                        <div className="flex justify-between items-center pt-2 border-t border-forest-sage/10 text-xs">
                          <span className="font-mono text-forest-gold font-bold">{formatMAD(painting.price)}</span>
                          <span className="text-[9px] text-forest-cream/50 uppercase font-mono">{painting.sizeCategory} ({painting.widthCm}×{painting.heightCm}cm)</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Grid of Categories — V35: نفس شبكة اللوحات حرفيًا */
            <div className={`w-full ${GRID_CLASS}`} style={gridStyle} data-cols={gridCols}>
              {filteredCategoriesList.map((cat) => {
                const count = getCountForStyle(cat.name);
                return (
                  <article
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      const hasSub = hasSubCollections(cat.name);
                      setIsSubCategoryConfirmed(!hasSub);
                    }}
                    className="group cursor-pointer flex flex-col space-y-4 transition-all"
                  >
                    {/* Visual Canvas Framing (Exact representation of product frames) */}
                    <div className="aspect-[3/4] bg-forest-deep border border-forest-sage/20 relative overflow-hidden transition-all duration-500 group-hover:border-forest-gold shadow-sm hover:shadow-md">
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Glass Reflection / Satin Sheen Overlay */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Overall ambient glass sheen change */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        {/* Diagonal light sweep (glare reflex) */}
                        <div className="absolute top-0 bottom-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/[0.25] to-transparent skew-x-[-30deg] transition-transform duration-1000 ease-out group-hover:translate-x-[450%]" />
                        
                        {/* Subtle fine border reflection */}
                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
                      </div>

                      {/* Subtle hover overlay details */}
                      <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                        {cat.type}
                      </div>

                      {/* Badge for paintings count */}
                      <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm">
                        {count} {count === 1 ? 'Canvas' : 'Canvases'}
                      </div>
                    </div>

                    {/* Info like a product card */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h3 className="font-serif text-xl text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
                          {displayStyle(cat.name as StyleType)}
                        </h3>
                      </div>
                      
                      <div className="text-right flex-shrink-0 self-center pl-2">
                        <span className="p-2 border border-forest-sage/20 bg-forest-black hover:bg-forest-gold hover:text-forest-black text-forest-cream rounded-full transition-colors duration-300 block">
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : selectedCategory !== null && !isSubCategoryConfirmed && availableSubCategories.length > 0 ? (
        /* --- VIEW 1.5: SUBCATEGORIES BROWSER PAGE --- */
        <div className="space-y-12 animate-fade-in">
          {/* Breadcrumb back button & Header */}
          <div className="border-b border-forest-sage/20 pb-8 space-y-6">
            <button
              type="button"
              aria-label="Back to all Collections"
              onClick={() => {
                setSelectedCategory(null);
                resetAllFilters();
              }}
              className="pz-back-btn text-xs font-sans tracking-wider text-forest-cream hover:text-forest-gold"
            >
              <ArrowLeft className="pz-back-btn__icon w-[18px] h-[18px]" aria-hidden="true" />
              <span className="pz-back-btn__label">Back to all Collections</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-semibold">
                  Discover {displayStyle(selectedCategory)}
                </span>
                <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mt-2 text-forest-cream font-bold">
                  {displayStyle(selectedCategory)} Sub-Collections
                </h1>
                <p className="text-sm text-forest-cream/70 max-w-2xl font-sans mt-3 leading-relaxed">
                  {currentCategoryInfo?.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Grid of Subcategories — V35: موحّدة مع شبكة اللوحات */}
          <div className={`w-full ${GRID_CLASS}`} style={gridStyle} data-cols={gridCols}>
            {availableSubCategories.map((subCat, subIdx) => {
              const card = (SUBCATEGORY_INFOS[selectedCategory] || []).find(c => c.name === subCat || c.title === subCat) || {
                title: subCat,
                tagline: 'Collection',
                desc: ''
              };
              
              return (
                <React.Fragment key={subCat}>
                  {subIdx === seriesSplitIndex && (
                    <div className="col-span-full flex items-center gap-3 pt-6 pb-1">
                      <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
                        Series
                      </span>
                      <span className="h-px flex-1 bg-forest-sage/20" />
                      <span className="text-[9px] font-mono text-forest-cream/40">
                        {SERIES_SUBCATEGORIES.length} collections
                      </span>
                    </div>
                  )}
                  {subIdx === 0 && seriesSplitIndex > 0 && (
                    <div className="col-span-full flex items-center gap-3 pb-1">
                      <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
                        Films
                      </span>
                      <span className="h-px flex-1 bg-forest-sage/20" />
                      <span className="text-[9px] font-mono text-forest-cream/40">
                        {FILM_SUBCATEGORIES.length} collections
                      </span>
                    </div>
                  )}

                  <article
                    onClick={() => {
                      setSelectedSubCategory(subCat);
                      setIsSubCategoryConfirmed(true);
                    }}
                    className="group cursor-pointer flex flex-col space-y-4 transition-all"
                  >
                    {/* Visual Canvas Framing */}
                    <div className="aspect-[3/4] bg-forest-deep border border-forest-sage/20 relative overflow-hidden transition-all duration-500 group-hover:border-forest-gold shadow-sm hover:shadow-md">
                      <RotatingCover
                        seedKey={COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? subCat}
                        index={subIdx}
                        pool={collectionImages(
                          COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? '',
                        ).map((r) => r.src)}
                        candidates={[
                          collectionCover(COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? '')?.src,
                          (card as any).imageUrl,
                          LEGACY_SUBCATEGORY_COVERS[card.title],
                          LEGACY_SUBCATEGORY_COVERS[(card as any).name ?? ''],
                          selectedCategory ? CATEGORY_COVER_FALLBACKS[selectedCategory] : null,
                          currentCategoryInfo?.imageUrl,
                        ]}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Glass Reflection / Satin Sheen Overlay */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute top-0 bottom-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/[0.25] to-transparent skew-x-[-30deg] transition-transform duration-1000 ease-out group-hover:translate-x-[450%]" />
                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
                      </div>

                      {/* Subtle hover overlay details */}
                      <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                        {card.tagline}
                      </div>

                      {/* Badge for paintings count */}
                      {collectionCount(COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? '') > 0 && (
                        <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm">
                          {collectionCount(COLLECTIONS_BY_TITLE.get(subCat)!.slug)} plates
                        </div>
                      )}
                    </div>

                    {/* Info block styled exactly like a product or main category card */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h3 className="font-serif text-xl text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
                          {subCat}
                        </h3>
                      </div>
                      
                      <div className="text-right flex-shrink-0 self-center pl-2">
                        <span className="p-2 border border-forest-sage/20 bg-forest-black hover:bg-forest-gold hover:text-forest-black text-forest-cream rounded-full transition-colors duration-300 block">
                          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </article>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        /* --- VIEW 2: PRODUCTS OF THE SELECTED FAMILY PAGE --- */
        <div className="space-y-12 animate-fade-in">
          {/* Breadcrumb Back bar & Header */}
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => {
                if (availableSubCategories.length > 0) {
                  setIsSubCategoryConfirmed(false);
                  setSelectedSubCategory(null);
                } else {
                  setSelectedCategory(null);
                  resetAllFilters();
                }
              }}
              className="pz-back-btn text-xs font-sans tracking-wider text-forest-cream hover:text-forest-gold max-w-full"
            >
              <ArrowLeft className="pz-back-btn__icon w-[18px] h-[18px]" aria-hidden="true" />
              <span className="pz-back-btn__label truncate">
                {availableSubCategories.length > 0
                  ? `Back to ${displayStyle(selectedCategory)} Sub-Collections`
                  : 'Back to all Collections'}
              </span>
            </button>

            {/* Custom Premium Category Banner */}
            <div className="bg-forest-deep border border-forest-sage/20 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center shadow-sm">
              {currentCategoryInfo && (
                <>
                  <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 border border-forest-sage/20 p-2.5 bg-forest-black">
                    <CoverImage
                      candidates={[
                        currentCategoryInfo.imageUrl,
                        CATEGORY_COVER_FALLBACKS[currentCategoryInfo.name ?? ''],
                      ]}
                      alt={currentCategoryInfo.name ?? 'Collection'}
                      className="w-full h-full object-cover shadow-sm"
                      priority
                    />
                  </div>
                  <div className="space-y-3 text-center md:text-left flex-grow">
                    <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-bold bg-forest-black px-3 py-1 border border-forest-sage/10 rounded-sm">
                      {currentCategoryInfo.type} / {currentCategoryInfo.tagline}
                    </span>
                    <h1 className="font-serif text-3xl md:text-4xl text-forest-cream tracking-tight font-bold">
                      The {displayStyle(selectedCategory)} Collection
                    </h1>
                    <p className="text-xs md:text-sm text-forest-cream/80 leading-relaxed max-w-2xl font-sans">
                      {currentCategoryInfo.desc}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filtering & Sorting Controls Bar - Soft Neumorphic Pill Style */}
          <div className="bg-gradient-to-b from-white via-[#F8F8FC] to-[#EDEDF6] border border-white/95 rounded-3xl md:rounded-full p-2.5 md:p-3 shadow-[0_12px_32px_rgba(180,185,210,0.42),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_#FFFFFF,inset_0_-1px_2px_rgba(180,185,210,0.25)] backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden lg:flex items-center gap-2 text-xs font-bold text-[#222634] bg-gradient-to-b from-white to-[#F3F3FA] border border-white px-4 py-2 rounded-full shadow-[0_4px_14px_rgba(150,155,185,0.32),0_1px_3px_rgba(0,0,0,0.05),inset_0_1.5px_0_#FFFFFF] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#70778A]" />
                <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>

              {/* View 2 Inline Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search within ${displayStyle(selectedCategory)}...`}
                  className="w-full bg-[#E5E4F0] border border-white/80 rounded-full pl-9 pr-8 py-2 text-xs md:text-sm text-[#222634] placeholder-[#70778A] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7952F3]/40 shadow-[inset_0_2px_4px_rgba(160,165,190,0.38),inset_0_-1px_1px_rgba(255,255,255,0.9)] transition-all font-sans"
                />
                <Search className="w-3.5 h-3.5 text-[#70778A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70778A] hover:text-[#222634] p-1 cursor-pointer rounded-full hover:bg-white/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              <div className="text-xs font-sans font-bold text-[#70778A] bg-white/70 border border-white/90 px-3 py-1.5 rounded-full shadow-inner shrink-0">
                Showing <span className="text-[#222634] font-extrabold">{filteredPaintings.length}</span> {filteredPaintings.length === 1 ? 'canvas' : 'canvases'}
              </div>
            </div>

            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none text-xs font-bold text-[#222634] bg-gradient-to-b from-white to-[#F3F3FA] border border-white pl-4 pr-9 py-2 rounded-full shadow-[0_4px_14px_rgba(150,155,185,0.32),0_1px_3px_rgba(0,0,0,0.05),inset_0_1.5px_0_#FFFFFF] hover:scale-[1.02] cursor-pointer focus:outline-none transition-all font-sans"
              >
                <option value="default" className="bg-white text-[#222634]">Default Hanging</option>
                <option value="price-asc" className="bg-white text-[#222634]">Price: Low to High</option>
                <option value="price-desc" className="bg-white text-[#222634]">Price: High to Low</option>
                <option value="year" className="bg-white text-[#222634]">Newest First</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#70778A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Sidebar Filters */}
            {showFilters && (
              <aside className="hidden lg:block lg:col-span-1 space-y-8 bg-forest-deep border border-forest-sage/20 p-6 sticky top-28 max-h-[calc(100dvh-140px)] overflow-y-auto overscroll-contain shadow-sm pr-4 scrollbar-thin animate-fade-in">
                <div className="flex items-center justify-between border-b border-forest-sage/20 pb-3">
                  <span className="font-sans text-xs tracking-widest uppercase font-semibold text-forest-cream">
                    Product Filters
                  </span>
                  <button
                    onClick={resetAllFilters}
                    className="text-[10px] uppercase font-bold text-forest-gold hover:opacity-80 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 text-forest-gold" />
                    Reset
                  </button>
                </div>

                {/* Sidebar Search Filter */}
                <div className="space-y-2">
                  <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
                    Keyword Search
                  </h3>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-forest-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Title, artist, story..."
                      className="w-full bg-forest-black border border-forest-sage/30 pl-8 pr-7 py-2 text-[11px] text-forest-cream placeholder-forest-cream/40 focus:outline-none focus:border-forest-gold"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-forest-cream/60 hover:text-forest-gold cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Family Info Panel in Sidebar */}
                <div className="space-y-2 bg-forest-black p-4 border border-forest-sage/10 rounded-sm">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-forest-gold">
                    Active Collection
                  </h4>
                  <p className="text-xs font-serif text-forest-cream/90 font-bold">{displayStyle(selectedCategory)}</p>
                  <button 
                    onClick={() => {
                      setSelectedCategory(null);
                      resetAllFilters();
                    }}
                    className="text-[9px] font-sans underline uppercase text-forest-gold hover:opacity-80 mt-1 block"
                  >
                    Switch Collection
                  </button>
                </div>

                {/* Size Filters */}
                <div className="space-y-3">
                  <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
                    Canvas Dimension
                  </h3>
                  <div className="space-y-2">
                    {sizeOptions.map((sz) => (
                      <label 
                        key={sz.value}
                        className="flex items-start gap-3 text-xs text-forest-cream/80 hover:text-forest-cream cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(sz.value)}
                          onChange={() => toggleSize(sz.value)}
                          className="rounded border-forest-sage/40 text-forest-gold focus:ring-forest-gold w-4 h-4 mt-0.5 cursor-pointer bg-forest-black"
                        />
                        <div>
                          <span className="block font-medium">{sz.label}</span>
                          <span className="text-[10px] text-forest-cream/50">{sz.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color Palette Filter */}
                <div className="space-y-3">
                  <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
                    Color Palette Tone
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {paletteOptions.map((pal) => (
                      <button
                        key={pal.id}
                        onClick={() => setSelectedPalette(selectedPalette === pal.id ? null : pal.id)}
                        className={`flex items-center gap-2 border px-2.5 py-1.5 text-left transition-all ${
                          selectedPalette === pal.id
                            ? 'border-forest-gold bg-forest-sage/20 font-bold'
                            : 'border-forest-sage/20 hover:border-forest-gold'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${pal.bgClass} flex-shrink-0 border border-forest-sage/20`} />
                        <span className="text-[9px] font-medium leading-none uppercase tracking-wider truncate text-forest-cream/80">
                          {pal.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <h3 className="font-sans text-xs tracking-wider uppercase font-medium text-forest-cream">
                      Price Range
                    </h3>
                    <span className="font-mono text-forest-gold font-bold">
                      Up to {formatMAD(maxPrice)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="390"
                    max="6500"
                    step="100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full accent-forest-gold cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-forest-cream/50 font-mono">
                    <span>{formatMAD(390)}</span>
                    <span>{formatMAD(6500)}</span>
                  </div>
                </div>
              </aside>
            )}

            {/* Paintings Grid
              * ⚠️ مجموعتا أصناف حصريتان ومنفصلتان تمامًا.
              * ممنوع دمج إعلاني grid-cols مختلفين لنفس نقطة التوقف.
              * أي تغيير هنا يُلزم تحديث GRID_SIZES في أعلى الملف.
              */}
            <main
              style={gridStyle}
              data-cols={gridCols}
              className={
                showFilters
                  ? 'pz-art-grid lg:col-span-3 grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12'
                  : 'pz-art-grid lg:col-span-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12'
              }
            >
              {filteredPaintings.length === 0 ? (
                <div className="col-span-full bg-forest-deep border border-forest-sage/20 p-12 text-center space-y-4">
                  <HelpCircle className="w-10 h-10 text-forest-sage mx-auto" />
                  <h3 className="font-serif text-2xl text-forest-cream font-bold">No paintings match</h3>
                  <p className="text-xs text-forest-cream/70 max-w-sm mx-auto font-sans leading-relaxed">
                    Try widening your budget, selecting another canvas size category, or resetting all current filters.
                  </p>
                  <button
                    onClick={resetAllFilters}
                    className="bg-forest-gold text-forest-black hover:opacity-90 text-[10px] tracking-[0.2em] uppercase font-bold px-6 py-3 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                visiblePaintings.map((painting, cardIndex) => (
                  <article 
                    key={painting.id}
                    onClick={() => onSelectPainting(painting)}
                    className="break-inside-avoid mb-2 sm:mb-3 lg:mb-4 group cursor-pointer flex flex-col space-y-4 animate-fade-in"
                  >
                    {/* V37 — لا برواز: الصورة تملأ البطاقة حافة إلى حافة.
                        حُذف: border وbg والحشو المتدرّج p-4→p-10 والظلّ.
                        بقي: overflow-hidden لأن تكبير المرور scale-[1.03] يحتاجه،
                        وgroup-hover انتقل من لون الحدّ إلى حلقة ring لا تزيد المقاس. */}
                    <div className="w-full relative overflow-hidden transition-shadow duration-500 hover:shadow-lg">
                      <ArtImage
                        image={imageRefOf(painting)}
                        alt={`${painting.title} — ${painting.artistName}`}
                        sizes={GRID_SIZES}
                        priority={cardIndex < EAGER_COUNT}
                        wrapperClassName="w-full"
                        className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      />
                      
                      {/* Subtle hover overlay details */}
                      <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute bottom-2 left-2 bg-forest-black/70 backdrop-blur-sm px-2 py-0.5 text-[9px] font-mono text-forest-gold/90 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {painting.widthCm}x{painting.heightCm} cm
                      </div>

                      {/* Tiny design indicator */}
                      <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        View Story
                      </div>
                    </div>

                    {/* Info and Price */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h3 className="font-serif text-lg text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
                          {painting.title}
                        </h3>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-mono text-xs tracking-wider text-forest-cream font-bold bg-forest-black border border-forest-sage/20 px-2.5 py-1 block">
                          {formatMAD(painting.price)}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-forest-cream/40 font-sans mt-1 block">
                          Excl. Frame
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </main>
            {totalPages > 1 && (
              <nav
                aria-label="Gallery pagination"
                className="col-span-full flex items-center justify-between gap-4 pt-10 mt-4 border-t border-forest-sage/20"
              >
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="flex items-center gap-2 min-h-[44px] text-[10px] font-sans uppercase tracking-[0.2em] font-bold px-5 py-3 border border-forest-sage/30 text-forest-cream disabled:opacity-30 disabled:cursor-not-allowed hover:border-forest-gold hover:text-forest-gold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-[18px] h-[18px]" aria-hidden="true" />
                  Previous
                </button>

                <div className="text-center">
                  <span className="block font-mono text-xs text-forest-gold font-bold">
                    {page} / {totalPages}
                  </span>
                  <span className="block text-[9px] font-mono uppercase tracking-widest text-forest-cream/50 mt-0.5">
                    {filteredPaintings.length} plates
                  </span>
                </div>

                <button
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 min-h-[44px] text-[10px] font-sans uppercase tracking-[0.2em] font-bold px-5 py-3 border border-forest-sage/30 text-forest-cream disabled:opacity-30 disabled:cursor-not-allowed hover:border-forest-gold hover:text-forest-gold transition-colors cursor-pointer"
                >
                  Next
                  <ArrowRight className="w-[18px] h-[18px]" aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
