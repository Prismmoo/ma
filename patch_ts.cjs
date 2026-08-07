const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGalleryFilters.ts', 'utf8');

// I will just use regex to remove multiple declarations.
// First remove all my additions.
code = code.replace(/const \[selectedAspectRatio.*?\] = useRemembered<string \| null>\(key\('aspect'\), null\);\n/g, '');
code = code.replace(/const \[selectedResolution.*?\] = useRemembered<string \| null>\(key\('res'\), 'HD'\);\n/g, '');
code = code.replace(/const \[mobileColumns.*?\] = useState<number>\(\(\) => \{[\s\S]*?\}\);\n/g, '');
code = code.replace(/useEffect\(\(\) => \{\n\s*localStorage.setItem\('gallery.mobileColumns', mobileColumns.toString\(\)\);\n\s*\}, \[mobileColumns\]\);\n/g, '');

code = code.replace(/setSelectedAspectRatio\(null\);\n/g, '');
code = code.replace(/setSelectedResolution\('HD'\);\n/g, '');

code = code.replace(/selectedAspectRatio,\n/g, '');
code = code.replace(/setSelectedAspectRatio,\n/g, '');
code = code.replace(/selectedResolution,\n/g, '');
code = code.replace(/setSelectedResolution,\n/g, '');
code = code.replace(/mobileColumns,\n/g, '');
code = code.replace(/setMobileColumns,\n/g, '');

const stateAdds = `
  const [selectedAspectRatio, setSelectedAspectRatio] = useRemembered<string | null>(key('aspect'), null);
  const [selectedResolution, setSelectedResolution] = useRemembered<string | null>(key('res'), 'HD');
  const [mobileColumns, setMobileColumns] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('gallery.mobileColumns') : null;
    return saved ? parseInt(saved, 10) : 2;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('gallery.mobileColumns', mobileColumns.toString());
  }, [mobileColumns]);
`;

code = code.replace(
  "const [selectedSizes, setSelectedSizes] = useState<SizeCategory[]>([]);",
  `const [selectedSizes, setSelectedSizes] = useState<SizeCategory[]>([]);${stateAdds}`
);

const resetAdds = `
    setSelectedAspectRatio(null);
    setSelectedResolution('HD');
`;
code = code.replace(
  "setSelectedSizes([]);",
  `setSelectedSizes([]);${resetAdds}`
);

const exportAdds = `
    selectedAspectRatio,
    setSelectedAspectRatio,
    selectedResolution,
    setSelectedResolution,
    mobileColumns,
    setMobileColumns,
`;
code = code.replace(
  "selectedSizes,",
  `selectedSizes,\n${exportAdds}`
);

fs.writeFileSync('src/hooks/useGalleryFilters.ts', code);
