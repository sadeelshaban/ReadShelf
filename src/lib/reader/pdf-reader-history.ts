import type { Highlight, Note } from "@/types";

export type HighlightChange = {
  before: Highlight;
  after: Highlight | null;
};

export type HistoryAction =
  | { type: "add_highlight"; highlight: Highlight }
  | { type: "delete_highlight"; highlight: Highlight }
  | { type: "batch_highlight"; changes: HighlightChange[] }
  | { type: "add_note"; note: Note }
  | { type: "delete_note"; note: Note };

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
    }
  }
  return next;
}
