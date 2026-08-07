import type { CartItem, Painting, PrintSpec } from '../types';
import type { PackComposition, PackComponent } from './packComposition';
import {
  fontById,
  personalizationPrice,
} from './personalization';
import { buildRenderRecipe, buildComponentRecipe, type RenderRecipeV2, ORDER_SCHEMA_VERSION } from './renderRecipe';
import { renderDesignToCanvas, renderPackContactSheet } from './renderDesign';
import { loadImageSource, canvasToBlob, blobToDataUrl } from './renderAssets';
import { getCachedProof, putCachedProof } from './orderProofCache';

const ENDPOINT = String((import.meta as any).env.VITE_ORDER_WEB_APP_URL ?? '').trim();

export const MAX_PACK_COMPONENTS = 24;

const MAX_PAYLOAD_BYTES = 45 * 1024 * 1024;

export interface OrderPackComponentPayload {
  slot: number;
  role: PackComponent['role'];
  sourceId: string;
  title: string;
  artistId: string;
  artistName: string;
  style: string;
  subCategory?: string;
  year: number;
  widthCm: number;
  heightCm: number;
  catalogPrice: number;
  finish: string | null;
  imageUrl: string;
  sourceImageUrl: string;
  isCustomerUpload: boolean;
  renderRecipe: RenderRecipeV2;
  proof: { mimeType: 'image/png'; widthPx: number; heightPx: number; dataUrl: string };
  transport: {
    customerOriginalDataUrl: string | null;
    uploadedSignatureDataUrl: string | null;
    artworkDataUrl: string | null;
  };
}

export interface OrderPackPayload {
  packType: PackComposition['packType'];
  packLabel: string;
  componentCount: number;
  packaging: PackComposition['packaging'];
  finish: string | null;
  pricing: PackComposition['pricing'];
  composedAt: string;
  contactSheet: { mimeType: 'image/png'; widthPx: number; heightPx: number; dataUrl: string } | null;
  components: OrderPackComponentPayload[];
}

export interface CustomerDetails {
  name: string;
  whatsapp: string;
}

export interface SubmitOrderInput {
  clientRequestId: string;
  customer: CustomerDetails;
  cartItems: CartItem[];
  whiteGloveService: boolean;
  grandTotal: number;
}

export interface SubmitOrderResult {
  ok: true;
  orderId: string;
  folderUrl: string;
  whatsappUrl: string;
}

export interface PrepareOrderProgress {
  phase: 'recipe' | 'assets' | 'proof' | 'payload';
  itemIndex: number;
  itemCount: number;
  message: string;
}

export interface OrderItemPayloadV2 {
  id: string;
  type: 'Painting' | 'Sticker';
  title: string;
  artistName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  renderRecipe: RenderRecipeV2;
  proof: {
    mimeType: 'image/png' | 'image/jpeg';
    widthPx: number;
    heightPx: number;
    dataUrl: string;
  };
  transport: {
    customerOriginalDataUrl: string | null;
    uploadedSignatureDataUrl: string | null;
  };
  pack?: OrderPackPayload;
  printSpec?: PrintSpec;
}

export interface OrderPayloadV2 {
  schemaVersion: typeof ORDER_SCHEMA_VERSION;
  clientRequestId: string;
  website: '';
  createdAtClient: string;
  customer: { name: string; whatsapp: string };
  whiteGloveService: boolean;
  grandTotal: number;
  items: OrderItemPayloadV2[];
}

function safeWhatsApp(value: string): string {
  return value.replace(/[^0-9+]/g, '').slice(0, 20);
}

