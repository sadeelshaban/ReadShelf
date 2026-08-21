import { describe, expect, it } from "vitest";
import type { Note } from "@/types";
import {
  detectTextDirection,
  isCommentNote,
  isDisplayableStickyNote,
  isStickyNote,
  normalizeStickyColor,
  noteHasContent,
  noteKindLabel,
  noteOverflowExtent,
  notePreviewLabel,
  noteTitle,
  stickyPaperPalette,
} from "@/lib/reader/sticky-notes";

function makeNote(overrides?: Partial<Note>): Note {
  return {
    id: "n1",
    book_id: "b1",
    user_id: "u1",
    page_number: 1,
    note_text: "",
    highlight_id: null,
    position: {
      x: 10,
      y: 10,
      width: 200,
      height: 160,
      title: "",
      rotation: 0,
    },
    text_color: "yellow",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("normalizeStickyColor", () => {
  it("keeps bookmark paper colors", () => {
    expect(normalizeStickyColor("yellow")).toBe("yellow");
    expect(normalizeStickyColor("red")).toBe("red");
    expect(normalizeStickyColor("blue")).toBe("blue");
  });

  it("maps legacy ink colors to sticky paper colors", () => {
    expect(normalizeStickyColor("black")).toBe("yellow");
  });
});

describe("sticky note content helpers", () => {
  it("reads title from position and body from note_text", () => {
    const note = makeNote({
      note_text: "Body text",
      position: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        title: "Hello world",
      },
    });
    expect(noteTitle(note)).toBe("Hello world");
    expect(noteHasContent(note)).toBe(true);
    expect(notePreviewLabel(note)).toBe("Body text");
  });

  it("falls back to English placeholder when empty", () => {
    expect(notePreviewLabel(makeNote())).toBe("Note");
  });

  it("detects Arabic as RTL", () => {
    expect(detectTextDirection("مرحبا")).toBe("rtl");
    expect(detectTextDirection("Hello")).toBe("ltr");
  });

  it("returns paper palette for bookmark colors", () => {
    expect(stickyPaperPalette("yellow").paper).toContain("rgba");
    expect(stickyPaperPalette("blue").id).toBe("blue");
  });

  it("distinguishes sticky notes from comments", () => {
    const sticky = makeNote();
    const comment = makeNote({
      note_text: "تعليق قصير",
      position: {
        x: 0,
        y: 0,
        width: 160,
        height: 60,
        kind: "comment",
      },
    });
    expect(isStickyNote(sticky)).toBe(true);
    expect(isDisplayableStickyNote(sticky)).toBe(false);
    expect(isDisplayableStickyNote(makeNote({ note_text: "Pressure reading" }))).toBe(true);
    expect(isDisplayableStickyNote(comment)).toBe(false);
    expect(isCommentNote(comment)).toBe(true);
    expect(noteKindLabel(comment)).toBe("Comment");
    expect(notePreviewLabel(comment)).toBe("تعليق قصير");
  });

  it("expands page bounds when a note sits outside the canvas", () => {
    const onPage = makeNote({
      position: { x: 10, y: 10, width: 40, height: 40, viewportWidth: 100, viewportHeight: 200 },
    });
    expect(noteOverflowExtent([onPage], 100, 200)).toBeNull();

    const offPage = makeNote({
      position: { x: 120, y: -30, width: 50, height: 40, viewportWidth: 100, viewportHeight: 200 },
    });
    const extent = noteOverflowExtent([offPage], 100, 200);
    expect(extent).not.toBeNull();
    expect(extent!.left).toBeLessThan(0);
    expect(extent!.width).toBeGreaterThan(100);
    expect(extent!.height).toBeGreaterThan(200);
  });
});
