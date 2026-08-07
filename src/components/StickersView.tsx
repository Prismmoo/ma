import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Search, X, HelpCircle } from 'lucide-react';
import { Painting, StyleType, FramingOption } from '../types';
import { Personalization } from '../lib/personalization';
import ArtImage from './ArtImage';
import CoverImage from './CoverImage';
import { useRemembered } from '../hooks/useNavMemory';
import {
  LEGACY_SUBCATEGORY_COVERS,
  CATEGORY_COVER_FALLBACKS,
} from '../lib/legacyCovers';
import {
  ANIME_SUBCATEGORIES,
  FILM_SUBCATEGORIES,
  SERIES_SUBCATEGORIES,
  GAME_SUBCATEGORIES,
  COLLECTIONS_BY_TITLE,
  collectionCover,
  collectionImages,
} from '../lib/art';
import RotatingCover from './RotatingCover';
import {
  CATEGORIES,
  displayStyle,
  subCategoryCard,
  categoryInfo,
  MOTORBIKE_SUBCATEGORIES,
  CAR_SUBCATEGORIES,
} from '../lib/galleryTaxonomy';
import {
  STICKER_PRODUCTS,
  STICKERS_BY_ID,
  StickerProduct,
} from '../lib/stickers';
import StickerEditor from './stickers/StickerEditor';
import CustomerArtworkUpload from './CustomerArtworkUpload';
import { buildCustomerPainting } from '../lib/customerArtwork';
import { PAINTINGS } from '../data';
import { formatMAD, STICKER_FLOOR_MAD } from '../lib/pricing';
import { imageRefOf } from '../lib/artRef';

/* ---------------------------------------------------------------------------
 * The sticker workshop is a MIRROR of the paintings gallery.
 * Same taxonomy module, same covers, same ordering, same card markup.
 * Nothing about a category, a cover or a collection is declared here:
 * everything comes from `lib/galleryTaxonomy`, `lib/art` and `lib/stickers`,
 * so any cover changed for the paintings changes here too, automatically.
 * ------------------------------------------------------------------------- */

const GRID_SIZES = '(min-width: 1280px) 400px, (min-width: 768px) 30vw, 45vw';
const SEARCH_SIZES = '(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw';
const EAGER_COUNT = 6;

interface StickersViewProps {
  onAddToCart: (painting: Painting, frame: FramingOption, personalization?: Personalization) => void;
}

/** Exactly the same sub-collection lists the gallery browses. */
function subCollectionsFor(style: StyleType | null): string[] {
  if (!style) return [];
  
  let raw: string[] = [];
  if (style === 'Motorbikes') raw = MOTORBIKE_SUBCATEGORIES;
  else if (style === 'Cars') raw = CAR_SUBCATEGORIES;
  else if (style === 'Anime') raw = ANIME_SUBCATEGORIES;
  else if (style === 'Films') raw = [...FILM_SUBCATEGORIES, ...SERIES_SUBCATEGORIES];
  else if (style === 'Gaming') raw = ['PRISM Studio', ...GAME_SUBCATEGORIES];
  
  // استثنِ أي مجموعة صار عدد صورها صفرًا وليست مجموعة استوديو
  return raw.filter((subCat) => PAINTINGS.some((p) => p.subCategory === subCat));
}

