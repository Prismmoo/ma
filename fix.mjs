import fs from 'fs';

let content = fs.readFileSync('src/components/stickers/StickerEditor.tsx', 'utf8');

content = content.replace(
  "import { DEFAULT_UNIT, formatSize } from '../../lib/stickerUnits';",
  "import { DEFAULT_UNIT, formatSize, pixelsToCentimetres } from '../../lib/stickerUnits';"
);

content = content.replace("undoHistory(prev);", "undoHistory<StickerDraft>(prev);");
content = content.replace("redoHistory(prev);", "redoHistory<StickerDraft>(prev);");

content = content.replace(
  /const handleAddToCart = \(\) => \{\n    const \{ widthPx: cw, heightPx: ch \} = croppedSizePx\(widthPx, heightPx, draft\.crop\);\n\n    const syntheticPainting: Painting = \{[\s\S]*?    \};\n\n    const framing: FramingOption = \{[\s\S]*?    \};/,
  `const handleAddToCart = () => {
    const { widthPx: cw, heightPx: ch } = croppedSizePx(widthPx, heightPx, draft.crop);
    const widthCm = pixelsToCentimetres(cw);
    const heightCm = pixelsToCentimetres(ch);
    const sizeLabel = formatSize(cw, ch, DEFAULT_UNIT);

    const syntheticPainting: Painting = {
      id: \`sticker-\${sticker.paintingId}-\${activeFinish.id}-\${sizeLabel.replace(/\\s+/g, '')}\`,
      title: \`[STICKER] \${sticker.title} (\${activeFinish.name} — \${sizeLabel})\`,
      artistId: sticker.artistId,
      artistName: sticker.artistName,
      year: sticker.source.year,
      style: sticker.style,
      sizeCategory: 'Small',
      widthCm,
      heightCm,
      price: finalPrice,
      story: \`\${shape.label} die-cut vinyl sticker with \${activeFinish.name} finish.\`,
      imageUrl: sticker.imageUrl,
      colorPalette: sticker.colorPalette,
      paletteNames: sticker.paletteNames,
      featured: false,
      subCategory: sticker.collection ?? undefined,
      image: sticker.image,
    };

    const framing: FramingOption = {
      id: 'sticker-cut',
      name: \`\${shape.label} die-cut\`,
      description: 'Weatherproof vinyl',
      price: 0,
      borderHex: activeFinish.borderHex,
      materialWidthCm: 0,
    };`
);

fs.writeFileSync('src/components/stickers/StickerEditor.tsx', content);
