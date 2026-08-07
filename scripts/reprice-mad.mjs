import { readFileSync, writeFileSync } from 'node:fs';

const SIZE_PRICE = { xs: 390, s: 590, m: 990, l: 1590, xl: 2490, xxl: 3490 };
const RESIN = 1.35;

function sizeCode(w, h) {
  const a = w * h;
  if (a <= 700) return 'xs';
  if (a <= 1300) return 's';
  if (a <= 2600) return 'm';
  if (a <= 5000) return 'l';
  if (a <= 10000) return 'xl';
  return 'xxl';
}

const path = 'src/data.ts';
let source = readFileSync(path, 'utf8');
const rows = [];

// Each painting literal exposes widthCm, heightCm and price in that order.
source = source.replace(
  /widthCm:\s*(\d+),\s*\n(\s*)heightCm:\s*(\d+),\s*\n(\s*)price:\s*(\d+)/g,
  (whole, w, padA, h, padB, oldPrice) => {
    const code = sizeCode(Number(w), Number(h));
    const next = Math.round((SIZE_PRICE[code] * RESIN) / 10) * 10;
    rows.push({ size: `${w}\u00d7${h}`, code, old: Number(oldPrice), next });
    return `widthCm: ${w},\n${padA}heightCm: ${h},\n${padB}price: ${next}`;
  }
);

writeFileSync(path, source);
console.table(rows);
console.log(`repriced ${rows.length} paintings`);