/** One sticker card - identical framing to a painting card. */
const StickerCard: React.FC<{
  sticker: StickerProduct;
  index: number;
  sizes: string;
  onOpen: () => void;
}> = ({
  sticker,
  index,
  sizes,
  onOpen,
}) => {
  return (
    <article
      onClick={onOpen}
      className="break-inside-avoid mb-2 sm:mb-3 lg:mb-4 group cursor-pointer flex flex-col space-y-4 animate-fade-in transition-transform active:scale-[0.98]"
    >
      <div className="pz-sticker-tile pz-curl rounded-[12px] lg:rounded-[16px] w-full flex items-center justify-center border border-white/10 transition-colors duration-500 group-hover:border-[#7952F3]/60 p-7 sm:p-9">
        <ArtImage
          image={imageRefOf(sticker)}
          alt={`${sticker.title} sticker`}
          sizes={sizes}
          priority={index < EAGER_COUNT}
          wrapperClassName="w-full"
          className="pz-sticker-art object-contain"
        />

        {/* Sticker chrome: laminate gloss, dashed cut line, peeling corner. */}
        <div className="pz-sticker-gloss" aria-hidden="true" />
        <div className="pz-sticker-cutline" aria-hidden="true" />
        <div className="pz-curl-shadow" aria-hidden="true" />
        <div className="pz-curl-flap" aria-hidden="true" />

        <div className="absolute bottom-3 left-3 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 px-2.5 py-1 text-[9px] font-mono text-[#C084FC] tracking-wider uppercase">
          Die-cut vinyl
        </div>

        <div className="absolute top-3 right-3 rounded-full bg-[#7952F3] text-white px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity">
          Customize
        </div>
      </div>

      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <h3 className="font-serif text-lg text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
            {sticker.title}
          </h3>
        </div>

        <div className="text-right">
          <span className="font-mono text-xs tracking-wider text-forest-cream font-bold bg-forest-black border border-forest-sage/20 px-2.5 py-1 block">
            From {formatMAD(STICKER_FLOOR_MAD)}
          </span>
          <span className="text-[8px] uppercase tracking-widest text-forest-cream/40 font-sans mt-1 block">
            Incl. cut
          </span>
        </div>
      </div>
    </article>
  );
}

