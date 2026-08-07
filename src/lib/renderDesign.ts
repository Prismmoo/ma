import type { RenderRecipeV2, NormalizedRect } from './renderRecipe';
import { renderStrokes } from './personalization';

export interface RenderInputFiles {
  artwork: CanvasImageSource;
  signature?: CanvasImageSource;
}

export interface RenderOptions {
  widthPx: number;
  heightPx: number;
  includeFrame: boolean;
  includeFinishPreview: boolean;
  background: 'transparent' | 'white';
}

export async function renderDesignToCanvas(
  recipe: RenderRecipeV2,
  files: RenderInputFiles,
  options: RenderOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = options.widthPx;
  canvas.height = options.heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // 1. Background
  if (options.background === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Layers based on recipe order
  for (const layer of recipe.layerOrder) {
    switch (layer) {
      case 'artwork':
        renderArtworkLayer(ctx, recipe, files.artwork, canvas.width, canvas.height);
        break;
      case 'drawing':
        renderDrawingLayer(ctx, recipe, canvas.width, canvas.height);
        break;
      case 'signature':
        if (files.signature) {
          renderSignatureLayer(ctx, recipe, files.signature, canvas.width, canvas.height);
        }
        break;
      case 'text':
        await renderTextLayer(ctx, recipe, canvas.width, canvas.height);
        break;
      case 'finish-preview':
        if (options.includeFinishPreview && recipe.itemType === 'Sticker') {
          renderFinishPreview(ctx, recipe, canvas.width, canvas.height);
        }
        break;
    }
  }

  // 3. Optional Frame (Proof only)
  if (options.includeFrame && recipe.itemType === 'Painting') {
    renderFrameProof(ctx, recipe, canvas.width, canvas.height);
  }

  return canvas;
}

/**
 * Composites every pack component onto a single labelled sheet so the owner
 * can see the whole bundle in one glance, at a glance-safe resolution.
 */
export async function renderPackContactSheet(
  entries: Array<{ label: string; canvas: HTMLCanvasElement; caption: string }>,
  options: { widthPx?: number; background?: string } = {}
): Promise<HTMLCanvasElement> {
  const width = options.widthPx ?? 1600;
  const columns = entries.length <= 2 ? entries.length : entries.length <= 4 ? 2 : 3;
  const rows = Math.ceil(entries.length / columns);
  const gutter = Math.round(width * 0.02);
  const captionHeight = Math.round(width * 0.035);
  const cell = Math.floor((width - gutter * (columns + 1)) / columns);
  const height = gutter + rows * (cell + captionHeight + gutter);

  const sheet = document.createElement('canvas');
  sheet.width = width;
  sheet.height = height;
  const ctx = sheet.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.fillStyle = options.background ?? '#ffffff';
  ctx.fillRect(0, 0, width, height);

  await document.fonts.ready;

  entries.forEach((entry, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = gutter + column * (cell + gutter);
    const y = gutter + row * (cell + captionHeight + gutter);

    const scale = Math.min(cell / entry.canvas.width, cell / entry.canvas.height);
    const drawWidth = entry.canvas.width * scale;
    const drawHeight = entry.canvas.height * scale;

    ctx.drawImage(
      entry.canvas,
      x + (cell - drawWidth) / 2,
      y + (cell - drawHeight) / 2,
      drawWidth,
      drawHeight
    );

    ctx.fillStyle = '#17151f';
    ctx.font = `600 ${Math.round(captionHeight * 0.42)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(entry.label, x + cell / 2, y + cell + captionHeight * 0.45, cell);
    ctx.fillStyle = '#6b6880';
    ctx.font = `400 ${Math.round(captionHeight * 0.34)}px Arial, sans-serif`;
    ctx.fillText(entry.caption, x + cell / 2, y + cell + captionHeight * 0.85, cell);
  });

  return sheet;
}

function renderArtworkLayer(
  ctx: CanvasRenderingContext2D,
  recipe: RenderRecipeV2,
  img: CanvasImageSource,
  width: number,
  height: number
) {
  const { artwork, source } = recipe;
  const rect = artwork.canvasRect;

  ctx.save();
  
  // Clipping if needed (e.g. for stickers)
  if (recipe.itemType === 'Sticker' && recipe.shape.clipPath) {
    applyClipPath(ctx, recipe.shape.clipPath, width, height);
  }

  // Calculate destination rectangle based on contain/cover
  const targetW = rect.width * width;
  const targetH = rect.height * height;
  const targetX = rect.x * width;
  const targetY = rect.y * height;

  ctx.translate(targetX + targetW / 2, targetY + targetH / 2);
  
  const t = artwork.transform;
  ctx.translate((t.x - 0.5) * targetW, (t.y - 0.5) * targetH);
  ctx.rotate((t.rotation * Math.PI) / 180);
  ctx.scale(t.scale * (t.flipX ? -1 : 1), t.scale * (t.flipY ? -1 : 1));
  
  ctx.globalAlpha = artwork.opacity;

  // Source dimensions
  const sw = Number(source.widthPx);
  const sh = Number(source.heightPx);
  
  // Fit logic
  let dw = targetW;
  let dh = targetH;
  if (artwork.fit === 'contain') {
    const sAspect = sw / sh;
    const tAspect = targetW / targetH;
    if (sAspect > tAspect) {
      dh = targetW / sAspect;
    } else {
      dw = targetH * sAspect;
    }
  } else if (artwork.fit === 'cover') {
     const sAspect = sw / sh;
     const tAspect = targetW / targetH;
     if (sAspect > tAspect) {
       dw = targetH * sAspect;
     } else {
       dh = targetW / sAspect;
     }
  }

  // Crop application
  const c = artwork.crop;
  const sx = c.left * sw;
  const sy = c.top * sh;
  const sWidth = (1 - c.left - c.right) * sw;
  const sHeight = (1 - c.top - c.bottom) * sh;

  ctx.drawImage(img, sx, sy, sWidth, sHeight, -dw / 2, -dh / 2, dw, dh);
  
  ctx.restore();
}

function renderDrawingLayer(
  ctx: CanvasRenderingContext2D,
  recipe: RenderRecipeV2,
  width: number,
  height: number
) {
  const { signature } = recipe;
  if (signature.strokes.length === 0) return;

  ctx.save();
  const pl = signature.placement;
  ctx.translate(pl.x * width, pl.y * height);
  ctx.rotate((pl.rotation * Math.PI) / 180);
  ctx.scale(pl.scale, pl.scale);
  ctx.translate(-width / 2, -height / 2);
  
  renderStrokes(ctx, signature.strokes, width, height);
  ctx.restore();
}

function renderSignatureLayer(
  ctx: CanvasRenderingContext2D,
  recipe: RenderRecipeV2,
  img: CanvasImageSource,
  width: number,
  height: number
) {
  const { signature } = recipe;
  ctx.save();
  const pl = signature.placement;
  ctx.translate(pl.x * width, pl.y * height);
  ctx.rotate((pl.rotation * Math.PI) / 180);
  ctx.scale(pl.scale, pl.scale);
  
  // Signature baseline box: 58% width, 38% height
  const maxW = width * 0.58;
  const maxH = height * 0.38;
  
  let sw = 0;
  let sh = 0;
  if (img instanceof HTMLImageElement) {
    sw = img.naturalWidth || img.width;
    sh = img.naturalHeight || img.height;
  } else if (img instanceof HTMLCanvasElement) {
    sw = img.width;
    sh = img.height;
  } else {
    // Fallback/cast if needed for other types
    sw = (img as any).width || 100;
    sh = (img as any).height || 100;
  }
  
  const aspect = sw / sh;
  
  let dw = maxW;
  let dh = maxW / aspect;
  if (dh > maxH) {
    dh = maxH;
    dw = maxH * aspect;
  }
  
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

async function renderTextLayer(
  ctx: CanvasRenderingContext2D,
  recipe: RenderRecipeV2,
  width: number,
  height: number
) {
  const { text } = recipe;
  if (!text.enabled || !text.config.value.trim()) return;

  ctx.save();
  const config = text.config;
  const pl = text.placement;
  
  const fontSize = config.sizeRatio * width;
  ctx.font = `${text.fontWeight} ${fontSize}px "${text.fontFamily}"`;
  ctx.fillStyle = config.color;
  ctx.textAlign = config.align;
  ctx.textBaseline = 'middle';

  ctx.translate(pl.x * width, pl.y * height);
  ctx.rotate(((pl.rotation + config.rotation) * Math.PI) / 180);
  ctx.scale(pl.scale, pl.scale);

  if (config.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = fontSize * 0.1;
    ctx.shadowOffsetX = fontSize * 0.05;
    ctx.shadowOffsetY = fontSize * 0.05;
  }

  const lines = config.value.split('\n');
  const lineHeight = fontSize * 1.1;
  const totalH = lines.length * lineHeight;
  
  lines.forEach((line, i) => {
    const y = (i + 0.5) * lineHeight - totalH / 2;
    
    if (config.letterSpacing === 0) {
      ctx.fillText(line, 0, y);
    } else {
      renderTextWithSpacing(ctx, line, 0, y, config.letterSpacing * fontSize);
    }
  });

  ctx.restore();
}

function renderTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  const characters = text.split('');
  let totalWidth = 0;
  const widths = characters.map(char => {
    const w = ctx.measureText(char).width;
    totalWidth += w + spacing;
    return w;
  });
  totalWidth -= spacing;

  let currentX = x;
  if (ctx.textAlign === 'center') currentX -= totalWidth / 2;
  else if (ctx.textAlign === 'right') currentX -= totalWidth;

  characters.forEach((char, i) => {
    ctx.fillText(char, currentX, y);
    currentX += widths[i] + spacing;
  });
}

function renderFinishPreview(
  ctx: CanvasRenderingContext2D,
  recipe: any, // StickerRenderRecipeV2
  width: number,
  height: number
) {
  // Simple finish simulation
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function renderFrameProof(
  ctx: CanvasRenderingContext2D,
  recipe: any, // PaintingRenderRecipeV2
  width: number,
  height: number
) {
  const { frame, output } = recipe;
  const frameWidthPx = (frame.materialWidthCm / output.widthCm) * width;
  
  ctx.save();
  ctx.strokeStyle = frame.borderHex;
  ctx.lineWidth = frameWidthPx;
  ctx.strokeRect(frameWidthPx / 2, frameWidthPx / 2, width - frameWidthPx, height - frameWidthPx);
  
  // Inner shadow/depth
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(frameWidthPx, frameWidthPx, width - frameWidthPx * 2, height - frameWidthPx * 2);
  
  ctx.restore();
}

function applyClipPath(ctx: CanvasRenderingContext2D, clipPath: string, width: number, height: number) {
  try {
    const path = new Path2D(clipPath);
    ctx.beginPath();
    // Scale path if it's normalized 0-1 or coordinate based
    // Assuming clipPath is designed for a specific viewBox, we might need a transform
    // For now, assume it's normalized or we use a transform
    ctx.clip(path);
  } catch (e) {
    console.error('Failed to apply clip path', e);
  }
}
