import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

if (!code.includes('export default GalleryView;')) {
    code += '\nexport default GalleryView;\n';
    fs.writeFileSync('src/components/GalleryView.tsx', code);
}
