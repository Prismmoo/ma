import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx', '.css'].includes(extname(entry))) out.push(full);
  }
  return out;
}

const HOOK_RE = /use(State|Effect|Memo|Callback|Ref|LayoutEffect|SyncExternalStore)\(/g;
const BP_RE = /(?:^|["'`\s])(sm|md|lg|xl|2xl):/g;

const rows = walk('src').map((file) => {
  const src = readFileSync(file, 'utf8');
  return {
    file,
    lines: src.split('\n').length,
    hooks: (src.match(HOOK_RE) ?? []).length,
    breakpoints: (src.match(BP_RE) ?? []).length,
  };
});

rows.sort((a, b) => b.lines - a.lines);

console.log('lines  hooks   bp   file');
for (const r of rows.slice(0, 25)) {
  console.log(
    String(r.lines).padStart(5) +
      String(r.hooks).padStart(7) +
      String(r.breakpoints).padStart(5) +
      '   ' + r.file
  );
}

const oversized = rows.filter((r) => r.file.includes('/components/') && r.lines > 700);
console.log('\ncomponents over 700 lines: ' + oversized.length);
for (const r of oversized) console.log('  ' + r.lines + '  ' + r.file);
