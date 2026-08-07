const fs = require('fs');

const code = `
import { useState, useMemo, useEffect } from 'react';
import type { Painting, StyleType, SizeCategory } from '../types';
import { PAINTINGS } from '../data';
import { useRemembered } from './useNavMemory';
import {
  CATEGORIES,
  MOTORBIKE_SUBCATEGORIES,
  CAR_SUBCATEGORIES,
  hasSubCollections,
} from '../lib/galleryTaxonomy';
import {
  ANIME_SUBCATEGORIES,
  FILM_SUBCATEGORIES,
  SERIES_SUBCATEGORIES,
  GAME_SUBCATEGORIES,
} from '../lib/art';

const PAGE_SIZE = 24;

interface Options {
  initialStyleFilter?: StyleType | null;
  onClearInitialStyleFilter?: () => void;
  memoryScope?: string;
}

export function useGalleryFilters(options: Options = {}) {
  const { initialStyleFilter, onClearInitialStyleFilter, memoryScope } = options;
  const key = (name: string) => \`gallery:\${memoryScope ?? 'default'}:\${name}\`;

  const [selectedCategory, setSelectedCategory] = useRemembered<StyleType | null>(key('category'), null);
  const [selectedSubCategory, setSelectedSubCategory] = useRemembered<string | null>(key('sub'), null);
  const [isSubCategoryConfirmed, setIsSubCategoryConfirmed] = useRemembered<boolean>(key('confirmed'), false);

  const [selectedSizes, setSelectedSizes] = useState<SizeCategory[]>([]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useRemembered<string | null>(key('aspect'), null);
  const [selectedResolution, setSelectedResolution] = useRemembered<string | null>(key('res'), 'HD');
  
  const [mobileColumns, setMobileColumns] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('gallery.mobileColumns') : null;
    return saved ? parseInt(saved, 10) : 2;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('gallery.mobileColumns', mobileColumns.toString());
  }, [mobileColumns]);

  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(6500);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'year'>('default');
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Traditional' | 'Pop Culture'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useRemembered<number>(key('page'), 1);

  useEffect(() => {
    setSelectedSubCategory(null);
    if (!selectedCategory) {
      setIsSubCategoryConfirmed(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (initialStyleFilter) {
      const isValid = CATEGORIES.some(cat => cat.name === initialStyleFilter);
      if (isValid) {
        setSelectedCategory(initialStyleFilter);
        const hasSub = hasSubCollections(initialStyleFilter);
        setIsSubCategoryConfirmed(!hasSub);
      } else {
        setSelectedCategory(null);
        setIsSubCategoryConfirmed(false);
      }
      if (onClearInitialStyleFilter) {
        onClearInitialStyleFilter();
      }
    } else if ((initialStyleFilter as any) === '') {
      setSelectedCategory(null);
      setIsSubCategoryConfirmed(false);
      if (onClearInitialStyleFilter) {
        onClearInitialStyleFilter();
      }
    }
  }, [initialStyleFilter, onClearInitialStyleFilter]);

  const toggleSize = (size: SizeCategory) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const resetAllFilters = () => {
    setSelectedSizes([]);
    setSelectedAspectRatio(null);
    setSelectedResolution('HD');
    setSelectedPalette(null);
    setMaxPrice(8000);
    setSortBy('default');
    setSelectedSubCategory(null);
    setSearchQuery('');
  };

  const globalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return PAINTINGS.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.artistName.toLowerCase().includes(q) ||
      p.style.toLowerCase().includes(q) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
      p.story.toLowerCase().includes(q) ||
      p.paletteNames.some(name => name.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const filteredPaintings = useMemo(() => {
    if (!selectedCategory) return [];
    let result = PAINTINGS.filter(p => p.style === selectedCategory);
    if (selectedSubCategory) {
      result = result.filter(p => p.subCategory === selectedSubCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.artistName.toLowerCase().includes(q) ||
        p.style.toLowerCase().includes(q) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        p.story.toLowerCase().includes(q) ||
        p.paletteNames.some(name => name.toLowerCase().includes(q))
      );
    }
    if (selectedSizes.length > 0) {
      result = result.filter(p => selectedSizes.includes(p.sizeCategory));
    }
    if (selectedPalette) {
      if (selectedPalette === 'earth') {
        result = result.filter(p => p.colorPalette.some(c => ['#8C7A6B', '#A18F7D', '#6F5C4B', '#C5B9AD', '#CBBDA0', '#8D7F67'].includes(c)));
      } else if (selectedPalette === 'monochrome') {
        result = result.filter(p => p.colorPalette.some(c => ['#121212', '#2A2A2A', '#131313', '#343332', '#72706D', '#0F0F0F', '#242424', '#EDEDED'].includes(c)));
      } else if (selectedPalette === 'lapis') {
        result = result.filter(p => p.colorPalette.some(c => ['#0C1625', '#162C4E', '#325078', '#1F1A3A', '#4A3B6B', '#A58BBA', '#0A192F', '#172A45', '#306F8A', '#00F0FF', '#00FF87'].includes(c)));
      } else if (selectedPalette === 'ochre') {
        result = result.filter(p => p.colorPalette.some(c => ['#D1A153', '#E5CE93', '#C68735', '#E2A414', '#D21F3C'].includes(c)));
      }
    }
    result = result.filter(p => p.price <= maxPrice);

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'year') {
      result.sort((a, b) => b.year - a.year);
    }
    return result;
  }, [selectedCategory, selectedSubCategory, searchQuery, selectedSizes, selectedPalette, maxPrice, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [
    selectedCategory,
    selectedSubCategory,
    searchQuery,
    selectedSizes,
    selectedPalette,
    maxPrice,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPaintings.length / PAGE_SIZE));
  const visiblePaintings = useMemo(
    () => filteredPaintings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPaintings, page]
  );

  const getCountForStyle = (styleName: StyleType) => {
    return PAINTINGS.filter(p => p.style === styleName).length;
  };

  const filteredCategoriesList = CATEGORIES.filter(cat => activeTab === 'All' || cat.type === activeTab);
  
  const currentCategoryInfo = useMemo(() => {
    if (!selectedCategory) return null;
    return CATEGORIES.find(cat => cat.name === selectedCategory) || null;
  }, [selectedCategory]);

  const availableSubCategories = useMemo(() => {
    if (!selectedCategory) return [];
    
    let raw: string[] = [];
    if (selectedCategory === 'Motorbikes') raw = MOTORBIKE_SUBCATEGORIES;
    else if (selectedCategory === 'Cars') raw = CAR_SUBCATEGORIES;
    else if (selectedCategory === 'Anime') raw = ANIME_SUBCATEGORIES;
    else if (selectedCategory === 'Films') raw = [...FILM_SUBCATEGORIES, ...SERIES_SUBCATEGORIES];
    else if (selectedCategory === 'Gaming') raw = ['PRISM Studio', ...GAME_SUBCATEGORIES];

    return raw.filter((subCat) => PAINTINGS.some((p) => p.subCategory === subCat));
  }, [selectedCategory]);

  const seriesSplitIndex = selectedCategory === 'Films' ? FILM_SUBCATEGORIES.length : -1;

  return {
    selectedCategory,
    setSelectedCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    isSubCategoryConfirmed,
    setIsSubCategoryConfirmed,
    selectedSizes,
    selectedAspectRatio,
    setSelectedAspectRatio,
    selectedResolution,
    setSelectedResolution,
    mobileColumns,
    setMobileColumns,
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
    pageSize: PAGE_SIZE,
  };
}
`;
fs.writeFileSync('src/hooks/useGalleryFilters.ts', code);
