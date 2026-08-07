const fs = require('fs');
let code = fs.readFileSync('src/hooks/useGalleryFilters.ts', 'utf8');

code = code.replace(
  "const [selectedSizes,\n    selectedAspectRatio,\n    setSelectedAspectRatio,\n    selectedResolution,\n    setSelectedResolution,\n    mobileColumns,\n    setMobileColumns,                         setSelectedSizes] = useState<SizeCategory[]>([]);",
  "const [selectedSizes, setSelectedSizes] = useState<SizeCategory[]>([]);\n  const [selectedAspectRatio, setSelectedAspectRatio] = useRemembered<string | null>(key('aspect'), null);\n  const [selectedResolution, setSelectedResolution] = useRemembered<string | null>(key('res'), 'HD');\n  const [mobileColumns, setMobileColumns] = useState<number>(() => {\n    const saved = typeof window !== 'undefined' ? localStorage.getItem('gallery.mobileColumns') : null;\n    return saved ? parseInt(saved, 10) : 2;\n  });\n  useEffect(() => {\n    if (typeof window !== 'undefined') localStorage.setItem('gallery.mobileColumns', mobileColumns.toString());\n  }, [mobileColumns]);"
);

// Remove the duplicates generated inside useMemo
code = code.replace(
  /const \[selectedSizes,\n.*?\] = useState<SizeCategory\[\]>\(\[\]\);\s*const \[selectedPalette, setSelectedPalette\] = useState<string \| null>\(null\);/s,
  "const [selectedSizes, setSelectedSizes] = useState<SizeCategory[]>([]);\n  const [selectedAspectRatio, setSelectedAspectRatio] = useRemembered<string | null>(key('aspect'), null);\n  const [selectedResolution, setSelectedResolution] = useRemembered<string | null>(key('res'), 'HD');\n  const [mobileColumns, setMobileColumns] = useState<number>(() => {\n    const saved = typeof window !== 'undefined' ? localStorage.getItem('gallery.mobileColumns') : null;\n    return saved ? parseInt(saved, 10) : 2;\n  });\n  useEffect(() => {\n    if (typeof window !== 'undefined') localStorage.setItem('gallery.mobileColumns', mobileColumns.toString());\n  }, [mobileColumns]);\n  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);"
);

// Actually, let's just rewrite the whole file from scratch using a known good state or carefully fix it.
