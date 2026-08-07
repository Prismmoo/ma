import { useCallback, useRef, useState } from 'react';
import { Stroke, TextConfig, LayerPlacement } from '../lib/personalization';

/** لقطة كاملة للعمل الفني في لحظة ما. */
export interface StudioSnapshot {
  strokes: Stroke[];
  text: TextConfig;
  drawPlacement: LayerPlacement;
  textPlacement: LayerPlacement;
  uploadedSignatureUrl?: string;
}

/**
 * وسم الإجراء — يُستعمل لأمرين:
 * 1) دمج التغييرات المتلاحقة من نفس النوع (سحب منزلق = خطوة واحدة لا خمسين).
 * 2) إظهار اسم الإجراء للزبون في إشعار التراجع.
 */
export type HistoryLabel =
  | 'stroke' | 'erase' | 'clear' | 'upload'
  | 'text' | 'font' | 'color' | 'size' | 'tilt' | 'move' | 'init';

export const HISTORY_LABEL_TEXT: Record<HistoryLabel, string> = {
  stroke: 'Stroke',
  erase: 'Erase',
  clear: 'Clear all',
  upload: 'Upload signature',
  text: 'Text',
  font: 'Font',
  color: 'Ink colour',
  size: 'Size',
  tilt: 'Tilt',
  move: 'Position',
  init: 'Change',
};

const HISTORY_LIMIT = 60;

/** نافذة دمج التغييرات المتشابهة — 550ms معيار مريح للمنزلقات وحقول النص. */
const COALESCE_MS = 550;

/** إجراءات ذرّية لا تُدمج أبدًا: كل واحدة خطوة تراجع مستقلة. */
const ATOMIC: ReadonlySet<HistoryLabel> = new Set<HistoryLabel>(['stroke', 'erase', 'clear', 'upload', 'font', 'color']);

export interface StudioHistoryApi {
  push: (next: StudioSnapshot, label: HistoryLabel) => void;
  undo: () => { snapshot: StudioSnapshot; label: HistoryLabel } | null;
  redo: () => { snapshot: StudioSnapshot; label: HistoryLabel } | null;
  reset: (snapshot: StudioSnapshot) => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * سجل تراجع/إعادة موحّد للاستوديو بأكمله.
 *
 * لماذا useRef + عدّاد إجبار وليس useState للمكدّسات؟
 * لأن push() يُستدعى من داخل معالجات أحداث متتابعة بسرعة (onChange للقلم).
 * مع useState كنت ستقرأ قيمًا قديمة داخل إغلاقات قديمة ⇒ فقدان خطوات.
 * المراجع دائمًا محدّثة، والعدّاد يُعلِم الواجهة فقط لتحديث حالة تعطيل الأزرار.
 */
export function useStudioHistory(): StudioHistoryApi {
  const pastRef = useRef<Array<{ snapshot: StudioSnapshot; label: HistoryLabel }>>([]);
  const futureRef = useRef<Array<{ snapshot: StudioSnapshot; label: HistoryLabel }>>([]);
  const presentRef = useRef<{ snapshot: StudioSnapshot; label: HistoryLabel } | null>(null);
  const lastRef = useRef<{ label: HistoryLabel; at: number }>({ label: 'init', at: 0 });

  const [, tick] = useState(0);
  const bump = useCallback(() => tick((n) => n + 1), []);

  const reset = useCallback(
    (snapshot: StudioSnapshot) => {
      pastRef.current = [];
      futureRef.current = [];
      presentRef.current = { snapshot, label: 'init' };
      lastRef.current = { label: 'init', at: 0 };
      bump();
    },
    [bump],
  );

  const push = useCallback(
    (next: StudioSnapshot, label: HistoryLabel) => {
      const now = Date.now();
      const present = presentRef.current;

      if (present) {
        const sameKind = label === lastRef.current.label;
        const inWindow = now - lastRef.current.at < COALESCE_MS;
        const coalesce = sameKind && inWindow && !ATOMIC.has(label);

        if (!coalesce) {
          pastRef.current.push(present);
          if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
          futureRef.current = [];
        }
      }

      presentRef.current = { snapshot: next, label };
      lastRef.current = { label, at: now };
      bump();
    },
    [bump],
  );

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev || !presentRef.current) return null;

    futureRef.current.push(presentRef.current);
    const undoneLabel = presentRef.current.label; // ما الذي تراجعنا عنه فعلًا
    presentRef.current = prev;
    lastRef.current = { label: 'init', at: 0 }; // يمنع دمج خطوة جديدة مع ما قبل التراجع
    bump();

    return { snapshot: prev.snapshot, label: undoneLabel };
  }, [bump]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next || !presentRef.current) return null;

    pastRef.current.push(presentRef.current);
    presentRef.current = next;
    lastRef.current = { label: 'init', at: 0 };
    bump();

    return { snapshot: next.snapshot, label: next.label };
  }, [bump]);

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
