import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, RotateCcw, ShoppingBag } from 'lucide-react';
import type { Painting, FramingOption } from '../../types';
import { PAINTINGS } from '../../data';
import { MOBILE_ROOMS } from '../../data/mobileRooms';
import type { Personalization } from '../../lib/personalization';
import { usePersonalizationEntry } from '../../hooks/usePersonalizationEntry';
import { formatMAD } from '../../lib/pricing';

interface Props {
  selectedPainting: Painting | null;
  selectedFrame: FramingOption;
  onBack: () => void;
  onAddToCart: (
    painting: Painting,
    frame: FramingOption,
    personalization?: Personalization,
  ) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type HandleName = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';

type Interaction =
  | null
  | {
      kind: 'move';
      startX: number;
      startY: number;
      originX: number;
      originY: number;
    }
  | {
      kind: 'resize';
      startDistance: number;
      originScale: number;
      centerX: number;
      centerY: number;
    }
  | {
      kind: 'tilt-x';
      handle: 'n' | 's';
      startY: number;
      originTilt: number;
    }
  | {
      kind: 'tilt-y';
      handle: 'e' | 'w';
      startX: number;
      originTilt: number;
    };

export default function MobileVisualizer({
  selectedPainting,
  selectedFrame,
  onBack,
  onAddToCart,
}: Props) {
  const painting = selectedPainting ?? PAINTINGS[0];
  const personalization = usePersonalizationEntry(painting.id);

  const [roomIndex, setRoomIndex] = useState(0);
  const [customWallUrl, setCustomWallUrl] = useState<string | null>(null);
  const [wallFailed, setWallFailed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 34 });
  const [scale, setScale] = useState(1);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [artFailed, setArtFailed] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const interactionRef = useRef<Interaction>(null);
  const pinchRef = useRef<null | { distance: number; scale: number }>(null);

  // Object URL clean up
  useEffect(() => {
    return () => {
      if (customWallUrl) {
        URL.revokeObjectURL(customWallUrl);
      }
    };
  }, [customWallUrl]);

  // Reset art failed state on painting change
  useEffect(() => {
    setArtFailed(false);
  }, [painting.id]);

  const cycleRoom = () => {
    setCustomWallUrl(null);
    setWallFailed(false);
    setRoomIndex((value) => {
      const next = (value + 1) % MOBILE_ROOMS.length;
      setPosition(MOBILE_ROOMS[next].defaultPosition);
      setScale(1);
      setTiltX(0);
      setTiltY(0);
      return next;
    });
  };