export async function prepareOrderPayload(
  input: SubmitOrderInput,
  onProgress?: (p: PrepareOrderProgress) => void
): Promise<OrderPayloadV2> {
  const itemCount = input.cartItems.length;
  const items: OrderItemPayloadV2[] = [];

  for (let i = 0; i < itemCount; i++) {
    const item = input.cartItems[i];
    const itemIndex = i + 1;
    
    onProgress?.({ phase: 'recipe', itemIndex, itemCount, message: `Building recipe for item ${itemIndex}...` });
    const recipe = buildRenderRecipe(item);
    
    const p = item.personalization;
    const updatedAt = p?.updatedAt || 0;
    const cacheKey = `${input.clientRequestId}:${item.painting.id}:${updatedAt}`;
    
    let proofDataUrl = '';
    let proofMime: 'image/png' | 'image/jpeg' = recipe.output.transparentBackground ? 'image/png' : 'image/jpeg';
    
    const cached = await getCachedProof(cacheKey);
    if (cached) {
      onProgress?.({ phase: 'proof', itemIndex, itemCount, message: `Using cached proof for item ${itemIndex}` });
      proofDataUrl = await blobToDataUrl(cached.proofBlob);
    } else {
      onProgress?.({ phase: 'assets', itemIndex, itemCount, message: `Loading assets for item ${itemIndex}...` });
      const artwork = await loadImageSource(recipe.source.customerAssetId ? recipe.source.dataUrl! : recipe.source.catalogueUrl!);
      const signature = recipe.signature.uploadedDataUrl ? await loadImageSource(recipe.signature.uploadedDataUrl) : undefined;
      
      onProgress?.({ phase: 'proof', itemIndex, itemCount, message: `Generating final proof for item ${itemIndex}...` });
      const canvas = await renderDesignToCanvas(recipe, { artwork, signature }, {
        widthPx: recipe.output.proofWidthPx,
        heightPx: recipe.output.proofHeightPx,
        includeFrame: true,
        includeFinishPreview: true,
        background: recipe.output.transparentBackground ? 'transparent' : 'white'
      });
      
      const blob = await canvasToBlob(canvas, proofMime, 0.9);
      await putCachedProof({
        key: cacheKey,
        clientRequestId: input.clientRequestId,
        itemId: item.painting.id,
        personalizationUpdatedAt: updatedAt,
        recipe,
        proofBlob: blob,
        createdAt: Date.now()
      });
      proofDataUrl = await blobToDataUrl(blob);
    }

    const unitPrice = item.painting.price + item.frame.price + personalizationPrice(p);

    const composition = (item.painting as Painting).packComposition;
    let packPayload: OrderPackPayload | undefined;

    if (composition?.isPack) {
      if (composition.components.length > MAX_PACK_COMPONENTS) {
        throw new Error(`A pack cannot contain more than ${MAX_PACK_COMPONENTS} artworks.`);
      }

      const componentPayloads: OrderPackComponentPayload[] = [];
      const sheetEntries: Array<{ label: string; canvas: HTMLCanvasElement; caption: string }> = [];

      for (const component of composition.components) {
        onProgress?.({
          phase: 'proof',
          itemIndex,
          itemCount,
          message: `Rendering ${component.slot}/${composition.componentCount}: ${component.title}`,
        });

        const componentRecipe = buildComponentRecipe(component);
        const componentKey =
          `${input.clientRequestId}:${item.painting.id}:pack:${component.slot}:${component.sourceId}`;

        let componentBlob: Blob;
        const cachedComponent = await getCachedProof(componentKey);

        if (cachedComponent) {
          componentBlob = cachedComponent.proofBlob;
        } else {
          const artwork = await loadImageSource(component.imageUrl);
          const componentCanvas = await renderDesignToCanvas(
            componentRecipe,
            { artwork },
            {
              widthPx: componentRecipe.output.proofWidthPx,
              heightPx: componentRecipe.output.proofHeightPx,
              includeFrame: component.role === 'canvas',
              includeFinishPreview: component.role === 'sticker',
              background: componentRecipe.output.transparentBackground ? 'transparent' : 'white',
            }
          );
          componentBlob = await canvasToBlob(componentCanvas, 'image/png', 0.92);
          sheetEntries.push({
            label: `${component.slot}. ${component.title}`,
            canvas: componentCanvas,
            caption: `${component.widthCm}×${component.heightCm} cm${component.finish ? ` · ${component.finish}` : ''}`,
          });
          await putCachedProof({
            key: componentKey,
            clientRequestId: input.clientRequestId,
            itemId: `${item.painting.id}#${component.slot}`,
            personalizationUpdatedAt: 0,
            recipe: componentRecipe,
            proofBlob: componentBlob,
            createdAt: Date.now(),
          });
        }

        const isUpload =
          component.isCustomerUpload === true || component.imageUrl.startsWith('data:');

        componentPayloads.push({
          slot: component.slot,
          role: component.role,
          sourceId: component.sourceId,
          title: component.title,
          artistId: component.artistId,
          artistName: component.artistName,
          style: component.style,
          subCategory: component.subCategory,
          year: component.year,
          widthCm: component.widthCm,
          heightCm: component.heightCm,
          catalogPrice: component.catalogPrice,
          finish: component.finish,
          imageUrl: component.imageUrl,
          sourceImageUrl: isUpload ? '' : component.imageUrl,
          isCustomerUpload: isUpload,
          renderRecipe: componentRecipe,
          proof: {
            mimeType: 'image/png',
            widthPx: componentRecipe.output.proofWidthPx,
            heightPx: componentRecipe.output.proofHeightPx,
            dataUrl: await blobToDataUrl(componentBlob),
          },
          transport: {
            customerOriginalDataUrl: null,
            uploadedSignatureDataUrl: null,
            artworkDataUrl: isUpload ? component.imageUrl : null,
          },
        });
      }

      let contactSheet: OrderPackPayload['contactSheet'] = null;
      if (sheetEntries.length > 0 && sheetEntries.length === composition.components.length) {
        onProgress?.({ phase: 'proof', itemIndex, itemCount, message: 'Building the pack contact sheet…' });
        const sheetCanvas = await renderPackContactSheet(sheetEntries, { widthPx: 1600 });
        const sheetBlob = await canvasToBlob(sheetCanvas, 'image/png', 0.9);
        contactSheet = {
          mimeType: 'image/png',
          widthPx: sheetCanvas.width,
          heightPx: sheetCanvas.height,
          dataUrl: await blobToDataUrl(sheetBlob),
        };
      }

      packPayload = {
        packType: composition.packType,
        packLabel: composition.packLabel,
        componentCount: composition.componentCount,
        packaging: composition.packaging,
        finish: composition.finish,
        pricing: composition.pricing,
        composedAt: composition.composedAt,
        contactSheet,
        components: componentPayloads,
      };
    }

    items.push({
      id: item.painting.id,
      type: recipe.itemType,
      title: item.painting.title,
      artistName: item.painting.artistName,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      renderRecipe: recipe,
      proof: {
        mimeType: proofMime,
        widthPx: recipe.output.proofWidthPx,
        heightPx: recipe.output.proofHeightPx,
        dataUrl: proofDataUrl,
      },
      transport: {
        customerOriginalDataUrl: recipe.source.role === 'customer-artwork' ? recipe.source.dataUrl! : null,
        uploadedSignatureDataUrl: recipe.signature.uploadedDataUrl || null,
      },
      ...(packPayload ? { pack: packPayload } : {}),
      ...(item.painting.printSpec ? { printSpec: item.painting.printSpec } : {}),
    });

    // Strip large dataUrls from recipe before sending (they are in transport now)
    if (recipe.source.dataUrl) delete recipe.source.dataUrl;
    if (recipe.signature.uploadedDataUrl) delete recipe.signature.uploadedDataUrl;
  }

  onProgress?.({ phase: 'payload', itemIndex: itemCount, itemCount, message: 'Finalizing order payload...' });
  
  return {
    schemaVersion: ORDER_SCHEMA_VERSION,
    clientRequestId: input.clientRequestId,
    website: '',
    createdAtClient: new Date().toISOString(),
    customer: {
      name: input.customer.name.trim(),
      whatsapp: safeWhatsApp(input.customer.whatsapp)
    },
    whiteGloveService: input.whiteGloveService,
    grandTotal: input.grandTotal,
    items,
  };
}

export async function submitOrder(
  input: SubmitOrderInput,
  onProgress?: (p: PrepareOrderProgress) => void
): Promise<SubmitOrderResult> {
  if (!ENDPOINT) throw new Error('Order receiver is not configured.');
  
  const payload = await prepareOrderPayload(input, onProgress);
  
  onProgress?.({ phase: 'payload', itemIndex: payload.items.length, itemCount: payload.items.length, message: 'Sending order to server...' });

  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    throw new Error(
      'This order carries too many large uploads to send in one request. ' +
      'Please split it into two packs, or upload smaller files.'
    );
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: serialized,
    redirect: 'follow',
  });
  
  if (!response.ok) throw new Error(`Order receiver returned HTTP ${response.status}.`);
  const result = await response.json();
  if (!result?.ok || !result.orderId) throw new Error(result?.error || 'The order was not confirmed.');
  return result as SubmitOrderResult;
}
