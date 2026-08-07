import type { CartItem, Painting } from '../types';
import type { Stroke, TextConfig, LayerPlacement } from './personalization';
import { fontById } from './personalization';
import type { ArtTransform, CropRect } from './stickerTransform';
import type { PackComponent } from './packComposition';

export const ORDER_SCHEMA_VERSION = 3 as const;
export const RENDERER_VERSION = 'prism-canvas-1' as const;

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SourceAssetRecipe {
  role: 'catalogue-artwork' | 'customer-artwork';
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  widthPx: number;
  heightPx: number;
  catalogueUrl: string | null;
  customerAssetId: string | null;
  /** Runtime transport only. Apps Script removes it after saving the file. */
  dataUrl?: string;
}

export interface ArtworkPlacementRecipe {
  fit: 'contain' | 'cover';
  canvasRect: NormalizedRect;
  transform: ArtTransform;
  crop: CropRect;
  opacity: number;
}

export interface SignatureRecipe {
  kind: 'none' | 'uploaded' | 'drawn' | 'uploaded-and-drawn';
  uploadedOriginalName: string | null;
  uploadedMimeType: string | null;
  uploadedWidthPx: number | null;
  uploadedHeightPx: number | null;
  uploadedDataUrl?: string;
  placement: LayerPlacement;
  strokes: Stroke[];
}

export interface TextLayerRecipe {
  enabled: boolean;
  config: TextConfig;
  placement: LayerPlacement;
  fontFamily: string;
  fontWeight: number;
  googleFontId: string;
}

export interface FrameSnapshot {
  id: string;
  name: string;
  description: string;
  price: number;
  borderHex: string;
  materialWidthCm: number;
}

export interface StickerShapeSnapshot {
  id: string;
  label: string;
  hint: string;
  clipPath: string | null;
  aspect: number | null;
  locksSquare: boolean;
}

export interface StickerFinishSnapshot {
  id: string;
  name: string;
  description: string;
  priceModifier: number;
  borderHex: string;
}

export interface OutputRecipe {
  widthCm: number;
  heightCm: number;
  proofWidthPx: number;
  proofHeightPx: number;
  targetDpi: 300;
  bleedMm: number;
  safeAreaMm: number;
  transparentBackground: boolean;
}

export interface QualitySnapshot {
  sourceWidthPx: number;
  sourceHeightPx: number;
  effectiveDpiX: number;
  effectiveDpiY: number;
  needsUpscale: boolean;
  warning: string | null;
}

export interface PaintingRenderRecipeV2 {
  schemaVersion: 3;
  rendererVersion: typeof RENDERER_VERSION;
  itemType: 'Painting';
  source: SourceAssetRecipe;
  artwork: ArtworkPlacementRecipe;
  signature: SignatureRecipe;
  text: TextLayerRecipe;
  frame: FrameSnapshot;
  output: OutputRecipe;
  quality: QualitySnapshot;
  layerOrder: Array<'artwork' | 'drawing' | 'signature' | 'text'>;
}

export interface StickerRenderRecipeV2 {
  schemaVersion: 3;
  rendererVersion: typeof RENDERER_VERSION;
  itemType: 'Sticker';
  source: SourceAssetRecipe;
  artwork: ArtworkPlacementRecipe;
  signature: SignatureRecipe;
  text: TextLayerRecipe;
  shape: StickerShapeSnapshot;
  finish: StickerFinishSnapshot;
  output: OutputRecipe;
  quality: QualitySnapshot;
  layerOrder: Array<'artwork' | 'drawing' | 'signature' | 'text' | 'finish-preview'>;
}

export type RenderRecipeV2 = PaintingRenderRecipeV2 | StickerRenderRecipeV2;

