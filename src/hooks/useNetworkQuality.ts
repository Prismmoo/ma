import { useEffect, useState } from 'react';

export interface NetworkQuality {
  saveData: boolean;
  slow: boolean;
  /** True when it is reasonable to prefetch multi-megabyte media. */
  allowHeavyMedia: boolean;
}

function read(): NetworkQuality {
  const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : undefined;
  const saveData = Boolean(conn?.saveData);
  const slow = ['slow-2g', '2g', '3g'].includes(conn?.effectiveType ?? '');
  return { saveData, slow, allowHeavyMedia: !saveData && !slow };
}

export function useNetworkQuality(): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>(read);

  useEffect(() => {
    const conn = (navigator as any).connection;
    if (!conn?.addEventListener) return;
    const update = () => setQuality(read());
    conn.addEventListener('change', update);
    return () => conn.removeEventListener('change', update);
  }, []);

  return quality;
}
