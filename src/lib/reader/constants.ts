export const HIGHLIGHT_PRESETS = [
  { name: "Yellow", value: "#FFEB3B" },
  { name: "Sky blue", value: "#29B6F6" },
  { name: "Green", value: "#66BB6A" },
  { name: "Pink", value: "#EC407A" },
  { name: "Orange", value: "#FF9800" },
  { name: "Purple", value: "#AB47BC" },
] as const;

export const HIGHLIGHT_DRAW_ALPHA = 0.58;

export const LAST_HIGHLIGHT_COLOR_KEY = "readshelf-last-highlight-color";
export const RECENT_HIGHLIGHT_COLORS_KEY = "readshelf-recent-highlight-colors";
export const RECENT_HIGHLIGHT_SLOT_KEY = "readshelf-recent-highlight-slot";

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

function isPresetColor(color: string) {
  const normalized = normalizeHex(color).toLowerCase();
  return HIGHLIGHT_PRESETS.some((p) => p.value.toLowerCase() === normalized);
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

export function loadRecentHighlightColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_HIGHLIGHT_COLORS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    const seen = new Set<string>();
    return parsed
      .map(normalizeHex)
      .filter((color) => !isPresetColor(color))
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

export function saveRecentHighlightColor(color: string): string {
  const normalized = normalizeHex(color);
  localStorage.setItem(LAST_HIGHLIGHT_COLOR_KEY, normalized);

  if (isPresetColor(normalized)) {
    return normalized;
  }

  const recent = loadRecentHighlightColors();
  const alreadySaved = recent.some(
    (entry) => entry.toLowerCase() === normalized.toLowerCase(),
  );
  if (alreadySaved) {
    return normalized;
  }

  if (recent.length < MAX_RECENT_CUSTOM_COLORS) {
    recent.push(normalized);
  } else {
    let slot = Number.parseInt(
      localStorage.getItem(RECENT_HIGHLIGHT_SLOT_KEY) ?? "0",
      10,
    );
    if (!Number.isFinite(slot) || slot < 0 || slot >= MAX_RECENT_CUSTOM_COLORS) {
      slot = 0;
    }
    recent[slot] = normalized;
    localStorage.setItem(
      RECENT_HIGHLIGHT_SLOT_KEY,
      String((slot + 1) % MAX_RECENT_CUSTOM_COLORS),
    );
  }

  localStorage.setItem(RECENT_HIGHLIGHT_COLORS_KEY, JSON.stringify(recent));
  return normalized;
}

export function loadLastHighlightColor() {
  if (typeof window === "undefined") return HIGHLIGHT_PRESETS[0].value;
  return (
    localStorage.getItem(LAST_HIGHLIGHT_COLOR_KEY) ?? HIGHLIGHT_PRESETS[0].value
  );
}

export const NOTE_TEXT_COLORS = [
  { name: "Black", value: "black", css: "#1a120b" },
  { name: "White", value: "white", css: "#ffffff" },
  { name: "Red", value: "red", css: "#dc2626" },
] as const;

export const DEFAULT_NOTE_FONT_SIZE = 14;
export const MIN_NOTE_FONT_SIZE = 10;
export const MAX_NOTE_FONT_SIZE = 32;

export function noteTextCss(color: string) {
  return NOTE_TEXT_COLORS.find((c) => c.value === color)?.css ?? "#1a120b";
}
