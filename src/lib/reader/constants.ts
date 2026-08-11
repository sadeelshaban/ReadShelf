import type { ShapeKind } from "@/types";

export const HIGHLIGHT_PRESETS = [
  { name: "Yellow", value: "#FFEB3B" },
  { name: "Sky blue", value: "#29B6F6" },
  { name: "Green", value: "#66BB6A" },
  { name: "Pink", value: "#EC407A" },
  { name: "Purple", value: "#AB47BC" },
] as const;

export const HIGHLIGHT_DRAW_ALPHA = 0.58;

export const LAST_HIGHLIGHT_COLOR_KEY = "readshelf-last-highlight-color";
export const RECENT_HIGHLIGHT_COLORS_KEY = "readshelf-recent-highlight-colors";
export const RECENT_HIGHLIGHT_SLOT_KEY = "readshelf-recent-highlight-slot";

export const PEN_PRESETS = [
  { name: "Black", value: "#1a120b" },
  { name: "Red", value: "#dc2626" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "Purple", value: "#7c3aed" },
] as const;

export const LAST_PEN_COLOR_KEY = "readshelf-last-pen-color";
export const RECENT_PEN_COLORS_KEY = "readshelf-recent-pen-colors";
export const RECENT_PEN_SLOT_KEY = "readshelf-recent-pen-slot";

const MAX_RECENT_CUSTOM_COLORS = 4;

export function normalizeHex(hex: string): string {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  return `#${full.toLowerCase()}`;
}

function isPresetColor(color: string, presets: readonly { value: string }[]) {
  const normalized = normalizeHex(color).toLowerCase();
  return presets.some((p) => p.value.toLowerCase() === normalized);
}

function isHighlightPresetColor(color: string) {
  return isPresetColor(color, HIGHLIGHT_PRESETS);
}

function isPenPresetColor(color: string) {
  return isPresetColor(color, PEN_PRESETS);
}

function loadRecentColors(storageKey: string, presetFilter: (color: string) => boolean) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    const seen = new Set<string>();
    return parsed
      .map(normalizeHex)
      .filter((color) => !presetFilter(color))
      .filter((color) => {
        const key = color.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_RECENT_CUSTOM_COLORS);
  } catch {
    return [];
  }
}

function saveRecentColor(
  color: string,
  lastKey: string,
  recentKey: string,
  slotKey: string,
  presetFilter: (color: string) => boolean,
): string {
  const normalized = normalizeHex(color);
  localStorage.setItem(lastKey, normalized);

  if (presetFilter(normalized)) {
    return normalized;
  }

  const recent = loadRecentColors(recentKey, presetFilter);
  const alreadySaved = recent.some(
    (entry) => entry.toLowerCase() === normalized.toLowerCase(),
  );
  if (alreadySaved) {
    return normalized;
  }

  if (recent.length < MAX_RECENT_CUSTOM_COLORS) {
    recent.push(normalized);
  } else {
    let slot = Number.parseInt(localStorage.getItem(slotKey) ?? "0", 10);
    if (!Number.isFinite(slot) || slot < 0 || slot >= MAX_RECENT_CUSTOM_COLORS) {
      slot = 0;
    }
    recent[slot] = normalized;
    localStorage.setItem(slotKey, String((slot + 1) % MAX_RECENT_CUSTOM_COLORS));
  }

  localStorage.setItem(recentKey, JSON.stringify(recent));
  return normalized;
}

export function loadRecentHighlightColors(): string[] {
  return loadRecentColors(RECENT_HIGHLIGHT_COLORS_KEY, isHighlightPresetColor);
}

export function saveRecentHighlightColor(color: string): string {
  return saveRecentColor(
    color,
    LAST_HIGHLIGHT_COLOR_KEY,
    RECENT_HIGHLIGHT_COLORS_KEY,
    RECENT_HIGHLIGHT_SLOT_KEY,
    isHighlightPresetColor,
  );
}

export function loadLastHighlightColor() {
  if (typeof window === "undefined") return HIGHLIGHT_PRESETS[0].value;
  return (
    localStorage.getItem(LAST_HIGHLIGHT_COLOR_KEY) ?? HIGHLIGHT_PRESETS[0].value
  );
}

export function loadRecentPenColors(): string[] {
  return loadRecentColors(RECENT_PEN_COLORS_KEY, isPenPresetColor);
}

export function saveRecentPenColor(color: string): string {
  return saveRecentColor(
    color,
    LAST_PEN_COLOR_KEY,
    RECENT_PEN_COLORS_KEY,
    RECENT_PEN_SLOT_KEY,
    isPenPresetColor,
  );
}

export function loadLastPenColor() {
  if (typeof window === "undefined") return PEN_PRESETS[1].value;
  return localStorage.getItem(LAST_PEN_COLOR_KEY) ?? PEN_PRESETS[1].value;
}

