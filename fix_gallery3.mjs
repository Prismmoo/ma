import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(440, 455).join('\n'));
