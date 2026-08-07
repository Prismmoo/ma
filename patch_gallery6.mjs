import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

// The main grid wrapper classes
// For search grid:
code = code.replace(
  'className="bg-forest-black relative overflow-hidden border border-forest-sage/10 rounded-xl lg:rounded-2xl" style={{ aspectRatio: painting.widthCm ? `${painting.widthCm}/${painting.heightCm}` : \'3/4\' }}',
  'className="bg-forest-black relative overflow-hidden border border-forest-sage/10 rounded-[12px] lg:rounded-[16px] transition-transform active:scale-[0.98]" style={{ aspectRatio: painting.widthCm ? `${painting.widthCm}/${painting.heightCm}` : \'3/4\' }}'
);
if (!code.includes('active:scale-[0.98]')) {
  // Try finding the original again if previous patch failed
  code = code.replace(
    '<div className="aspect-[3/4] bg-forest-black relative overflow-hidden border border-forest-sage/10">',
    '<div className="bg-forest-black relative overflow-hidden border border-forest-sage/10 rounded-[12px] lg:rounded-[16px] transition-transform active:scale-[0.98]" style={{ aspectRatio: painting.widthCm ? `${painting.widthCm}/${painting.heightCm}` : \'3/4\' }}>'
  );
}

// For main gallery wrapper
// It is wrapped in:
// <div
//   className={`pz-image-canvas w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-500 ${
//     selectedPaintingId === painting.id
//       ? 'bg-forest-gold/5'
//       : 'bg-forest-sage/5 group-hover:bg-forest-sage/10'
//   }`}
// >
// We'll change it to apply the masonry styles instead. But wait, `pz-image-canvas` gives a nice framing effect. The prompt said: "Preserve all existing functionality, state management, API calls, routing, i18n (Arabic/RTL), and design language." 
// "Each image tile must: use object-fit: cover with an intrinsic aspect-ratio from the image metadata (fallback 3/4) to prevent layout shift (CLS), have loading="lazy" + decoding="async", show a shimmer/skeleton placeholder while loading, use border-radius: 12px on mobile, 16px on desktop, have a subtle transition and active:scale-[0.98] press feedback on touch"

// Let's replace the pz-image-canvas div with a simpler wrapper for the image:
code = code.replace(
  /<div\n\s*className={`pz-image-canvas[^>]+>\n\s*<ArtImage\n\s*image={imageRefOf\(painting\)}\n\s*alt={`\$\{painting.title\} — \$\{painting.artistName\}`}\n\s*sizes={GRID_SIZES}\n\s*priority={cardIndex < EAGER_COUNT}\n\s*wrapperClassName="w-full"\n\s*className="object-contain shadow-xl group-hover:scale-\[1.03\] transition-transform duration-700"\n\s*\/>\n\s*<\/div>/g,
  `<div className="bg-forest-black relative overflow-hidden border border-forest-sage/10 rounded-[12px] lg:rounded-[16px] transition-transform active:scale-[0.98]" style={{ aspectRatio: painting.widthCm ? \`\${painting.widthCm}/\${painting.heightCm}\` : '3/4' }}>
                        <ArtImage
                          image={imageRefOf(painting)}
                          alt={\`\${painting.title} — \${painting.artistName}\`}
                          sizes={GRID_SIZES}
                          priority={cardIndex < EAGER_COUNT}
                          wrapperClassName="w-full h-full"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-forest-black/90 backdrop-blur-sm px-2 py-0.5 text-[8px] font-mono text-forest-gold uppercase border border-forest-sage/20">
                          {displayStyle(painting.style)}
                        </div>
                        {painting.subCategory && (
                          <div className="absolute top-2 right-2 bg-forest-gold text-forest-black px-2 py-0.5 text-[8px] font-sans font-bold uppercase">
                            {painting.subCategory}
                          </div>
                        )}
                      </div>`
);

// We also need to fix the first ArtImage aspect ratio:
code = code.replace(
  /aspectRatio="3 \/ 4"/g,
  ''
);

fs.writeFileSync('src/components/GalleryView.tsx', code);
