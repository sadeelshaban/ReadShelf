import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  LineCapStyle,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import type { Highlight, HighlightStroke, Note, NotePosition } from "@/types";
import {
  DEFAULT_NOTE_FONT_SIZE,
  HIGHLIGHT_DRAW_ALPHA,
} from "@/lib/reader/constants";
import {
  isCommentNote,
  isNoteOnPage,
  noteBody,
  noteHasContent,
  stickyPaperPalette,
} from "@/lib/reader/sticky-notes";

const DEFAULT_RENDER_SCALE = 1.35;
const NOTE_FONT_TTF_PATH = path.join(
  process.cwd(),
  "assets/fonts/NotoSansArabic-Regular.ttf",
);
const NOTE_FONT_WOFF2_PATH = path.join(
  process.cwd(),
  "node_modules/@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff2",
);
const NOTE_FONT_WOFF_PATH = path.join(
  process.cwd(),
  "node_modules/@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff",
);

let cachedNoteFontBytes: Uint8Array | null = null;

function resolveNoteFontPath() {
  if (fs.existsSync(NOTE_FONT_TTF_PATH)) return NOTE_FONT_TTF_PATH;
  if (fs.existsSync(NOTE_FONT_WOFF2_PATH)) return NOTE_FONT_WOFF2_PATH;
  if (fs.existsSync(NOTE_FONT_WOFF_PATH)) return NOTE_FONT_WOFF_PATH;
  return NOTE_FONT_TTF_PATH;
}

function parseHexColor(hex: string): RGB {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  return rgb(
    Number.parseInt(full.slice(0, 2), 16) / 255,
    Number.parseInt(full.slice(2, 4), 16) / 255,
    Number.parseInt(full.slice(4, 6), 16) / 255,
  );
}

export function parseRgbaColor(css: string): { color: RGB; opacity: number } {
  const hex = css.trim();
  if (hex.startsWith("#")) {
    return { color: parseHexColor(hex), opacity: 1 };
  }

  const match = css.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
  );
  if (!match) {
    return { color: rgb(1, 1, 1), opacity: 1 };
  }

  return {
    color: rgb(
      Number.parseFloat(match[1]!) / 255,
      Number.parseFloat(match[2]!) / 255,
      Number.parseFloat(match[3]!) / 255,
    ),
    opacity: match[4] != null ? Number.parseFloat(match[4]) : 1,
  };
}

function noteColorToRgb(textColor: string): RGB {
  return parseHexColor(stickyPaperPalette(textColor).ink);
}

function fallbackViewport(page: PDFPage) {
  const { width, height } = page.getSize();
  return {
    width: width * DEFAULT_RENDER_SCALE,
    height: height * DEFAULT_RENDER_SCALE,
  };
}

function resolveHighlightViewport(
  highlight: Highlight,
  pageFallback: { width: number; height: number },
) {
  return {
    width: highlight.position?.viewportWidth ?? pageFallback.width,
    height: highlight.position?.viewportHeight ?? pageFallback.height,
  };
}

function resolveNoteViewport(
  note: Note,
  pageFallback: { width: number; height: number },
) {
  return {
    width: note.position?.viewportWidth ?? pageFallback.width,
    height: note.position?.viewportHeight ?? pageFallback.height,
  };
}

export function noteFontSizeInPdfPoints(
  fontSize: number,
  viewport: { width: number; height: number },
  pageWidth: number,
) {
  if (viewport.width <= 0) return fontSize;
  return (fontSize / viewport.width) * pageWidth;
}

