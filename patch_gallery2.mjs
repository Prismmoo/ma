import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

// Imports
code = code.replace(
  "import { Search, Info, HelpCircle, X, Check, XCircle } from 'lucide-react';", 
  "import { Search, Info, HelpCircle, X, Check, XCircle, Download, Trash, Heart } from 'lucide-react';\nimport GalleryOptionsSheet from './GalleryOptionsSheet';"
);

// We need to inject GalleryOptionsSheet and masonry layout.
fs.writeFileSync('src/components/GalleryView.tsx', code);
