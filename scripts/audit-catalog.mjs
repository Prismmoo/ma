#!/usr/bin/env node
/**
 * Catalog integrity audit.
 *
 * Run this after adding or reorganising paintings:
 *     node scripts/audit-catalog.mjs
 *
 * Exits 1 on any ERROR so it can gate a build. WARNs never fail the run.
 *
 * It reads the SOURCE files as text rather than importing the TS modules,
 * so it runs with plain node and needs no build step.
 */
import { readFileSync } from 'node:fs';

const VALID_STYLES = [
  'Abstract', 'Minimalist', 'Textured', 'Contemporary', 'Impressionist',
  'Anime', 'Gaming', 'Films', 'Motorbikes', 'Cars',
];

const src = readFileSync('src/data.ts', 'utf8');

// Pull every `style: '...'` and `id: '...'` pair in document order.
const entries = [];
const blockRe = /\{[^{}]*?id:\s*'([^']+)'[\s\S]*?\}/g;
let match;
while ((match = blockRe.exec(src)) !== null) {
  const block = match[0];
  const id = match[1];
  const style = /style:\s*'([^']*)'/.exec(block)?.[1] ?? null;
  const title = /title:\s*'([^']*)'/.exec(block)?.[1] ?? null;
  const sub = /subCategory:\s*'([^']*)'/.exec(block)?.[1] ?? null;
  const url = /imageUrl:\s*'([^']*)'/.exec(block)?.[1] ?? null;
  const hasRef = /\bimage:\s*\{/.test(block) || /\bimage:\s*toImageRef/.test(block);
  if (style || title) entries.push({ id, title, style, sub, url, hasRef });
}

const errors = [];
const warnings = [];
const seen = new Set();

for (const entry of entries) {
  if (seen.has(entry.id)) errors.push(`duplicate id: ${entry.id}`);
  seen.add(entry.id);

  if (!entry.title) errors.push(`${entry.id}: missing title`);

  if (!entry.style) {
    errors.push(`${entry.id}: missing style`);
  } else if (!VALID_STYLES.includes(entry.style)) {
    const near = VALID_STYLES.find(
      (s) => s.toLowerCase().startsWith(entry.style.slice(0, 4).toLowerCase())
    );
    errors.push(
      `${entry.id}: invalid style '${entry.style}'` + (near ? ` — did you mean '${near}'?` : '')
    );
  }

  if (!entry.url && !entry.hasRef) errors.push(`${entry.id}: no imageUrl and no image ref`);
  if (!entry.sub) warnings.push(`${entry.id}: no subCategory — will sit outside every collection`);
}

// Category census — the owner's quick sanity view.
const census = new Map();
for (const entry of entries) {
  if (!entry.style) continue;
  const bucket = census.get(entry.style) ?? { total: 0, subs: new Set() };
  bucket.total += 1;
  if (entry.sub) bucket.subs.add(entry.sub);
  census.set(entry.style, bucket);
}

console.log('\n=== CATALOG CENSUS ===');
for (const style of VALID_STYLES) {
  const bucket = census.get(style);
  const total = bucket?.total ?? 0;
  const subs = bucket?.subs.size ?? 0;
  const flag = total === 0 ? '   (empty — no tab will render)' : '';
  console.log(`${style.padEnd(16)} ${String(total).padStart(4)} paintings  ${String(subs).padStart(3)} collections${flag}`);
}
console.log(`${'TOTAL'.padEnd(16)} ${String(entries.length).padStart(4)} paintings`);

if (warnings.length) {
  console.log(`\n=== WARNINGS (${warnings.length}) ===`);
  for (const w of warnings.slice(0, 30)) console.log('  ! ' + w);
  if (warnings.length > 30) console.log(`  … and ${warnings.length - 30} more`);
}

if (errors.length) {
  console.log(`\n=== ERRORS (${errors.length}) ===`);
  for (const e of errors) console.log('  x ' + e);
  console.log('\nFAILED — fix the errors above; these paintings will not appear correctly.\n');
  process.exit(1);
}

console.log('\nOK — every painting will reach Gallery, Stickers and Packs.\n');
