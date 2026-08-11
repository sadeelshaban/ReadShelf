import { describe, expect, it } from "vitest";
import {
  commentFontSizeToScreen,
  normalizeCommentPosition,
} from "@/lib/reader/coordinates";
import type { NotePosition } from "@/types";

function mockCanvas(displayWidth: number, pixelWidth = 595) {
  return {
    width: pixelWidth,
    height: 842,
    getBoundingClientRect: () => ({
      width: displayWidth,
      height: (displayWidth * 842) / pixelWidth,
      top: 0,
      left: 0,
      right: displayWidth,
      bottom: (displayWidth * 842) / pixelWidth,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  } as HTMLCanvasElement;
}

describe("commentFontSizeToScreen", () => {
  it("returns stored screen px when commentFontScreen is set", () => {
    const pos: NotePosition = {
      x: 0,
      y: 0,
      width: 80,
      height: 40,
      fontSize: 16,
      kind: "comment",
      commentFontScreen: true,
      viewportWidth: 595,
    };
    expect(commentFontSizeToScreen(pos, mockCanvas(1190))).toBe(16);
  });

  it("converts legacy page-scaled fontSize using current display scale", () => {
    const pos: NotePosition = {
      x: 0,
      y: 0,
      width: 80,
      height: 40,
      fontSize: 28,
      kind: "comment",
      viewportWidth: 595,
    };
    expect(commentFontSizeToScreen(pos, mockCanvas(1190))).toBe(14);
  });

  it("keeps screen-native values that lack the migration flag", () => {
    const pos: NotePosition = {
      x: 0,
      y: 0,
      width: 80,
      height: 40,
      fontSize: 14,
      kind: "comment",
      viewportWidth: 595,
    };
    expect(commentFontSizeToScreen(pos, mockCanvas(1190))).toBe(14);
  });
});

describe("normalizeCommentPosition", () => {
  it("marks legacy comments as screen-pixel and fixes fontSize", () => {
    const pos: NotePosition = {
      x: 10,
      y: 20,
      width: 80,
      height: 40,
      fontSize: 28,
      kind: "comment",
      viewportWidth: 595,
    };
    const canvas = mockCanvas(1190);
    expect(normalizeCommentPosition(pos, canvas)).toEqual({
      ...pos,
      fontSize: 14,
      commentFontScreen: true,
    });
  });
});
