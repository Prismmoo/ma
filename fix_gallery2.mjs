const fs = require('fs');
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

// There's a trailing } or something near line 445.
// Let's print out lines around 440-450.
const lines = code.split('\\n');
console.log(lines.slice(435, 455).join('\\n'));
