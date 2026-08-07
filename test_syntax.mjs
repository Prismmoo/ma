import fs from 'fs';
import { parse } from '@babel/parser';

try {
  const code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');
  parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  console.log('GalleryView OK');
} catch (e) { console.error('GalleryView Error', e); }
