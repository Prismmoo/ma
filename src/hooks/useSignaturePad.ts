import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stroke, StrokePoint, renderStrokes } from '../lib/personalization';

export interface SignaturePadOptions {
  color: string;
  size: number;
  erasing: boolean;
  aspect: number;
  onChange?: (strokes: Stroke[]) => void;
}

export interface SignaturePadApi {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  strokes: Stroke[];
  isDrawing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isEmpty: boolean;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setStrokes: (next: Stroke[]) => void;
  handlers: {
    onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  };
}

const VELOCITY_FILTER_WEIGHT = 0.7;
const MIN_PRESSURE = 0.32;
const MAX_PRESSURE = 1.0;
const MIN_DISTANCE = 0.008;
const HISTORY_LIMIT = 50;

export function useSignaturePad(options: SignaturePadOptions): SignaturePadApi {
  const { color, size, erasing, aspect, onChange } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [strokes, setStrokesState] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const currentRef = useRef<Stroke | null>(null);
  const lastVelocityRef = useRef(0);
  const lastPointRef = useRef<StrokePoint | null>(null);
  const rafRef = useRef<number | null>(null);
  const dprRef = useRef(1);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;

    const cssWidth = container.clientWidth;
    const cssHeight = Math.round(cssWidth / aspect);

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderStrokes(ctx, strokes, cssWidth, cssHeight);
    }
  }, [aspect, strokes]);

  useEffect(() => {
    resizeCanvas();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(container);
    return () => ro.disconnect();
  }, [resizeCanvas]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = dprRef.current;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    const live = currentRef.current;
    renderStrokes(ctx, live ? [...strokes, live] : strokes, w, h);
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const scheduleRedraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      redraw();
    });
  }, [redraw]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const derivePressure = useCallback((e: React.PointerEvent, point: StrokePoint): number => {
    if (e.pointerType === 'pen' && e.pressure > 0 && e.pressure !== 0.5) {
      return MIN_PRESSURE + e.pressure * (MAX_PRESSURE - MIN_PRESSURE);
    }

    const last = lastPointRef.current;
    if (!last) return 0.7;

    const dt = Math.max(1, point.t - last.t);
    const dist = Math.hypot(point.x - last.x, point.y - last.y);
    const rawVelocity = (dist / dt) * 1000;

    const velocity =
      VELOCITY_FILTER_WEIGHT * rawVelocity +
      (1 - VELOCITY_FILTER_WEIGHT) * lastVelocityRef.current;
    lastVelocityRef.current = velocity;

    const normalized = Math.min(1, velocity / 3);
    return MAX_PRESSURE - normalized * (MAX_PRESSURE - MIN_PRESSURE);
  }, []);

  const toLocal = useCallback((e: React.PointerEvent<HTMLCanvasElement>): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      p: 0.7,
      t: e.timeStamp,
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      const point = toLocal(e);
      if (!point) return;

      lastVelocityRef.current = 0;
      lastPointRef.current = null;
      point.p = derivePressure(e, point);
      lastPointRef.current = point;

      currentRef.current = {
        points: [point],
        color,
        size,
        erase: erasing,
      };

      setIsDrawing(true);
      scheduleRedraw();
    },
    [color, size, erasing, toLocal, derivePressure, scheduleRedraw],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const stroke = currentRef.current;
      if (!stroke) return;
      e.preventDefault();

      const point = toLocal(e);
      if (!point) return;

      const last = lastPointRef.current;
      if (last) {
        const dist = Math.hypot(point.x - last.x, point.y - last.y);
        if (dist < MIN_DISTANCE) return;
      }

      point.p = derivePressure(e, point);
      lastPointRef.current = point;
      stroke.points.push(point);

      scheduleRedraw();
    },
    [toLocal, derivePressure, scheduleRedraw],
  );

  const commit = useCallback(() => {
    const stroke = currentRef.current;
    currentRef.current = null;
    lastPointRef.current = null;
    setIsDrawing(false);

    if (!stroke || stroke.points.length === 0) return;

    setStrokesState((prev) => {
      const next = [...prev, stroke].slice(-HISTORY_LIMIT);
      onChange?.(next);
      return next;
    });
    setRedoStack([]);
  }, [onChange]);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      commit();
    },
    [commit],
  );

  const onPointerCancel = useCallback(() => {
    commit();
  }, [commit]);

  const undo = useCallback(() => {
    setStrokesState((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      const next = prev.slice(0, -1);
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  const redo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const restored = prevRedo[prevRedo.length - 1];
      setStrokesState((prev) => {
        const next = [...prev, restored];
        onChange?.(next);
        return next;
      });
      return prevRedo.slice(0, -1);
    });
  }, [onChange]);

  const clear = useCallback(() => {
    setStrokesState((prev) => {
      if (prev.length > 0) setRedoStack(prev);
      onChange?.([]);
      return [];
    });
  }, [onChange]);

  const setStrokes = useCallback(
    (next: Stroke[]) => {
      setStrokesState(next);
      setRedoStack([]);
      onChange?.(next);
    },
    [onChange],
  );

  return {
    canvasRef,
    containerRef,
    strokes,
    isDrawing,
    canUndo: strokes.length > 0,
    canRedo: redoStack.length > 0,
    isEmpty: strokes.length === 0,
    undo,
    redo,
    clear,
    setStrokes,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
