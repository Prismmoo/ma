import React from 'react';
import CoverImage from '../CoverImage';

export default function PackShelfCard({
  label,
  count,
  coverCandidates,
  onOpen,
}: {
  key?: React.Key;
  label: string;
  count: number;
  coverCandidates: Array<string | null | undefined>;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="pz-shelf" onClick={onOpen}>
      <div className="pz-shelf__frame">
        <CoverImage
          candidates={coverCandidates}
          alt={label}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="pz-shelf__label">{label}</span>
      <span className="pz-shelf__count">{count} pieces</span>
    </button>
  );
}
