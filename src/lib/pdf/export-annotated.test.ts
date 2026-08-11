import { describe, expect, it } from "vitest";
import {
  intersectNoteWithPage,
  noteFontSizeInPdfPoints,
  parseRgbaColor,
} from "@/lib/pdf/export-annotated";
import type { NotePosition } from "@/types";

describe("noteFontSizeInPdfPoints", () => {
  it("scales page font size to PDF points for comments and sticky notes", () => {
    expect(noteFontSizeInPdfPoints(14, { width: 595, height: 842 }, 595)).toBe(14);
    expect(noteFontSizeInPdfPoints(14, { width: 595, height: 842 }, 1190)).toBe(28);
  });
});

describe("intersectNoteWithPage", () => {
  it("clips note bounds to the page viewport", () => {
    const position: NotePosition = {
      x: -20,
      y: 10,
      width: 100,
      height: 80,
      viewportWidth: 595,
      viewportHeight: 842,
    };
    expect(intersectNoteWithPage(position, { width: 595, height: 842 })).toEqual({
      ...position,
      x: 0,
      y: 10,
      width: 80,
      height: 80,
    });
  });
});

describe("parseRgbaColor", () => {
  it("parses rgba css colors", () => {
    const parsed = parseRgbaColor("rgba(247, 231, 161, 0.42)");
    expect(parsed.opacity).toBeCloseTo(0.42);
  });
});
