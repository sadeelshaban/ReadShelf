import { describe, expect, it } from "vitest";
import { formatStorageBytes } from "@/lib/admin/storage-usage";

describe("formatStorageBytes", () => {
  it("formats zero bytes", () => {
    expect(formatStorageBytes(0)).toBe("0 B");
  });

  it("formats megabytes", () => {
    expect(formatStorageBytes(24.5 * 1024 * 1024)).toBe("24.5 MB");
  });
});
