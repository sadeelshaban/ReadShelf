import { describe, expect, it } from "vitest";
import {
  computeProgressFromVisitedPages,
  inferInitialPagesVisited,
  isBookFullyRead,
  mergeVisitedPages,
} from "@/lib/books/reading-progress";

describe("reading progress from visited pages", () => {
  it("computes percent from unique visited pages", () => {
    expect(computeProgressFromVisitedPages([1, 2, 3, 5], 10)).toBe(40);
  });

  it("requires every page before marking a book finished", () => {
    expect(isBookFullyRead([1, 2, 99, 100], 100)).toBe(false);
    expect(isBookFullyRead(Array.from({ length: 100 }, (_, i) => i + 1), 100)).toBe(
      true,
    );
  });

  it("merges new pages without duplicates", () => {
    expect(mergeVisitedPages([1, 2], [2, 3], 10)).toEqual([1, 2, 3]);
  });

  it("infers sequential legacy progress from last_page", () => {
    expect(inferInitialPagesVisited([], 5, 50, 10)).toEqual([1, 2, 3, 4, 5]);
  });
});
