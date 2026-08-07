import { useCallback, useSyncExternalStore } from 'react';
import { Personalization } from '../lib/personalization';
import { getPersonalization, subscribePersonalization } from '../lib/personalizationStore';

const NOOP_UNSUBSCRIBE = () => undefined;

/**
 * اشتراك للقراءة فقط في تخصيص لوحة واحدة.
 * أي مكوّن يستدعيه يُعاد رندره فورًا عند حفظ الاستوديو — بلا props drilling.
 *
 * ⚠️ getSnapshot يجب أن يرجّع **نفس المرجع** ما لم تتغير البيانات.
 * المخزن يخزّن الكائن ذاته في Map، ويرجّع undefined المفردة عند الغياب ⇒ مستقر.
 * إرجاع كائن جديد هنا يوقع React في حلقة رندر لا نهائية.
 */
export function usePersonalizationEntry(
  paintingId: string | null | undefined,
): Personalization | undefined {
  const subscribe = useCallback(
    (onChange: () => void) =>
      paintingId ? subscribePersonalization(paintingId, onChange) : NOOP_UNSUBSCRIBE,
    [paintingId],
  );

  const getSnapshot = useCallback(
    () => (paintingId ? getPersonalization(paintingId) : undefined),
    [paintingId],
  );

  /* الوسيط الثالث getServerSnapshot: تأمين مستقبلي لو فُعّل SSR. */
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}
