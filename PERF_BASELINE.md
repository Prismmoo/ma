
> react-example@0.0.0 report:bundle
> vite build && node scripts/report-bundle.mjs

vite v6.4.3 building for production...
transforming...
✓ 2137 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.11 kB │ gzip:   0.55 kB
dist/assets/index-DfVC5Gpe.css    140.07 kB │ gzip:  21.86 kB
dist/assets/index-C8Fdgrka.js   1,094.11 kB │ gzip: 281.41 kB
✓ built in 6.00s
   274.8 KB gz    1068.5 KB  index-C8Fdgrka.js
    21.3 KB gz     136.8 KB  index-DfVC5Gpe.css
------------------------------------------------
   296.2 KB gz    1205.3 KB  TOTAL  (2 files)

> react-example@0.0.0 report:source
> node scripts/report-source.mjs

lines  hooks   bp   file
 1487     26    9   src/components/VisualizerView.tsx
 1373      0    0   src/data.ts
 1356      0    0   src/index.css
 1109      0    0   src/generated/artCatalog.gen.ts
 1050      8   55   src/components/GalleryView.tsx
  937      1   11   src/components/PacksView.tsx
  769      6   32   src/components/HeroSection.tsx
  594      8   34   src/components/StickersView.tsx
  552      0    0   src/lib/galleryTaxonomy.ts
  512     23    6   src/components/personalization/PersonalizationStudio.tsx
  426      0    0   src/lib/stickers.ts
  418      0    4   src/App.tsx
  407      0    0   src/lib/renderRecipe.ts
  403      1    0   src/components/CartDrawer.tsx
  385      0    0   src/lib/renderDesign.ts
  367      9    3   src/components/stickers/StickerEditor.tsx
  359      0    0   src/lib/personalization.ts
  340      0    0   src/lib/orderSubmission.ts
  295     20    0   src/hooks/useSignaturePad.ts
  280      1    8   src/components/OrderStatusModal.tsx
  277      4    6   src/components/Header.tsx
  265      5    2   src/components/ThreeDPaintingView.tsx
  258      1    1   src/components/stickers/StickerDimensionControls.tsx
  255      0    0   src/lib/stickerTransform.ts
  244      1   10   src/components/ProductDetailModal.tsx

components over 700 lines: 4
  1487  src/components/VisualizerView.tsx
  1050  src/components/GalleryView.tsx
  937  src/components/PacksView.tsx
  769  src/components/HeroSection.tsx
