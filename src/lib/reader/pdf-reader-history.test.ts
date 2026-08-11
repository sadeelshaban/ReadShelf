import { describe, expect, it } from "vitest";
import type { Highlight, Note } from "@/types";
import {
  applyHistoryRedo,
  applyHistoryUndo,
  HISTORY_TTL_MS,
  isHistoryEntryExpired,
  mergeHighlightChanges,
  popUndoEntry,
  pruneExpiredHistory,
} from "@/lib/reader/pdf-reader-history";

const baseHighlight = (id: string, page = 1): Highlight => ({
  id,
  book_id: "book-1",
  user_id: "user-1",
  page_number: page,
  selected_text: "",
  color: "#FFEB3B",
  highlight_type: "freeform",
  position: { strokes: [], viewportWidth: 800, viewportHeight: 1100 },
  created_at: "2026-01-01T00:00:00Z",
});

const baseNote = (id: string): Note => ({
  id,
  book_id: "book-1",
  user_id: "user-1",
  page_number: 1,
  note_text: "hello",
  highlight_id: null,
  text_color: "yellow",
  position: { x: 10, y: 10, width: 100, height: 80 },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

describe("mergeHighlightChanges", () => {
  it("removes highlights when after is null", () => {
    const h1 = baseHighlight("h1");
    const h2 = baseHighlight("h2");
    const result = mergeHighlightChanges([h1, h2], [
      { before: h1, after: null },
    ]);
    expect(result).toEqual([h2]);
  });

  it("updates highlights when after is provided", () => {
    const h1 = baseHighlight("h1");
    const updated = { ...h1, color: "#2196F3" };
    const result = mergeHighlightChanges([h1], [{ before: h1, after: updated }]);
    expect(result[0]?.color).toBe("#2196F3");
  });

  it("applies multiple changes in order", () => {
    const h1 = baseHighlight("h1");
    const h2 = baseHighlight("h2");
    const h3 = baseHighlight("h3");
    const updatedH2 = { ...h2, page_number: 5 };
    const result = mergeHighlightChanges([h1, h2, h3], [
      { before: h1, after: null },
      { before: h2, after: updatedH2 },
    ]);
    expect(result).toEqual([updatedH2, h3]);
  });
});

describe("history expiry", () => {
  it("drops entries older than 15 minutes", () => {
    const now = Date.now();
    const fresh = { action: { type: "add_highlight" as const, highlight: baseHighlight("h1") }, at: now - 1000 };
    const stale = { action: { type: "add_highlight" as const, highlight: baseHighlight("h2") }, at: now - HISTORY_TTL_MS - 1 };
    expect(isHistoryEntryExpired(stale, now)).toBe(true);
    expect(pruneExpiredHistory([fresh, stale], now)).toEqual([fresh]);
  });

  it("skips expired undo entries", () => {
    const now = Date.now();
    const stale = { action: { type: "add_highlight" as const, highlight: baseHighlight("h1") }, at: now - HISTORY_TTL_MS - 1 };
    const fresh = { action: { type: "add_highlight" as const, highlight: baseHighlight("h2") }, at: now - 5000 };
    const result = popUndoEntry([stale, fresh], now);
    expect(result.entry?.action.type).toBe("add_highlight");
    expect((result.entry?.action as { highlight: Highlight }).highlight.id).toBe("h2");
    expect(result.stack).toEqual([]);
  });
});

describe("applyHistoryUndo / applyHistoryRedo", () => {
  it("round-trips add_highlight", () => {
    const highlight = baseHighlight("h1");
    const action = { type: "add_highlight" as const, highlight };
    const afterAdd = applyHistoryRedo([], [], action);
    expect(afterAdd.highlights).toEqual([highlight]);
    const afterUndo = applyHistoryUndo(afterAdd.highlights, [], action);
    expect(afterUndo.highlights).toEqual([]);
    const afterRedo = applyHistoryRedo(afterUndo.highlights, [], action);
    expect(afterRedo.highlights).toEqual([highlight]);
  });

  it("round-trips update_highlight for shape moves", () => {
    const before = baseHighlight("shape-1");
    before.highlight_type = "shape_arrow";
    before.position = {
      shape: { x1: 10, y1: 10, x2: 40, y2: 40, filled: false, strokeWidth: 2 },
      viewportWidth: 800,
      viewportHeight: 1100,
    };
    const after = {
      ...before,
      position: {
        ...before.position!,
        shape: { x1: 30, y1: 40, x2: 60, y2: 70, filled: false, strokeWidth: 2 },
      },
    };
    const action = { type: "update_highlight" as const, before, after };
    const moved = applyHistoryRedo([before], [], action);
    expect(moved.highlights[0]?.position?.shape?.x1).toBe(30);
    const undone = applyHistoryUndo(moved.highlights, [], action);
    expect(undone.highlights[0]?.position?.shape?.x1).toBe(10);
  });

  it("round-trips add_note / delete_note", () => {
    const note = baseNote("n1");
    const add = { type: "add_note" as const, note };
    const withNote = applyHistoryRedo([], [], add);
    expect(withNote.notes).toEqual([note]);
    const without = applyHistoryUndo(withNote.highlights, withNote.notes, add);
    expect(without.notes).toEqual([]);

    const del = { type: "delete_note" as const, note };
    const deleted = applyHistoryRedo([baseHighlight("h")], [note], del);
    expect(deleted.notes).toEqual([]);
    const restored = applyHistoryUndo(deleted.highlights, deleted.notes, del);
    expect(restored.notes).toEqual([note]);
  });
});