  const handleWallUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const nextUrl = URL.createObjectURL(file);
    setCustomWallUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });
    setWallFailed(false);
  };

  const reset = () => {
    const activeRoom = MOBILE_ROOMS[roomIndex];
    setPosition(activeRoom.defaultPosition);
    setScale(1);
    setTiltX(0);
    setTiltY(0);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const handle = (e.target as HTMLElement)
      .closest<HTMLElement>('[data-vz-handle]')
      ?.dataset.vzHandle as HandleName | undefined;

    if (pointersRef.current.size === 1) {
      if (handle === 'nw' || handle === 'ne' || handle === 'se' || handle === 'sw') {
        const rect = stageRef.current!.getBoundingClientRect();
        const centerX = rect.left + (position.x / 100) * rect.width;
        const centerY = rect.top + (position.y / 100) * rect.height;
        interactionRef.current = {
          kind: 'resize',
          startDistance: Math.max(1, Math.hypot(e.clientX - centerX, e.clientY - centerY)),
          originScale: scale,
          centerX,
          centerY,
        };
      } else if (handle === 'n' || handle === 's') {
        interactionRef.current = {
          kind: 'tilt-x',
          handle,
          startY: e.clientY,
          originTilt: tiltX,
        };
      } else if (handle === 'e' || handle === 'w') {
        interactionRef.current = {
          kind: 'tilt-y',
          handle,
          startX: e.clientX,
          originTilt: tiltY,
        };
      } else {
        interactionRef.current = {
          kind: 'move',
          startX: e.clientX,
          startY: e.clientY,
          originX: position.x,
          originY: position.y,
        };
      }
    } else if (pointersRef.current.size === 2) {
      interactionRef.current = null;
      const pts = Array.from(pointersRef.current.values()) as { x: number; y: number }[];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = { distance: dist, scale };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1 && interactionRef.current) {
      const interaction = interactionRef.current;
      if (interaction.kind === 'move') {
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = e.clientX - interaction.startX;
        const dy = e.clientY - interaction.startY;

        const pxPct = (dx / rect.width) * 100;
        const pyPct = (dy / rect.height) * 100;

        setPosition({
          x: clamp(interaction.originX + pxPct, 10, 90),
          y: clamp(interaction.originY + pyPct, 12, 78),
        });
      } else if (interaction.kind === 'resize') {
        const distance = Math.hypot(
          e.clientX - interaction.centerX,
          e.clientY - interaction.centerY,
        );
        setScale(clamp(interaction.originScale * (distance / interaction.startDistance), 0.55, 2.2));
      } else if (interaction.kind === 'tilt-x') {
        const direction = interaction.handle === 'n' ? -1 : 1;
        const delta = (e.clientY - interaction.startY) * direction;
        setTiltX(clamp(interaction.originTilt + delta * 0.22, -32, 32));
      } else if (interaction.kind === 'tilt-y') {
        const direction = interaction.handle === 'w' ? -1 : 1;
        const delta = (e.clientX - interaction.startX) * direction;
        setTiltY(clamp(interaction.originTilt + delta * 0.22, -32, 32));
      }
    } else if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values()) as { x: number; y: number }[];
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const nextScale = pinchRef.current.scale * (currentDist / pinchRef.current.distance);
      setScale(clamp(nextScale, 0.55, 2.2));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size === 0) {
      interactionRef.current = null;
      pinchRef.current = null;
    } else if (pointersRef.current.size === 1) {
      pinchRef.current = null;
      const activeId = Array.from(pointersRef.current.keys())[0];
      const activePt = pointersRef.current.get(activeId)!;
      interactionRef.current = {
        kind: 'move',
        startX: activePt.x,
        startY: activePt.y,
        originX: position.x,
        originY: position.y,
      };
    }
  };

  const activeRoom = MOBILE_ROOMS[roomIndex];
  const wallUrl = customWallUrl ?? activeRoom.imageUrl;

  const ratio = painting.widthCm / painting.heightCm;
  const baseWidth = ratio >= 1 ? 42 : 31;

  return (
    <section className="pz-mv" aria-label="View artwork in room">
      <header className="pz-mv-header">
        <button className="pz-mv-icon-button" onClick={onBack} aria-label="Back to gallery">
          <ArrowLeft size={20} />
        </button>
        <div className="pz-mv-heading">
          <strong>View in Room</strong>
          <span>{painting.title}</span>
        </div>
        <div className="w-[44px]" />
      </header>

      <div
        ref={stageRef}
        className="pz-mv-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <div className="pz-mv-wall-fallback" aria-hidden="true">
          <div className="pz-mv-wall-line" />
          <div className="pz-mv-floor" />
        </div>

        {!wallFailed && (
          <img
            key={wallUrl}
            src={wallUrl}
            alt="Room wall"
            className="pz-mv-wall-image"
            draggable={false}
            referrerPolicy="no-referrer"
            onLoad={() => setWallFailed(false)}
            onError={() => setWallFailed(true)}
          />
        )}

        <div
          className="pz-mv-art"
          style={{
            width: `${baseWidth}%`,
            aspectRatio: `${painting.widthCm} / ${painting.heightCm}`,
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: [
              'translate(-50%, -50%)',
              'perspective(900px)',
              `rotateX(${tiltX}deg)`,
              `rotateY(${tiltY}deg)`,
              `scale(${scale})`,
            ].join(' '),
            transformStyle: 'preserve-3d',
          }}
        >
          {artFailed ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white bg-black/50 select-none">
              Artwork unavailable
            </div>
          ) : (
            <img
              src={painting.imageUrl}
              alt={painting.title}
              draggable={false}
              onError={() => setArtFailed(true)}
            />
          )}

          <div className="pz-mv-handles" aria-hidden="true">
            {(['nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'] as const).map((handle) => (
              <span
                key={handle}
                data-vz-handle={handle}
                className={`pz-mv-handle pz-mv-handle--${handle}`}
              />
            ))}
          </div>
        </div>

        <div className="pz-mv-hint">Drag artwork · Corners resize · Sides tilt</div>
      </div>

      <footer className="pz-mv-dock">
        <div className="pz-mv-tools">
          <label className="pz-mv-secondary-button relative cursor-pointer">
            <ImagePlus size={17} /> Change Wall
            <input type="file" accept="image/*" hidden onChange={handleWallUpload} />
          </label>
          <button
            className="pz-mv-secondary-button"
            onClick={cycleRoom}
            title={`Current room: ${activeRoom.name}`}
          >
            Next Room
          </button>
          <button className="pz-mv-icon-button" onClick={reset} aria-label="Reset">
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="pz-mv-buy-row">
          <div className="pz-mv-price">
            <span>{painting.widthCm} × {painting.heightCm} cm</span>
            <strong>{formatMAD(painting.price + selectedFrame.price)}</strong>
          </div>
          <button
            className="pz-mv-buy-button"
            onClick={() => onAddToCart(painting, selectedFrame, personalization || undefined)}
          >
            <ShoppingBag size={18} /> Add to Cart
          </button>
        </div>
      </footer>
    </section>
  );
}
