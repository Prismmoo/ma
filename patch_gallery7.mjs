import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

const target2 = `<div
                      className={\`pz-image-canvas w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-500 \${
                        selectedPaintingId === painting.id
                          ? 'bg-forest-gold/5'
                          : 'bg-forest-sage/5 group-hover:bg-forest-sage/10'
                      }\`}
                    >
                      <ArtImage
                        image={imageRefOf(painting)}
                        alt={\`\${painting.title} — \${painting.artistName}\`}
                        sizes={GRID_SIZES}
                        priority={cardIndex < EAGER_COUNT}
                        wrapperClassName="w-full"
                        className="object-contain shadow-xl group-hover:scale-[1.03] transition-transform duration-700"
                      />
                      
                    </div>`;

const replacement2 = `<div className="bg-forest-black relative overflow-hidden border border-forest-sage/10 rounded-[12px] lg:rounded-[16px] transition-transform active:scale-[0.98]" style={{ aspectRatio: painting.widthCm ? \`\${painting.widthCm}/\${painting.heightCm}\` : '3/4' }}>
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
                      </div>`;
                      
code = code.replace(target2, replacement2);

const target1 = '<div className="aspect-[3/4] bg-forest-black relative overflow-hidden border border-forest-sage/10">';
const replacement1 = `<div className="bg-forest-black relative overflow-hidden border border-forest-sage/10 rounded-[12px] lg:rounded-[16px] transition-transform active:scale-[0.98]" style={{ aspectRatio: painting.widthCm ? \`\${painting.widthCm}/\${painting.heightCm}\` : '3/4' }}>`;
code = code.replace(target1, replacement1);

fs.writeFileSync('src/components/GalleryView.tsx', code);
