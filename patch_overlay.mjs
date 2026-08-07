import fs from 'fs';

function patchOverlay() {
    let code = fs.readFileSync('src/components/personalization/PersonalizationOverlay.tsx', 'utf8');
    
    // Add uploadedSignatureUrlProp
    code = code.replace(
        '  onMovePlacement?: (layer: \'draw\' | \'text\', patch: Partial<LayerPlacement>) => void;',
        '  onMovePlacement?: (layer: \'draw\' | \'text\', patch: Partial<LayerPlacement>) => void;\n  uploadedSignatureUrlProp?: string;'
    );
    
    code = code.replace(
        '  onMovePlacement,',
        '  onMovePlacement,\n  uploadedSignatureUrlProp,'
    );
    
    const sigStr = `  const currentUploadedSignature = uploadedSignatureUrlProp ?? value?.uploadedSignatureUrl ?? '';`;
    if (!code.includes(sigStr)) {
        code = code.replace(
            '  const drawPlacement = value?.drawPlacement ?? { ...DEFAULT_PLACEMENT };',
            '  const drawPlacement = value?.drawPlacement ?? { ...DEFAULT_PLACEMENT };\n' + sigStr
        );
    }
    
    const imgJsx = `
      {currentUploadedSignature && (
        <img
          src={currentUploadedSignature}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 max-h-[38%] max-w-[58%] object-contain"
          style={{
            left: \`\${drawPlacement.x * 100}%\`,
            top: \`\${drawPlacement.y * 100}%\`,
            transform: \`translate(-50%, -50%) rotate(\${drawPlacement.rotation}deg) scale(\${drawPlacement.scale})\`,
            transformOrigin: 'center',
          }}
        />
      )}`;
      
    if (!code.includes('src={currentUploadedSignature}')) {
        code = code.replace(
            '<canvas ref={canvasRef} className="absolute inset-0" />',
            '<canvas ref={canvasRef} className="absolute inset-0" />' + imgJsx
        );
    }
    fs.writeFileSync('src/components/personalization/PersonalizationOverlay.tsx', code);
}

function patchPreview() {
    let code = fs.readFileSync('src/components/personalization/PersonalizationPreviewLayer.tsx', 'utf8');
    
    code = code.replace(
        'const { strokes, text, drawPlacement, textPlacement } = personalization;',
        'const { strokes, text, drawPlacement, textPlacement, uploadedSignatureUrl } = personalization;'
    );
    
    const imgJsx = `
      {uploadedSignatureUrl && (
        <img
          src={uploadedSignatureUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 max-h-[38%] max-w-[58%] object-contain"
          style={{
            left: \`\${drawPlacement.x * 100}%\`,
            top: \`\${drawPlacement.y * 100}%\`,
            transform: \`translate(-50%, -50%) rotate(\${drawPlacement.rotation}deg) scale(\${drawPlacement.scale})\`,
            transformOrigin: 'center',
          }}
        />
      )}`;
      
    if (!code.includes('src={uploadedSignatureUrl}')) {
        code = code.replace(
            '<canvas ref={canvasRef} className="absolute inset-0" />',
            '<canvas ref={canvasRef} className="absolute inset-0" />' + imgJsx
        );
    }
    fs.writeFileSync('src/components/personalization/PersonalizationPreviewLayer.tsx', code);
}

patchOverlay();
patchPreview();
