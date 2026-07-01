import { describe, expect, it } from "vitest";
import {
  bookmarkColorHex,
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
    expect(bookmarkColorHex("yellow")).toBe("#E8B923");
    expect(bookmarkColorHex("blue")).toBe("#2F7DD1");
    expect(bookmarkColorHex("red")).toBe("#D64545");
  });

  it("maps legacy color names", () => {
    expect(bookmarkColorHex("gold")).toBe("#E8B923");
  });

  it("falls back to yellow for unknown ids", () => {
    expect(bookmarkColorHex("unknown")).toBe("#E8B923");
  });
});
