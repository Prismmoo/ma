import { useCallback, useMemo, useState, useEffect } from 'react';
import type { Painting } from '../../types';
import type { PackKind } from '../../lib/packBuilder';
import {
  poolFor,
  categoryTree,
  itemsInCategory,
  itemsInCollection,
  searchPool,
  type PackCategoryNode,
} from '../../lib/packCatalog';

export type BrowserLevel = 'categories' | 'collections' | 'items' | 'search';

export function usePackBrowser(kind: PackKind) {
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [collectionSlug, setCollectionSlug] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Switching pack kind must reset navigation, otherwise the buyer lands on a
  // collection that does not exist in the other pool.
  useEffect(() => {
    setCategorySlug(null);
    setCollectionSlug(null);
    setQuery('');
  }, [kind]);

  const pool = useMemo(() => poolFor(kind), [kind]);
  const tree = useMemo(() => categoryTree(pool), [pool]);

  const category: PackCategoryNode | null = useMemo(
    () => (categorySlug ? tree.find((c) => c.slug === categorySlug) ?? null : null),
    [tree, categorySlug]
  );

  const level: BrowserLevel = useMemo(() => {
    if (query.trim()) return 'search';
    if (!category) return 'categories';
    if (category.collections.length > 0 && !collectionSlug) return 'collections';
    return 'items';
  }, [query, category, collectionSlug]);

  /**
   * The rendered list. This is the performance contract: outside of 'items' and
   * 'search' it is EMPTY, so zero artwork thumbnails are mounted while the buyer
   * is choosing a category. At 'items' it is one collection — tens, not hundreds.
   */
  const items: Painting[] = useMemo(() => {
    if (level === 'search') return searchPool(pool, query);
    if (level !== 'items' || !category) return [];
    return collectionSlug
      ? itemsInCollection(pool, category.slug, collectionSlug)
      : itemsInCategory(pool, category.slug);
  }, [level, pool, query, category, collectionSlug]);

  const openCategory = useCallback((slug: string) => {
    setQuery('');
    setCategorySlug(slug);
    setCollectionSlug(null);
  }, []);

  const openCollection = useCallback((slug: string) => setCollectionSlug(slug), []);

  const back = useCallback(() => {
    if (query.trim()) { setQuery(''); return; }
    if (collectionSlug) { setCollectionSlug(null); return; }
    setCategorySlug(null);
  }, [query, collectionSlug]);

  const reset = useCallback(() => {
    setQuery('');
    setCategorySlug(null);
    setCollectionSlug(null);
  }, []);

  const collection = useMemo(
    () => category?.collections.find((c) => c.slug === collectionSlug) ?? null,
    [category, collectionSlug]
  );

  return {
    pool, tree, level, category, collection, items,
    query, setQuery,
    openCategory, openCollection, back, reset,
  };
}
