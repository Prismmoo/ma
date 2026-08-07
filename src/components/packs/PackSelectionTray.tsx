import React from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { formatMAD } from '../../lib/pricing';
import { gateMessage, type PackEntry, type PackKind, type PackTotals } from '../../lib/packBuilder';

interface Props {
  kind: PackKind;
  entries: PackEntry[];
  totals: PackTotals;
  onRemove: (paintingId: string) => void;
  onClear: () => void;
  onOrder: () => void;
}

export default function PackSelectionTray({
  kind,
  entries,
  totals,
  onRemove,
  onClear,
  onOrder,
}: Props) {
  const percent = Math.min(100, Math.round((totals.count / Math.max(1, totals.count + totals.remainingToMinimum)) * 100));

  return (
    <div className="pz-tray" role="region" aria-label="Pack selection">
      <div className="pz-tray__progress" aria-hidden="true">
        <span style={{ width: `${totals.meetsMinimum ? 100 : percent}%` }} />
      </div>

      <div className="pz-tray__chips">
        {entries.map((entry) => (
          <button
            key={entry.painting.id}
            type="button"
            className="pz-tray__chip"
            onClick={() => onRemove(entry.painting.id)}
            aria-label={`Remove ${entry.painting.title}`}
          >
            <img src={entry.painting.imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            {entry.quantity > 1 && <b>{entry.quantity}</b>}
            <X className="w-2.5 h-2.5" />
          </button>
        ))}
        {entries.length === 0 && <span className="pz-tray__hint">Nothing chosen yet</span>}
      </div>

      <div className="pz-tray__totals">
        <span className="pz-tray__count">
          {totals.count} chosen
        </span>
        {totals.discount > 0 && (
          <>
            <s className="pz-tray__was">{formatMAD(totals.subtotal)}</s>
            <span className="pz-tray__save">−{totals.tier?.label}</span>
          </>
        )}
        <strong className="pz-tray__now">{formatMAD(totals.total)}</strong>
      </div>

      <div className="pz-tray__actions">
        {entries.length > 0 && (
          <button type="button" className="pz-tray__clear" onClick={onClear}>Clear</button>
        )}
        <button
          type="button"
          className="pz-tray__order"
          onClick={onOrder}
          disabled={!totals.meetsMinimum}
        >
          <ShoppingBag className="w-4 h-4" />
          {totals.meetsMinimum ? 'Add pack to cart' : `Add ${totals.remainingToMinimum} more`}
        </button>
      </div>

      <p className="pz-tray__gate" aria-live="polite">{gateMessage(kind, totals)}</p>
    </div>
  );
}
