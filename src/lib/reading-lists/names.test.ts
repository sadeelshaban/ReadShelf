import { describe, expect, it } from "vitest";
import { normalizeReadingListName } from "@/lib/reading-lists/names";

describe("normalizeReadingListName", () => {
  it("accepts Arabic and English names", () => {
    expect(normalizeReadingListName("امتحانات")).toBe("امتحانات");
    expect(normalizeReadingListName("To Read")).toBe("To Read");
    expect(normalizeReadingListName("  مراجعة finals  ")).toBe("مراجعة finals");
  });

  it("rejects empty or control characters", () => {
    expect(normalizeReadingListName("   ")).toBeNull();
    expect(normalizeReadingListName(`bad\u0001name`)).toBeNull();
  });
});