/** Clip note bounds to the page canvas so export matches on-page content only. */
export function intersectNoteWithPage(
  position: NotePosition,
  viewport: { width: number; height: number },
): NotePosition | null {
  const vw = viewport.width;
  const vh = viewport.height;
  const x1 = Math.max(0, position.x);
  const y1 = Math.max(0, position.y);
  const x2 = Math.min(vw, position.x + position.width);
  const y2 = Math.min(vh, position.y + position.height);
  if (x2 <= x1 || y2 <= y1) return null;

  return {
    ...position,
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
}

function toPdfRect(
  position: Pick<NotePosition, "x" | "y" | "width" | "height">,
  viewport: { width: number; height: number },
  page: PDFPage,
) {
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const sx = pageWidth / viewport.width;
  const sy = pageHeight / viewport.height;
  const left = position.x * sx;
  const top = position.y * sy;
  const w = position.width * sx;
  const h = position.height * sy;

  return {
    x: left,
    y: pageHeight - top - h,
    width: w,
    height: h,
  };
}

function strokeToSvgPath(
  stroke: HighlightStroke,
  viewport: { width: number; height: number },
  page: PDFPage,
) {
  if (stroke.points.length < 2) return null;

  const { width, height } = page.getSize();

  return stroke.points
    .map((point, index) => {
      const x = (point.x / viewport.width) * width;
      const y = (point.y / viewport.height) * height;
      const command = index === 0 ? "M" : "L";
      return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function drawHighlightsOnPage(
  page: PDFPage,
  pageHighlights: Highlight[],
  pageFallback: { width: number; height: number },
) {
  const { width, height } = page.getSize();

  for (const highlight of pageHighlights) {
    const color = parseHexColor(highlight.color || "#FFEB3B");
    const viewport = resolveHighlightViewport(highlight, pageFallback);
    const strokes = highlight.position?.strokes ?? [];

    for (const stroke of strokes) {
      const path = strokeToSvgPath(stroke, viewport, page);
      if (!path) continue;

      const thickness = (stroke.width / viewport.width) * width;
      const isPen = highlight.highlight_type === "pen";

      page.drawSvgPath(path, {
        x: 0,
        y: height,
        borderColor: color,
        borderWidth: thickness,
        borderOpacity: isPen ? 1 : HIGHLIGHT_DRAW_ALPHA,
        borderLineCap: LineCapStyle.Round,
      });
    }
  }
}

function drawWrappedNoteText(
  page: PDFPage,
  text: string,
  rect: { x: number; y: number; width: number; height: number },
  size: number,
  font: PDFFont,
  color: RGB,
  padding: number,
) {
  page.drawText(text, {
    x: rect.x + padding,
    y: rect.y + rect.height - padding - size,
    size,
    font,
    color,
    maxWidth: Math.max(8, rect.width - padding * 2),
    lineHeight: size * 1.25,
  });
}

function drawStickyNoteOnPage(
  page: PDFPage,
  note: Note,
  position: NotePosition,
  viewport: { width: number; height: number },
  noteFont: PDFFont,
) {
  const palette = stickyPaperPalette(note.text_color);
  const rect = toPdfRect(position, viewport, page);
  const paper = parseRgbaColor(palette.paper);
  const header = parseRgbaColor(palette.header);
  const fold = parseRgbaColor(palette.fold);
  const border = parseRgbaColor(palette.fold);
  const headerHeight = Math.min(rect.height * 0.18, noteFontSizeInPdfPoints(14, viewport, page.getWidth()) * 1.8);
  const fontSize = noteFontSizeInPdfPoints(
    position.fontSize ?? DEFAULT_NOTE_FONT_SIZE,
    viewport,
    page.getWidth(),
  );
  const text = noteBody(note);
  if (!text) return;

  page.drawRectangle({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    color: paper.color,
    opacity: paper.opacity,
    borderColor: border.color,
    borderWidth: 0.75,
    borderOpacity: 0.65,
  });

  page.drawRectangle({
    x: rect.x,
    y: rect.y + rect.height - headerHeight,
    width: rect.width,
    height: headerHeight,
    color: header.color,
    opacity: Math.min(1, header.opacity + 0.08),
  });

  const foldSize = Math.min(rect.width * 0.12, headerHeight * 1.1, 18);
  page.drawSvgPath(`M 0 0 L ${foldSize} 0 L ${foldSize} ${foldSize} Z`, {
    x: rect.x + rect.width - foldSize,
    y: rect.y + rect.height - foldSize,
    color: fold.color,
    opacity: fold.opacity,
  });

  page.drawText("Note", {
    x: rect.x + 6,
    y: rect.y + rect.height - headerHeight + headerHeight * 0.28,
    size: Math.max(7, fontSize * 0.72),
    font: noteFont,
    color: noteColorToRgb(note.text_color ?? "yellow"),
    opacity: 0.75,
  });

  drawWrappedNoteText(
    page,
    text,
    {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height - headerHeight,
    },
    Math.max(8, fontSize * 0.92),
    noteFont,
    noteColorToRgb(note.text_color ?? "yellow"),
    8,
  );
}

function drawCommentOnPage(
  page: PDFPage,
  note: Note,
  position: NotePosition,
  viewport: { width: number; height: number },
  noteFont: PDFFont,
) {
  const text = noteBody(note);
  if (!text) return;

  const fontSize = noteFontSizeInPdfPoints(
    position.fontSize ?? DEFAULT_NOTE_FONT_SIZE,
    viewport,
    page.getWidth(),
  );
  const padding = Math.max(4, fontSize * 0.45);
  const textWidth = Math.min(
    (position.width / viewport.width) * page.getWidth(),
    noteFont.widthOfTextAtSize(text, fontSize) + padding * 2,
  );
  const lineCount = Math.max(1, text.split(/\r?\n/).length);
  const textHeight = lineCount * fontSize * 1.25 + padding * 2;
  const rect = toPdfRect(
    {
      ...position,
      width: (textWidth / page.getWidth()) * viewport.width,
      height: (textHeight / page.getHeight()) * viewport.height,
    },
    viewport,
    page,
  );
  const bubble = parseRgbaColor("rgba(255, 248, 241, 0.82)");
  const marker = parseRgbaColor("rgba(111, 69, 40, 0.45)");

  page.drawRectangle({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    color: bubble.color,
    opacity: bubble.opacity,
    borderColor: marker.color,
    borderWidth: 0.5,
    borderOpacity: 0.35,
  });

  page.drawSvgPath("M 0 0 L 6 3 L 0 6 Z", {
    x: rect.x - 4,
    y: rect.y + rect.height - fontSize * 1.1,
    color: marker.color,
    opacity: 0.35,
  });

  drawWrappedNoteText(
    page,
    text,
    rect,
    fontSize,
    noteFont,
    noteColorToRgb(note.text_color ?? "yellow"),
    padding,
  );
}

function drawNotesOnPage(
  page: PDFPage,
  pageNotes: Note[],
  pageFallback: { width: number; height: number },
  noteFont: PDFFont,
) {
  for (const note of pageNotes) {
    if (!note.position || !noteHasContent(note)) continue;
    if (!isNoteOnPage(note.position)) continue;

    const viewport = resolveNoteViewport(note, pageFallback);
    const clipped = intersectNoteWithPage(note.position, viewport);
    if (!clipped) continue;

    try {
      if (isCommentNote(note)) {
        drawCommentOnPage(page, note, clipped, viewport, noteFont);
      } else {
        drawStickyNoteOnPage(page, note, clipped, viewport, noteFont);
      }
    } catch (error) {
      console.error("Failed to draw note on exported PDF:", note.id, error);
    }
  }
}

async function loadNoteFont(pdfDoc: PDFDocument): Promise<PDFFont> {
  pdfDoc.registerFontkit(fontkit);
  const fontPath = resolveNoteFontPath();
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Note export font not found at ${fontPath}`);
  }

  if (!cachedNoteFontBytes) {
    cachedNoteFontBytes = fs.readFileSync(fontPath);
  }

  return pdfDoc.embedFont(cachedNoteFontBytes, { subset: true });
}

export async function buildAnnotatedPdf(
  pdfBytes: Uint8Array,
  highlights: Highlight[],
  notes: Note[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const exportableNotes = notes.filter(
    (note) => noteHasContent(note) && note.position && isNoteOnPage(note.position),
  );
  const noteFont =
    exportableNotes.length > 0 ? await loadNoteFont(pdfDoc) : null;
  const pages = pdfDoc.getPages();
  const pageNumbers = new Set<number>([
    ...highlights.map((h) => h.page_number),
    ...notes.map((n) => n.page_number),
  ]);

  for (const pageNumber of pageNumbers) {
    if (pageNumber < 1 || pageNumber > pages.length) continue;

    const page = pages[pageNumber - 1];
    const pageFallback = fallbackViewport(page);

    drawHighlightsOnPage(
      page,
      highlights.filter((h) => h.page_number === pageNumber),
      pageFallback,
    );
    if (noteFont) {
      drawNotesOnPage(
        page,
        notes.filter((n) => n.page_number === pageNumber),
        pageFallback,
        noteFont,
      );
    }
  }

  return pdfDoc.save();
}

export function safePdfFilename(title: string) {
  const cleaned = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);

  return cleaned ? `${cleaned}.pdf` : "book.pdf";
}

export function contentDispositionAttachment(filename: string) {
  const asciiFallback =
    filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_") || "book.pdf";
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
