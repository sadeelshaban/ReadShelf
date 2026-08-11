import { describe, expect, it } from "vitest";
import {
  displayCommentFromPagePosition,
  migrateCommentToPageAnchored,
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

describe("displayCommentFromPagePosition", () => {
  it("scales comment font size with page zoom like sticky notes", () => {
    const pos: NotePosition = {
      x: 0,
      y: 0,
      width: 80,
      height: 40,
      fontSize: 14,
      kind: "comment",
      viewportWidth: 595,
    };
    expect(displayCommentFromPagePosition(pos, mockCanvas(595)).fontSize).toBe(14);
    expect(displayCommentFromPagePosition(pos, mockCanvas(1190)).fontSize).toBe(28);
  });
});

describe("migrateCommentToPageAnchored", () => {
  it("converts legacy screen-pixel comments to page coordinates", () => {
    const pos: NotePosition = {
      x: 10,
      y: 20,
      width: 80,
      height: 40,
      fontSize: 14,
      kind: "comment",
      commentFontScreen: true,
      viewportWidth: 595,
    };
    const canvas = mockCanvas(1190);
    const migrated = migrateCommentToPageAnchored(pos, canvas);
    expect(migrated.commentFontScreen).toBeUndefined();
    expect(displayCommentFromPagePosition(migrated, canvas).fontSize).toBe(14);
  });
});
