import type {
  CustomerArtworkUpload,
  Painting,
  SupportedCustomerImageMime,
} from '../types';

export const CUSTOMER_IMAGE_MAX_BYTES = 20 * 1024 * 1024;
export const SIGNATURE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const CUSTOMER_IMAGE_MIMES: readonly SupportedCustomerImageMime[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

export class CustomerArtworkError extends Error {
  constructor(
    public readonly code: 'type' | 'size' | 'decode' | 'empty',
    message: string,
  ) {
    super(message);
    this.name = 'CustomerArtworkError';
  }
}

export function isSupportedCustomerMime(value: string): value is SupportedCustomerImageMime {
  return CUSTOMER_IMAGE_MIMES.includes(value as SupportedCustomerImageMime);
}

export function extensionOf(name: string): string {
  return name.toLowerCase().split('.').pop() ?? '';
}

export function validateCustomerFile(
  file: Pick<File, 'name' | 'type' | 'size'>,
  maxBytes = CUSTOMER_IMAGE_MAX_BYTES,
): void {
  if (!file.size) throw new CustomerArtworkError('empty', 'The selected file is empty.');
  if (!isSupportedCustomerMime(file.type) || !EXTENSIONS.has(extensionOf(file.name))) {
    throw new CustomerArtworkError('type', 'Use a JPG, JPEG, PNG or WebP image.');
  }
  if (file.size > maxBytes) {
    throw new CustomerArtworkError('size', `The image must be ${Math.round(maxBytes / 1048576)} MB or smaller.`);
  }
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new CustomerArtworkError('decode', 'Could not read this image.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

function decodeDimensions(dataUrl: string): Promise<{ widthPx: number; heightPx: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new CustomerArtworkError('decode', 'This image has invalid dimensions.'));
        return;
      }
      resolve({ widthPx: image.naturalWidth, heightPx: image.naturalHeight });
    };
    image.onerror = () => reject(new CustomerArtworkError('decode', 'The browser could not decode this image.'));
    image.src = dataUrl;
  });
}

export async function readCustomerArtwork(file: File): Promise<CustomerArtworkUpload> {
  validateCustomerFile(file);
  const dataUrl = await readDataUrl(file);
  const dimensions = await decodeDimensions(dataUrl);
  return {
    id: `customer-${crypto.randomUUID()}`,
    originalName: file.name,
    mimeType: file.type as SupportedCustomerImageMime,
    sizeBytes: file.size,
    ...dimensions,
    dataUrl,
  };
}

export function nearestAspectTemplate(asset: CustomerArtworkUpload, paintings: Painting[]): Painting {
  if (!paintings.length) throw new Error('The painting catalogue is empty.');
  const aspect = asset.widthPx / asset.heightPx;
  return paintings.reduce((best, candidate) => {
    const candidateAspect = candidate.widthCm / Math.max(1, candidate.heightCm);
    const bestAspect = best.widthCm / Math.max(1, best.heightCm);
    return Math.abs(candidateAspect - aspect) < Math.abs(bestAspect - aspect) ? candidate : best;
  });
}

export function buildCustomerPainting(asset: CustomerArtworkUpload, paintings: Painting[]): Painting {
  const template = nearestAspectTemplate(asset, paintings);
  return {
    ...template,
    id: asset.id,
    title: asset.originalName.replace(/\.(jpe?g|png|webp)$/i, '') || 'Customer artwork',
    artistId: 'customer',
    artistName: 'Customer artwork',
    year: new Date().getFullYear(),
    story: 'Customer-supplied artwork for this order.',
    imageUrl: asset.dataUrl,
    image: undefined,
    featured: false,
    subCategory: undefined,
    customerUpload: asset,
    isCustomerUpload: true,
  };
}
