import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

// The articles have duplicate className props.
// I will replace all `<article\n                      className="break-inside-avoid mb-2 sm:mb-3 lg:mb-4 group cursor-pointer bg-forest-deep border border-forest-sage/20 hover:border-forest-gold transition-all flex flex-col p-3 shadow-sm hover:shadow-md animate-fade-in"`
// With just `<article`

code = code.replace(/<article\n\s*className="break-inside-avoid[^"]+"/g, '<article');
fs.writeFileSync('src/components/GalleryView.tsx', code);
