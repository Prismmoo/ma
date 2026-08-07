#!/usr/bin/env node
/**
 * sync-art-catalog.mjs
 * ---------------------------------------------------------------------------
 * يقرأ manifest.json من الـ CDN (أو من ملف محلي) ويولّد
 * src/generated/artCatalog.gen.ts — مصدر الحقيقة الوحيد للصور.
 *
 *   npm run art:sync              # يجلب من الشبكة
 *   npm run art:sync -- --local ~/Downloads/art/manifest.json
 *
 * لا يُشغّل تلقائيًا في `npm run build` عمدًا: البناء يجب أن يبقى
 * ممكنًا دون اتصال شبكة. الملف المولّد يُرفع إلى Git.
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CDN_ROOT =
  'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/art';
const OUT = resolve(ROOT, 'src/generated/artCatalog.gen.ts');

/* ------------------------------------------------------------------ *
 * 1. التصنيفات والعناوين المعروضة — مصدر الحقيقة للأسماء.
 *    أي slug موجود في المانيفست وليس هنا → يوقف السكربت.
 *    أي slug هنا وليس في المانيفست → يوقف السكربت.
 *    هذا ما يمنع مشكلة 'Claymore' من التكرار إلى الأبد.
 * ------------------------------------------------------------------ */
const TITLES = {
  // ---- Anime & Manga (18) ----
  'attack-on-titan':      'Attack on Titan',
  'berserk':              'Berserk',
  'black-clover':         'Black Clover',
  'death-note':           'Death Note',
  'demon-slayer':         'Demon Slayer',
  'dragon-ball':          'Dragon Ball',
  'golden-boy':           'Golden Boy',
  'hajime-no-ippo':       'Hajime no Ippo',
  'hunter-x-hunter':      'Hunter x Hunter',
  'jujutsu-kaisen':       'Jujutsu Kaisen',
  'naruto':               'Naruto',
  'one-piece':            'One Piece',
  'one-punch-man':        'One Punch Man',
  'slam-dunk':            'Slam Dunk',
  'solo-leveling':        'Solo Leveling',
  'the-climber':          'The Climber',
  'vagabond':             'Vagabond',
  'vinland-saga':         'Vinland Saga',
  // ---- Films (12) ----
  '2001-a-space-odyssey': '2001: A Space Odyssey',
  'captain-phillips':     'Captain Phillips',
  'city-of-god':          'City of God',
  'fight-club':           'Fight Club',
  'interstellar':         'Interstellar',
  'joker':                'Joker',
  'memento':              'Memento',
  'oppenheimer':          'Oppenheimer',
  'paul':                 'Paul',
  'pulp-fiction':         'Pulp Fiction',
  'se7en':                'Se7en',
  'the-dark-knight':      'The Dark Knight',
  // ---- Series (14) ----
  'better-call-saul':     'Better Call Saul',
  'breaking-bad':         'Breaking Bad',
  'dark':                 'Dark',
  'from':                 'From',
  'game-of-thrones':      'Game of Thrones',
  'lost':                 'Lost',
  'money-heist':          'Money Heist',
  'peaky-blinders':       'Peaky Blinders',
  'six-feet-under':       'Six Feet Under',
  'the-boys':             'The Boys',
  'the-last-kingdom':     'The Last Kingdom',
  'the-sopranos':         'The Sopranos',
  'the-walking-dead':     'The Walking Dead',
  'the-wire':             'The Wire',

  // ---- Games (23) ----
  'bloodborne':            'Bloodborne',
  'call-of-duty':          'Call of Duty',
  'cyberpunk-2077':        'Cyberpunk 2077',
  'death-stranding':       'Death Stranding',
  'elden-ring':            'Elden Ring',
  'expedition-33':         'Expedition 33',
  'fifa':                  'FIFA',
  'final-fantasy':         'Final Fantasy',
  'forza-horizon':         'Forza Horizon',
  'free-fire':             'Free Fire',
  'gta-san-andreas':       'GTA San Andreas',
  'gta-vice-city':         'GTA Vice City',
  'half-life':             'Half-Life',
  'hollow-knight':         'Hollow Knight',
  'minecraft':             'Minecraft',
  'prince-of-persia':      'Prince of Persia',
  'pubg':                  'PUBG',
  'red-dead-redemption-2': 'Red Dead Redemption 2',
  'resident-evil':         'Resident Evil',
  'silent-hill':           'Silent Hill',
  'skyrim':                'Skyrim',
  'the-last-of-us':        'The Last of Us',
  'the-witcher':           'The Witcher',

  // ---- Cars (7) ----
  'audi':         'Audi',
  'bmw':          'BMW',
  'mercedes':     'Mercedes-Benz',
  'more-cars':    'More Cars',
  'nissan':       'Nissan',
  'porsche':      'Porsche',
  'toyota-supra': 'Toyota Supra',
};

