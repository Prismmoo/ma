import { useCallback, useMemo, useState } from 'react';
import type { Painting } from '../../types';
import {
  PACK_RULES,
  computeTotals,
  type PackEntry,
  type PackKind,
} from '../../lib/packBuilder';

export function usePackSelection(kind: PackKind, finishId: string) {
  const rule = PACK_RULES[kind];
  const [entries, setEntries] = useState<PackEntry[]>([]);

  const totals = useMemo(
    () => computeTotals(kind, entries, finishId),
    [kind, entries, finishId]
  );

  const quantityOf = useCallback(
    (id: string) => entries.find((entry) => entry.painting.id === id)?.quantity ?? 0,
    [entries]
  );

  const add = useCallback(
    (painting: Painting, by = 1) => {
      setEntries((current) => {
        const count = current.reduce((sum, entry) => sum + entry.quantity, 0);
        if (count + by > rule.maximum) return current;
        const index = current.findIndex((entry) => entry.painting.id === painting.id);
        if (index === -1) return [...current, { painting, quantity: by }];
        const next = [...current];
        next[index] = { ...next[index], quantity: next[index].quantity + by };
        return next;
      });
    },
    [rule.maximum]
  );

  const remove = useCallback((paintingId: string, by = 1) => {
    setEntries((current) => {
      const index = current.findIndex((entry) => entry.painting.id === paintingId);
      if (index === -1) return current;
      const quantity = current[index].quantity - by;
      if (quantity <= 0) return current.filter((_, i) => i !== index);
      const next = [...current];
      next[index] = { ...next[index], quantity };
      return next;
    });
  }, []);

  const toggle = useCallback(
    (painting: Painting) => {
      quantityOf(painting.id) > 0 ? remove(painting.id, Number.MAX_SAFE_INTEGER) : add(painting);
    },
    [quantityOf, remove, add]
  );

  const clear = useCallback(() => setEntries([]), []);

  return { entries, totals, rule, quantityOf, add, remove, toggle, clear };
}
