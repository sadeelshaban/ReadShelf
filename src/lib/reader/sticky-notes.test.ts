import { describe, expect, it } from "vitest";
import type { Note } from "@/types";
import {
  detectTextDirection,
  isCommentNote,
  isStickyNote,
  normalizeStickyColor,
  noteHasContent,
  noteKindLabel,
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
    expect(notePreviewLabel(note)).toBe("Hello world");
  });

  it("falls back to Arabic placeholder when empty", () => {
    expect(notePreviewLabel(makeNote())).toBe("ملاحظة");
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
    expect(isCommentNote(comment)).toBe(true);
    expect(noteKindLabel(comment)).toBe("تعليق");
    expect(notePreviewLabel(comment)).toBe("تعليق قصير");
  });
});
