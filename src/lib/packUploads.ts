import type { Painting, StyleType } from '../types';
import { stickerPriceMAD } from './pricing';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_PACK_UPLOADS = 30;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export interface UploadResult {
  painting: Painting | null;
  error: string | null;
  /** Low-resolution warning. The upload still succeeds. */
  warning: string | null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

function measure(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

/**
 * Print-quality gate.
 *
 * A 10x10 cm sticker at a usable 300 DPI needs about 1181 px on the short edge.
 * We warn below that rather than refusing, because the owner's stated policy is
 * "warn about quality and try to improve it" — not to reject the order.
 */
const MIN_EDGE_PX = 1000;

export async function fileToPainting(file: File, index: number): Promise<UploadResult> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { painting: null, error: `${file.name}: unsupported format`, warning: null };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { painting: null, error: `${file.name}: ${mb} MB exceeds the 20 MB limit`, warning: null };
  }

  const dataUrl = await readAsDataUrl(file);
  const { width, height } = await measure(dataUrl);
  if (width === 0) {
    return { painting: null, error: `${file.name}: not a readable image`, warning: null };
  }

  const shortEdge = Math.min(width, height);
  const warning =
    shortEdge < MIN_EDGE_PX
      ? `${file.name} is ${width}×${height}px. We will upscale it, but fine detail may soften in print.`
      : null;

  const painting: Painting = {
    id: `upload-${Date.now()}-${index}`,
    title: file.name.replace(/\.[^.]+$/, '').slice(0, 60) || `Your image ${index + 1}`,
    artistId: 'customer',
    artistName: 'Your upload',
    year: new Date().getFullYear(),
    style: 'Contemporary' as StyleType,
    sizeCategory: 'Small',
    widthCm: 10,
    heightCm: 10,
    price: stickerPriceMAD(10, 10, 'matte-vinyl'), // neutral baseline price so archived manifest is honest
    story: 'Customer-supplied image.',
    imageUrl: dataUrl,
    colorPalette: ['#C084FC', '#E2E8F0', '#12131A'],
    paletteNames: ['Upload', 'Paper', 'Shadow'],
    isCustomerUpload: true,
  } as Painting;

  return { painting, error: null, warning };
}

export async function filesToPaintings(files: File[]): Promise<{
  paintings: Painting[];
  errors: string[];
  warnings: string[];
}> {
  const results = await Promise.all(files.map((file, i) => fileToPainting(file, i)));
  return {
    paintings: results.map((r) => r.painting).filter((p): p is Painting => p !== null),
    errors: results.map((r) => r.error).filter((e): e is string => e !== null),
    warnings: results.map((r) => r.warning).filter((w): w is string => w !== null),
  };
}
