export type BookmarkColorId = "yellow" | "blue" | "red";

export const BOOKMARK_COLORS: Array<{
  id: BookmarkColorId;
  name: string;
  value: string;
}> = [
  { id: "yellow", name: "Yellow", value: "#E8B923" },
  { id: "blue", name: "Blue", value: "#2F7DD1" },
  { id: "red", name: "Red", value: "#D64545" },
];

const LEGACY_COLOR_MAP: Record<string, string> = {
  gold: "#E8B923",
  green: "#4CAF50",
  yellow: "#E8B923",
  red: "#D64545",
  blue: "#2F7DD1",
  black: "#3C2A21",
};

export function bookmarkColorHex(colorId: string): string {
  const match = BOOKMARK_COLORS.find((entry) => entry.id === colorId);
  if (match) return match.value;
  return LEGACY_COLOR_MAP[colorId] ?? BOOKMARK_COLORS[0].value;
}

export function normalizeBookmarkLabel(input: string): string {
  const word = input.trim().split(/\s+/)[0] ?? "";
  return word.slice(0, 24);
}
