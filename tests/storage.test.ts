import { describe, it, expect } from "vitest";
import {
  fileUrl,
  storageRelFromUrl,
  resolveStoragePath,
} from "@/lib/storage";

describe("storage url helpers", () => {
  it("round-trips fileUrl <-> storageRelFromUrl", () => {
    const rel = "campaigns/abc/def/images/scene-1.png";
    const url = fileUrl(rel);
    expect(url).toBe(`/api/files/${rel}`);
    expect(storageRelFromUrl(url)).toBe(rel);
  });

  it("strips leading slashes in fileUrl", () => {
    expect(fileUrl("/a/b.png")).toBe("/api/files/a/b.png");
  });
});

describe("resolveStoragePath", () => {
  it("resolves a normal relative path under the storage root", () => {
    const abs = resolveStoragePath("campaigns/x/y.png");
    expect(abs.endsWith("/campaigns/x/y.png")).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(() => resolveStoragePath("../../etc/passwd")).toThrow(
      "Invalid storage path",
    );
  });
});
