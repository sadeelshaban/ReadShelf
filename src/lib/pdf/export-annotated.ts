import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  StandardFonts,
  LineCapStyle,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import type { Highlight, HighlightStroke, Note } from "@/types";
import {
  DEFAULT_NOTE_FONT_SIZE,
  HIGHLIGHT_DRAW_ALPHA,
  NOTE_TEXT_COLORS,
} from "@/lib/reader/constants";

const DEFAULT_RENDER_SCALE = 1.35;
const NOTE_FONT_TTF_PATH = path.join(
  process.cwd(),
  "assets/fonts/NotoSansArabic-Regular.ttf",
);
const NOTE_FONT_WOFF_PATH = path.join(
  process.cwd(),
  "node_modules/@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff",
);

let cachedNoteFontBytes: Uint8Array | null = null;

function resolveNoteFontPath() {
  if (fs.existsSync(NOTE_FONT_TTF_PATH)) return NOTE_FONT_TTF_PATH;
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

function noteColorToRgb(textColor: string): RGB {
  const css =
    NOTE_TEXT_COLORS.find((c) => c.value === textColor)?.css ?? "#1a120b";
  if (css === "#ffffff") return rgb(1, 1, 1);
  if (css === "#dc2626") return rgb(0.86, 0.15, 0.15);
  return rgb(0.1, 0.07, 0.04);
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

function toPdfPoint(
  x: number,
  y: number,
  viewport: { width: number; height: number },
  page: PDFPage,
) {
  const { width, height } = page.getSize();
  return {
    x: (x / viewport.width) * width,
    y: height - (y / viewport.height) * height,
  };
}

function toCanvasPoint(
  x: number,
  y: number,
  viewport: { width: number; height: number },
  page: PDFPage,
) {
  const { width, height } = page.getSize();
  return {
    x: (x / viewport.width) * width,
    y: (y / viewport.height) * height,
  };
}

function strokeToSvgPath(
  stroke: HighlightStroke,
  viewport: { width: number; height: number },
  page: PDFPage,
) {
  if (stroke.points.length < 2) return null;

  return stroke.points
    .map((point, index) => {
      const { x, y } = toCanvasPoint(point.x, point.y, viewport, page);
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

function drawNotesOnPage(
  page: PDFPage,
  pageNotes: Note[],
  pageFallback: { width: number; height: number },
  noteFont: PDFFont,
) {
  const { width } = page.getSize();

  for (const note of pageNotes) {
    if (!note.position || !note.note_text.trim()) continue;

    const viewport = resolveNoteViewport(note, pageFallback);
    const anchor = toPdfPoint(
      note.position.x,
      note.position.y + note.position.height - 12,
      viewport,
      page,
    );
    const maxWidth = (note.position.width / viewport.width) * width;
    const fontSize = note.position.fontSize ?? DEFAULT_NOTE_FONT_SIZE;
    const size = (fontSize / viewport.width) * width;

    try {
      page.drawText(note.note_text.trim(), {
        x: anchor.x,
        y: anchor.y,
        size,
        font: noteFont,
        color: noteColorToRgb(note.text_color ?? "black"),
        maxWidth,
        lineHeight: size * 1.25,
      });
    } catch (error) {
      console.error("Failed to draw note on exported PDF:", note.id, error);
    }
  }
}

async function loadNoteFont(pdfDoc: PDFDocument, notes: Note[]): Promise<PDFFont> {
  const hasNoteText = notes.some((note) => note.note_text.trim().length > 0);
  if (!hasNoteText) {
    return pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  try {
    pdfDoc.registerFontkit(fontkit);
    const fontPath = resolveNoteFontPath();
    if (!cachedNoteFontBytes) {
      cachedNoteFontBytes = fs.readFileSync(fontPath);
    }
    return pdfDoc.embedFont(cachedNoteFontBytes, {
      subset: true,
    });
  } catch {
    return pdfDoc.embedFont(StandardFonts.Helvetica);
  }
}

export async function buildAnnotatedPdf(
  pdfBytes: Uint8Array,
  highlights: Highlight[],
  notes: Note[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const noteFont = await loadNoteFont(pdfDoc, notes);
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
    drawNotesOnPage(
      page,
      notes.filter((n) => n.page_number === pageNumber),
      pageFallback,
      noteFont,
    );
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
