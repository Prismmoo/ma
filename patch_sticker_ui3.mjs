import fs from 'fs';

let code = fs.readFileSync('src/components/stickers/StickerEditor.tsx', 'utf8');

// The mode buttons might be slightly different.
code = code.replace(/<button[^>]*onClick=\{\(\) => setMode\('laminate'\)\}[^>]*>[\s\S]*?<\/button>/, '');
code = code.replace(/<button[^>]*onClick=\{\(\) => setMode\('review'\)\}[^>]*>[\s\S]*?<\/button>/, '');

code = code.replace('className="grid grid-cols-4 gap-4 mb-8"', 'className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto"');
code = code.replace('className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"', 'className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto"');

fs.writeFileSync('src/components/stickers/StickerEditor.tsx', code);
