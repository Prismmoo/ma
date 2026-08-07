import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

const target2 = `                    {/* Visual Canvas Framing */}
                    <div 
                      className={\`w-full bg-forest-deep border border-forest-sage/20 flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:border-forest-gold shadow-sm hover:shadow-md \${
                        painting.sizeCategory === 'Small' ? 'p-4' :
                        painting.sizeCategory === 'Medium' ? 'p-6' :
                        painting.sizeCategory === 'Large' ? 'p-8' :
                        'p-10'
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
                      
                      {/* Subtle hover overlay details */}
                      <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="absolute bottom-4 left-4 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase">
                        {painting.widthCm}x{painting.heightCm} cm
                      </div>

                      {/* Tiny design indicator */}
                      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-forest-gold/30 group-hover:bg-forest-gold transition-colors duration-700" />
                    </div>`;

const replacement2 = `                    {/* Visual Canvas Framing */}
                    <div className="bg-forest-black relative overflow-hidden border border-forest-sage/10 rounded-[12px] lg:rounded-[16px] transition-transform active:scale-[0.98]" style={{ aspectRatio: painting.widthCm ? \`\${painting.widthCm}/\${painting.heightCm}\` : '3/4' }}>
                        <ArtImage
                          image={imageRefOf(painting)}
                          alt={\`\${painting.title} — \${painting.artistName}\`}
                          sizes={GRID_SIZES}
                          priority={cardIndex < EAGER_COUNT}
                          wrapperClassName="w-full h-full"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-forest-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="absolute top-2 left-2 bg-forest-black/90 backdrop-blur-sm px-2 py-0.5 text-[8px] font-mono text-forest-gold uppercase border border-forest-sage/20 pointer-events-none">
                          {displayStyle(painting.style)}
                        </div>
                        {painting.subCategory && (
                          <div className="absolute top-2 right-2 bg-forest-gold text-forest-black px-2 py-0.5 text-[8px] font-sans font-bold uppercase pointer-events-none">
                            {painting.subCategory}
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-forest-black/95 backdrop-blur-sm border border-forest-sage/20 px-2.5 py-1 text-[9px] font-mono text-forest-gold tracking-wider uppercase pointer-events-none">
                          {painting.widthCm}x{painting.heightCm} cm
                        </div>
                      </div>`;
                      
code = code.replace(target2, replacement2);
fs.writeFileSync('src/components/GalleryView.tsx', code);
