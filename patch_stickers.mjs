import fs from 'fs';
let code = fs.readFileSync('src/components/StickersView.tsx', 'utf8');

// Replace grid classes
code = code.replace(/className="pz-art-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12/g, 
  'className="w-full gap-2 sm:gap-3 lg:gap-4 columns-2 sm:columns-3 lg:columns-4 xl:columns-5');
  
code = code.replace(/className="pz-art-grid grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12/g, 
  'className="w-full gap-2 sm:gap-3 lg:gap-4 columns-2 sm:columns-3 lg:columns-4 xl:columns-5');
  
// Add break-inside-avoid to articles
code = code.replace(/className="group cursor-pointer flex flex-col space-y-4 animate-fade-in"/g, 
  'className="break-inside-avoid mb-2 sm:mb-3 lg:mb-4 group cursor-pointer flex flex-col space-y-4 animate-fade-in"');
  
code = code.replace(/className="group cursor-pointer bg-forest-deep border border-forest-sage\/20 hover:border-forest-gold transition-all flex flex-col p-3 space-y-3 shadow-sm hover:shadow-md"/g, 
  'className="break-inside-avoid mb-2 sm:mb-3 lg:mb-4 group cursor-pointer bg-forest-deep border border-forest-sage/20 hover:border-forest-gold transition-all flex flex-col p-3 space-y-3 shadow-sm hover:shadow-md"');

fs.writeFileSync('src/components/StickersView.tsx', code);
