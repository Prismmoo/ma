/**
 * Undo / redo history for the sticker editor.
 * ---------------------------------------------------------------------------
 * Why a dedicated module instead of `useState` inside the editor:
 *
 * 1. Undo must be *predictable*. The editor mutates the draft on every pointer
 *    move (pan, pinch, crop), so pushing every intermediate state would make
 *    Ctrl+Z move the artwork by one pixel at a time. `pushHistory` therefore
 *    COALESCES consecutive entries that share the same `label` inside
 *    `COALESCE_MS`, so a whole drag gesture is a single undo step.
 * 2. The stack is bounded (`HISTORY_LIMIT`) so a long editing session cannot
 *    grow memory without limit.
 * 3. It is pure data + pure functions, so it is unit-testable without React.
 */

export interface HistoryEntry<T> {
  /** The full editor state at this point in time. */
  state: T;
  /** Short human label, e.g. "Move artwork" - also used for coalescing. */
  label: string;
  /** Epoch milliseconds, used for coalescing. */
  at: number;
}

export interface History<T> {
  past: Array<HistoryEntry<T>>;
  present: HistoryEntry<T>;
  future: Array<HistoryEntry<T>>;
}

export const HISTORY_LIMIT = 40;
export const COALESCE_MS = 700;

export function createHistory<T>(state: T, label = 'Open editor', at = Date.now()): History<T> {
  return { past: [], present: { state, label, at }, future: [] };
}

/**
 * Push a new state.
 * - Consecutive pushes with the same label inside COALESCE_MS replace the
 *   present entry instead of stacking (one drag = one undo step).
 * - Any push clears the redo stack, which is the standard editor contract.
 */
export function pushHistory<T>(
  history: History<T>,
  state: T,
  label: string,
  at: number = Date.now(),
): History<T> {
  const coalesce = history.present.label === label && at - history.present.at < COALESCE_MS;

  if (coalesce) {
    return { past: history.past, present: { state, label, at }, future: [] };
  }

  const past = [...history.past, history.present];
  while (past.length > HISTORY_LIMIT) past.shift();

  return { past, present: { state, label, at }, future: [] };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}

export function undo<T>(history: History<T>): History<T> {
  if (!canUndo(history)) return history;
  const past = [...history.past];
  const present = past.pop() as HistoryEntry<T>;
  return { past, present, future: [history.present, ...history.future] };
}

export function redo<T>(history: History<T>): History<T> {
  if (!canRedo(history)) return history;
  const [present, ...future] = history.future;
  return { past: [...history.past, history.present], present, future };
}

/** Label of the step Ctrl+Z would revert, for the button tooltip. */
export function undoLabel<T>(history: History<T>): string | null {
  return canUndo(history) ? history.present.label : null;
}

export function redoLabel<T>(history: History<T>): string | null {
  return canRedo(history) ? history.future[0].label : null;
}

/**
 * True when the event should trigger undo (Ctrl+Z / Cmd+Z, without Shift).
 * Typing inside an input must never be hijacked, so the caller checks the
 * event target first; this helper only reads the key combination.
 */
export function isUndoEvent(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z';
}

/** Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y. */
export function isRedoEvent(e: KeyboardEvent): boolean {
  if (!(e.metaKey || e.ctrlKey)) return false;
  const key = e.key.toLowerCase();
  return (e.shiftKey && key === 'z') || key === 'y';
}
