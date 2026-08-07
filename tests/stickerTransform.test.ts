import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  IDENTITY_TRANSFORM,
  FULL_CROP,
  MIN_CROP,
  MIN_SCALE,
  MAX_SCALE,
  clamp,
  clampCrop,
  clampTransform,
  cropCssInset,
  cropHeight,
  cropWidth,
  croppedSizePx,
  isCropped,
  normaliseAngle,
  parseStageState,
  pointerAngle,
  pointerDistance,
  resizeCrop,
  snapAngle,
  transformSummary,
  artworkCssTransform,
} from '../src/lib/stickerTransform';

test('clamp rejects NaN and Infinity', () => {
  assert.equal(clamp(Number.NaN, 0, 1), 0);
  assert.equal(clamp(Number.POSITIVE_INFINITY, 0, 1), 0);
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
});

test('clampTransform keeps the scale inside the allowed range', () => {
  assert.equal(clampTransform({ ...IDENTITY_TRANSFORM, scale: 100 }).scale, MAX_SCALE);
  assert.equal(clampTransform({ ...IDENTITY_TRANSFORM, scale: 0 }).scale, MIN_SCALE);
  assert.equal(clampTransform({ ...IDENTITY_TRANSFORM, scale: Number.NaN }).scale, MIN_SCALE);
});

test('normaliseAngle and snapAngle behave like a design tool', () => {
  assert.equal(normaliseAngle(370), 10);
  assert.equal(normaliseAngle(-370), -10);
  assert.equal(normaliseAngle(Number.NaN), 0);
  assert.equal(snapAngle(88), 90);
  assert.equal(snapAngle(80), 80);
  assert.equal(snapAngle(-1.5), 0);
});

test('crop window can never collapse', () => {
  const crushed = clampCrop({ left: 0.9, right: 0.9, top: 0.95, bottom: 0.95 });
  assert.ok(cropWidth(crushed) >= MIN_CROP - 1e-6);
  assert.ok(cropHeight(crushed) >= MIN_CROP - 1e-6);
});

test('resizeCrop moves the window without changing its size', () => {
  const start = clampCrop({ left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 });
  const moved = resizeCrop(start, 'move', 0.05, -0.05);
  assert.ok(Math.abs(cropWidth(moved) - cropWidth(start)) < 1e-6);
  assert.ok(Math.abs(cropHeight(moved) - cropHeight(start)) < 1e-6);
  assert.ok(moved.left > start.left);
  assert.ok(moved.top < start.top);
});

test('resizeCrop drags a single corner', () => {
  const next = resizeCrop(FULL_CROP, 'se', -0.2, -0.1);
  assert.ok(Math.abs(next.right - 0.2) < 1e-6);
  assert.ok(Math.abs(next.bottom - 0.1) < 1e-6);
  assert.equal(next.left, 0);
  assert.equal(next.top, 0);
});

test('move never pushes the window outside the sticker', () => {
  const start = clampCrop({ left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 });
  const moved = resizeCrop(start, 'move', 5, 5);
  assert.ok(moved.left >= 0 && moved.top >= 0);
  assert.ok(moved.right >= -1e-9 && moved.bottom >= -1e-9);
  assert.ok(moved.left + cropWidth(moved) <= 1 + 1e-6);
});

test('isCropped only reports a real crop', () => {
  assert.equal(isCropped(FULL_CROP), false);
  assert.equal(isCropped(clampCrop({ ...FULL_CROP, left: 0.2 })), true);
});

test('croppedSizePx reduces the printed size', () => {
  const size = croppedSizePx(400, 400, clampCrop({ left: 0.25, right: 0.25, top: 0, bottom: 0 }));
  assert.ok(Math.abs(size.widthPx - 200) < 1e-6);
  assert.ok(Math.abs(size.heightPx - 400) < 1e-6);
});

test('pointer helpers compute pinch distance and angle', () => {
  assert.equal(pointerDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(pointerAngle({ x: 0, y: 0 }, { x: 1, y: 0 }), 0);
  assert.equal(pointerAngle({ x: 0, y: 0 }, { x: 0, y: 1 }), 90);
});

test('css helpers emit valid values', () => {
  assert.equal(cropCssInset(FULL_CROP), 'inset(0% 0% 0% 0%)');
  const css = artworkCssTransform({ ...IDENTITY_TRANSFORM, flipX: true, scale: 2 });
  assert.ok(css.includes('scale(-2, 2)'));
  assert.ok(css.includes('rotate(0deg)'));
});

test('transformSummary describes the framing in plain words', () => {
  assert.equal(transformSummary(IDENTITY_TRANSFORM, FULL_CROP), 'original framing');
  const summary = transformSummary(
    { ...IDENTITY_TRANSFORM, scale: 1.5, rotation: 90, flipX: true },
    clampCrop({ left: 0.25, right: 0.25, top: 0, bottom: 0 }),
  );
  assert.ok(summary.includes('zoom 1.50x'));
  assert.ok(summary.includes('rotated 90deg'));
  assert.ok(summary.includes('flipped horizontally'));
  assert.ok(summary.includes('cropped to 50%'));
});

test('parseStageState survives corrupt or missing data', () => {
  assert.deepEqual(parseStageState(null).transform, IDENTITY_TRANSFORM);
  assert.deepEqual(parseStageState('not json').crop, FULL_CROP);
  const partial = parseStageState('{"transform":{"scale":99}}');
  assert.equal(partial.transform.scale, MAX_SCALE);
  assert.equal(partial.transform.x, 0.5);
});
