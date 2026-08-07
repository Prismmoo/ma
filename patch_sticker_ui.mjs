import fs from 'fs';

let code = fs.readFileSync('src/components/stickers/StickerEditor.tsx', 'utf8');

// Remove laminate/review buttons
const modeBtns = `            <button
              onClick={() => setMode('laminate')}
              className={\`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border transition-all duration-300 \${
                mode === 'laminate'
                  ? 'border-forest-gold bg-forest-gold/10'
                  : 'border-forest-sage/20 bg-forest-black/50 hover:border-forest-gold/50'
              }\`}
            >
              <Sparkles className={\`w-5 h-5 sm:w-6 sm:h-6 mb-2 \${mode === 'laminate' ? 'text-forest-gold' : 'text-forest-cream/60'}\`} />
              <span className={\`text-xs font-sans uppercase tracking-wider \${mode === 'laminate' ? 'text-forest-gold font-bold' : 'text-forest-cream/60'}\`}>
                Laminate
              </span>
            </button>
            <button
              onClick={() => setMode('review')}
              className={\`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border transition-all duration-300 \${
                mode === 'review'
                  ? 'border-forest-gold bg-forest-gold/10'
                  : 'border-forest-sage/20 bg-forest-black/50 hover:border-forest-gold/50'
              }\`}
            >
              <Eye className={\`w-5 h-5 sm:w-6 sm:h-6 mb-2 \${mode === 'review' ? 'text-forest-gold' : 'text-forest-cream/60'}\`} />
              <span className={\`text-xs font-sans uppercase tracking-wider \${mode === 'review' ? 'text-forest-gold font-bold' : 'text-forest-cream/60'}\`}>
                Review
              </span>
            </button>`;
code = code.replace(modeBtns, "");

// also fix grid cols from 4 to 2
code = code.replace('className="grid grid-cols-4 gap-4 mb-8"', 'className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto"');
code = code.replace('className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"', 'className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto"');

fs.writeFileSync('src/components/stickers/StickerEditor.tsx', code);
