import type React from 'react';
import { useState, useRef, useCallback } from 'react';

export type Transform = {
  x: number;
  y: number;
  scale: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  flipH: boolean;
  flipV: boolean;
};

export type CustomSize = { widthCm: number; heightCm: number } | null;

export type Snapshot = {
  transform: Transform;
  sizeId: string | null;
  customSize: CustomSize;
};

const HISTORY_LIMIT = 30;

export function useVisualizerHistory(
  transform: Transform,
  sizeId: string | null,
  customSize: CustomSize,
  setTransform: React.Dispatch<React.SetStateAction<Transform>>,
  setSizeId: React.Dispatch<React.SetStateAction<string | null>>,
  setCustomSize: React.Dispatch<React.SetStateAction<CustomSize>>
) {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [, setHistoryTick] = useState(0);

  const snapshot = useCallback(
    (): Snapshot => ({ transform, sizeId, customSize }),
    [transform, sizeId, customSize]
  );

  const commit = useCallback(() => {
    past.current = [...past.current, snapshot()].slice(-HISTORY_LIMIT);
    future.current = [];
    setHistoryTick(n => n + 1);
  }, [snapshot]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current = [snapshot(), ...future.current].slice(0, HISTORY_LIMIT);
    setTransform(prev.transform);
    setSizeId(prev.sizeId);
    setCustomSize(prev.customSize);
    setHistoryTick(n => n + 1);
  }, [snapshot, setTransform, setSizeId, setCustomSize]);

  const redo = useCallback(() => {
    const next = future.current.shift();
    if (!next) return;
    past.current = [...past.current, snapshot()].slice(-HISTORY_LIMIT);
    setTransform(next.transform);
    setSizeId(next.sizeId);
    setCustomSize(next.customSize);
    setHistoryTick(n => n + 1);
  }, [snapshot, setTransform, setSizeId, setCustomSize]);

  return {
    commit,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
