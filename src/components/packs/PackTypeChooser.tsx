import React from 'react';
import { Layers, Image as ImageIcon } from 'lucide-react';
import { PACK_RULES, type PackKind } from '../../lib/packBuilder';

interface Props {
  value: PackKind | null;
  onChange: (kind: PackKind) => void;
}

export default function PackTypeChooser({ value, onChange }: Props) {
  const options: Array<{ kind: PackKind; icon: React.ReactNode; blurb: string }> = [
    {
      kind: 'sticker',
      icon: <Layers className="w-7 h-7" />,
      blurb: 'Weatherproof 10 × 10 cm die-cut vinyl. Mix any artworks you like.',
    },
    {
      kind: 'canvas',
      icon: <ImageIcon className="w-7 h-7" />,
      blurb: 'Resin-coated giclée canvases, each at its own catalogue size.',
    },
  ];

  return (
    <div className="pz-pack-chooser">
      {options.map(({ kind, icon, blurb }) => {
        const rule = PACK_RULES[kind];
        const active = value === kind;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onChange(kind)}
            aria-pressed={active}
            className={`pz-pack-chooser__card ${active ? 'is-active' : ''}`}
          >
            <span className="pz-pack-chooser__icon">{icon}</span>
            <span className="pz-pack-chooser__title">{rule.label}</span>
            <span className="pz-pack-chooser__min">from {rule.minimum} pieces</span>
            <span className="pz-pack-chooser__blurb">{blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
