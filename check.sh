echo "# 1"
npm run lint

echo "# 2"
npm test

echo "# 3"
grep -c "id: '" src/lib/printSizes.ts
grep -c "system: 'SQUARE'" src/lib/printSizes.ts

echo "# 4"
grep -rn 'setLockAspect' src/

echo "# 6"
grep -n 'STAGE_ASPECT\|offsetWidth\|window\.\|document\.' src/lib/sizeMath.ts

echo "# 7"
grep -rn 'pz-handle' src/components/
grep -n "absolute w-3.5 h-3.5 bg-forest-gold" src/components/VisualizerView.tsx
grep -c 'cursor-nwse-resize\|cursor-nesw-resize\|cursor-ns-resize\|cursor-ew-resize' src/components/VisualizerView.tsx
