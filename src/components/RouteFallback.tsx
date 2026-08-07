import React from 'react';

/**
 * Shown while a route chunk is downloading.
 * Deliberately minimal: it must never cause a layout shift, so it reserves
 * viewport-sized space and uses only existing theme tokens.
 */
export default function RouteFallback({ label }: { label?: string }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, []);
  
  if (!visible) return <div className="pz-route-hold" aria-busy="true" />;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] w-full items-center justify-center px-6"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="pz-route-spinner" aria-hidden="true" />
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-forest-cream/50">
          {label ?? 'Loading'}
        </span>
      </div>
    </div>
  );
}
