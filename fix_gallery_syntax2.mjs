import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

// Global search article:
code = code.replace(
  'className="group cursor-pointer bg-forest-deep border border-forest-sage/20 hover:border-forest-gold transition-all flex flex-col p-3 space-y-3 shadow-sm hover:shadow-md"',
  'className="break-inside-avoid mb-2 sm:mb-3 lg:mb-4 group cursor-pointer bg-forest-deep border border-forest-sage/20 hover:border-forest-gold transition-all flex flex-col p-3 space-y-3 shadow-sm hover:shadow-md"'
);

// Main list article:
code = code.replace(
  'className="group cursor-pointer flex flex-col space-y-4 animate-fade-in"',
  'className="break-inside-avoid mb-2 sm:mb-3 lg:mb-4 group cursor-pointer flex flex-col space-y-4 animate-fade-in"'
);

fs.writeFileSync('src/components/GalleryView.tsx', code);
