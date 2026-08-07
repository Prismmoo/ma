import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Crumb { key: string; label: string; onClick?: () => void; }

export default function PackBrowserCrumbs({
  crumbs,
  onBack,
}: {
  crumbs: Crumb[];
  onBack: (() => void) | null;
}) {
  return (
    <nav className="pz-crumbs" aria-label="Pack browser location">
      {onBack && (
        <button type="button" className="pz-crumbs__back pz-back-btn" onClick={onBack} aria-label="Go back">
          <ChevronLeft className="pz-back-btn__icon w-[18px] h-[18px]" aria-hidden="true" />
        </button>
      )}
      <ol>
        {crumbs.map((crumb, index) => (
          <li key={crumb.key}>
            {index > 0 && <ChevronRight className="w-3 h-3 opacity-40" aria-hidden="true" />}
            {crumb.onClick ? (
              <button type="button" onClick={crumb.onClick}>{crumb.label}</button>
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