export function hexToRgba(hex: string, alpha = HIGHLIGHT_DRAW_ALPHA) {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const NOTE_TEXT_COLORS = [
  { name: "Yellow", value: "yellow", css: "rgba(247, 231, 161, 0.42)" },
  { name: "Red", value: "red", css: "rgba(243, 197, 204, 0.42)" },
  { name: "Blue", value: "blue", css: "rgba(197, 216, 247, 0.42)" },
] as const;

export const DEFAULT_NOTE_FONT_SIZE = 14;
export const MIN_NOTE_FONT_SIZE = 10;
export const MAX_NOTE_FONT_SIZE = 32;

export const MIN_STROKE_WIDTH = 0;
export const MAX_STROKE_WIDTH = 50;
export const DEFAULT_HIGHLIGHT_STROKE_WIDTH = 28;
export const DEFAULT_PEN_STROKE_WIDTH = 3;
export const DEFAULT_ERASER_STROKE_WIDTH = 40;

export const HIGHLIGHT_STROKE_WIDTH_KEY = "readshelf-highlight-stroke-width";
export const PEN_STROKE_WIDTH_KEY = "readshelf-pen-stroke-width";
export const ERASER_STROKE_WIDTH_KEY = "readshelf-eraser-stroke-width";

export const SHAPE_KIND_KEY = "readshelf-shape-kind";
export const SHAPE_FILLED_KEY = "readshelf-shape-filled";

export const READER_THEME_PRIMARY = "#6f4528";
export const READER_THEME_ACCENT = "#c9952a";
export const READER_ERASER_RING = "rgba(201, 149, 42, 0.55)";
export const READER_ERASER_STROKE = "#6f4528";
export const READER_ERASER_HALO = "rgba(255, 252, 247, 0.92)";

function clampStrokeWidth(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MAX_STROKE_WIDTH, Math.max(MIN_STROKE_WIDTH, value));
}

export function loadHighlightStrokeWidth() {
  if (typeof window === "undefined") return DEFAULT_HIGHLIGHT_STROKE_WIDTH;
  const raw = localStorage.getItem(HIGHLIGHT_STROKE_WIDTH_KEY);
  return clampStrokeWidth(raw ? Number.parseFloat(raw) : NaN, DEFAULT_HIGHLIGHT_STROKE_WIDTH);
}

export function loadPenStrokeWidth() {
  if (typeof window === "undefined") return DEFAULT_PEN_STROKE_WIDTH;
  const raw = localStorage.getItem(PEN_STROKE_WIDTH_KEY);
  return clampStrokeWidth(raw ? Number.parseFloat(raw) : NaN, DEFAULT_PEN_STROKE_WIDTH);
}

export function loadEraserStrokeWidth() {
  if (typeof window === "undefined") return DEFAULT_ERASER_STROKE_WIDTH;
  const raw = localStorage.getItem(ERASER_STROKE_WIDTH_KEY);
  return clampStrokeWidth(raw ? Number.parseFloat(raw) : NaN, DEFAULT_ERASER_STROKE_WIDTH);
}

export function saveHighlightStrokeWidth(width: number) {
  localStorage.setItem(HIGHLIGHT_STROKE_WIDTH_KEY, String(clampStrokeWidth(width, DEFAULT_HIGHLIGHT_STROKE_WIDTH)));
}

export function savePenStrokeWidth(width: number) {
  localStorage.setItem(PEN_STROKE_WIDTH_KEY, String(clampStrokeWidth(width, DEFAULT_PEN_STROKE_WIDTH)));
}

export function saveEraserStrokeWidth(width: number) {
  localStorage.setItem(ERASER_STROKE_WIDTH_KEY, String(clampStrokeWidth(width, DEFAULT_ERASER_STROKE_WIDTH)));
}

const SHAPE_KINDS: ShapeKind[] = ["rect", "ellipse", "line", "arrow", "double_arrow"];

export function loadShapeKind(): ShapeKind {
  if (typeof window === "undefined") return "rect";
  const raw = localStorage.getItem(SHAPE_KIND_KEY);
  return SHAPE_KINDS.includes(raw as ShapeKind) ? (raw as ShapeKind) : "rect";
}

export function saveShapeKind(kind: ShapeKind) {
  localStorage.setItem(SHAPE_KIND_KEY, kind);
}

export function loadShapeFilled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SHAPE_FILLED_KEY) === "1";
}

export function saveShapeFilled(filled: boolean) {
  localStorage.setItem(SHAPE_FILLED_KEY, filled ? "1" : "0");
}

export function eraserCursorDataUri(size = 28) {
  const center = size / 2;
  const radius = size * 0.34;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><circle cx='${center}' cy='${center}' r='${radius + 2.2}' fill='none' stroke='${READER_ERASER_HALO}' stroke-width='2.4'/><circle cx='${center}' cy='${center}' r='${radius}' fill='${READER_ERASER_RING}' stroke='${READER_ERASER_STROKE}' stroke-width='1.8'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${center} ${center}, crosshair`;
}

export function noteTextCss(color: string) {
  const match = NOTE_TEXT_COLORS.find((c) => c.value === color);
  if (match) return match.css;
  // Legacy ink colors → sticky paper defaults
  if (color === "black") return NOTE_TEXT_COLORS[0].css;
  return NOTE_TEXT_COLORS[0].css;
}