export default function StickersView({ onAddToCart }: StickersViewProps) {
  const [selectedCategory, setSelectedCategory] = useRemembered<StyleType | null>('stickers:category', null);
  const [selectedSubCategory, setSelectedSubCategory] = useRemembered<string | null>('stickers:sub', null);
  const [isSubCategoryConfirmed, setIsSubCategoryConfirmed] = useRemembered<boolean>('stickers:confirmed', false);
  const [activeTab, setActiveTab] = useState<'All' | 'Traditional' | 'Pop Culture'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editorStickerId, setEditorStickerId] = useState<string | null>(null);
  const [customEditorSticker, setCustomEditorSticker] = useState<StickerProduct | null>(null);

  /* V35: الملصقات تتبع نفس تفضيل أعمدة المعرض المحفوظ.
     نقرأ المفتاح نفسه المكتوب في useGalleryFilters.ts:45 حتى يبقى مصدر
     الحقيقة واحدًا دون تمرير props عبر شجرة غير معنيّة. */
  const [stickerGridCols, setStickerGridCols] = useState<number>(() => {
    if (typeof window === 'undefined') return 2;
    return localStorage.getItem('gallery.mobileColumns') === '3' ? 3 : 2;
  });

  useEffect(() => {
    const sync = () => {
      setStickerGridCols(
        localStorage.getItem('gallery.mobileColumns') === '3' ? 3 : 2,
      );
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const stickerGridStyle = useMemo(
    () => ({ ['--pz-mobile-cols' as string]: String(stickerGridCols) }) as React.CSSProperties,
    [stickerGridCols],
  );

  useEffect(() => {
    setSelectedSubCategory(null);
    if (!selectedCategory) setIsSubCategoryConfirmed(false);
  }, [selectedCategory]);

  const countForStyle = (style: StyleType) =>
    STICKER_PRODUCTS.filter((s) => s.style === style).length;

  /* Only families that really have stickers, in the gallery's own order. */
  const visibleCategories = useMemo(
    () =>
      CATEGORIES.filter(
        (cat) => (activeTab === 'All' || cat.type === activeTab) && countForStyle(cat.name) > 0,
      ),
    [activeTab],
  );

  const availableSubCategories = useMemo(
    () => subCollectionsFor(selectedCategory).filter((sub) =>
      STICKER_PRODUCTS.some((s) => s.style === selectedCategory && s.collection === sub),
    ),
    [selectedCategory],
  );

  const seriesSplitIndex = useMemo(() => {
    if (selectedCategory !== 'Films') return -1;
    const films = availableSubCategories.filter((t) => FILM_SUBCATEGORIES.includes(t));
    return films.length > 0 && films.length < availableSubCategories.length ? films.length : -1;
  }, [selectedCategory, availableSubCategories]);

  const globalSearchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return STICKER_PRODUCTS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artistName.toLowerCase().includes(q) ||
        s.style.toLowerCase().includes(q) ||
        (s.collection ?? '').toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const listedStickers = useMemo(() => {
    if (!selectedCategory) return [];
    let result = STICKER_PRODUCTS.filter((s) => s.style === selectedCategory);
    if (selectedSubCategory) result = result.filter((s) => s.collection === selectedSubCategory);
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || (s.collection ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [selectedCategory, selectedSubCategory, searchQuery]);

  const currentCategoryInfo = categoryInfo(selectedCategory);
  const editorSticker = customEditorSticker ?? (editorStickerId ? STICKERS_BY_ID.get(editorStickerId) : undefined);

  /* ---------------------------------------------------------------- editor */
  if (editorStickerId || customEditorSticker) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        {editorSticker ? (
          <StickerEditor
            sticker={editorSticker}
            onBack={() => setEditorStickerId(null)}
            onAddToCart={onAddToCart}
          />
        ) : (
          <div className="bg-forest-deep border border-forest-sage/20 p-12 text-center space-y-4">
            <HelpCircle className="w-10 h-10 text-forest-sage mx-auto" />
            <h3 className="font-serif text-2xl text-forest-cream font-bold">This sticker is no longer available</h3>
            <button
              onClick={() => setEditorStickerId(null)}
              className="bg-forest-gold text-forest-black text-[10px] tracking-[0.2em] uppercase font-bold px-6 py-3 cursor-pointer"
            >
              Back to the workshop
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-12">
      {/* ------------------------------------------------- header + search */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-semibold">
              Sticker Workshop
            </span>
            <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mt-2 text-forest-cream font-bold">
              Die-Cut Vinyl Stickers
            </h1>
            <p className="text-sm text-forest-cream/70 max-w-2xl font-sans mt-3 leading-relaxed">
              Every canvas in the gallery exists here as a sticker, inside the very same collections.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-forest-cream/40" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stickers"
              aria-label="Search stickers"
              className="w-full bg-forest-black border border-forest-sage/20 pl-9 pr-9 py-3 text-xs font-sans text-forest-cream placeholder:text-forest-cream/40 focus:outline-none focus:border-forest-gold transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-cream/40 hover:text-forest-gold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Dynamic Views */}
      {searchQuery.trim() && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
              {globalSearchResults.length} results
            </span>
            <span className="h-px flex-1 bg-forest-sage/20" />
          </div>
          <div
            className="w-full pz-art-grid grid gap-x-2 gap-y-6 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            style={stickerGridStyle}
            data-cols={stickerGridCols}
          >
            {globalSearchResults.slice(0, 48).map((sticker, i) => (
              <StickerCard
                key={sticker.id}
                sticker={sticker}
                index={i}
                sizes={SEARCH_SIZES}
                onOpen={() => setEditorStickerId(sticker.id)}
              />
            ))}
          </div>
        </div>
      )}

      {!searchQuery.trim() && selectedCategory === null ? (
        /* -------------------------------------------- VIEW 1: CATEGORIES */
        <div className="space-y-8">
          <div className="flex gap-2">
            {(['All', 'Pop Culture', 'Traditional'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-[0.2em] border transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-forest-gold text-forest-black border-forest-gold'
                    : 'bg-forest-black text-forest-cream/70 border-forest-sage/20 hover:border-forest-gold'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div
            className="w-full pz-art-grid grid gap-x-2 gap-y-6 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:columns-5 animate-fade-in transition-transform active:scale-[0.98]"
            style={stickerGridStyle}
            data-cols={stickerGridCols}
          >
            {visibleCategories.map((cat) => {
              const count = countForStyle(cat.name);
              return (
                <article
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setIsSubCategoryConfirmed(
                      subCollectionsFor(cat.name).filter((sub) =>
                        STICKER_PRODUCTS.some((s) => s.style === cat.name && s.collection === sub),
                      ).length === 0,
                    );
                  }}
                  className="group cursor-pointer flex flex-col space-y-4 transition-all"
                >
                  <div className="pz-sticker-tile pz-curl rounded-[12px] lg:rounded-[16px] aspect-square border border-white/10 relative overflow-hidden transition-colors duration-500 group-hover:border-[#7952F3]/60">
            <div className="pz-curl-shadow" aria-hidden="true" />
            <div className="pz-curl-flap" aria-hidden="true" />
                    <CoverImage
                      candidates={[cat.imageUrl, CATEGORY_COVER_FALLBACKS[cat.name]]}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    />

                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="absolute top-0 bottom-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/[0.25] to-transparent skew-x-[-30deg] transition-transform duration-1000 ease-out group-hover:translate-x-[450%]" />
                      <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
                    </div>

                    <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                      {cat.type}
                    </div>

                    <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm">
                      {count} {count === 1 ? 'Sticker' : 'Stickers'}
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h3 className="font-serif text-xl text-forest-cream leading-tight group-hover:text-forest-gold transition-colors font-bold">
                        {displayStyle(cat.name)}
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
        </div>
      ) : !searchQuery.trim() && !isSubCategoryConfirmed && availableSubCategories.length > 0 ? (
        /* --------------------------------------- VIEW 1.5: SUB-COLLECTIONS */
        <div className="space-y-12 animate-fade-in transition-transform active:scale-[0.98]">
          <div className="border-b border-forest-sage/20 pb-8 space-y-6">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="pz-back-btn text-xs font-sans tracking-wider text-forest-cream hover:text-forest-gold"
            >
              <ArrowLeft className="pz-back-btn__icon w-[18px] h-[18px]" aria-hidden="true" />
              <span className="pz-back-btn__label">Back to all Collections</span>
            </button>

            <div>
              <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-forest-gold font-semibold">
                Discover {displayStyle(selectedCategory!)}
              </span>
              <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mt-2 text-forest-cream font-bold">
                {displayStyle(selectedCategory!)} Sticker Collections
              </h1>
              <p className="text-sm text-forest-cream/70 max-w-2xl font-sans mt-3 leading-relaxed">
                {currentCategoryInfo?.desc}
              </p>
            </div>
          </div>

          <div
            className="w-full pz-art-grid grid gap-x-2 gap-y-6 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 animate-fade-in transition-transform active:scale-[0.98]"
            style={stickerGridStyle}
            data-cols={stickerGridCols}
          >
            {availableSubCategories.map((subCat, subIdx) => {
              const card = subCategoryCard(selectedCategory, subCat);
              const stickerCount = STICKER_PRODUCTS.filter(
                (s) => s.style === selectedCategory && s.collection === subCat,
              ).length;

              return (
                <React.Fragment key={subCat}>
                  {subIdx === 0 && seriesSplitIndex > 0 && (
                    <div className="col-span-full flex items-center gap-3 pb-1">
                      <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
                        Films
                      </span>
                      <span className="h-px flex-1 bg-forest-sage/20" />
                    </div>
                  )}
                  {subIdx === seriesSplitIndex && (
                    <div className="col-span-full flex items-center gap-3 pt-6 pb-1">
                      <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-semibold whitespace-nowrap">
                        Series
                      </span>
                      <span className="h-px flex-1 bg-forest-sage/20" />
                    </div>
                  )}

                  <article
                    onClick={() => {
                      setSelectedSubCategory(subCat);
                      setIsSubCategoryConfirmed(true);
                    }}
                    className="group cursor-pointer flex flex-col space-y-4 transition-all"
                  >
                    <div className="pz-sticker-tile pz-curl rounded-[12px] lg:rounded-[16px] aspect-square border border-white/10 relative overflow-hidden transition-colors duration-500 group-hover:border-[#7952F3]/60">
            <div className="pz-curl-shadow" aria-hidden="true" />
            <div className="pz-curl-flap" aria-hidden="true" />
                      <RotatingCover
                        seedKey={COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? subCat}
                        index={subIdx}
                        pool={collectionImages(
                          COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? '',
                        ).map((r) => r.src)}
                        candidates={[
                          collectionCover(COLLECTIONS_BY_TITLE.get(subCat)?.slug ?? '')?.src,
                          card.imageUrl,
                          LEGACY_SUBCATEGORY_COVERS[card.title],
                          LEGACY_SUBCATEGORY_COVERS[card.name ?? ''],
                          selectedCategory ? CATEGORY_COVER_FALLBACKS[selectedCategory] : null,
                          currentCategoryInfo?.imageUrl,
                        ]}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute top-0 bottom-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/[0.25] to-transparent skew-x-[-30deg] transition-transform duration-1000 ease-out group-hover:translate-x-[450%]" />
                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
                      </div>

                      <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                        {card.tagline}
                      </div>

                      <div className="absolute top-4 right-4 bg-forest-gold text-forest-black px-2.5 py-1 text-[8px] font-sans tracking-[0.15em] uppercase font-bold rounded-sm">
                        {stickerCount} stickers
                      </div>
                    </div>

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
      ) : !searchQuery.trim() ? (
        /* ------------------------------------------ VIEW 2: STICKER GRID */
        <div className="space-y-12 animate-fade-in transition-transform active:scale-[0.98]">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => {
                if (availableSubCategories.length > 0) {
                  setIsSubCategoryConfirmed(false);
                  setSelectedSubCategory(null);
                } else {
                  setSelectedCategory(null);
                }
              }}
              className="pz-back-btn text-xs font-sans tracking-wider text-forest-cream hover:text-forest-gold max-w-full"
            >
              <ArrowLeft className="pz-back-btn__icon w-[18px] h-[18px]" aria-hidden="true" />
              <span className="pz-back-btn__label truncate">
                {availableSubCategories.length > 0
                  ? `Back to ${displayStyle(selectedCategory!)} Collections`
                  : 'Back to all Collections'}
              </span>
            </button>

            <div className="bg-forest-deep border border-forest-sage/20 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center shadow-sm">
              {currentCategoryInfo && (
                <>
                  <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 border border-forest-sage/20 p-2.5 bg-forest-black">
                    <CoverImage
                      candidates={[
                        selectedSubCategory
                          ? collectionCover(COLLECTIONS_BY_TITLE.get(selectedSubCategory)?.slug ?? '')?.src
                          : null,
                        selectedSubCategory
                          ? LEGACY_SUBCATEGORY_COVERS[selectedSubCategory]
                          : null,
                        currentCategoryInfo.imageUrl,
                        CATEGORY_COVER_FALLBACKS[currentCategoryInfo.name],
                      ]}
                      alt={selectedSubCategory ?? currentCategoryInfo.name}
                      className="w-full h-full object-cover shadow-sm"
                      priority
                    />
                  </div>
                  <div className="space-y-3 text-center md:text-left flex-grow">
                    <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-forest-gold font-bold bg-forest-black px-3 py-1 border border-forest-sage/10 rounded-sm">
                      {currentCategoryInfo.type} / {currentCategoryInfo.tagline}
                    </span>
                    <h1 className="font-serif text-3xl md:text-4xl text-forest-cream tracking-tight font-bold">
                      {selectedSubCategory ?? displayStyle(selectedCategory!)} Stickers
                    </h1>
                    <p className="text-sm text-forest-cream/70 font-sans leading-relaxed max-w-2xl">
                      {selectedSubCategory
                        ? subCategoryCard(selectedCategory, selectedSubCategory).desc
                        : currentCategoryInfo.desc}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div
            className="w-full pz-art-grid grid gap-x-2 gap-y-6 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            style={stickerGridStyle}
            data-cols={stickerGridCols}
          >
            {listedStickers.length === 0 ? (
              <div className="col-span-full bg-forest-deep border border-forest-sage/20 p-12 text-center space-y-4">
                <HelpCircle className="w-10 h-10 text-forest-sage mx-auto" />
                <h3 className="font-serif text-2xl text-forest-cream font-bold">No stickers here yet</h3>
                <p className="text-xs text-forest-cream/70 max-w-sm mx-auto font-sans leading-relaxed">
                  This collection has no artwork that can be printed as a sticker.
                </p>
              </div>
            ) : (
              listedStickers.map((sticker, i) => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
                  index={i}
                  sizes={GRID_SIZES}
                  onOpen={() => setEditorStickerId(sticker.id)}
                />
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
