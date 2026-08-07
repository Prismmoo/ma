import fs from 'fs';

let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

// 1. Remove Your Art States
const stateStart = code.indexOf('// Your Art States');
const stateEnd = code.indexOf('const [selectedSizes, setSelectedSizes');
if (stateStart !== -1 && stateEnd !== -1) {
    code = code.slice(0, stateStart) + code.slice(stateEnd);
}

// 2. Remove isYourArtView JSX block
const jsxStart = code.indexOf('{isYourArtView ? (');
const nextViewStart = code.indexOf('/* Grid of Categories');
if (jsxStart !== -1 && nextViewStart !== -1) {
    // We need to find the `) : (` just before `/* Grid of Categories`
    // Actually, `isYourArtView ? (` is followed by a big block, and then `) : (`
    // Let's just use a regex for this specific part, or carefully find it.
    const beforeJsx = code.slice(0, jsxStart);
    // Find the nearest `) : (` before `/* Grid of Categories`
    let remaining = code.slice(jsxStart);
    let match = remaining.match(/\s*\) : \(\s*\/\* Grid of Categories/);
    if (match) {
        code = beforeJsx + remaining.slice(match.index + match[0].indexOf('/* Grid of Categories'));
    } else {
        // another attempt: look for `) : (` and `<div className="space-y-12 animate-fade-in">` maybe?
        let match2 = remaining.match(/\s*\) : \(\s*\/\* --- VIEW 1/);
        if (!match2) match2 = remaining.match(/\s*\) : \(\s*<div/);
        
        if (match2) {
             code = beforeJsx + remaining.slice(match2.index + match2[0].indexOf('<div'));
        }
    }
}

// 3. Add imports if not there
if (!code.includes('CustomerArtworkUpload')) {
    code = code.replace(
        "import { Painting, StyleType, SizeCategory, FramingOption } from '../types';",
        "import { Painting, StyleType, SizeCategory, FramingOption } from '../types';\nimport CustomerArtworkUpload from './CustomerArtworkUpload';\nimport { buildCustomerPainting } from '../lib/customerArtwork';"
    );
}

// 4. Insert the CustomerArtworkUpload component
// Let's find the first child of the main wrapper.
const mainWrapper = '<div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">';
if (code.includes(mainWrapper) && !code.includes('context="painting"')) {
    code = code.replace(
        mainWrapper,
        mainWrapper + '\n      <div className="mb-6">\n        <CustomerArtworkUpload\n          context="painting"\n          onEdit={(asset) => onSelectPainting(buildCustomerPainting(asset, PAINTINGS))}\n        />\n      </div>'
    );
}

fs.writeFileSync('src/components/GalleryView.tsx', code);
