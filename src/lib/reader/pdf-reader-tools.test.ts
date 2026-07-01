import { describe, expect, it } from "vitest";
import {
  canNavigatePages,
  isDrawingTool,
  isInteractiveDrawLayer,
  isNoteTextTarget,
} from "@/lib/reader/pdf-reader-tools";

describe("isDrawingTool", () => {
  it("is true for highlight and pen", () => {
    expect(isDrawingTool("highlight")).toBe(true);
    expect(isDrawingTool("pen")).toBe(true);
  });

  it("is false for other tools", () => {
    expect(isDrawingTool("read")).toBe(false);
    expect(isDrawingTool("eraser")).toBe(false);
  });
});

describe("isInteractiveDrawLayer", () => {
  it("includes drawing and eraser tools", () => {
    expect(isInteractiveDrawLayer("highlight")).toBe(true);
    expect(isInteractiveDrawLayer("pen")).toBe(true);
    expect(isInteractiveDrawLayer("eraser")).toBe(true);
    expect(isInteractiveDrawLayer("read")).toBe(false);
  });
});

describe("canNavigatePages", () => {
  const base = {
    editingNoteId: null,
    isDrawing: false,
    isErasing: false,
    activeTool: "read" as const,
  };

  it("allows navigation in read mode", () => {
    expect(canNavigatePages(base)).toBe(true);
  });

  it("blocks navigation while editing a note", () => {
    expect(canNavigatePages({ ...base, editingNoteId: "note-1" })).toBe(false);
  });

  it("blocks navigation during drawing or erasing", () => {
    expect(canNavigatePages({ ...base, isDrawing: true })).toBe(false);
    expect(canNavigatePages({ ...base, isErasing: true })).toBe(false);
  });

  it("blocks navigation for annotation tools", () => {
    expect(canNavigatePages({ ...base, activeTool: "highlight" })).toBe(false);
    expect(canNavigatePages({ ...base, activeTool: "pan" })).toBe(false);
  });

  it("allows navigation in bookmark mode", () => {
    expect(canNavigatePages({ ...base, activeTool: "bookmark" })).toBe(true);
  });
});

describe("isNoteTextTarget", () => {
  it("detects textarea inside note root", () => {
    const root = document.createElement("div");
    root.className = "note-root";
    const textarea = document.createElement("textarea");
    root.appendChild(textarea);
    document.body.appendChild(root);

    expect(isNoteTextTarget(textarea)).toBe(true);
    expect(isNoteTextTarget(document.createElement("textarea"))).toBe(false);

    root.remove();
  });
});