export function buildRenderRecipe(item: CartItem): RenderRecipeV2 {
  const p = item.personalization;
  const isSticker = p?.printType === 'Sticker' || !!p?.stickerState;

  const source: SourceAssetRecipe = item.painting.customerUpload
    ? {
        role: 'customer-artwork',
        originalName: item.painting.customerUpload.originalName,
        mimeType: item.painting.customerUpload.mimeType,
        sizeBytes: item.painting.customerUpload.sizeBytes,
        widthPx: item.painting.customerUpload.widthPx,
        heightPx: item.painting.customerUpload.heightPx,
        catalogueUrl: null,
        customerAssetId: item.painting.customerUpload.id,
        dataUrl: item.painting.customerUpload.dataUrl,
      }
    : {
        role: 'catalogue-artwork',
        originalName: null,
        mimeType: null,
        sizeBytes: null,
        widthPx: 2000, // Fallback for catalogue if unknown
        heightPx: 2500,
        catalogueUrl: item.painting.imageUrl,
        customerAssetId: null,
      };

  const artwork: ArtworkPlacementRecipe = {
    fit: isSticker ? 'cover' : 'contain',
    canvasRect: { x: 0, y: 0, width: 1, height: 1 },
    transform: p?.stickerState?.transform || {
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      flipX: false,
      flipY: false,
    },
    crop: p?.stickerState?.crop || { left: 0, top: 0, right: 0, bottom: 0 },
    opacity: 1,
  };

  const signature: SignatureRecipe = {
    kind: p?.uploadedSignatureUrl && p?.strokes.length ? 'uploaded-and-drawn' :
          p?.uploadedSignatureUrl ? 'uploaded' :
          p?.strokes.length ? 'drawn' : 'none',
    uploadedOriginalName: null,
    uploadedMimeType: null,
    uploadedWidthPx: null,
    uploadedHeightPx: null,
    uploadedDataUrl: p?.uploadedSignatureUrl,
    placement: p?.drawPlacement || { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    strokes: JSON.parse(JSON.stringify(p?.strokes || [])),
  };

  const font = p ? fontById(p.text.fontId) : fontById('great-vibes');
  const text: TextLayerRecipe = {
    enabled: !!p && p.text.value.trim().length > 0,
    config: p ? { ...p.text } : {
      value: '',
      fontId: 'great-vibes',
      color: '#111111',
      sizeRatio: 0.09,
      rotation: 0,
      letterSpacing: 0,
      align: 'center',
      shadow: true,
    },
    placement: p?.textPlacement || { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    fontFamily: font.family,
    fontWeight: font.weight || 400,
    googleFontId: font.id,
  };

  const output: OutputRecipe = {
    widthCm: isSticker ? (p?.stickerState?.widthCm || 10) : item.painting.widthCm,
    heightCm: isSticker ? (p?.stickerState?.heightCm || 10) : item.painting.heightCm,
    proofWidthPx: 1600,
    proofHeightPx: 2000,
    targetDpi: 300,
    bleedMm: 3,
    safeAreaMm: 5,
    transparentBackground: isSticker,
  };

  const quality: QualitySnapshot = {
    sourceWidthPx: source.widthPx,
    sourceHeightPx: source.heightPx,
    effectiveDpiX: Math.round((source.widthPx / (output.widthCm / 2.54))),
    effectiveDpiY: Math.round((source.heightPx / (output.heightCm / 2.54))),
    needsUpscale: (source.widthPx / (output.widthCm / 2.54)) < 200,
    warning: (source.widthPx / (output.widthCm / 2.54)) < 150 ? 'Low resolution' : null,
  };

  if (isSticker) {
    return {
      schemaVersion: 3,
      rendererVersion: RENDERER_VERSION,
      itemType: 'Sticker',
      source,
      artwork,
      signature,
      text,
      shape: {
        id: p?.stickerState?.shapeId || 'circle',
        label: 'Circle',
        hint: '',
        clipPath: null, // Should be filled from a shape registry if possible
        aspect: 1,
        locksSquare: true,
      },
      finish: {
        id: p?.stickerState?.finishId || 'glossy',
        name: 'Glossy',
        description: '',
        priceModifier: 0,
        borderHex: '#FFFFFF',
      },
      output,
      quality,
      layerOrder: ['artwork', 'drawing', 'signature', 'text', 'finish-preview'],
    } as StickerRenderRecipeV2;
  }

  return {
    schemaVersion: 3,
    rendererVersion: RENDERER_VERSION,
    itemType: 'Painting',
    source,
    artwork,
    signature,
    text,
    frame: {
      id: item.frame.id,
      name: item.frame.name,
      description: '',
      price: item.frame.price,
      borderHex: '#D4AF37', // Gold fallback
      materialWidthCm: 3,
    },
    output,
    quality,
    layerOrder: ['artwork', 'drawing', 'signature', 'text'],
  } as PaintingRenderRecipeV2;
}

const CM_PER_INCH = 2.54;

export function buildComponentRecipe(component: PackComponent): RenderRecipeV2 {
  const isSticker = component.role === 'sticker';
  const dpi = 300;
  const aspect = component.widthCm / component.heightCm;
  const proofWidthPx = 1400;

  const source: SourceAssetRecipe = {
    role: 'catalogue-artwork',
    originalName: null,
    mimeType: null,
    sizeBytes: null,
    widthPx: 2000,
    heightPx: Math.round(2000 / aspect),
    catalogueUrl: component.imageUrl,
    customerAssetId: null,
  };

  const artwork: ArtworkPlacementRecipe = {
    fit: isSticker ? 'cover' : 'contain',
    canvasRect: { x: 0, y: 0, width: 1, height: 1 },
    transform: { x: 0.5, y: 0.5, scale: 1, rotation: 0, flipX: false, flipY: false },
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
    opacity: 1,
  };

  const signature: SignatureRecipe = {
    kind: 'none',
    uploadedOriginalName: null,
    uploadedMimeType: null,
    uploadedWidthPx: null,
    uploadedHeightPx: null,
    placement: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    strokes: [],
  };

  const text: TextLayerRecipe = {
    enabled: false,
    config: {
      value: '',
      fontId: 'great-vibes',
      color: '#111111',
      sizeRatio: 0.09,
      rotation: 0,
      letterSpacing: 0,
      align: 'center',
      shadow: true,
    },
    placement: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    fontFamily: 'Great Vibes',
    fontWeight: 400,
    googleFontId: 'great-vibes',
  };

  const output: OutputRecipe = {
    widthCm: component.widthCm,
    heightCm: component.heightCm,
    proofWidthPx,
    proofHeightPx: Math.round(proofWidthPx / aspect),
    targetDpi: 300,
    bleedMm: isSticker ? 3 : 0,
    safeAreaMm: isSticker ? 2 : 0,
    transparentBackground: isSticker,
  };

  const quality: QualitySnapshot = {
    sourceWidthPx: source.widthPx,
    sourceHeightPx: source.heightPx,
    effectiveDpiX: Math.round((source.widthPx / (output.widthCm / CM_PER_INCH))),
    effectiveDpiY: Math.round((source.heightPx / (output.heightCm / CM_PER_INCH))),
    needsUpscale: false,
    warning: null,
  };

  if (isSticker) {
    return {
      schemaVersion: 3,
      rendererVersion: RENDERER_VERSION,
      itemType: 'Sticker',
      source,
      artwork,
      signature,
      text,
      shape: {
        id: 'square',
        label: 'Square',
        hint: '',
        clipPath: null,
        aspect: 1,
        locksSquare: true,
      },
      finish: {
        id: component.finish ? component.finish.toLowerCase() : 'matte',
        name: component.finish || 'Matte',
        description: '',
        priceModifier: 0,
        borderHex: '#FFFFFF',
      },
      output,
      quality,
      layerOrder: ['artwork', 'drawing', 'signature', 'text', 'finish-preview'],
    } as StickerRenderRecipeV2;
  }

  return {
    schemaVersion: 3,
    rendererVersion: RENDERER_VERSION,
    itemType: 'Painting',
    source,
    artwork,
    signature,
    text,
    frame: {
      id: 'frame-none',
      name: 'None',
      description: '',
      price: 0,
      borderHex: '#D4AF37',
      materialWidthCm: 0,
    },
    output,
    quality,
    layerOrder: ['artwork', 'drawing', 'signature', 'text'],
  } as PaintingRenderRecipeV2;
}
