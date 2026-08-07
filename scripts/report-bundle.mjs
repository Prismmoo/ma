import { readdirSync, statSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dir = 'dist/assets';
const rows = readdirSync(dir)
  .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
  .map((f) => {
    const buf = readFileSync(join(dir, f));
    return { file: f, raw: statSync(join(dir, f)).size, gzip: gzipSync(buf).length };
  })
  .sort((a, b) => b.gzip - a.gzip);

const kb = (n) => (n / 1024).toFixed(1).padStart(8) + ' KB';
let totalRaw = 0;
let totalGzip = 0;
for (const row of rows) {
  totalRaw += row.raw;
  totalGzip += row.gzip;
  console.log(kb(row.gzip) + ' gz  ' + kb(row.raw) + '  ' + row.file);
}
console.log('-'.repeat(48));
console.log(kb(totalGzip) + ' gz  ' + kb(totalRaw) + '  TOTAL  (' + rows.length + ' files)');

// Budget gate. Fails CI when a single chunk grows past the ceiling.
const BUDGET_GZIP = 250 * 1024;
const over = rows.filter((r) => r.file.endsWith('.js') && r.gzip > BUDGET_GZIP);
if (over.length) {
  console.error('\nBUDGET EXCEEDED:');
  for (const row of over) console.error('  ' + row.file + '  ' + kb(row.gzip) + ' gz');
  process.exitCode = 1;
}
