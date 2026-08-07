import React, { useEffect, useRef } from 'react';
import {
  Personalization,
  fontById,
  fontFamilyCss,
  renderStrokes,
} from '../../lib/personalization';

interface PersonalizationPreviewLayerProps {
  personalization: Personalization;
  /** أقصى عرض منطقي للنص داخل اللوحة */
  maxTextWidth?: string;
  className?: string;
}

/**
 * طبقة للقراءة فقط ترسم التوقيع + النص فوق أي صورة.
 *
 * لماذا مكوّن منفصل وليس PersonalizationOverlay بـ interactive={false}؟
 * لأن PersonalizationOverlay يفرض aspectRatio و`w-full` و`rounded-xl bg-ui-surface-alt`
 * (الأسطر 143–146 من ملفه)، وهذا يرسم مستطيلًا رماديًا فوق الجدار
 * في VisualizerView. هنا نحتاج inset-0 شفافًا تمامًا.
 *
 * ⚠️ الحاوي الأب يجب أن يحمل `relative` و`containerType: 'inline-size'`.
 */
export const PersonalizationPreviewLayer: React.FC<PersonalizationPreviewLayerProps> = ({
  personalization,
  maxTextWidth = '86%',
  className = '',
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { strokes, text, drawPlacement, textPlacement, uploadedSignatureUrl } = personalization;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    /* قياس مستمر: اللوحة في VisualizerView تتغير أبعادها مع كل سحب وتكبير،
       فلا يكفي قياس واحد عند التركيب. */
    const draw = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (strokes.length === 0) return;

      /* نفس منطق التحويل المستعمل في PersonalizationOverlay الأسطر 81–87 —
         التطابق إلزامي وإلا قفز التوقيع بين الاستوديو والحائط. */
      ctx.save();
      ctx.translate(drawPlacement.x * w, drawPlacement.y * h);
      ctx.rotate((drawPlacement.rotation * Math.PI) / 180);
      ctx.scale(drawPlacement.scale, drawPlacement.scale);
      ctx.translate(-w / 2, -h / 2);
      renderStrokes(ctx, strokes, w, h);
      ctx.restore();
    };

    draw();

    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [strokes, drawPlacement]);

  const font = fontById(text.fontId);
  const showText = text.value.trim().length > 0;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {uploadedSignatureUrl && (
        <img
          src={uploadedSignatureUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 max-h-[38%] max-w-[58%] object-contain"
          style={{
            left: `${drawPlacement.x * 100}%`,
            top: `${drawPlacement.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${drawPlacement.rotation}deg) scale(${drawPlacement.scale})`,
            transformOrigin: 'center',
          }}
        />
      )}

      {showText && (
        <span
          className="absolute whitespace-pre-wrap select-none"
          style={{
            left: `${textPlacement.x * 100}%`,
            top: `${textPlacement.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${textPlacement.rotation + text.rotation}deg) scale(${textPlacement.scale})`,
            fontSize: `${text.sizeRatio * 100}cqw`,
            fontFamily: fontFamilyCss(font),
            fontWeight: font.weight ?? 400,
            color: text.color,
            letterSpacing: `${text.letterSpacing}em`,
            textAlign: text.align,
            textShadow: text.shadow ? '0 1px 6px rgba(0,0,0,0.35)' : 'none',
            lineHeight: 1.1,
            maxWidth: maxTextWidth,
          }}
        >
          {text.value}
        </span>
      )}
    </div>
  );
};

export default PersonalizationPreviewLayer;
