export type BookmarkColorId = "gold" | "green" | "yellow" | "red" | "blue" | "black";

export const BOOKMARK_COLORS: Array<{
  id: BookmarkColorId;
  name: string;
  value: string;
}> = [
  { id: "gold", name: "Default", value: "#D4AF37" },
  { id: "green", name: "Finished", value: "#4CAF50" },
  { id: "yellow", name: "Reading", value: "#FFC107" },
  { id: "red", name: "Important", value: "#E53935" },
  { id: "blue", name: "Review", value: "#1E88E5" },
  { id: "black", name: "Mark", value: "#3C2A21" },
];

export function bookmarkColorHex(colorId: string): string {
  return (
    BOOKMARK_COLORS.find((entry) => entry.id === colorId)?.value ??
    BOOKMARK_COLORS[0].value
  );
}
