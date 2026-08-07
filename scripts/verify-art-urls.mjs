#!/usr/bin/env node
/**
 * verify-art-urls.mjs — يتحقق من وجود الروابط المُشتقة على الـ CDN.
 *   npm run art:verify            # عينة 40 رابطًا عشوائيًا (سريع)
 *   npm run art:verify -- --all   # كل الروابط (بطيء: >700 طلب)
 */
import { ART_COLLECTIONS, CDN_ART_ROOT } from '../src/generated/artCatalog.gen.ts';

const all = [];
for (const c of ART_COLLECTIONS)
  for (const im of c.imgs)
    for (const w of im.z)
      all.push(
        `${CDN_ART_ROOT}/${c.cat}/${c.slug}/` +
        `${c.pfx}-${c.slug}-${String(im.i).padStart(2, '0')}-${w}.webp`,
      );

const full = process.argv.includes('--all');
const pool = full ? all : all.sort(() => Math.random() - 0.5).slice(0, 40);
console.log(`▸ checking ${pool.length} / ${all.length} urls\n`);

let bad = 0;
const CONCURRENCY = 12;
for (let i = 0; i < pool.length; i += CONCURRENCY) {
  const batch = pool.slice(i, i + CONCURRENCY);
  const codes = await Promise.all(
    batch.map((u) =>
      fetch(u, { method: 'HEAD' }).then((r) => r.status).catch(() => 0),
    ),
  );
  codes.forEach((code, k) => {
    if (code !== 200) { bad++; console.log(`  ${code}  ${batch[k]}`); }
  });
}

console.log(bad === 0 ? `\n✅ all ${pool.length} urls return 200` : `\n❌ ${bad} broken urls`);
process.exit(bad === 0 ? 0 : 1);
