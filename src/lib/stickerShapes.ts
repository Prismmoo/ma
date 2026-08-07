/**
 * Sticker cut shapes.
 * ---------------------------------------------------------------------------
 * A die-cut sticker is defined by TWO things: its cut size (centimetres) and
 * its cut SHAPE. Until now the app only had the size, so every sticker was a
 * rectangle. This module adds the shape catalogue.
 *
 * Design decisions:
 * - A shape is described by a `clipPath` string, so the preview uses exactly
 *   the same geometry the die-cut would use. No images, no SVG assets.
 * - `aspect` is the natural width / height of the shape. `null` means the
 *   shape works at any ratio (square, rounded, circle are 1, banner is 2, ...).
 *   The editor applies it when the user picks the shape, but the user can
 *   still override the size afterwards.
 * - `contour` is the classic "die-cut / kiss-cut" option: no geometric clip at
 *   all, the cut follows the artwork silhouette. It is the default because it
 *   is what most sticker shops print by default.
 */

export interface StickerShape {
  id: string;
  label: string;
  /** Short human explanation shown under the label. */
  hint: string;
  /** CSS clip-path, or null for "follow the artwork silhouette". */
  clipPath: string | null;
  /** Natural width / height for this shape. */
  aspect: number;
  /** True when the shape must stay 1:1 (circle, square, hexagon, star...). */
  locksSquare: boolean;
}

/** Regular polygon helper, kept inline so the values stay readable in devtools. */
function polygon(points: Array<[number, number]>): string {
  return `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(', ')})`;
}

export const STICKER_SHAPES: StickerShape[] = [
  {
    id: 'contour',
    label: 'Die-cut',
    hint: 'Cut follows the artwork',
    clipPath: null,
    aspect: 1,
    locksSquare: true,
  },
  {
    id: 'square',
    label: 'Square',
    hint: 'Sharp 1:1 cut',
    clipPath: 'inset(0% 0% 0% 0%)',
    aspect: 1,
    locksSquare: true,
  },
  {
    id: 'rounded',
    label: 'Rounded',
    hint: 'Square with soft corners',
    clipPath: 'inset(0% 0% 0% 0% round 12%)',
    aspect: 1,
    locksSquare: true,
  },
  {
    id: 'circle',
    label: 'Circle',
    hint: 'Perfect round cut',
    clipPath: 'circle(50% at 50% 50%)',
    aspect: 1,
    locksSquare: true,
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    hint: 'Landscape 3:2 cut',
    clipPath: 'inset(0% 0% 0% 0% round 4%)',
    aspect: 3 / 2,
    locksSquare: false,
  },
  {
    id: 'portrait',
    label: 'Portrait',
    hint: 'Vertical 2:3 cut',
    clipPath: 'inset(0% 0% 0% 0% round 4%)',
    aspect: 2 / 3,
    locksSquare: false,
  },
  {
    id: 'oval',
    label: 'Oval',
    hint: 'Wide ellipse',
    clipPath: 'ellipse(50% 50% at 50% 50%)',
    aspect: 3 / 2,
    locksSquare: false,
  },
  {
    id: 'hexagon',
    label: 'Hexagon',
    hint: 'Six-sided badge',
    clipPath: polygon([
      [50, 0],
      [93, 25],
      [93, 75],
      [50, 100],
      [7, 75],
      [7, 25],
    ]),
    aspect: 1,
    locksSquare: true,
  },
  {
    id: 'shield',
    label: 'Shield',
    hint: 'Crest / badge cut',
    clipPath: polygon([
      [50, 0],
      [100, 18],
      [100, 62],
      [50, 100],
      [0, 62],
      [0, 18],
    ]),
    aspect: 1,
    locksSquare: true,
  },
  {
    id: 'star',
    label: 'Star',
    hint: 'Five-point cut',
    clipPath: polygon([
      [50, 0],
      [61, 35],
      [98, 35],
      [68, 57],
      [79, 91],
      [50, 70],
      [21, 91],
      [32, 57],
      [2, 35],
      [39, 35],
    ]),
    aspect: 1,
    locksSquare: true,
  },
  {
    id: 'arch',
    label: 'Arch',
    hint: 'Rounded top, flat base',
    clipPath: 'inset(0% 0% 0% 0% round 50% 50% 8% 8%)',
    aspect: 3 / 4,
    locksSquare: false,
  },
  {
    id: 'banner',
    label: 'Banner',
    hint: 'Wide strip, notched ends',
    clipPath: polygon([
      [0, 0],
      [100, 0],
      [92, 50],
      [100, 100],
      [0, 100],
      [8, 50],
    ]),
    aspect: 5 / 2,
    locksSquare: false,
  },
];

export const DEFAULT_SHAPE_ID = 'contour';

const SHAPES_BY_ID: Record<string, StickerShape> = STICKER_SHAPES.reduce(
  (acc, shape) => {
    acc[shape.id] = shape;
    return acc;
  },
  {} as Record<string, StickerShape>,
);

/** Never throws: an unknown or retired id falls back to the default shape. */
export function shapeById(id: string | undefined | null): StickerShape {
  if (!id) return SHAPES_BY_ID[DEFAULT_SHAPE_ID];
  return SHAPES_BY_ID[id] ?? SHAPES_BY_ID[DEFAULT_SHAPE_ID];
}

export function isKnownShapeId(id: unknown): boolean {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SHAPES_BY_ID, id);
}

/** The clip-path to apply to the artwork layer for a given shape id. */
export function shapeClipPath(id: string | undefined | null): string | undefined {
  return shapeById(id).clipPath ?? undefined;
}

/** Human label used in the cart line and in the summary row. */
export function shapeLabel(id: string | undefined | null): string {
  return shapeById(id).label;
}
