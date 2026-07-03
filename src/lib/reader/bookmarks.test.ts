import { describe, expect, it } from "vitest";
import {
  bookmarkColorHex,
  bookmarkRibbonPalette,
  normalizeBookmarkLabel,
} from "@/lib/reader/bookmarks";

describe("normalizeBookmarkLabel", () => {
  it("takes first word only", () => {
    expect(normalizeBookmarkLabel("Chapter 3 intro")).toBe("Chapter");
  });

  it("trims whitespace", () => {
    expect(normalizeBookmarkLabel("  Notes  ")).toBe("Notes");
  });

  it("limits to 24 characters", () => {
    expect(normalizeBookmarkLabel("abcdefghijklmnopqrstuvwxyz")).toBe(
      "abcdefghijklmnopqrstuvwx",
    );
  });

  it("returns empty string for blank input", () => {
    expect(normalizeBookmarkLabel("   ")).toBe("");
  });
});

describe("bookmarkColorHex", () => {
  it("resolves known color ids", () => {
    expect(bookmarkColorHex("yellow")).toBe("#D48806");
    expect(bookmarkColorHex("red")).toBe("#C62828");
    expect(bookmarkColorHex("blue")).toBe("#1E56C5");
  });

  it("maps legacy color names", () => {
    expect(bookmarkColorHex("gold")).toBe("#D48806");
  });

  it("falls back to yellow for unknown ids", () => {
    expect(bookmarkColorHex("unknown")).toBe("#D48806");
  });
});

describe("bookmarkRibbonPalette", () => {
  it("returns gradient stops for yellow and red", () => {
    expect(bookmarkRibbonPalette("yellow").highlight).toBe("#F0B429");
    expect(bookmarkRibbonPalette("red").mid).toBe("#B91C1C");
  });
});
