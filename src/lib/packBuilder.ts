import type { Painting } from '../types';
import { formatMAD, paintingPriceMAD, stickerPriceMAD, roundTo } from './pricing';

export type PackKind = 'sticker' | 'canvas';

export interface PackRule {
  kind: PackKind;
  label: string;
  labelAr: string;
  minimum: number;
  maximum: number;
  /** Sticker packs ship at one physical size; canvases keep their own. */
  fixedSizeCm: [number, number] | null;
}

export const PACK_RULES: Record<PackKind, PackRule> = {
  sticker: {
    kind: 'sticker',
    label: 'Sticker Pack',
    labelAr: 'باك ستيكر',
    minimum: 10,
    maximum: 60,
    fixedSizeCm: [10, 10],
  },
  canvas: {
    kind: 'canvas',
    label: 'Canvas Pack',
    labelAr: 'باك لوحات',
    minimum: 3,
    maximum: 12,
    fixedSizeCm: null,
  },
};

/* ------------------------------------------------------------------ */
/* Discount curve                                                      */
/* ------------------------------------------------------------------ */

export interface DiscountTier {
  from: number;
  rate: number;
  label: string;
}

/**
 * Volume discounts. Deliberately gentle: the goal is to reward a bigger basket,
 * not to train buyers to wait for a sale. Each tier is one visible step, so the
 * UI can say "add 3 more and save 5% more" — which is what actually moves a
 * basket from 12 to 15.
 */
export const DISCOUNT_TIERS: Record<PackKind, DiscountTier[]> = {
  sticker: [
    { from: 10, rate: 0.05, label: '5%' },
    { from: 15, rate: 0.10, label: '10%' },
    { from: 25, rate: 0.15, label: '15%' },
    { from: 40, rate: 0.20, label: '20%' },
  ],
  canvas: [
    { from: 3, rate: 0.08, label: '8%' },
    { from: 5, rate: 0.12, label: '12%' },
    { from: 8, rate: 0.15, label: '15%' },
  ],
};

export function tierFor(kind: PackKind, count: number): DiscountTier | null {
  const tiers = DISCOUNT_TIERS[kind];
  let active: DiscountTier | null = null;
  for (const tier of tiers) if (count >= tier.from) active = tier;
  return active;
}

export function nextTier(kind: PackKind, count: number): DiscountTier | null {
  return DISCOUNT_TIERS[kind].find((tier) => count < tier.from) ?? null;
}

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

export interface PackEntry {
  painting: Painting;
  quantity: number;
}

export interface PackTotals {
  count: number;
  subtotal: number;
  discountRate: number;
  discount: number;
  total: number;
  tier: DiscountTier | null;
  next: DiscountTier | null;
  /** How many more pieces unlock the next tier. Null when already at the top. */
  toNextTier: number | null;
  meetsMinimum: boolean;
  remainingToMinimum: number;
  atMaximum: boolean;
}

export function unitPrice(kind: PackKind, painting: Painting, finishId: string): number {
  if (kind === 'sticker') {
    const [w, h] = PACK_RULES.sticker.fixedSizeCm!;
    return stickerPriceMAD(w, h, finishId);
  }
  return paintingPriceMAD(painting, 'resin');
}

export function computeTotals(
  kind: PackKind,
  entries: PackEntry[],
  finishId: string
): PackTotals {
  const rule = PACK_RULES[kind];
  const count = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const subtotal = entries.reduce(
    (sum, entry) => sum + unitPrice(kind, entry.painting, finishId) * entry.quantity,
    0
  );

  const tier = tierFor(kind, count);
  const next = nextTier(kind, count);
  const discountRate = tier?.rate ?? 0;
  const discount = roundTo(subtotal * discountRate, 1);

  return {
    count,
    subtotal: roundTo(subtotal, 1),
    discountRate,
    discount,
    total: roundTo(subtotal - discount, 1),
    tier,
    next,
    toNextTier: next ? next.from - count : null,
    meetsMinimum: count >= rule.minimum,
    remainingToMinimum: Math.max(0, rule.minimum - count),
    atMaximum: count >= rule.maximum,
  };
}

/** The label under the order button. Never leaves the buyer guessing. */
export function gateMessage(kind: PackKind, totals: PackTotals): string {
  const rule = PACK_RULES[kind];
  if (!totals.meetsMinimum) {
    const noun = kind === 'sticker' ? 'stickers' : 'canvases';
    return `Choose ${totals.remainingToMinimum} more ${noun} · minimum ${rule.minimum}`;
  }
  if (totals.next && totals.toNextTier) {
    return `Add ${totals.toNextTier} more to save ${totals.next.label}`;
  }
  return `Best price reached · ${formatMAD(totals.total)}`;
}
