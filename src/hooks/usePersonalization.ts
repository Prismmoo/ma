import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Personalization,
  PersonalizationMode,
  Stroke,
  TextConfig,
  LayerPlacement,
  emptyPersonalization,
  personalizationPrice,
  isPersonalized,
  exportStrokesPng,
} from '../lib/personalization';
import {
  getPersonalization,
  setPersonalization,
  removePersonalization,
} from '../lib/personalizationStore';

export interface UsePersonalizationApi {
  value: Personalization;
  mode: PersonalizationMode;
  setMode: (m: PersonalizationMode) => void;
  setStrokes: (s: Stroke[]) => void;
  setUploadedSignatureUrl: (url: string) => void;
  patchText: (patch: Partial<TextConfig>) => void;
  patchPlacement: (layer: 'draw' | 'text', patch: Partial<LayerPlacement>) => void;
  applySnapshot: (s: {
    strokes: Stroke[];
    text: TextConfig;
    drawPlacement: LayerPlacement;
    textPlacement: LayerPlacement;
    uploadedSignatureUrl?: string;
  }) => void;
  reset: () => void;
  price: number;
  personalized: boolean;
  commit: (aspect: number) => Personalization;
}

export function usePersonalization(
  paintingId: string | null,
  active: boolean,
): UsePersonalizationApi {
  const [value, setValue] = useState<Personalization>(() => emptyPersonalization());

  /* التحميل: من المخزن لا من localStorage مباشرة. */
  useEffect(() => {
    if (!paintingId || !active) return;
    setValue(getPersonalization(paintingId) ?? emptyPersonalization());
  }, [paintingId, active]);

  const setMode = useCallback((mode: PersonalizationMode) => {
    setValue((v) => ({ ...v, mode, updatedAt: Date.now() }));
  }, []);

  const setStrokes = useCallback((strokes: Stroke[]) => {
    setValue((v) => ({ ...v, strokes, updatedAt: Date.now() }));
  }, []);

  const setUploadedSignatureUrl = useCallback((url: string) => {
    setValue((v) => ({ ...v, uploadedSignatureUrl: url, updatedAt: Date.now() }));
  }, []);

  const patchText = useCallback((patch: Partial<TextConfig>) => {
    setValue((v) => ({ ...v, text: { ...v.text, ...patch }, updatedAt: Date.now() }));
  }, []);

  const patchPlacement = useCallback(
    (layer: 'draw' | 'text', patch: Partial<LayerPlacement>) => {
      setValue((v) =>
        layer === 'draw'
          ? { ...v, drawPlacement: { ...v.drawPlacement, ...patch }, updatedAt: Date.now() }
          : { ...v, textPlacement: { ...v.textPlacement, ...patch }, updatedAt: Date.now() },
      );
    },
    [],
  );

  /** إعادة تطبيق لقطة كاملة دفعة واحدة (تراجع / إعادة).
   *  تحديث واحد ⇒ رندر واحد ⇒ لا وميض في المعاينة. */
  const applySnapshot = useCallback(
    (s: {
      strokes: Stroke[];
      text: TextConfig;
      drawPlacement: LayerPlacement;
      textPlacement: LayerPlacement;
      uploadedSignatureUrl?: string;
    }) => {
      setValue((v) => ({
        ...v,
        strokes: s.strokes,
        text: s.text,
        drawPlacement: s.drawPlacement,
        textPlacement: s.textPlacement,
        uploadedSignatureUrl: s.uploadedSignatureUrl,
        updatedAt: Date.now(),
      }));
    },
    [],
  );

  const reset = useCallback(() => {
    setValue(emptyPersonalization());
    if (paintingId) removePersonalization(paintingId);
  }, [paintingId]);

  const price = useMemo(() => personalizationPrice(value), [value]);
  const personalized = useMemo(() => isPersonalized(value), [value]);

  const commit = useCallback(
    (aspect: number): Personalization => {
      const previewDataUrl = value.uploadedSignatureUrl || exportStrokesPng(value.strokes, 1200, aspect) || undefined;
      const committed: Personalization = { ...value, previewDataUrl, updatedAt: Date.now() };
      setValue(committed);
      /* البثّ الوحيد للتطبيق كله.
         بعد هذا السطر يعرف المودال والحائط والسلة في نفس الإطار. */
      if (paintingId) setPersonalization(paintingId, committed);
      return committed;
    },
    [value, paintingId],
  );

  return {
    value,
    mode: value.mode,
    setMode,
    setStrokes,
    setUploadedSignatureUrl,
    patchText,
    patchPlacement,
    applySnapshot,
    reset,
    price,
    personalized,
    commit,
  };
}
