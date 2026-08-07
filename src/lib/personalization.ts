/* =========================================================================
 *  PRISM — طبقة التخصيص (التوقيع والكتابة على اللوحة)
 *  لا يعتمد على React — منطق خالص قابل للاختبار.
 * ========================================================================= */

import type { ArtTransform, CropRect } from './stickerTransform';

export interface StrokePoint {
  x: number;
  y: number;
  p: number;
  t: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  size: number;
  erase?: boolean;
}

export type PersonalizationMode = 'draw' | 'text';

export interface TextConfig {
  value: string;
  fontId: string;
  color: string;
  sizeRatio: number;
  rotation: number;
  letterSpacing: number;
  align: 'left' | 'center' | 'right';
  shadow: boolean;
}

export interface LayerPlacement {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface StickerPersonalizationState {
  transform: ArtTransform;
  crop: CropRect;
  summary: string;
  finishId: string;
  shapeId: string;
  widthPx: number;
  heightPx: number;
  widthCm: number;
  heightCm: number;
}

export interface Personalization {
  mode: PersonalizationMode;
  strokes: Stroke[];
  text: TextConfig;
  drawPlacement: LayerPlacement;
  textPlacement: LayerPlacement;
  uploadedSignatureUrl?: string;
  /** Source image used by uploaded signature or drawing export. Not a full design proof. */
  previewDataUrl?: string;
  updatedAt: number;
  printType?: string;
  stickerState?: StickerPersonalizationState;
}

export type FontGroupId = 'signature' | 'calligraphy' | 'handwriting' | 'editorial' | 'display';

export interface ArtFont {
  id: string;
  family: string;
  group: FontGroupId;
  weight?: number;
  scale: number;
}

export const ART_FONTS: ArtFont[] = [
  { id: 'great-vibes',    family: 'Great Vibes',           group: 'signature',   scale: 1.15 },
  { id: 'allura',         family: 'Allura',                group: 'signature',   scale: 1.20 },
  { id: 'style-script',   family: 'Style Script',          group: 'signature',   scale: 1.10 },
  { id: 'mr-de-haviland', family: 'Mr De Haviland',        group: 'signature',   scale: 1.30 },
  { id: 'herr-von',       family: 'Herr Von Muellerhoff',  group: 'signature',   scale: 1.35 },
  { id: 'alex-brush',     family: 'Alex Brush',            group: 'signature',   scale: 1.15 },
  { id: 'italianno',      family: 'Italianno',             group: 'signature',   scale: 1.25 },
  { id: 'sacramento',     family: 'Sacramento',            group: 'signature',   scale: 1.10 },

  { id: 'tangerine',      family: 'Tangerine',             group: 'calligraphy', weight: 700, scale: 1.45 },
  { id: 'pinyon',         family: 'Pinyon Script',         group: 'calligraphy', scale: 1.20 },
  { id: 'parisienne',     family: 'Parisienne',            group: 'calligraphy', scale: 1.15 },
  { id: 'petit-formal',   family: 'Petit Formal Script',   group: 'calligraphy', scale: 1.05 },
  { id: 'rouge',          family: 'Rouge Script',          group: 'calligraphy', scale: 1.20 },
  { id: 'yellowtail',     family: 'Yellowtail',            group: 'calligraphy', scale: 1.00 },
  { id: 'cookie',         family: 'Cookie',                group: 'calligraphy', scale: 1.05 },

  { id: 'caveat',         family: 'Caveat',                group: 'handwriting', weight: 600, scale: 1.05 },
  { id: 'shadows',        family: 'Shadows Into Light',    group: 'handwriting', scale: 1.05 },
  { id: 'homemade',       family: 'Homemade Apple',        group: 'handwriting', scale: 1.15 },
  { id: 'nanum-pen',      family: 'Nanum Pen Script',      group: 'handwriting', scale: 1.10 },
  { id: 'kalam',          family: 'Kalam',                 group: 'handwriting', weight: 400, scale: 1.00 },
  { id: 'bad-script',     family: 'Bad Script',            group: 'handwriting', scale: 1.05 },
  { id: 'la-belle',       family: 'La Belle Aurore',       group: 'handwriting', scale: 1.15 },
  { id: 'satisfy',        family: 'Satisfy',               group: 'handwriting', scale: 1.05 },

  { id: 'playfair',       family: 'Playfair Display',      group: 'editorial',   weight: 500, scale: 0.95 },
  { id: 'cormorant',      family: 'Cormorant Garamond',    group: 'editorial',   weight: 500, scale: 1.00 },
  { id: 'cinzel',         family: 'Cinzel',                group: 'editorial',   weight: 500, scale: 0.90 },
  { id: 'josefin',        family: 'Josefin Sans',          group: 'editorial',   weight: 400, scale: 0.95 },

  { id: 'bebas',          family: 'Bebas Neue',            group: 'display',     scale: 0.90 },
  { id: 'orbitron',       family: 'Orbitron',              group: 'display',     weight: 700, scale: 0.85 },
  { id: 'audiowide',      family: 'Audiowide',             group: 'display',     scale: 0.85 },
];

export const FONT_GROUPS: Array<{ id: FontGroupId; label: string }> = [
  { id: 'signature',   label: 'Signatures' },
  { id: 'calligraphy', label: 'Calligraphy' },
  { id: 'handwriting', label: 'Handwriting' },
  { id: 'editorial',   label: 'Editorial' },
  { id: 'display',     label: 'Display' },
];

export const DEFAULT_FONT_ID = 'great-vibes';

export function fontById(id: string): ArtFont {
  return ART_FONTS.find((f) => f.id === id) ?? ART_FONTS[0];
}

export function fontFamilyCss(font: ArtFont): string {
  return '"' + font.family + '", cursive';
}

export function buildGoogleFontsHref(): string {
  const families = ART_FONTS.map((f) => {
    const name = f.family.replace(/ /g, '+');
    return f.weight ? 'family=' + name + ':wght@' + f.weight : 'family=' + name;
  }).join('&');
  return 'https://fonts.googleapis.com/css2?' + families + '&display=swap';
}

export const INK_PRESETS: Array<{ name: string; hex: string }> = [
  { name: 'Archival Black', hex: '#111111' },
  { name: 'Studio White',   hex: '#FFFFFF' },
  { name: 'Prism Violet',   hex: '#7952F3' },
  { name: 'Deep Indigo',    hex: '#312E81' },
  { name: 'Gallery Gold',   hex: '#C5A059' },
  { name: 'Oxblood',        hex: '#7F1D1D' },
  { name: 'Sea Ink',        hex: '#0E7490' },
  { name: 'Forest',         hex: '#166534' },
  { name: 'Graphite',       hex: '#4B5563' },
  { name: 'Blush',          hex: '#F472B6' },
];

export const PERSONALIZATION_PRICES = {
  text: 25,
  draw: 45,
  both: 60,
} as const;

export function hasUploadedSignature(p: Personalization | null | undefined): boolean {
  return !!p && !!p.uploadedSignatureUrl;
}

export function hasDrawing(p: Personalization | null | undefined): boolean {
  return (!!p && p.strokes.some((s) => !s.erase && s.points.length > 1)) || hasUploadedSignature(p);
}

export function hasText(p: Personalization | null | undefined): boolean {
  return !!p && p.text.value.trim().length > 0;
}

export function isPersonalized(p: Personalization | null | undefined): boolean {
  return hasDrawing(p) || hasText(p);
}

export function personalizationPrice(p: Personalization | null | undefined): number {
  const d = hasDrawing(p);
  const t = hasText(p);
  if (d && t) return PERSONALIZATION_PRICES.both;
  if (d) return PERSONALIZATION_PRICES.draw;
  if (t) return PERSONALIZATION_PRICES.text;
  return 0;
}

export function personalizationSummary(p: Personalization | null | undefined): string {
  if (!isPersonalized(p) || !p) return '';
  const parts: string[] = [];
  if (hasText(p)) parts.push('“' + p.text.value.trim() + '” in ' + fontById(p.text.fontId).family);
  if (hasUploadedSignature(p)) parts.push('uploaded signature');
  else if (hasDrawing(p)) parts.push('hand-drawn signature');
  return parts.join(' + ');
}

export const DEFAULT_TEXT: TextConfig = {
  value: '',
  fontId: DEFAULT_FONT_ID,
  color: '#111111',
  sizeRatio: 0.09,
  rotation: 0,
  letterSpacing: 0,
  align: 'center',
  shadow: true,
};

export const DEFAULT_PLACEMENT: LayerPlacement = { x: 0.5, y: 0.78, scale: 1, rotation: 0 };

export function emptyPersonalization(): Personalization {
  return {
    mode: 'draw',
    strokes: [],
    text: { ...DEFAULT_TEXT },
    drawPlacement: { ...DEFAULT_PLACEMENT },
    textPlacement: { ...DEFAULT_PLACEMENT },
    uploadedSignatureUrl: '',
    updatedAt: Date.now(),
  };
}

const STORAGE_PREFIX = 'prism.personalization.v1.';

export function storageKeyFor(paintingId: string): string {
  return STORAGE_PREFIX + paintingId;
}

export function loadPersonalization(paintingId: string): Personalization | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(paintingId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Personalization>;
    if (!parsed || !Array.isArray(parsed.strokes)) return null;
    return {
      ...emptyPersonalization(),
      ...parsed,
      text: { ...DEFAULT_TEXT, ...(parsed.text ?? {}) },
      drawPlacement: { ...DEFAULT_PLACEMENT, ...(parsed.drawPlacement ?? {}) },
      textPlacement: { ...DEFAULT_PLACEMENT, ...(parsed.textPlacement ?? {}) },
    };
  } catch {
    return null;
  }
}

