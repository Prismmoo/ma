import React, { memo } from 'react';

interface CubeLoaderProps {
  /** Announced to screen readers while the cube spins. */
  label?: string;
  className?: string;
}

/*
 * 3D cube loader. Adapted from Uiverse.io by wolf_3808.
 *
 * The six faces are siblings inside a preserve-3d parent; each is rotated onto
 * its own plane and pushed out by exactly half the cube size. Only `transform`
 * is animated, so the whole thing is composited on the GPU and does not steal
 * frames from the order upload it is reporting on.
 *
 * All styling lives in src/index.css under the pz-cube namespace.
 */
function CubeLoaderBase({ label = 'Loading', className = '' }: CubeLoaderProps) {
  return (
    <div
      className={`pz-cube ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="pz-cube__box" aria-hidden="true">
        <div className="pz-cube__inner">
          <div className="pz-cube__face pz-cube__face--front" />
          <div className="pz-cube__face pz-cube__face--back" />
          <div className="pz-cube__face pz-cube__face--right" />
          <div className="pz-cube__face pz-cube__face--left" />
          <div className="pz-cube__face pz-cube__face--top" />
          <div className="pz-cube__face pz-cube__face--bottom" />
        </div>
      </div>
    </div>
  );
}

const CubeLoader = memo(CubeLoaderBase);
export default CubeLoader;
