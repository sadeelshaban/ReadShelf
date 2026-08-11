import { describe, expect, it } from "vitest";
import {
  buildAnnotatedPdf,
  intersectNoteWithPage,
  noteFontSizeInPdfPoints,
  noteTextUsesMixedScripts,
  parseRgbaColor,
  resolveExportNoteFontSize,
  splitNoteScriptRuns,
} from "@/lib/pdf/export-annotated";
import type { Note, NotePosition } from "@/types";

describe("noteFontSizeInPdfPoints", () => {
  it("scales page font size to PDF points for comments and sticky notes", () => {
    expect(noteFontSizeInPdfPoints(14, { width: 595, height: 842 }, 595)).toBe(14);
    expect(noteFontSizeInPdfPoints(14, { width: 595, height: 842 }, 1190)).toBe(28);
  });
});

describe("resolveExportNoteFontSize", () => {
  it("converts legacy screen-pixel comment sizes during export", () => {
    const size = resolveExportNoteFontSize(
      {
        x: 0,
        y: 0,
        width: 180,
        height: 48,
        fontSize: 14,
        commentFontScreen: true,
        viewportWidth: 800,
        viewportHeight: 1131,
      },
      { width: 595, height: 842 },
      595,
    );
    expect(size).toBeCloseTo(10.4125);
  });
});

describe("note script runs", () => {
  it("detects mixed Arabic and Latin text", () => {
    expect(noteTextUsesMixedScripts("blocking")).toBe(false);
    expect(noteTextUsesMixedScripts("اعطال")).toBe(false);
    expect(noteTextUsesMixedScripts("hello اعطال")).toBe(true);
  });

  it("splits mixed script runs", () => {
    expect(splitNoteScriptRuns("blocking jam")).toEqual([
      { text: "blocking jam", script: "latin" },
    ]);
    expect(splitNoteScriptRuns("hello اعطال")).toEqual([
      { text: "hello ", script: "latin" },
      { text: "اعطال", script: "arabic" },
    ]);
  });
});

describe("buildAnnotatedPdf", () => {
  it("embeds readable English comments and Arabic sticky notes", async () => {
    const { PDFDocument } = await import("pdf-lib");
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([595, 842]);
    const baseBytes = await baseDoc.save();

    const position: NotePosition = {
      x: 80,
      y: 120,
      width: 180,
      height: 48,
      fontSize: 14,
      kind: "comment",
      viewportWidth: 595,
      viewportHeight: 842,
    };

    const notes: Note[] = [
      {
        id: "comment-1",
        book_id: "book-1",
        user_id: "user-1",
        page_number: 1,
        note_text: "blocking",
        text_color: "yellow",
        position,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "note-1",
        book_id: "book-1",
        user_id: "user-1",
        page_number: 1,
        note_text: "اعطال ميكانيكية",
        text_color: "yellow",
        position: {
          ...position,
          x: 360,
          y: 120,
          width: 180,
          height: 120,
          kind: "sticky",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const exported = await buildAnnotatedPdf(baseBytes, [], notes);
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({ data: exported, useSystemFonts: true }).promise;
    const page = await doc.getPage(1);
    const text = (await page.getTextContent()).items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    expect(text).toContain("blocking");
    expect(text).toContain("اعطال");
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