/* ------------------------------------------------------------------ */
async function loadManifest() {
  const localIdx = process.argv.indexOf('--local');
  if (localIdx !== -1 && process.argv[localIdx + 1]) {
    const p = resolve(process.argv[localIdx + 1].replace(/^~/, process.env.HOME));
    console.log(`▸ reading local manifest: ${p}`);
    return JSON.parse(readFileSync(p, 'utf8'));
  }
  const url = `${CDN_ROOT}/manifest.json`;
  console.log(`▸ fetching: ${url}`);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`manifest fetch failed: HTTP ${res.status}`);
  return res.json();
}

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

const main = async () => {
  const raw = await loadManifest();
  if (!Array.isArray(raw) || raw.length === 0) fail('manifest is empty or not an array');
  console.log(`▸ records: ${raw.length}`);

  /* ---- group by collection ---- */
  const byCollection = new Map();
  for (const r of raw) {
    for (const k of ['id', 'category', 'collection', 'index', 'width', 'height', 'sizes']) {
      if (r[k] === undefined || r[k] === null) fail(`record ${r.id ?? '?'} is missing "${k}"`);
    }
    if (!Array.isArray(r.sizes) || r.sizes.length === 0)
      fail(`record ${r.id} has an empty "sizes" array`);

    // البادئة = كل شيء قبل أول شرطة في الـ id
    const prefix = r.id.split('-')[0];
    if (!['anm', 'flm', 'srs', 'gam', 'car'].includes(prefix))
      fail(`record ${r.id} has an unknown prefix "${prefix}"`);

    // التحقق من أن الـ id يطابق المخطط تمامًا
    const expectedId = `${prefix}-${r.collection}-${String(r.index).padStart(2, '0')}`;
    if (r.id !== expectedId)
      fail(`id mismatch: manifest says "${r.id}" but scheme derives "${expectedId}"`);

    if (!byCollection.has(r.collection)) {
      byCollection.set(r.collection, {
        slug: r.collection,
        cat: r.category,
        pfx: prefix,
        type: r.collectionType ?? (r.category === 'cars' ? 'car' : r.category === 'games' ? 'game' : r.category === 'anime-manga' ? 'anime' : 'film'),   // 'anime' | 'film' | 'series' | 'game' | 'car'
        imgs: [],
      });
    }
    const c = byCollection.get(r.collection);
    if (c.pfx !== prefix) fail(`collection ${r.collection} mixes prefixes ${c.pfx}/${prefix}`);
    c.imgs.push({
      i: r.index,
      w: r.width,
      h: r.height,
      z: [...r.sizes].sort((a, b) => a - b),
    });
  }

  /* ---- بوابة التطابق: لا مجموعة بلا عنوان، ولا عنوان بلا مجموعة ---- */
  const inManifest = new Set(byCollection.keys());
  const inTitles = new Set(Object.keys(TITLES));
  const missingTitle = [...inManifest].filter((s) => !inTitles.has(s));
  const orphanTitle  = [...inTitles].filter((s) => !inManifest.has(s));
  if (missingTitle.length)
    fail(`مجموعات في الـ CDN بلا عنوان في TITLES:\n   ${missingTitle.join('\n   ')}`);
  if (orphanTitle.length) {
    const strict = !process.argv.includes('--allow-orphan-titles');
    const msg =
      `عناوين في TITLES بلا صور في المانيفست:\n   ${orphanTitle.join('\n   ')}\n\n` +
      `   إمّا أن الصور لم تُرفع، وإمّا أن manifest.json لم يُحدَّث بعد الرفع.\n` +
      `   رفع الملفات إلى المستودع لا يضيفها إلى manifest.json تلقائيًا.\n` +
      `   للتجاوز عمدًا: npm run art:sync -- --allow-orphan-titles`;
    if (strict) fail(msg);
    console.warn(`⚠️ ${msg}`);
  }

  /* ---- الترتيب المستقر ---- */
  const collections = [...byCollection.values()].sort(
    (a, b) => a.cat.localeCompare(b.cat) || TITLES[a.slug].localeCompare(TITLES[b.slug]),
  );
  for (const c of collections) {
    c.imgs.sort((a, b) => a.i - b.i);
    // التحقق من عدم وجود ثغرات في الترقيم
    c.imgs.forEach((im, k) => {
      if (im.i !== k + 1) fail(`${c.slug}: index gap — expected ${k + 1}, got ${im.i}`);
    });
  }

  /* ---- إحصاءات للطباعة ---- */
  const total = collections.reduce((n, c) => n + c.imgs.length, 0);
  const multiSize = collections.reduce(
    (n, c) => n + c.imgs.filter((im) => im.z.length > 1).length, 0);

  /* بوّابة العدّ لكل تصنيف — تمنع التوليد الناقص الصامت. */
  const EXPECTED_PER_CAT = { 'anime-manga': 18, 'films-series': 26, 'games': 23, 'cars': 7 };
  for (const [cat, want] of Object.entries(EXPECTED_PER_CAT)) {
    const got = collections.filter((c) => c.cat === cat).length;
    if (got !== want)
      fail(`تصنيف "${cat}": المتوقع ${want} مجموعة، المولَّد ${got}. ` +
           `حدِّث EXPECTED_PER_CAT عمدًا إن كان التغيير مقصودًا.`);
  }

  /* ---- توليد الملف ---- */
  const body = collections
    .map((c) => {
      const imgs = c.imgs
        .map((im) => `    { i: ${im.i}, w: ${im.w}, h: ${im.h}, z: [${im.z.join(', ')}] },`)
        .join('\n');
      return `  {
    slug: '${c.slug}',
    title: ${JSON.stringify(TITLES[c.slug])},
    cat: '${c.cat}',
    pfx: '${c.pfx}',
    type: '${c.type}',
    imgs: [
${imgs}
    ],
  },`;
    })
    .join('\n');

  const out = `/* eslint-disable */
// ############################################################################
// #  ملف مولّد آليًا — لا تعدّله يدويًا.
// #  أعد التوليد بـ:  npm run art:sync
// #  المصدر: ${CDN_ROOT}/manifest.json
// #  التوليد: ${new Date().toISOString()}
// #  ${collections.length} مجموعة · ${total} صورة
// ############################################################################

import type { GeneratedCollection } from '../types';

export const CDN_ART_ROOT = '${CDN_ROOT}' as const;

export const ART_COLLECTIONS: GeneratedCollection[] = [
${body}
];

export const ART_TOTAL_IMAGES = ${total};
`;

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, out, 'utf8');

  console.log('');
  console.log(`✅ ${OUT.replace(ROOT + '/', '')}`);
  console.log(`   ${collections.length} collections · ${total} images`);
  console.log(`   multi-size images: ${multiSize} / ${total}`);
  console.log(`   file size: ${(out.length / 1024).toFixed(1)} KB raw`);
  for (const cat of ['anime-manga', 'films-series', 'games', 'cars']) {
    const cs = collections.filter((c) => c.cat === cat);
    console.log(
      `   ${cat.padEnd(14)} ${String(cs.length).padStart(2)} collections · ` +
      `${cs.reduce((n, c) => n + c.imgs.length, 0)} images`,
    );
  }
};

main().catch((e) => fail(e.message));