export function savePersonalization(paintingId: string, p: Personalization): void {
  try {
    const { previewDataUrl: _omit, ...rest } = p;
    void _omit;
    localStorage.setItem(storageKeyFor(paintingId), JSON.stringify(rest));
  } catch {
    /* empty */
  }
}

export function clearPersonalization(paintingId: string): void {
  try {
    localStorage.removeItem(storageKeyFor(paintingId));
  } catch {
    /* empty */
  }
}

export function renderStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  width: number,
  height: number,
): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    const pts = stroke.points;
    if (pts.length === 0) continue;

    ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;

    const base = stroke.size * width;

    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x * width, pts[0].y * height, (base * pts[0].p) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const midX = ((prev.x + cur.x) / 2) * width;
      const midY = ((prev.y + cur.y) / 2) * height;
      const startX = i === 1 ? prev.x * width : ((pts[i - 2].x + prev.x) / 2) * width;
      const startY = i === 1 ? prev.y * height : ((pts[i - 2].y + prev.y) / 2) * height;

      ctx.lineWidth = Math.max(0.4, base * ((prev.p + cur.p) / 2));
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(prev.x * width, prev.y * height, midX, midY);
      ctx.stroke();
    }
  }

  ctx.globalCompositeOperation = 'source-over';
}

export function strokesBounds(
  strokes: Stroke[],
): { x: number; y: number; w: number; h: number } | null {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (const s of strokes) {
    if (s.erase) continue;
    for (const p of s.points) {
      found = true;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (!found) return null;

  const pad = 0.02;
  return {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: Math.min(1, maxX + pad) - Math.max(0, minX - pad),
    h: Math.min(1, maxY + pad) - Math.max(0, minY - pad),
  };
}

export function exportStrokesPng(
  strokes: Stroke[],
  targetWidth: number,
  aspect: number,
): string | null {
  const bounds = strokesBounds(strokes);
  if (!bounds) return null;

  const fullW = targetWidth;
  const fullH = Math.round(targetWidth / aspect);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bounds.w * fullW));
  canvas.height = Math.max(1, Math.round(bounds.h * fullH));

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.translate(-bounds.x * fullW, -bounds.y * fullH);
  renderStrokes(ctx, strokes, fullW, fullH);

  return canvas.toDataURL('image/png');
}
