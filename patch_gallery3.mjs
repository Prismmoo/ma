import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

code = code.replace(
  "seriesSplitIndex,\n  } = useGalleryFilters({ initialStyleFilter, onClearInitialStyleFilter, memoryScope: 'gallery' });",
  "seriesSplitIndex,\n    selectedAspectRatio,\n    setSelectedAspectRatio,\n    selectedResolution,\n    setSelectedResolution,\n    mobileColumns,\n    setMobileColumns,\n  } = useGalleryFilters({ initialStyleFilter, onClearInitialStyleFilter, memoryScope: 'gallery' });"
);

fs.writeFileSync('src/components/GalleryView.tsx', code);
