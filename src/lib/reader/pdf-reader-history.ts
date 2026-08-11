import type { Highlight, Note } from "@/types";

export type HighlightChange = {
  before: Highlight;
  after: Highlight | null;
};

export type HistoryAction =
  | { type: "add_highlight"; highlight: Highlight }
  | { type: "delete_highlight"; highlight: Highlight }
  | { type: "update_highlight"; before: Highlight; after: Highlight }
  | { type: "batch_highlight"; changes: HighlightChange[] }
  | { type: "add_note"; note: Note }
  | { type: "delete_note"; note: Note };

export type TimestampedHistoryAction = {
  action: HistoryAction;
  at: number;
};

export const HISTORY_TTL_MS = 15 * 60 * 1000;
export const HISTORY_MAX_ENTRIES = 100;

export function isHistoryEntryExpired(
  entry: TimestampedHistoryAction,
  now = Date.now(),
) {
  return now - entry.at > HISTORY_TTL_MS;
}

export function pruneExpiredHistory(
  stack: TimestampedHistoryAction[],
  now = Date.now(),
) {
  return stack.filter((entry) => !isHistoryEntryExpired(entry, now));
}

export function trimHistoryStack(stack: TimestampedHistoryAction[]) {
  if (stack.length <= HISTORY_MAX_ENTRIES) return stack;
  return stack.slice(stack.length - HISTORY_MAX_ENTRIES);
}

export function popUndoEntry(
  stack: TimestampedHistoryAction[],
  now = Date.now(),
): { stack: TimestampedHistoryAction[]; entry: TimestampedHistoryAction | null } {
  let next = pruneExpiredHistory(stack, now);
  while (next.length > 0) {
    const entry = next[next.length - 1]!;
    next = next.slice(0, -1);
    if (!isHistoryEntryExpired(entry, now)) {
      return { stack: next, entry };
    }
  }
  return { stack: next, entry: null };
}

export function popRedoEntry(
  stack: TimestampedHistoryAction[],
  now = Date.now(),
): { stack: TimestampedHistoryAction[]; entry: TimestampedHistoryAction | null } {
  let next = pruneExpiredHistory(stack, now);
  while (next.length > 0) {
    const entry = next[next.length - 1]!;
    next = next.slice(0, -1);
    if (!isHistoryEntryExpired(entry, now)) {
      return { stack: next, entry };
    }
  }
  return { stack: next, entry: null };
}

export function mergeHighlightChanges(
  highlights: Highlight[],
  changes: HighlightChange[],
): Highlight[] {
  let next = [...highlights];
  for (const change of changes) {
    if (change.after === null) {
      next = next.filter((entry) => entry.id !== change.before.id);
    } else {
      const index = next.findIndex((entry) => entry.id === change.before.id);
      if (index >= 0) next[index] = change.after;
      else next.push(change.after);
    }
  }
  return next;
}

/** Apply a single history action in the undo direction (reverse the recorded op). */
export function applyHistoryUndo(
  highlights: Highlight[],
  notes: Note[],
  action: HistoryAction,
): { highlights: Highlight[]; notes: Note[] } {
  switch (action.type) {
    case "add_highlight":
      return {
        highlights: highlights.filter((entry) => entry.id !== action.highlight.id),
        notes,
      };
    case "delete_highlight":
      return {
        highlights: highlights.some((entry) => entry.id === action.highlight.id)
          ? highlights
          : [...highlights, action.highlight],
        notes,
      };
    case "update_highlight":
      return {
        highlights: highlights.map((entry) =>
          entry.id === action.before.id ? action.before : entry,
        ),
        notes,
      };
    case "batch_highlight": {
      let next = [...highlights];
      for (const change of action.changes) {
        if (change.after === null) {
          if (!next.some((entry) => entry.id === change.before.id)) {
            next.push(change.before);
          }
        } else {
          const index = next.findIndex((entry) => entry.id === change.before.id);
          if (index >= 0) next[index] = change.before;
        }
      }
      return { highlights: next, notes };
    }
    case "add_note":
      return {
        highlights,
        notes: notes.filter((entry) => entry.id !== action.note.id),
      };
    case "delete_note":
      return {
        highlights,
        notes: notes.some((entry) => entry.id === action.note.id)
          ? notes
          : [...notes, action.note],
      };
    default:
      return { highlights, notes };
  }
}

/** Apply a single history action in the redo direction (replay the recorded op). */
export function applyHistoryRedo(
  highlights: Highlight[],
  notes: Note[],
  action: HistoryAction,
): { highlights: Highlight[]; notes: Note[] } {
  switch (action.type) {
    case "add_highlight":
      return {
        highlights: highlights.some((entry) => entry.id === action.highlight.id)
          ? highlights
          : [...highlights, action.highlight],
        notes,
      };
    case "delete_highlight":
      return {
        highlights: highlights.filter((entry) => entry.id !== action.highlight.id),
        notes,
      };
    case "update_highlight":
      return {
        highlights: highlights.map((entry) =>
          entry.id === action.after.id ? action.after : entry,
        ),
        notes,
      };
    case "batch_highlight":
      return {
        highlights: mergeHighlightChanges(highlights, action.changes),
        notes,
      };
    case "add_note":
      return {
        highlights,
        notes: notes.some((entry) => entry.id === action.note.id)
          ? notes
          : [...notes, action.note],
      };
    case "delete_note":
      return {
        highlights,
        notes: notes.filter((entry) => entry.id !== action.note.id),
      };
    default:
      return { highlights, notes };
  }
}
