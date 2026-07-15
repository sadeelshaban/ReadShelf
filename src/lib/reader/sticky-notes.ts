import type { Note, NotePosition } from "@/types";
import {
  BOOKMARK_COLORS,
  type BookmarkColorId,
  bookmarkColorHex,
} from "@/lib/reader/bookmarks";

export type StickyPaperPalette = {
  id: BookmarkColorId;
  name: string;
  /** Solid bookmark brand color */
  brand: string;
  /** Sticky paper fill */
  paper: string;
  /** Darker fold / edge */
  fold: string;
  /** Title bar strip */
  header: string;
  /** Body text on paper */
  ink: string;
  /** Muted placeholder */
  muted: string;
};

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

const PAPER_PALETTES: Record<BookmarkColorId, StickyPaperPalette> = {
  yellow: {
    id: "yellow",
    name: "Yellow",
    brand: bookmarkColorHex("yellow"),
    paper: "rgba(247, 231, 161, 0.42)",
    fold: "rgba(230, 200, 90, 0.55)",
    header: "rgba(240, 213, 110, 0.5)",
    ink: "#3A2A04",
    muted: "rgba(58, 42, 4, 0.5)",
  },
  red: {
    id: "red",
    name: "Red",
    brand: bookmarkColorHex("red"),
    paper: "rgba(243, 197, 204, 0.42)",
    fold: "rgba(217, 146, 157, 0.55)",
    header: "rgba(232, 170, 180, 0.5)",
    ink: "#3A0810",
    muted: "rgba(58, 8, 16, 0.5)",
  },
  blue: {
    id: "blue",
    name: "Blue",
    brand: bookmarkColorHex("blue"),
    paper: "rgba(197, 216, 247, 0.42)",
    fold: "rgba(143, 176, 232, 0.55)",
    header: "rgba(168, 196, 240, 0.5)",
    ink: "#0C2048",
    muted: "rgba(12, 32, 72, 0.5)",
  },
};

const LEGACY_NOTE_COLOR: Record<string, BookmarkColorId> = {
  yellow: "yellow",
  red: "red",
  blue: "blue",
  black: "yellow",
  gold: "yellow",
  green: "yellow",
};

export const STICKY_NOTE_COLORS = BOOKMARK_COLORS.map((entry) => ({
  id: entry.id,
  name: entry.name,
  value: entry.id,
  brand: entry.value,
  paper: PAPER_PALETTES[entry.id].paper,
  swatch: entry.value,
}));

export const DEFAULT_STICKY_COLOR: BookmarkColorId = "yellow";
export const DEFAULT_STICKY_WIDTH = 200;
export const DEFAULT_STICKY_HEIGHT = 168;
export const MIN_STICKY_WIDTH = 140;
export const MIN_STICKY_HEIGHT = 120;
export const MAX_STICKY_WIDTH = 360;
export const MAX_STICKY_HEIGHT = 420;
export const STICKY_ROTATION_STEP = 15;

export function normalizeStickyColor(color: string | null | undefined): BookmarkColorId {
  if (!color) return DEFAULT_STICKY_COLOR;
  return LEGACY_NOTE_COLOR[color] ?? DEFAULT_STICKY_COLOR;
}

export function stickyPaperPalette(color: string | null | undefined): StickyPaperPalette {
  return PAPER_PALETTES[normalizeStickyColor(color)];
}

export function noteTitle(note: Note | NotePosition | null | undefined): string {
  if (!note) return "";
  if ("position" in note) {
    return (note.position?.title ?? "").trim();
  }
  return (note.title ?? "").trim();
}

export function noteBody(note: Note | null | undefined): string {
  return (note?.note_text ?? "").trim();
}

export function noteRotation(note: Note | NotePosition | null | undefined): number {
  if (!note) return 0;
  const raw =
    "position" in note ? note.position?.rotation : (note as NotePosition).rotation;
  const value = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
  return ((value % 360) + 360) % 360;
}

export function noteHasContent(note: Note | null | undefined): boolean {
  if (!note) return false;
  return noteTitle(note).length > 0 || noteBody(note).length > 0;
}

export function noteKind(note: Note | NotePosition | null | undefined): "sticky" | "comment" {
  if (!note) return "sticky";
  const kind =
    "position" in note ? note.position?.kind : (note as NotePosition).kind;
  return kind === "comment" ? "comment" : "sticky";
}

export function isStickyNote(note: Note | null | undefined) {
  return noteKind(note) === "sticky";
}

export function isCommentNote(note: Note | null | undefined) {
  return noteKind(note) === "comment";
}

export function noteKindLabel(note: Note): string {
  return isCommentNote(note) ? "تعليق" : "ملاحظة لاصقة";
}

export function notePreviewLabel(note: Note): string {
  if (isCommentNote(note)) {
    const body = noteBody(note);
    if (body) {
      const firstLine = body.split(/\r?\n/)[0]?.trim() ?? "";
      return firstLine.slice(0, 64) || "تعليق";
    }
    return "تعليق";
  }
  const title = noteTitle(note);
  if (title) return title;
  const body = noteBody(note);
  if (body) {
    const firstLine = body.split(/\r?\n/)[0]?.trim() ?? "";
    return firstLine.slice(0, 48) || "ملاحظة";
  }
  return "ملاحظة";
}

export function detectTextDirection(text: string): "rtl" | "ltr" {
  return ARABIC_RE.test(text) ? "rtl" : "ltr";
}

export function stickyNoteFontStack() {
  return '"Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif';
}

export const DEFAULT_COMMENT_WIDTH = 200;
export const DEFAULT_COMMENT_HEIGHT = 72;
export const MIN_COMMENT_WIDTH = 140;
export const MIN_COMMENT_HEIGHT = 48;

export function clampStickySize(width: number, height: number) {
  return {
    width: Math.min(MAX_STICKY_WIDTH, Math.max(MIN_STICKY_WIDTH, width)),
    height: Math.min(MAX_STICKY_HEIGHT, Math.max(MIN_STICKY_HEIGHT, height)),
  };
}

export function normalizeRotation(degrees: number) {
  const stepped = Math.round(degrees / STICKY_ROTATION_STEP) * STICKY_ROTATION_STEP;
  return ((stepped % 360) + 360) % 360;
}
