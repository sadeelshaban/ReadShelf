export type BookmarkColorId = "yellow" | "blue" | "red";

export type BookmarkRibbonPalette = {
  edge: string;
  mid: string;
  highlight: string;
};

export const BOOKMARK_COLORS: Array<{
  id: BookmarkColorId;
  name: string;
  value: string;
}> = [
  { id: "yellow", name: "Yellow", value: "#D48806" },
  { id: "red", name: "Red", value: "#7A1525" },
  { id: "blue", name: "Blue", value: "#1E56C5" },
];

const RIBBON_PALETTES: Record<BookmarkColorId, BookmarkRibbonPalette> = {
  yellow: {
    edge: "#8A5A05",
    mid: "#C47A08",
    highlight: "#F0B429",
  },
  red: {
    edge: "#4A0A12",
    mid: "#7A1525",
    highlight: "#B83245",
  },
  blue: {
    edge: "#123985",
    mid: "#1A4DA8",
    highlight: "#4A7FE8",
  },
};

const LEGACY_COLOR_MAP: Record<string, BookmarkColorId> = {
  gold: "yellow",
  green: "yellow",
  yellow: "yellow",
  red: "red",
  blue: "blue",
  black: "yellow",
};

export function bookmarkColorHex(colorId: string): string {
  const match = BOOKMARK_COLORS.find((entry) => entry.id === colorId);
  if (match) return match.value;

  const legacyId = LEGACY_COLOR_MAP[colorId];
  if (legacyId) {
    return BOOKMARK_COLORS.find((entry) => entry.id === legacyId)!.value;
  }

  return BOOKMARK_COLORS[0].value;
}

export function bookmarkRibbonPalette(colorId: string): BookmarkRibbonPalette {
  const resolved =
    BOOKMARK_COLORS.find((entry) => entry.id === colorId)?.id ??
    LEGACY_COLOR_MAP[colorId] ??
    "yellow";

  return RIBBON_PALETTES[resolved];
}

export function normalizeBookmarkLabel(input: string): string {
  const word = input.trim().split(/\s+/)[0] ?? "";
  return word.slice(0, 24);
}

export const BOOKMARK_RIBBON_WIDTH = 22;
export const BOOKMARK_RIBBON_HEIGHT = 164;
export const BOOKMARK_RIBBON_GAP = 4;
export const BOOKMARK_RIBBON_INSET = 10;
