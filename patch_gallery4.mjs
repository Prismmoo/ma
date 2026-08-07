import fs from 'fs';
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf8');

// Replace the controls above the grid
// Around line 542 (Filter / Sort Bar)
const controlsStart = code.indexOf('{/* Filter / Sort Bar */}');
const gridStart = code.indexOf('          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">');

if (controlsStart > 0 && gridStart > controlsStart) {
  code = code.substring(0, controlsStart) + 
`          {/* Unified Controls Toolbar and Mobile Sticky Bar */}
          <GalleryOptionsSheet
            aspectRatio={selectedAspectRatio}
            onAspectRatio={setSelectedAspectRatio}
            resolution={selectedResolution}
            onResolution={setSelectedResolution}
            palette={selectedPalette}
            onPalette={setSelectedPalette}
            mobileColumns={mobileColumns}
            onMobileColumns={setMobileColumns}
            sortBy={sortBy}
            onSortBy={setSortBy}
            onReset={resetAllFilters}
            paletteOptions={paletteOptions}
          />
` + code.substring(gridStart);
}

// Remove the Sidebar
const sidebarStart = code.indexOf('{/* Sidebar Filters */}');
const gridContentStart = code.indexOf('{/* Artworks Grid */}');

if (sidebarStart > 0 && gridContentStart > sidebarStart) {
  code = code.substring(0, sidebarStart) + code.substring(gridContentStart);
}

// Now replace the layout class of the artwork grid container
// The container has class conditionally dependent on showFilters.
// We will just replace the whole `<div\n              className={\n                showFilters` part.
const mainGridContainerStart = code.indexOf('<div\n              className={\n                showFilters');
if (mainGridContainerStart > 0) {
    const mainGridContainerEnd = code.indexOf('>', mainGridContainerStart + 30);
    // Let's use dynamic class for mobileColumns
    const replacement = `<div
              className={\`w-full gap-2 sm:gap-3 lg:gap-4 \${
                mobileColumns === 3 ? 'columns-3' : 'columns-2'
              } sm:columns-3 lg:columns-4 xl:columns-5\`}
            >`;
    code = code.substring(0, mainGridContainerStart) + replacement + code.substring(mainGridContainerEnd + 1);
}

// Let's also do the same for the other grids in GalleryView.tsx (like globalSearchResults and Category grid)
// global search grid
const searchGridStr = '<div className="pz-art-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">';
code = code.replace(searchGridStr, 
  `<div className={\`w-full gap-2 sm:gap-3 lg:gap-4 \${
                mobileColumns === 3 ? 'columns-3' : 'columns-2'
              } sm:columns-3 lg:columns-4 xl:columns-5\`}>`
);

// category grid
const catGridStr = '<div className="pz-art-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 animate-fade-in">';
code = code.replace(catGridStr, 
  `<div className={\`w-full gap-2 sm:gap-3 lg:gap-4 \${
                mobileColumns === 3 ? 'columns-3' : 'columns-2'
              } sm:columns-3 lg:columns-4 xl:columns-5\`}>`
);

// subcategory grid
const subCatGridStr = '<div className="pz-art-grid grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 animate-fade-in">';
code = code.replace(subCatGridStr, 
  `<div className={\`w-full gap-2 sm:gap-3 lg:gap-4 \${
                mobileColumns === 3 ? 'columns-3' : 'columns-2'
              } sm:columns-3 lg:columns-4 xl:columns-5\`}>`
);

// Also need to add break-inside-avoid to all articles and change their styles
code = code.replace(/<article/g, '<article\n                      className="break-inside-avoid mb-2 sm:mb-3 lg:mb-4 group cursor-pointer bg-forest-deep border border-forest-sage/20 hover:border-forest-gold transition-all flex flex-col p-3 shadow-sm hover:shadow-md animate-fade-in"');

// We have multiple instances of <article ...className="..."> so doing string replace on <article> is bad.
// Let's revert the article replace and do it properly with regex.

fs.writeFileSync('src/components/GalleryView.tsx', code);
