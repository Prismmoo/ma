import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

// I will add a row of actions to the tile in GalleryView
// The hover styles can be achieved with `@media (hover: hover) { .hover-only { opacity: 0; } :hover > .hover-only { opacity: 1; } }`
// But with Tailwind: `opacity-100 lg:opacity-0 lg:group-hover:opacity-100` works for hovering on desktop and always showing on touch/mobile.

const actionRow = `
                        {/* Overlay Actions */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 z-10">
                          <button className="w-7 h-7 rounded-full bg-forest-black/80 text-forest-cream hover:text-forest-gold flex items-center justify-center backdrop-blur-md" onClick={(e) => { e.stopPropagation(); }}>
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-7 h-7 rounded-full bg-forest-black/80 text-forest-cream hover:text-forest-gold flex items-center justify-center backdrop-blur-md" onClick={(e) => { e.stopPropagation(); }}>
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
`;

// Insert it right before the last closing div of the image wrapper.
code = code.replace(
  '{painting.widthCm}x{painting.heightCm} cm\n                        </div>\n                      </div>',
  `{painting.widthCm}x{painting.heightCm} cm\n                        </div>${actionRow}                      </div>`
);

// We should also do this for the search results grid.
code = code.replace(
  '{painting.subCategory}\n                          </div>\n                        )}\n                      </div>',
  `{painting.subCategory}\n                          </div>\n                        )}\n${actionRow}                      </div>`
);

fs.writeFileSync('src/components/GalleryView.tsx', code);
