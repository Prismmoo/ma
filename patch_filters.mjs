import fs from 'fs';

let content = fs.readFileSync('src/hooks/useGalleryFilters.ts', 'utf8');

// Insert new states
const stateAdds = `
  const [selectedAspectRatio, setSelectedAspectRatio] = useRemembered<string | null>(key('aspect'), null);
  const [selectedResolution, setSelectedResolution] = useRemembered<string | null>(key('res'), 'HD');
  const [mobileColumns, setMobileColumns] = useState<number>(() => {
    const saved = localStorage.getItem('gallery.mobileColumns');
    return saved ? parseInt(saved, 10) : 2;
  });

  useEffect(() => {
    localStorage.setItem('gallery.mobileColumns', mobileColumns.toString());
  }, [mobileColumns]);
`;

content = content.replace(
  "const [selectedSizes, setSelectedSizes] = useState<SizeCategory[]>([]);",
  `const [selectedSizes, setSelectedSizes] = useState<SizeCategory[]>([]);${stateAdds}`
);

// Reset adds
const resetAdds = `
    setSelectedAspectRatio(null);
    setSelectedResolution('HD');
`;
content = content.replace(
  "setSelectedSizes([]);",
  `setSelectedSizes([]);${resetAdds}`
);

// Export adds
const exportAdds = `
    selectedAspectRatio,
    setSelectedAspectRatio,
    selectedResolution,
    setSelectedResolution,
    mobileColumns,
    setMobileColumns,
`;
content = content.replace(
  "selectedSizes,",
  `selectedSizes,\n${exportAdds}`
);

fs.writeFileSync('src/hooks/useGalleryFilters.ts', content);
