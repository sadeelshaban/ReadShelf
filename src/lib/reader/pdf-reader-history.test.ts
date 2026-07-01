import { describe, expect, it } from "vitest";
import type { Highlight } from "@/types";
import { mergeHighlightChanges } from "@/lib/reader/pdf-reader-history";

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
