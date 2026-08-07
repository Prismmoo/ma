const fs = require('fs');
let code = fs.readFileSync('src/components/VisualizerView.tsx', 'utf8');

code = code.replace(/const playDemo = \(\) => \{[\s\S]*?\}, 50\);\s*\};\s*/, '');

fs.writeFileSync('src/components/VisualizerView.tsx', code);
