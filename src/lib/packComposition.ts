import type { Painting } from '../types';

export type PackType = 'sticker-box' | 'twin-canvas' | 'collector-portfolio';
export type PackComponentRole = 'sticker' | 'canvas' | 'accessory';
export type StickerFinishName = 'Holographic' | 'Chrome' | 'Matte';

/** One real, physically produced artwork inside a bundle. */
export interface PackComponent {
  /** 1-based slot the buyer filled. Stable across the whole pipeline. */
  slot: number;
  role: PackComponentRole;
  /** The catalogue id of the artwork the buyer picked. Never 'mixed'. */
  sourceId: string;
  title: string;
  artistId: string;
  artistName: string;
  style: string;
  /** Which collection inside the style. The owner needs this to pull the file. */
  subCategory?: string;
  year: number;
  /** Catalogue CDN address, OR a data: URL when the buyer uploaded the image. */
  imageUrl: string;
  /**
   * True when imageUrl is a data: URL carrying the buyer's own file.
   *
   * The server branches on this: an upload's bytes are already in the payload
   * and must be written straight to Drive, while a catalogue URL must be
   * fetched server-side. Deriving it here rather than sniffing the string on
   * the server keeps one authority over what "customer artwork" means.
   */
  isCustomerUpload?: boolean;
  /** Real production size of THIS component, not of the bundle. */
  widthCm: number;
  heightCm: number;
  /** Catalogue price before any bundle discount. */
  catalogPrice: number;
  /** Sticker finish, or null for canvases. */
  finish: StickerFinishName | null;
  colorPalette: string[];
  paletteNames: string[];
}

export interface PackPricing {
  componentsTotal: number;
  packagingPrice: number;
  discountPercent: number;
  discountAmount: number;
  packPrice: number;
}

export interface PackPackaging {
  id: string;
  name: string;
  description: string;
}

export interface PackComposition {
  isPack: true;
  packType: PackType;
  packLabel: string;
  componentCount: number;
  components: PackComponent[];
  packaging: PackPackaging;
  /** Global finish chosen for a sticker box; null when not applicable. */
  finish: StickerFinishName | null;
  pricing: PackPricing;
  /** ISO timestamp of the moment the buyer confirmed the pack. */
  composedAt: string;
}

/** Physical production size per component role. Values are the real ones
 *  already used elsewhere in the app; do not change them. */
export const PACK_COMPONENT_SIZE_CM: Record<PackType, { sticker: [number, number] | null }> = {
  'sticker-box':         { sticker: [10, 10] },
  'twin-canvas':         { sticker: null },
  'collector-portfolio': { sticker: [8, 8] },
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toStickerComponent(
  painting: Painting,
  slot: number,
  finish: StickerFinishName,
  sizeCm: [number, number]
): PackComponent {
  return {
    slot,
    role: 'sticker',
    sourceId: painting.id,
    title: painting.title,
    artistId: painting.artistId,
    artistName: painting.artistName,
    style: painting.style,
    subCategory: typeof painting.subCategory === 'string' ? painting.subCategory : undefined,
    year: painting.year,
    imageUrl: painting.imageUrl,
    isCustomerUpload: (painting as Painting & { isCustomerUpload?: boolean }).isCustomerUpload === true,
    widthCm: sizeCm[0],
    heightCm: sizeCm[1],
    catalogPrice: painting.price,
    finish,
    colorPalette: painting.colorPalette,
    paletteNames: painting.paletteNames,
  };
}

export function toCanvasComponent(painting: Painting, slot: number): PackComponent {
  return {
    slot,
    role: 'canvas',
    sourceId: painting.id,
    title: painting.title,
    artistId: painting.artistId,
    artistName: painting.artistName,
    style: painting.style,
    subCategory: typeof painting.subCategory === 'string' ? painting.subCategory : undefined,
    year: painting.year,
    imageUrl: painting.imageUrl,
    isCustomerUpload: (painting as Painting & { isCustomerUpload?: boolean }).isCustomerUpload === true,
    widthCm: painting.widthCm,
    heightCm: painting.heightCm,
    catalogPrice: painting.price,
    finish: null,
    colorPalette: painting.colorPalette,
    paletteNames: painting.paletteNames,
  };
}

export function buildPackPricing(
  components: PackComponent[],
  packagingPrice: number,
  packPrice: number
): PackPricing {
  const componentsTotal = round2(
    components.reduce((sum, c) => sum + c.catalogPrice, 0) + packagingPrice
  );
  const discountAmount = round2(Math.max(0, componentsTotal - packPrice));
  const discountPercent = componentsTotal > 0
    ? Math.round((discountAmount / componentsTotal) * 100)
    : 0;
  return {
    componentsTotal,
    packagingPrice: round2(packagingPrice),
    discountPercent,
    discountAmount,
    packPrice: round2(packPrice),
  };
}

export function buildPackComposition(args: {
  packType: PackType;
  packLabel: string;
  components: PackComponent[];
  packaging: PackPackaging;
  finish: StickerFinishName | null;
  packagingPrice: number;
  packPrice: number;
}): PackComposition {
  const components = args.components
    .slice()
    .sort((a, b) => a.slot - b.slot);
  return {
    isPack: true,
    packType: args.packType,
    packLabel: args.packLabel,
    componentCount: components.length,
    components,
    packaging: args.packaging,
    finish: args.finish,
    pricing: buildPackPricing(components, args.packagingPrice, args.packPrice),
    composedAt: new Date().toISOString(),
  };
}

/** Human readable one-liner reused by the cart and the Sheet. */
export function describePack(pack: PackComposition): string {
  return pack.components
    .map(c => `${c.slot}. ${c.title} — ${c.widthCm}×${c.heightCm}cm${c.finish ? ` (${c.finish})` : ''}`)
    .join(' | ');
}

export function isPackPainting(
  painting: Painting & { packComposition?: PackComposition }
): boolean {
  return !!painting.packComposition?.isPack;
}
