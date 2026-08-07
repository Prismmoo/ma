const fs = require('fs');
let code = fs.readFileSync('src/components/VisualizerView.tsx', 'utf8');

code = code.replace(
  /\)\}\s*<\/PanelGroup>/,
  '</PanelGroup>'
);

fs.writeFileSync('src/components/VisualizerView.tsx', code);
